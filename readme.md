# Proxy Live Document 
(Name is pending)

An opinionanted, mutable, single store state management library that allows fine granied observers over what changes.

## Current status

- alpha verion
- api likely to change
- all apis are well tested

## Instalation

```
npm i vladnicula/proxy-live-document#master
```
(will be published on NPM at some point)

## Core ideas

### Changes mutate the data

Any change we want to make should be made with a mutation, just like in the old days.

If you want to modify something in your state, write just the change, without having to wory about immutability, efficient rerendering of the UI or anything like that. 

```tsx
const state = {}
// ...
state.someValue = 32
// ...
```

Is a valid way of setting a key in the state object.



### Any object {} can be observed and used as the root of the state

This means that we have complete freedom of how we want to structure our content, how nested the values can be.

```tsx
const state = {}

select(state, ['someValue'], (currentState, patches) => {
  console.log(`running selector`, currentState.someValue)
})

mutate(state, (currentState) => {
  currentState.someValue = 32
})

// will log `running selector` 32
```

### Class instances are supported

```tsx

class State {

  someValue: number = 0

  changeValue (newValue: number) {
    this.someValue = newValue
  }
}

const theAppState = new State()

select(theAppState, ['someValue'], (currentState, patches) => {
  console.log(`running selector`, currentState.someValue)
})

mutate(theAppState, (currentState) => {
  currentState.changeValue(32)
})

// will log `running selector` 32

```

### No support for arrays / lists (yet?)

Observations of changes don't know how to reason about arrays, only objects are supported for now.

If you have arrays in your state, consider changing them to { key: value, key2: value2 } representations. The ui rendering in general - regradless of ui framework used - would benefit greatly by this change.

## API Overview

### mutate

```tsx
mutate<T>(state: T, callback(stateLikeObject: T) => void)
```

`mutate` is a function that wrappes the root state into a proxy and keeps track of chagnes happening in it.

- The type `<T>` of state will identical to the first paremeter of the `callback`
- Changes will only be observed if they are done on the `stateLikeObject` or on subobjects accessed from the `stateLikeObject`
- If an error is trown in the mutate functon, NO CHANGES will be made on the `state` and no observables will be triggered.

### select

```tsx
select<T>(
  state: T, 
  selectors: string[], 
  callback(
    stateLikeObject: T, 
    patches: JSONPatchEnchanged[]
  ) => unknown
)
```

`select` is a function that gets the root state and an array of paths of interest similar to the paths used to match folders inside a directory structure. When any change done in `mutate` functions happens on those selected paths, the `callback` parameter will run.


### mutateFromPatches

Mutate functions return an array of type `JSONPatchEnchaned[]`. These are like a git commit. They contain only what was changed and what was the original value of the thing that changed.

```tsx
const patches = mutate(state, (currentState) => {...})

console.log(patches) // would be an array [{op: 'add', ...}]
```

In some situations, like in the case of a history undo or redo operation, we might want to "replay" or "revert" a change. 

In order to produce a change based on existing patch objects, not on a callback like in the case of `mutate` we have the `mutateFromPatches` method:

```tsx
const state1 = {}
const state2 = {}
const patches = mutate(state1, (s) => {s.value = 1})

mutateFromPatches(state2, patches)

console.log(state2.value === state1.value) // true
```

The combination of mutate and mutateFromPatches, with the help of another library function `inversePatch` can be used to implement history undo and redo, as well as a basic server sincronization and real time collaboration. 

## License
All code contributed to this repository is licensed under the standard MIT license:

Copyright 2020 library contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.