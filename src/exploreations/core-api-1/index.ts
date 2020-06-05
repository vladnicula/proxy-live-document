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
const MutationProxyMap: ProxyMapType<ObjectTree> = new WeakMap()

const dirtyPaths = new Set<ProxyObjectHandler<ObjectTree>>()

type JSONPatch = {
  op: 'replace' | 'remove' | 'add',
  path: string,
  value: unknown,
  old?: unknown
}

export const mutate = <T extends ObjectTree>(
  treeStructure: T,
  callback: (mutable: T) => unknown
) => {
  const proxy = proxyfyAccess(treeStructure)
  callback(proxy as T)
  const patch = Array.from(dirtyPaths).reduce(
    (
      acc: JSONPatch[],
      value,
    ) => {
      const { path, ops } = value
      const sourcePath = path.join('/')
      for ( let i = 0; i < ops.length; i += 1 ) {
        acc.push({
          ...ops[i],
          path: `${sourcePath}/${ops[i].path}`
        })
      }
      return acc
    }, 
    []
  )
  return patch
}

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
}