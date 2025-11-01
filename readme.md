# Proxy Live Document

An opinionated, mutable, single-store state management library with fine-grained reactivity and automatic JSON Patch generation.

## Why Proxy Live Document?

**Built for real-time collaboration and time-travel features** - Perfect for applications that need:
- 🔄 Real-time state synchronization across clients
- ⏮️ Undo/redo functionality
- 📡 Efficient server updates (send only what changed)
- 🎯 Fine-grained reactivity (update only what needs updating)
- ✍️ Mutable API (no spread operators or immutability overhead)

## Current Status

- **Version**: 2.0.7beta (Beta/Alpha)
- **API**: May change in future versions
- **Test Coverage**: All APIs are well tested
- **Production Ready**: Core object mutations are stable

## Installation

```bash
npm install proxy-live-document
```

## Quick Start

```typescript
import { mutate, select } from 'proxy-live-document'

// Create your state - any object works
const state = {
  user: { name: 'Alice', age: 30 },
  todos: {}
}

// Subscribe to changes on specific paths
select(state, ['/user/name'], (currentState) => {
  console.log('Name changed:', currentState.user.name)
})

// Mutate naturally - no spread operators needed!
const patches = mutate(state, (draft) => {
  draft.user.name = 'Bob'
  draft.user.age = 31
})

// Console output: "Name changed: Bob"
// patches = [{ op: 'replace', path: '/user/name', value: 'Bob', old: 'Alice' }, ...]
```

---

## Core Concepts

### 1. Mutable API - Write Natural Code

No more spread operators, `Object.assign()`, or immutability helpers. Just mutate:

```typescript
const state = { count: 0, user: { name: 'Alice' } }

mutate(state, (draft) => {
  draft.count++                    // ✅ Simple increment
  draft.user.name = 'Bob'          // ✅ Direct assignment
  draft.settings = { theme: 'dark' } // ✅ Add new properties
  delete draft.oldProp             // ✅ Delete properties
})
```

### 2. Fine-Grained Selectors - Only React to What Changed

Subscribe to specific paths using JSON Pointer syntax:

```typescript
const state = {
  user: { name: 'Alice', email: 'alice@example.com' },
  settings: { theme: 'dark' }
}

// Only triggers when user.name changes
select(state, ['/user/name'], (currentState) => {
  console.log('Name updated:', currentState.user.name)
})

// Only triggers when settings change
select(state, ['/settings'], (currentState) => {
  console.log('Settings updated:', currentState.settings)
})

mutate(state, (draft) => {
  draft.user.email = 'bob@example.com' // First selector WON'T trigger
  draft.user.name = 'Bob'              // First selector WILL trigger
})
```

### 3. Glob Patterns - Watch Subtrees

Use wildcards to watch multiple paths:

```typescript
const state = {
  todos: {
    'todo-1': { text: 'Buy milk', done: false },
    'todo-2': { text: 'Walk dog', done: true }
  }
}

// Watch ANY todo change
select(state, ['/todos/*'], (currentState) => {
  console.log('A todo changed!')
})

// Watch ANY nested property in ANY todo
select(state, ['/todos/*/**'], (currentState) => {
  console.log('A todo property changed!')
})

mutate(state, (draft) => {
  draft.todos['todo-1'].done = true // Both selectors trigger
  draft.todos['todo-3'] = { text: 'New task', done: false } // Both trigger
})
```

### 4. JSON Patches - Perfect for Sync & History

Every mutation returns JSON Patch operations (RFC 6902):

```typescript
const patches = mutate(state, (draft) => {
  draft.user.name = 'Bob'
  draft.count = 42
})

console.log(patches)
// [
//   { op: 'replace', path: '/user/name', value: 'Bob', old: 'Alice' },
//   { op: 'replace', path: '/count', value: 42, old: 0 }
// ]

// Send minimal data to server
socket.emit('state-update', patches)

// Apply patches on another instance
mutateFromPatches(remoteState, patches)
```

---

## Real-World Examples

### Example 1: Todo App with Undo/Redo

```typescript
import { mutate, select, inversePatch } from 'proxy-live-document'

const state = {
  todos: {} as Record<string, { text: string, done: boolean }>
}

const history: any[] = []
const future: any[] = []

// Subscribe to any todo change
select(state, ['/todos/**'], (currentState) => {
  renderTodoList(currentState.todos)
})

function addTodo(id: string, text: string) {
  const patches = mutate(state, (draft) => {
    draft.todos[id] = { text, done: false }
  })
  history.push(patches)
  future.length = 0 // Clear redo stack
}

function toggleTodo(id: string) {
  const patches = mutate(state, (draft) => {
    draft.todos[id].done = !draft.todos[id].done
  })
  history.push(patches)
  future.length = 0
}

function undo() {
  if (history.length === 0) return
  const patches = history.pop()
  const inversePatches = patches.map(inversePatch)
  mutateFromPatches(state, inversePatches)
  future.push(patches)
}

function redo() {
  if (future.length === 0) return
  const patches = future.pop()
  mutateFromPatches(state, patches)
  history.push(patches)
}
```

### Example 2: Real-Time Collaboration

```typescript
import { mutate, select, mutateFromPatches } from 'proxy-live-document'

const state = { document: { title: '', content: '' } }

// Listen to local changes and send to server
select(state, ['/document/**'], (currentState, patches) => {
  socket.emit('document-update', patches)
})

// Apply remote changes
socket.on('remote-update', (patches) => {
  mutateFromPatches(state, patches)
  // Selectors will trigger and update UI automatically
})

// Make local changes
function updateTitle(newTitle: string) {
  mutate(state, (draft) => {
    draft.document.title = newTitle
  })
}
```

### Example 3: Form State Management

```typescript
const formState = {
  values: { username: '', email: '', age: 0 },
  errors: {} as Record<string, string>,
  touched: {} as Record<string, boolean>
}

// Watch specific field changes
select(formState, ['/values/email'], (currentState) => {
  validateEmail(currentState.values.email)
})

function validateEmail(email: string) {
  mutate(formState, (draft) => {
    if (!email.includes('@')) {
      draft.errors.email = 'Invalid email'
    } else {
      delete draft.errors.email
    }
  })
}

function setFieldValue(field: string, value: any) {
  mutate(formState, (draft) => {
    draft.values[field] = value
    draft.touched[field] = true
  })
}
```

---

## API Reference

### `mutate<T>(state: T, callback: (draft: T) => void): JSONPatchEnhanced[]`

Wraps your state in a proxy and tracks all changes made in the callback.

**Parameters:**
- `state`: Your root state object (any object or class instance)
- `callback`: Function that receives a draft proxy - mutate it freely

**Returns:** Array of JSON Patch operations describing what changed

**Features:**
- ✅ Changes are transactional - errors rollback everything
- ✅ Nested mutations are supported
- ✅ Works with class instances and methods
- ✅ Returns `undefined` if no changes were made

```typescript
const patches = mutate(state, (draft) => {
  draft.user.name = 'New Name'

  // Nested mutations work
  mutate(draft.settings, (settingsDraft) => {
    settingsDraft.theme = 'light'
  })
})
```

### `select<T>(state: T, selectors: string[], callback: (state: T, patches?: JSONPatchEnhanced[]) => void, options?): { dispose: () => void }`

Subscribe to changes on specific paths. Callback runs only when selected paths change.

**Parameters:**
- `state`: Your root state object
- `selectors`: Array of JSON Pointer paths (e.g., `['/user/name', '/todos/*']`)
- `callback`: Function called when selected paths change
- `options`: Optional configuration
  - `reactToAncestorChanges: boolean` - Trigger when parent paths change (default: false)

**Returns:** Object with `dispose()` method to unsubscribe

**Path Patterns:**
- `/user/name` - Exact path
- `/todos/*` - Any direct child of todos
- `/todos/**` - Any descendant of todos (any depth)
- `/todos/*/done` - The `done` property of any todo

```typescript
const subscription = select(
  state,
  ['/user/*', '/settings/**'],
  (currentState, patches) => {
    console.log('User or settings changed:', patches)
  }
)

// Unsubscribe when done
subscription.dispose()
```

### `autorun<T>(state: T, callback: (state: T) => void): () => void`

Automatically track dependencies - callback re-runs when accessed properties change.

Similar to MobX's `autorun` or Vue's `watch`.

```typescript
const state = { firstName: 'Alice', lastName: 'Smith' }

const dispose = autorun(state, (currentState) => {
  // Automatically tracks firstName and lastName
  console.log('Full name:', currentState.firstName, currentState.lastName)
})

mutate(state, (draft) => {
  draft.firstName = 'Bob' // autorun callback will re-run
})

dispose() // Stop tracking
```

### `mutateFromPatches<T>(state: T, patches: JSONPatchEnhanced[]): void`

Apply pre-generated patches to a state object.

**Use cases:**
- Replaying changes for undo/redo
- Applying remote changes in real-time collaboration
- Syncing state from server

```typescript
const state1 = { count: 0 }
const state2 = { count: 0 }

const patches = mutate(state1, (draft) => {
  draft.count = 10
})

// Apply same changes to state2
mutateFromPatches(state2, patches)

console.log(state2.count) // 10
```

### `inversePatch(patch: JSONPatchEnhanced): JSONPatchEnhanced`

Generate the inverse of a patch operation (for undo functionality).

```typescript
const patches = mutate(state, (draft) => {
  draft.value = 'new'
})

const undoPatches = patches.map(inversePatch)
mutateFromPatches(state, undoPatches) // Reverts the change
```

---

## Array Support & Limitations

⚠️ **Arrays have LIMITED support** - basic operations work, complex methods may not generate correct patches.

### ✅ Supported Array Operations

These operations work correctly and generate proper patches:

```typescript
const state = { items: ['a', 'b', 'c'] }

mutate(state, (draft) => {
  // ✅ SUPPORTED
  draft.items.push('d')              // Add to end
  draft.items.pop()                  // Remove from end
  draft.items.shift()                // Remove from start
  draft.items.unshift('z')           // Add to start
  draft.items[1] = 'new'             // Replace by index
  draft.items = ['x', 'y', 'z']      // Replace entire array

  // ✅ Simple splice (remove OR add, not both)
  draft.items.splice(1, 1)           // Remove 1 item at index 1
  draft.items.splice(1, 0, 'new')    // Insert 'new' at index 1
})
```

### ⚠️ Partially Supported

These may work but have known issues:

```typescript
mutate(state, (draft) => {
  // ⚠️ splice with BOTH remove and add - ONLY removal generates patches
  draft.items.splice(1, 1, 'a', 'b')  // Removes 1, adds 2 - patches incomplete!

  // ⚠️ delete - replaces with undefined but array doesn't shrink
  delete draft.items[1]               // Sets items[1] = undefined (unusual behavior)
})
```

### ❌ Unsupported / Untested

These methods may not generate correct patches:

```typescript
mutate(state, (draft) => {
  // ❌ NOT TESTED - use at your own risk
  draft.items.reverse()              // May not generate patches correctly
  draft.items.sort()                 // May not generate patches correctly
  draft.items.fill('x')              // Not tested
  draft.items.copyWithin(0, 1, 2)    // Not tested
})
```

### 💡 Recommended Pattern: Use Object Maps Instead

For better support and performance, use objects instead of arrays:

```typescript
// ❌ Avoid
const state = {
  todos: [
    { id: '1', text: 'Buy milk' },
    { id: '2', text: 'Walk dog' }
  ]
}

// ✅ Prefer
const state = {
  todos: {
    '1': { id: '1', text: 'Buy milk' },
    '2': { id: '2', text: 'Walk dog' }
  }
}

// Benefits:
// - Full selector support with glob patterns: '/todos/*'
// - Direct access by ID: state.todos['1']
// - Better for React rendering (stable keys)
// - No index-shifting bugs
```

---

## Class Instance Support

Proxy Live Document works seamlessly with class instances:

```typescript
class TodoList {
  todos: Record<string, { text: string, done: boolean }> = {}

  addTodo(id: string, text: string) {
    this.todos[id] = { text, done: false }
  }

  toggleTodo(id: string) {
    this.todos[id].done = !this.todos[id].done
  }
}

const myTodos = new TodoList()

// Works just like plain objects
select(myTodos, ['/todos/*'], (current) => {
  console.log('Todos changed')
})

mutate(myTodos, (draft) => {
  draft.addTodo('1', 'Buy milk')
  draft.toggleTodo('1')
})
```

### Advanced: Custom Serialization with `IObservableDomain`

For classes with complex serialization needs, implement the `IObservableDomain` interface:

```typescript
import { IObservableDomain } from 'proxy-live-document'

class CustomState implements IObservableDomain {
  // Your class properties...

  // Custom serialization
  toJSON() {
    return { /* custom format */ }
  }

  // Custom deserialization
  static fromJSON(data: any) {
    const instance = new CustomState()
    // Restore from data
    return instance
  }
}
```

---

## Deprecated Features

### ⛔ `reshape()` - Not Supported

The `reshape()` method on selectors is **not supported** and will throw an error:

```typescript
const subscription = select(state, ['/user/name'], callback)

// ❌ This will throw an error
subscription.reshape((selectors) => [...selectors, '/user/email'])
```

**Alternative:** Simply dispose the old selector and create a new one:

```typescript
// ✅ Do this instead
subscription.dispose()
const newSubscription = select(
  state,
  ['/user/name', '/user/email'],
  callback
)
```

### ⚠️ `observe()` - Deprecated

The `observe()` method is deprecated. Use `select()` or `autorun()` instead:

```typescript
// ❌ Old API (deprecated)
const result = select(state, ['/user/name'], callback)
result.observe(anotherCallback)

// ✅ New API
select(state, ['/user/name'], callback)
select(state, ['/user/name'], anotherCallback) // Separate subscriptions
```

---

## Best Practices

### 1. Structure State as Objects, Not Arrays

```typescript
// ✅ Good - full selector support
const state = {
  users: {
    'user-1': { name: 'Alice' },
    'user-2': { name: 'Bob' }
  }
}

// ❌ Avoid - limited array support
const state = {
  users: [
    { id: 'user-1', name: 'Alice' },
    { id: 'user-2', name: 'Bob' }
  ]
}
```

### 2. Use Specific Selectors for Performance

```typescript
// ✅ Good - only triggers on name change
select(state, ['/user/name'], callback)

// ❌ Bad - triggers on any user property change
select(state, ['/user/**'], callback)
```

### 3. Batch Related Changes in One Mutation

```typescript
// ✅ Good - one mutation, one set of patches
mutate(state, (draft) => {
  draft.user.name = 'Alice'
  draft.user.email = 'alice@example.com'
  draft.user.age = 30
})

// ❌ Less efficient - three mutations, three patch sets
mutate(state, (draft) => { draft.user.name = 'Alice' })
mutate(state, (draft) => { draft.user.email = 'alice@example.com' })
mutate(state, (draft) => { draft.user.age = 30 })
```

### 4. Always Dispose of Subscriptions

```typescript
function MyComponent() {
  const subscription = select(state, ['/data'], callback)

  // Clean up when component unmounts
  return () => subscription.dispose()
}
```

### 5. Use Autorun for Derived Values

```typescript
// ✅ Good - automatically tracks dependencies
autorun(state, (current) => {
  const total = current.items.reduce((sum, item) => sum + item.price, 0)
  updateUI(total)
})

// ❌ Harder to maintain - manual path tracking
select(state, ['/items/**'], (current) => {
  const total = current.items.reduce((sum, item) => sum + item.price, 0)
  updateUI(total)
})
```

---

## Known Limitations

1. **Array operations** - Only basic array methods fully supported (see Array Support section)
2. **Non-enumerable properties** - Only enumerable properties are tracked
3. **Symbols** - Symbol properties are not tracked
4. **Prototype mutations** - Changes to prototypes are not tracked
5. **WeakMap/WeakSet** - Not supported as state values
6. **Circular references** - Supported for mutations but patches may not serialize correctly

---

## TypeScript Support

Fully typed with TypeScript. Your state types are preserved:

```typescript
interface AppState {
  user: { name: string, age: number }
  settings: { theme: 'light' | 'dark' }
}

const state: AppState = {
  user: { name: 'Alice', age: 30 },
  settings: { theme: 'light' }
}

mutate(state, (draft) => {
  draft.user.name = 'Bob'           // ✅ Type-safe
  draft.user.age = 'invalid'        // ❌ Type error
  draft.settings.theme = 'blue'     // ❌ Type error
})
```

---

## Contributing

Issues and pull requests are welcome! See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for current bugs and limitations.

## License

MIT © Vlad Nicula

---

## FAQ

**Q: Why not just use Redux/MobX/Zustand?**
A: Proxy Live Document is specifically designed for applications that need JSON Patches - real-time collaboration, undo/redo, and efficient server sync. The mutable API is a bonus for developer experience.

**Q: Can I use this with React?**
A: Yes! Use selectors in `useEffect` hooks, or wrap in a custom hook. The library is framework-agnostic.

**Q: How does this compare to Immer?**
A: Similar mutable API, but Proxy Live Document adds: fine-grained selectors, automatic patch generation, and glob pattern support. Immer focuses on immutability helpers.

**Q: Is this production-ready?**
A: The core object mutation functionality is stable and well-tested. Array support is limited. Use with caution for arrays or stick to object-based state.

**Q: What about performance?**
A: Fine-grained selectors mean only affected components re-render. For large state trees, this is much more efficient than re-rendering everything.
