/**
 * TODO:
 * - the actual proxy
 * - return type for mutate should be json path
 * - json path generation
 * - proxy map cleanup? how do they proxies get garbage collected?
 */

type ObjectTree = object

type ProxyMapType<T extends ObjectTree> = WeakMap<T, T>

// can we have a better way to define the type of this one?
let MutationProxyMap: ProxyMapType<ObjectTree> = new WeakMap()

let dirtyPaths = new Set<ProxyObjectHandler<ObjectTree>>()

type JSONPatch = {
  op: 'replace' | 'remove' | 'add',
  path: string,
  value: unknown,
  old?: unknown
}

type JSONPatchEnhanced = JSONPatch & {
  pathArray: string[],
}

/**
 * Used by the mutation to save the changes on the actual target objects. Triggers no updates.
 * This basically does the mutations.
 */
export const applyInternalMutation = <T extends ObjectTree>(mutations: JSONPatchEnhanced[], stateTree: T) => {
  mutations.forEach(mutation => {
    applyJSONPatchOperation(mutation, stateTree)
  })
}

const applyJSONPatchOperation = <T extends ObjectTree>(operation: JSONPatchEnhanced, stateTree: T) => {
  const { op, path, pathArray, value, old } = operation
  if ( !pathArray.length ) {
    return
  }
  const pathArrayClone = [...pathArray]
  const lastVal = pathArrayClone.pop() as string
  const location = pathArrayClone.reduce((reference: Record<string, unknown> | unknown, pathPart) => {
    if ( typeof reference !== 'object' || reference === null ) {
      throw new Error(`could not walk json path ${path} in target.`)
    }
    return (reference as Record<string, unknown>)[pathPart]
  }, stateTree) as ObjectTree

  switch (op) {
    case 'add':
    case 'replace':
      Object.assign(location, {[lastVal]: value})
      break
    case 'remove':
      // TODO the fuck is worng with this typeshit
      delete location[lastVal]
      break
  }
}

export const mutate = <T extends ObjectTree>(
  stateTree: T,
  callback: (mutable: T) => unknown
) => {
  const proxy = proxyfyAccess(stateTree)
  callback(proxy as T)
  const patch = Array.from(dirtyPaths).reduce(
    (
      acc: JSONPatchEnhanced[],
      value,
    ) => {
      const { path, ops } = value
      const sourcePath = path.join('/')
      for ( let i = 0; i < ops.length; i += 1 ) {
        const op = ops[i] 
        acc.push({
          ...op,
          path: `${sourcePath}/${op.path}`,
          pathArray: [...path, op.path]
        })
      }
      return acc
    }, 
    []
  )

  applyInternalMutation(patch, stateTree)
  MutationProxyMap = new WeakMap()
  dirtyPaths = new Set()
  return patch
}

const DELETED = Symbol('DELETED')

const proxyfyAccess = <T extends ObjectTree>(target: T, path = []): T => {
  let proxy = MutationProxyMap.get(target)
  if ( !proxy ) {
    proxy = new Proxy(target, new ProxyObjectHandler(path))
    MutationProxyMap.set(target, proxy)
  }

  return proxy as T
}


class ProxyObjectHandler<T extends object> {
  readonly path: string[]
  readonly cache: Partial<T> = {}
  readonly deleted: Record<string, boolean> = {}
  readonly original: Partial<T> = {}
  readonly ops: JSONPatch[] = []

  constructor (path: string []) {
    this.path = path
  }

  get <K extends keyof T>(target: T, prop: K) {
    debugger
    if (typeof prop === "symbol") {
      return Reflect.get(target, prop);
    }

    if ( typeof prop === 'string' && this.deleted[prop] ) {
      return undefined
    }

    // TODO why is subEntity not type safe here?
    const subEntity = this.cache[prop] || target[prop]
    if ( typeof subEntity === 'object' && subEntity !== null ) {
      return proxyfyAccess(subEntity, [...this.path, prop])
    }
    return subEntity
  }

  set <K extends keyof T>(target: T, prop: K, value: T[K]) {
    debugger
    // console.log('set handler called', [prop, value], this.path)
    // TODO consider moving this from a global into a normal var
    dirtyPaths.add(this)

    let opType: 'add' | 'replace' | 'remove' = 'add'
    if ( target[prop] ) {
      opType = value ? 'replace' : 'remove'
    }

    // console.log('set', this, prop, value)
    if ( !this.cache[prop] && target[prop] ) {
      this.original[prop] = target[prop]
    }
    this.cache[prop] = value

    this.ops.push({
      op: opType,
      path: `${prop}`,
      old: this.original[prop],
      value,
    })

    return true
  }

  /**
   * Proxy trap for delete keyword
   */
  deleteProperty <K extends keyof T>(target: T, prop: K) {
    if (prop in target) {
      if ( typeof prop === 'string' ) {
        dirtyPaths.add(this)
        this.deleted[prop] = true
        if ( target[prop] ) {
          delete this.cache[prop]
          this.original[prop] = target[prop]
        }
        this.ops.push({
          op: 'remove',
          path: `${prop}`,
          old: this.original[prop],
          value: undefined
        })
      }
      return true
    }

    return false
  }

  /**
   * Proxy trap for Object.getOwnPropertyDescriptor()
   */
  getOwnPropertyDescriptor <K extends keyof T>(target: T, prop: K) {
    if ( typeof prop === 'string' && this.deleted[prop] ) {
      return undefined
    }
    return Reflect.getOwnPropertyDescriptor(target, prop)
  }

  /**
   * Proxy trap for when looking at what keys we have
   */
  ownKeys (target: T) {
    console.log('ownKeys', target) 
    return Reflect.ownKeys(target)
  }

  /**
   * Proxy trap for when looking at what keys we have
   */
  has <K extends keyof T>(target: T, key: K) {
    if ( typeof key === 'string' && this.deleted[key] ) {
      return false
    }
    if ( this.cache[key] ) {
      return true
    }
    return Reflect.has(target, key)
  }
}