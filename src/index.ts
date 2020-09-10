type ObjectTree = object

type ProxyMapType<T extends ObjectTree> = WeakMap<T, T>

export const Patcher = Symbol('Patcher')
const WatcherProxy = Symbol('WatcherProxy')
const TargetRef = Symbol('TargetRef')

type JSONPatch = {
  op: 'replace' | 'remove' | 'add',
  path: string,
  value: unknown,
  old?: unknown
}

export type JSONPatchEnhanced = JSONPatch & {
  pathArray: string[],
}

/**
 * Was used to apply changes in the mutation function after all the operatoins finished.
 * I changed that to allow writing immediatly in the mutation. Now, when a class instance
 * makes a change somewhere deep in the tree, the change happens immedtialy. I keep track
 * of it in the json patch operations and can reason about it later on. 
 * 
 * This will come in handy for real time colaboraiton when changes from the server will be
 * captured and handled by clients. 
 */
export const applyInternalMutation = <T extends ObjectTree>(mutations: JSONPatchEnhanced[], stateTree: T) => {
  mutations.forEach(mutation => {
    applyJSONPatchOperation(mutation, stateTree)
  })
}

export const combinedJSONPatches = (operations: JSONPatchEnhanced[]) => {
  const skipMap = new Map()
  for ( let i = 0; i < operations.length; i += 1 ) {
    const compareOp = operations[i]
    if ( skipMap.has(compareOp) ) {
      continue;
    }
    for ( let j = 0; j < operations.length; j += 1 ) {
      const compareWithOp = operations[j]
      if ( compareOp === compareWithOp || skipMap.has(compareWithOp) ) {
        continue;
      }

      if ( compareWithOp.path.includes(compareOp.path) 
        && combineIntersectedPathOperations(compareOp, compareWithOp)
      ) {
        skipMap.set(compareWithOp, true)
      }
    }
  }

  return operations.filter((op) => !skipMap.has(op))
}

/**
 * Takes a "parent" operation and a "child" operation based on their path
 * and changes the parent operation to contain the child one if possible.
 * 
 * Used to merge togather multiple operations on the same subtree, at different
 * levels. 
 * 
 * This is needed because the mutations could sometimes write or remove the same
 * key at different points in the execution, and we only care about the final result
 * at the end of the transactionlike operation.
 * 
 * The return statement is a boolean. If merge was possible, the destinatoin of the 
 * merge, the first param of this function, is already mutated to contain the 
 * new content.
 * 
 * @param into JSON Patch op that is a parent of the from op
 * @param from JSON Patch op that is a child of the into op
 * 
 * @returns true if the merge was possible, and false otherwise
 */
const combineIntersectedPathOperations = (into: JSONPatchEnhanced, from: JSONPatchEnhanced) => {
  const pathTarget = into.path
  const pathFrom = from.path

  if ( !pathFrom.includes(pathTarget) ) {
    return false
  }

  switch ( into.op ) {
    case "remove":
      return true
    case "add":
      mergeWithParentAdd(into, from)
      return true
    case "replace":
      return true
    default:
      return false
  }
}

const mergeWithParentAdd = (into: JSONPatchEnhanced, from: JSONPatchEnhanced) => {
  const mergeIntoValue = into.value as Record<string, unknown>
  const subPath = from.path.replace(into.path, '')
  const subPathArray = subPath.split('/').filter(part => !!part)
  applyJSONPatchOperation(
    {
      ...from,
      path: subPath,
      pathArray: subPathArray
    },
    mergeIntoValue
  )
}

export const applyJSONPatchOperation = <T extends ObjectTree>(operation: JSONPatchEnhanced, stateTree: T) => {
  const { op, pathArray, value } = operation
  const pathArrayLen = pathArray.length
  if ( !pathArrayLen ) {
    return
  }

  let currentStateTree = stateTree as Record<string, unknown>
  let itPathPart
  let lastPatcher: {
    entity: Record<string, unknown>
    pathArray: string []
  } | null = currentStateTree.hasOwnProperty(Patcher) ? {
    entity: currentStateTree,
    pathArray: [...pathArray]
  } : null

  for ( let i = 0; i < pathArrayLen - 1; i += 1 ) {
    itPathPart = pathArray[i]
    if ( !currentStateTree.hasOwnProperty(itPathPart) ) {
      throw new Error(`applyJSONPatchOperation cannot walk json patch path ${pathArray.join('/')}. Cannot access path ${[...pathArray].slice(0, i).join('/')}.`)
    }
    currentStateTree = (currentStateTree as Record<string, unknown>)[itPathPart] as Record<string, unknown>
    if ( currentStateTree.hasOwnProperty(Patcher) ) {
      lastPatcher = {
        entity: currentStateTree,
        pathArray: [...pathArray].slice(i + 1) 
      }
    }
    
  }

  const lastPathPart = pathArray[pathArrayLen - 1]

  if ( lastPatcher && `applyPatch` in lastPatcher.entity && typeof  lastPatcher.entity.applyPatch === 'function' ) {
    const subPathArray = operation.pathArray.filter((pathPart) => lastPatcher?.pathArray.indexOf(pathPart) !== -1)
    const subPathString = subPathArray.join('/');

    (lastPatcher.entity.applyPatch as (patchOp: JSONPatchEnhanced) => unknown)(
      {
        ...operation,
        path: subPathString,
        pathArray: subPathArray
      }
    )
    return
  }

  switch (op) {
    case 'add':
    case 'replace':
      Object.assign(currentStateTree, {[lastPathPart]: value})
      break
    case 'remove':
      delete currentStateTree[lastPathPart]
      break
  }

}

export const mutateFromPatches =  <T extends ObjectTree>(
  stateTree: T, 
  patches: JSONPatchEnhanced[]
) => {
  mutate(stateTree, (mutatable) => {
    for ( let i = 0; i < patches.length; i += 1 ) {
      applyJSONPatchOperation(patches[i], mutatable)
    }
  })
}

export class MutationsManager {

  mutationMaps: Map<ObjectTree, ProxyMapType<ObjectTree>> = new Map()
  mutationDirtyPaths: Map<ObjectTree, Set<ProxyMutationObjectHandler<ObjectTree>>> = new Map()

  private getSubProxy = <T extends ObjectTree>(target: ObjectTree, subTarget: T, currentPathArray?: string[]): T => {
    const mutationProxies = this.mutationMaps.get(target)
    let proxy = mutationProxies?.get(subTarget) as T | undefined
    if ( !proxy ) {
      proxy = new Proxy(subTarget, new ProxyMutationObjectHandler({
        target: subTarget,
        dirtyPaths: this.mutationDirtyPaths.get(target) as Set<ProxyMutationObjectHandler<object>>,
        pathArray: currentPathArray,
        proxyfyAccess:  <T extends ObjectTree>(someOtherSubTarget: T, someOtherPathArray?: string[]) => {
          return this.getSubProxy(target, someOtherSubTarget, someOtherPathArray)
        }
      })) as T
      mutationProxies?.set(subTarget, proxy)
    }

    return proxy
  }

  startMutation (target: ObjectTree) {
    this.mutationMaps.set(target, new WeakMap() as ProxyMapType<ObjectTree>)
    this.mutationDirtyPaths.set(target, new Set<ProxyMutationObjectHandler<ObjectTree>>())

    const rootProxy = new Proxy(target, new ProxyMutationObjectHandler({
      target,
      dirtyPaths: this.mutationDirtyPaths.get(target) as Set<ProxyMutationObjectHandler<object>>,
      proxyfyAccess: <T extends ObjectTree>(subTarget: T, pathArray?: string[]) => {
        return this.getSubProxy(target, subTarget, pathArray)
      }
    }))
    this.mutationMaps.get(target)?.set(target, rootProxy)
  }

  hasRoot (rootA: any) {
    return this.mutationMaps.has(rootA)
  }

  commit (target: ObjectTree) {
    const dirtyPaths = this.mutationDirtyPaths.get(target) 
    if ( !dirtyPaths ) {
      return []
    }
    const patch = Array.from(dirtyPaths).reduce(
      (
        acc: JSONPatchEnhanced[],
        value,
      ) => {
        const { pathArray: path, ops } = value
        const sourcePath = path.length ? `/${path.join('/')}` : ''
        for ( let i = 0; i < ops.length; i += 1 ) {
          const op = ops[i] 
          const { old, value } = op
          if ( old === value ) {
            continue
          }
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
  
    const combinedPatches = combinedJSONPatches(patch)
    selectorsManager.processPatches(target, combinedPatches)
    
    this.mutationMaps.delete(target)
    this.mutationDirtyPaths.delete(target)

    return combinedPatches
  }

  mutate <T extends ObjectTree>(
    target: T,
    callback: (mutable: T) => unknown
  ) {

    const isOuterMostTransactionForThisObject = !this.hasRoot(target)
    if ( isOuterMostTransactionForThisObject ) {
      this.startMutation(target)
    }

    const proxyWrapper = this.mutationMaps.get(target)?.get(target) as T
    if ( !proxyWrapper ) {
      return
    }

    callback(proxyWrapper)

    // only return the patches on the top most level
    if ( isOuterMostTransactionForThisObject ) {
      return this.commit(target)
    }

    return []
  }
} 

const mutationsManager = new MutationsManager()

export const mutate = <T extends ObjectTree>(
  stateTree: T,
  callback: (mutable: T) => unknown
) => {
  return mutationsManager.mutate(stateTree, callback)
}

/**
 * When working with domain objects, it's probably best to have a 
 * method that serializes them so we can 'snapshot' how they origianlly
 * looked like before a changed appened. Without this, object spreads 
 * on those object might not create the best results.
 * 
 * For the first phase of this, I'm only looking at plain objects in 
 * the initial algorithm. In the second phase this might come in handy.
 */
export abstract class IObservableDomain {
  abstract toJSON: () => Record<string, unknown>
  abstract fromJSON: (input: Record<string, unknown>) => void
}


export class ProxyMutationObjectHandler<T extends object> {
  readonly pathArray: string[]
  readonly deleted: Record<string, boolean> = {}
  readonly original: Partial<T> = {}
  readonly targetRef: T
  readonly ops: JSONPatch[] = []
  readonly dirtyPaths: Set<ProxyMutationObjectHandler<ObjectTree>>

  readonly proxyfyAccess: <T extends ObjectTree>(target: T, pathArray?: string[] ) => T

  constructor (params: {
    target: T, 
    pathArray?: string []
    dirtyPaths: Set<ProxyMutationObjectHandler<ObjectTree>>,
    proxyfyAccess: <T extends ObjectTree>(target: T, pathArray?: string[] ) => T
  }) {
    const { target, pathArray = [], proxyfyAccess, dirtyPaths} = params
    this.pathArray = pathArray
    this.targetRef = target
    this.proxyfyAccess = proxyfyAccess
    this.dirtyPaths = dirtyPaths
  }

  get <K extends keyof T>(target: T, prop: K) {
    if ( typeof prop === 'symbol' && prop === TargetRef ) {
      return this.targetRef
    }

    if ( typeof prop === 'symbol' && prop === WatcherProxy ) {
      return true
    }

    if (typeof prop === "symbol" || prop === 'hasOwnProperty') {
      return Reflect.get(target, prop);
    }

    if ( typeof prop === 'string' && this.deleted.hasOwnProperty(prop) ) {
      return undefined
    }

    const subEntity = target[prop]
    if ( typeof subEntity === 'object' && subEntity !== null ) {
      return this.proxyfyAccess(subEntity as unknown as object, [...this.pathArray, prop] as string[])
    }
    return subEntity
  }

  set <K extends keyof T>(target: T, prop: K, value: T[K]) {
    // console.log('set handler called', [prop, value], this.path)
    // TODO consider moving this from a global into a normal var
    this.dirtyPaths.add(this)
    let opType: 'add' | 'replace' | 'remove' = 'add'
    if ( target[prop] ) {
      opType = value ? 'replace' : 'remove'
    }

    /**
     * We can check if this is the first time we are setting this prop
     * in this mutation, by looking to see if we have an original value
     * already. If we don't, the it's the first time we write.
     * 
     * We also only care about value that exist in the target. If we are
     * setting a new value, we don't have an original, so we don't add
     * the key at all in the original cache. This way, if target did not
     * have an original value, we will get hasOwnProperty(prop) === false
     * with this if, instead of true, but having the value be undefined.
     * 
     * It's debatable if having hasOwnProp is better here compared to
     * the in operator: https://masteringjs.io/tutorials/fundamentals/hasownproperty
     */
    if ( !this.original.hasOwnProperty(prop) && target.hasOwnProperty(prop) ) {
      this.original[prop] = target[prop]
    }

    /**
     * JSON Patch values should not have reference to mutable
     * objects that are set. If we set them as references then
     * later modifications will appear in them. 
     */
    let opValue = value
    if ( typeof value === 'object' && value !== null ) {
      const objectValue = value as unknown as object
      if ( objectValue.hasOwnProperty(WatcherProxy) ) {
        opValue = (objectValue as unknown as { [TargetRef]: T[K] })[TargetRef] 
      } else {
        opValue = {...value}
      }
    }

    /**
     * Same thing for the old value. If we reference an object
     * that object will no longer hold the old values after the
     * mutation.
     */
    let opOriginal = this.original[prop]
    if ( typeof opOriginal === 'object' && opOriginal !== null ) {
      opOriginal = {...opOriginal}
    }
    
    this.ops.push({
      op: opType,
      path: `${prop}`,
      old: opOriginal,
      value: opValue,
    })

    return Reflect.set(target, prop, value)
  }

  /**
   * Proxy trap for delete keyword
   */
  deleteProperty <K extends keyof T>(target: T, prop: K) {
    if (prop in target) {
      if ( typeof prop === 'string' ) {
        this.dirtyPaths.add(this)
        this.deleted[prop] = true
        
        if ( !this.original.hasOwnProperty(prop) ) {
          this.original[prop] = target[prop]
        }

        let opOriginal = this.original[prop]
        if ( typeof opOriginal === 'object' && opOriginal !== null ) {
          opOriginal = {...opOriginal}
        }

        this.ops.push({
          op: 'remove',
          path: `${prop}`,
          old: opOriginal,
          value: undefined
        })
      }
    }

    return Reflect.deleteProperty(target, prop)
  }

  /**
   * Proxy trap for Object.getOwnPropertyDescriptor()
   */
  getOwnPropertyDescriptor <K extends keyof T>(target: T, prop: K) {
    if ( typeof prop === 'string' && this.deleted[prop] ) {
      return undefined
    }
    if ( prop === WatcherProxy ) {
      return {
        configurable: true,
        value: true
      }
    }
    return Reflect.getOwnPropertyDescriptor(target, prop)
  }

  /**
   * Proxy trap for when looking at what keys we have
   */
  ownKeys (target: T) {
    return Reflect.ownKeys(target)
  }

  /**
   * Proxy trap for when looking at what keys we have
   */
  has <K extends keyof T>(target: T, key: K) {
    return Reflect.has(target, key)
  }
}

export const pathMatchesSource = (source: string[], target: string[] ) => {
  if ( source.indexOf('**') === -1 && source.length !== target.length ) {
    return false
  }

  for ( let i = 0; i < source.length; i += 1 ) {

    /**
     * If this level of the path is static and is matched we
     * continue to the next path
     */
    if ( source[i] === target[i] ) {
      continue
    }

    /**
     * if we match anything and still have something to match
     * we continue to look at the next entities
     */
    if ( source[i] === '*' && target[i] ) {
      continue
    }

    /**
     * if the source ends with "**", and target[i] still exists
     * it means we have a subtree there, we can match it and not
     * look inside it anymore.
     */
    if ( i + 1 === source.length && source[i] === '**' && target[i] ) {
      return true
    }

    /**
     * When source and target are not equal, and all special cases of * or **
     * are treated before this line of code, we basically say it's a do go
     */
    if ( target[i] !== source[i] ) {
      return false
    }
  }

  return true
}

const pathsMatchAnySources = (source: string[][], target: string[][] ) => {
  for ( let i = 0; i < source.length; i += 1 ) {
    for ( let j = 0; j < target.length; j += 1 ) {
      if ( pathMatchesSource(source[i], target[j]) ) {
        return target[j]
      }
    }
  }

  return false
}

class StateTreeSelector <T extends ObjectTree, MP extends SeletorMappingBase<T>> {
  private selectorSet: Array<string[]>
  private mappingFn: MP
  private lastSelectorValue: null | any = null

  private callbackSet: Set<(input: ReturnType<MP>) => unknown> = new Set()
  private disposeMethod: Function

  constructor (
    selectorSet: string[],
    mappingFn: MP,
    disposeMethod: Function
  ) {
    this.mappingFn = mappingFn
    this.disposeMethod = disposeMethod
    this.selectorSet = selectorSet.map((stringPath) => {
      if (stringPath.startsWith('/') ) {
        return stringPath.substr(1).split('/')
      }
      return stringPath.split('/')
    })
  }

  reshape ( callback: (selectorSet: string[][]) => string[][] ) {
    this.selectorSet = callback(this.selectorSet)
  }

  match ( pathArrays:string[][] ) {
    const selectorSet = this.selectorSet
    return pathsMatchAnySources(selectorSet, pathArrays)
  }

  run (stateTree: T, pathsArray: JSONPatchEnhanced[]) {
    const mappedValue = this.mappingFn(stateTree, pathsArray) as ReturnType<MP>
    if ( this.lastSelectorValue !== mappedValue ) {
      this.lastSelectorValue = mappedValue
      this.callbackSet.forEach((callback) => {
        callback(mappedValue)
      })
    }
  }

  observe (callback: (input: ReturnType<MP>) => unknown) {
    if ( this.callbackSet.has(callback) ) {
      throw new Error(`this callback was already registered. If you run things twice, create two different callbacks`)
    }
    this.callbackSet.add(callback)
    return () => {
      this.callbackSet.delete(callback)
    }
  }

  dispose () {
    this.disposeMethod()
  }
}

class StateTreeSelectorsManager<
  T extends ObjectTree, 
  K extends StateTreeSelector<T, SeletorMappingBase<T>>
> {
  
  selectorMap = new WeakMap<T, {selectors: K[]}>()

  registerSelector (stateTree: T, selector: K) {
    let selectorForThisTree = this.selectorMap.get(stateTree)
    if ( !selectorForThisTree ) {
      selectorForThisTree = {
        selectors: [] as K[]
      }
      this.selectorMap.set(stateTree, selectorForThisTree)
    }

    selectorForThisTree.selectors.push(selector)
  }

  removeSelector (stateTree: T, selector: K ) {
    const selectorForThisTree = this.selectorMap.get(stateTree)
    if ( !selectorForThisTree ) {
      return
    }

    const pos = selectorForThisTree.selectors.indexOf(selector)
    if ( pos !== -1 ) {
      selectorForThisTree.selectors = [
        ...selectorForThisTree.selectors.slice(0, pos),
        ...selectorForThisTree.selectors.slice(pos + 1)
      ]
    }
  }

  processPatches(stateTree:T, combinedPatches: JSONPatchEnhanced[]) {
    const selectors = this.selectorMap.get(stateTree)
    if ( !selectors || !selectors.selectors || selectors.selectors.length === 0 ) {
      return
    }

    const pathArrays = combinedPatches.map((patch) => patch.pathArray)
    for ( let i = 0; i < selectors.selectors.length; i += 1 ) {
      const itSelector = selectors.selectors[i]
      const matchedPath = itSelector.match(pathArrays)
      if ( matchedPath ) {
        itSelector.run(stateTree, combinedPatches)
      }
    }
  }
}

const selectorsManager = new StateTreeSelectorsManager()
type SeletorMappingBase<T> = (s: T, patches: JSONPatchEnhanced[]) => unknown

export const select = <T extends ObjectTree, MP extends SeletorMappingBase<T>>(
  stateTree: T, 
  selectors: string[],
  mappingFn: MP
) => {
  const castSelectorManager = (selectorsManager as unknown as StateTreeSelectorsManager<T, StateTreeSelector<T, MP>>)
  const selector = new StateTreeSelector<T, MP>(selectors, mappingFn, () => {
    castSelectorManager.removeSelector(stateTree, selector)
  });
  castSelectorManager.registerSelector(stateTree, selector)
  return selector
}

export const inversePatch = (patch: JSONPatchEnhanced): JSONPatchEnhanced => {
  const { path, pathArray, op, value, old} = patch

  switch ( op ) {
    case 'add':
      return {
        op: 'remove',
        value: old,
        old: value,
        pathArray,
        path
      }
    case 'remove':
      return {
        op: 'add',
        value: old,
        old: value,
        pathArray,
        path
      }
    case 'replace':
      return {
        op: 'replace',
        value: old,
        old: value,
        pathArray,
        path
      }
  }
}
