import { createMutaitonInMutationTree, getPatchesFromMutationTree, makeAndGetChildPointer, MutationTreeNode, NO_VALUE } from "./mutation-map"
import { ProxyCache } from "./proxy-cache"
import { addSelectorToTree, getRefDescedents, removeSelectorFromTree, SelectorTreeBranch } from "./selector-map"
import { isObject } from "./utils/isObject"

export type ObjectTree = object

export type ProxyMapType<T extends ObjectTree> = WeakMap<T, T>

export const Patcher = Symbol('Patcher')
export const WatcherProxy = Symbol('WatcherProxy')
export const TargetRef = Symbol('TargetRef')

type JSONPatch = {
  op: 'replace' | 'remove' | 'add',
  path: string,
  value: unknown,
  old?: unknown
}

export type JSONPatchEnhanced = JSONPatch & {
  pathArray: string[],
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
  mutationSelectorPointers: Map<ObjectTree, Array<SelectorTreeBranch>> = new Map()
  mutationChangePointers: Map<ObjectTree, MutationTreeNode> = new Map()

  private getSubProxy = <T extends ObjectTree>(
    target: ObjectTree, 
    relevantMutationPointer: MutationTreeNode,
    selectorTreePointer: Array<SelectorTreeBranch>,
    subTarget: T, 
    // currentPathArray: string[],
    incOpCount: () => number
  ): T => {
    const mutationProxies = this.mutationMaps.get(target)
    let proxy = mutationProxies?.get(subTarget) as T | undefined
    if ( !proxy ) {
      proxy = new Proxy(subTarget, new ProxyMutationObjectHandler({
        target: subTarget,
        selectorPointerArray: selectorTreePointer,
        mutationNode: relevantMutationPointer,
        dirtyPaths: this.mutationDirtyPaths.get(target) as Set<ProxyMutationObjectHandler<object>>,
        incOpCount: incOpCount,
        // pathArray: currentPathArray,
        proxyfyAccess:  <T extends ObjectTree>(
          subentityFromTarget: T, 
          relevantMutationPointer: MutationTreeNode,
          relevantSelectionPointers: SelectorTreeBranch[], 
          // someOtherPathArray: string[]
        ) => {
          return this.getSubProxy(
            target, 
            relevantMutationPointer,
            relevantSelectionPointers, 
            subentityFromTarget, 
            // someOtherPathArray
            incOpCount
          )
        }
      }) as ProxyHandler<T>) as T
      mutationProxies?.set(subTarget, proxy)
    }

    return proxy
  }

  startMutation (target: ObjectTree) {
    this.mutationMaps.set(target, new WeakMap() as ProxyMapType<ObjectTree>)

    const proxyMapForMutation = new WeakMap() as ProxyMapType<ObjectTree>
    const mutationDirtyPaths = new Set<ProxyMutationObjectHandler<ObjectTree>>()
    const selectorPointers = new Array<SelectorTreeBranch>(
      selectorsManager.getSelectorTree(target)
    )
    const mutationPointer: MutationTreeNode = {
      p: null,
      k: ''
    }
    this.mutationChangePointers.set(target, mutationPointer)
    let opCount = 0
    const incOpCount = () => {
      opCount += 1
      return opCount
    }
    const rootProxy = new Proxy(target, new ProxyMutationObjectHandler({
      target,
      selectorPointerArray: selectorPointers,
      mutationNode: mutationPointer,
      dirtyPaths: mutationDirtyPaths,
      incOpCount: incOpCount,
      proxyfyAccess: <T extends ObjectTree>(subTarget: T, mutationPoiner: MutationTreeNode, newPointers: SelectorTreeBranch[]) => {
        return this.getSubProxy(target, mutationPoiner, newPointers, subTarget, incOpCount)
      }
    }))
    proxyMapForMutation.set(target, rootProxy)

    this.mutationDirtyPaths.set(target, mutationDirtyPaths)
    this.mutationMaps.set(target, proxyMapForMutation)
    this.mutationSelectorPointers.set(target, selectorPointers)
  }

  hasRoot (rootA: any) {
    return this.mutationMaps.has(rootA)
  }

  commit (target: ObjectTree) {
    const dirtyPaths = this.mutationDirtyPaths.get(target) 
    if ( !dirtyPaths ) {
      return []
    }

    const uniqueSelectorPaths = Array.from(dirtyPaths).reduce(
      (
        selectorPointers,
        value,
      ) => {
        value.writeSelectorPointerArray
          .filter((item) => {
            return item.propName !== 'root'
          })
          .forEach(item => selectorPointers.add(item))

        return selectorPointers
      }, 
      new Set() as Set<SelectorTreeBranch>
    )

    
    // const combinedPatches = combinedJSONPatches(allDistinctPatches)
    const combinedPatches = getPatchesFromMutationTree(this.mutationChangePointers.get(target)!)
    selectorsManager.runSelectorPointers(target, uniqueSelectorPaths, combinedPatches)

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

const makeAutoRunProxy = <T extends ObjectTree>(
  stateTree: T, 
  path: string[],
  selectorTree: SelectorTreeBranch,
  currentPointers: SelectorTreeBranch[],
  callbackWithCleanupOfCurrentPointers: () => void
): object => {
  return new Proxy(stateTree, {
    get: (target, prop) => {
      if ( typeof prop === 'symbol' && prop === WatcherProxy ) {
        return true
      }
      if (typeof prop === "symbol" || prop === 'hasOwnProperty') {
        return Reflect.get(target, prop);
      }

      const protoDesc = Object.getOwnPropertyDescriptor(
        target.constructor.prototype,
        prop
      );

      if ( protoDesc?.get ) {
        return protoDesc.get.call(
          makeAutoRunProxy(
            stateTree,
            path,
            selectorTree,
            currentPointers,
            callbackWithCleanupOfCurrentPointers
          )
        )
      } else {
        const subEntity = target[prop as keyof typeof target]
        // we add a selector entity here
        currentPointers.push(addSelectorToTree(
          selectorTree,
          [...path, prop],
          callbackWithCleanupOfCurrentPointers,
        ))
        if (isObject(subEntity)) {
          return makeAutoRunProxy(
            subEntity,
            [...path, prop] as string[],
            selectorTree,
            currentPointers,
            callbackWithCleanupOfCurrentPointers
          )
        }
        return subEntity
      }

    },

    /**
     * Proxy trap for Object.getOwnPropertyDescriptor()
     * Used to check if we are using a proxy that is
     * intended for usage in the autorun or not
     */
    getOwnPropertyDescriptor(target, prop) {
      if ( prop === WatcherProxy ) {
        return {
          configurable: true,
          value: true
        }
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },

    ownKeys (target) {
      currentPointers.push(addSelectorToTree(
        selectorTree,
        [...path, "*"],
        callbackWithCleanupOfCurrentPointers,
      ))
      return Reflect.ownKeys(target)
    }
  })
}

export const autorun = <T extends ObjectTree>(
  stateTree: T,
  callback: (observable: T, patches?: JSONPatchEnhanced[]) => unknown
) => {
  const castSelectorManager = (selectorsManager as unknown as StateTreeSelectorsManager<T>)
  const selectorTree = castSelectorManager.getSelectorTree(stateTree)

  let currentPointers: SelectorTreeBranch[] = []

  const cleanup = () => {
    currentPointers.forEach((pointer) => {
      removeSelectorFromTree(pointer, callbackWithCleanupOfCurrentPointers)
    })
  }
  const callbackWithCleanupOfCurrentPointers = (_state?: T, patches?: JSONPatchEnhanced[]) => {
    cleanup()
    currentPointers = []
    const proxyTree = makeAutoRunProxy(
      stateTree,
      [],
      selectorTree,
      currentPointers,
      callbackWithCleanupOfCurrentPointers
    ) as T
    callback(proxyTree, patches)
  }

  callbackWithCleanupOfCurrentPointers()

  return cleanup
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

type ProxyAccessFN<T = any> = (
  target: T, 
  mutationPointer: MutationTreeNode,
  newPointers: SelectorTreeBranch[], 
  // pathArray: string[] 
) => T
export class ProxyMutationObjectHandler<T extends object> {
  // readonly pathArray: string[]
  readonly deleted: Record<string, boolean> = {}

  // THIS SHOULD BE DELTEDD AFTER NEW COMBINED PATCHES
  // it is used to set the "old" reference value of a
  // patch. I think we no longer need this, since we
  // can read the target value at the time of the change
  // and work our way from there anyway.
  readonly original: Partial<T> = {}

  // parent set this (origin mutation manager)
  // targetRef is the current object that is proxied over?
  // or is it the ROOT of the mutation? It is the target
  // of the proxy, so the current object that is being
  // used by the proxy.
  // COULD BE CLOUSER BASED
  readonly targetRef: T

  /**
   * ops are the individual operations happening on this
   * object. All the intermediary entities that would 
   * most probably dissapear with the new change.
   */
  // readonly ops: JSONPatch[] = []

  // parent set this (origin mutation manager)
  // COULD BE CLOUSER BASED
  readonly dirtyPaths: Set<ProxyMutationObjectHandler<ObjectTree>>

  // parent set this (origin mutation manager)
  // call that can create new proxies, managed by mutation manager
  // COULD BE CLOUSER BASED
  readonly proxyfyAccess: ProxyAccessFN

  // parent set this (origin mutation manager)
  // contains the starting selection pointers for this root, then 
  // for each sublevel
  // COULD BE CLOUSER BASED
  readonly selectorPointerArray: Array<SelectorTreeBranch>

  // locally created, then sent over array for writes. Probably can
  // be imrpvoed
  readonly writeSelectorPointerArray: Array<SelectorTreeBranch> = []


  mutationNode: MutationTreeNode
  incOpCount: () => number

  constructor (params: {
    mutationNode: MutationTreeNode,
    target: T, 
    // pathArray: string []
    selectorPointerArray: Array<SelectorTreeBranch>,
    dirtyPaths: Set<ProxyMutationObjectHandler<ObjectTree>>,
    proxyfyAccess: ProxyAccessFN,
    incOpCount: () => number
  }) {
    const { target, proxyfyAccess, dirtyPaths} = params
    // this.pathArray = pathArray
    this.targetRef = target
    this.proxyfyAccess = proxyfyAccess
    this.dirtyPaths = dirtyPaths
    this.selectorPointerArray = params.selectorPointerArray
    this.mutationNode = params.mutationNode
    this.incOpCount = params.incOpCount
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
    if (typeof subEntity === 'object' && subEntity !== null) {
      // There is no way of knowing if an object is a Proxy or not.
      // In order for us to avoid creating Proxies in Proxies, we are
      // caching the already created ones and if in the future we
      // need them, we are just getting them from the cache
      // Other framerworks/libs use a symbol to mark their proxies
      // with it and check for that symbol.
      if (ProxyCache.exists(subEntity as unknown as object)) {
        return subEntity
      }

      const { selectorPointerArray } = this
      const subPropSelectionPointers = selectorPointerArray.reduce((acc: SelectorTreeBranch[], item) => {
        const descendentPointers = getRefDescedents(
          item,
          prop as any
        )
        if ( descendentPointers ) {
          acc.push(...descendentPointers)
        }
        return acc
      }, [])

      const subPropMutationPointer = makeAndGetChildPointer(
        this.mutationNode,
        prop as string | number
      )

      const entityProxy = this.proxyfyAccess(
        subEntity,
        subPropMutationPointer,
        subPropSelectionPointers,
        // [...this.pathArray, prop] as string[]
      )

      if (!ProxyCache.exists(entityProxy as unknown as object)) {
        ProxyCache.cache(entityProxy)
      }
      return entityProxy
    }
    return subEntity
  }

  set <K extends keyof T>(target: T, prop: K, value: T[K]) {
    // console.log('set handler called', [prop, value], this.path)
    // TODO consider moving this from a global into a normal var
    if ( prop === 'length' && Array.isArray(target) ) {
      return true
    }
    // console.log(`set`, target, prop, value)

    this.writeSelectorPointerArray.push(
      ...this.selectorPointerArray.reduce((acc: SelectorTreeBranch[], item) => {
        const descendentPointers = getRefDescedents(
          item,
          prop as string | number
        )
        if ( descendentPointers ) {
          acc.push(...descendentPointers)
        }
        return acc
      }, [])
    )

    this.dirtyPaths.add(this)

    // could "tick" right here and produce the derivates :) :-? 
    // let opType: 'add' | 'replace' | 'remove' = 'add'
    // if ( target[prop] ) {
    //   opType = value ? 'replace' : 'remove'
    // }

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
        // was opValue = {...value} before. not sure why, all tests pass without it
        // if spread is needed it must account for arrays from now on. Leaving it
        // as a check for now to be safe.
        opValue = Array.isArray(value) ? [...value] as unknown as T[K]: {...value}
      }
    }

    /**
     * Same thing for the old value. If we reference an object
     * that object will no longer hold the old values after the
     * mutation.
     */
    let opOriginal = this.original[prop]
    if ( typeof opOriginal === 'object' && opOriginal !== null ) {
      opOriginal = {...opOriginal} as Partial<T>[K]
    }

     /**
     * NEW MUTATION ALGO
     */


     const childMutationPointer = makeAndGetChildPointer(
      this.mutationNode,
      prop as string | number // we don't have symbols, not sure how we would set a symbol
    )

    createMutaitonInMutationTree(
      childMutationPointer,
      // if prop exists in target, we replace, otherwise we spcify NO_VALUE
      prop in target ? target[prop] : NO_VALUE,
      opValue,
      this.incOpCount()
    )

    /**
     * END NEW MUTATION ALGO
     */
    
    // this.ops.push({
    //   op: opType,
    //   path: String(prop),
    //   old: opOriginal,
    //   value: opValue,
    // })

    return Reflect.set(target, prop, value)
  }

  /**
   * Proxy trap for delete keyword
   */
  deleteProperty <K extends keyof T>(target: T, prop: K) {
    if (prop in target) {
      if ( typeof prop === 'string' ) {

        this.writeSelectorPointerArray.push(
          ...this.selectorPointerArray.reduce((acc: SelectorTreeBranch[], item) => {
            const descendentPointers = getRefDescedents(
              item,
              prop as string | number
            )
            if ( descendentPointers ) {
              acc.push(...descendentPointers)
            }
            return acc
          }, [])
        )

        const childMutationPointer = makeAndGetChildPointer(
          this.mutationNode,
          prop as string | number // we don't have symbols, not sure how we would set a symbol
        )

        createMutaitonInMutationTree(
          childMutationPointer,
          target[prop],
          NO_VALUE,
          this.incOpCount()
        )

        this.dirtyPaths.add(this)
        this.deleted[prop] = true
        
        if ( !this.original.hasOwnProperty(prop) ) {
          this.original[prop] = target[prop]
        }

        let opOriginal = this.original[prop]
        if ( typeof opOriginal === 'object' && opOriginal !== null ) {
          opOriginal = {...opOriginal} as Partial<T>[K & string]
        }
        
        // this.ops.push({
        //   op: 'remove',
        //   path: `${prop}`,
        //   old: opOriginal,
        //   value: undefined
        // })
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

/**
 * Returns the array of keys that make up the selector path
 * Removes the / at the beginning of the string, if it is 
 * specified
 * 
 * @param selector string
 * @returns string[]
 */
const getSelectorPathArray = (selector:string) => {
  if (selector.startsWith('/') ) {
    return selector.substring(1).split('/')
  }
  return selector.split('/')
}
export class StateTreeSelectorsManager<
  T extends ObjectTree, 
> {
  // TODO could be a global weak map, and have less
  // class instances in the implementation
  selectorTrees = new WeakMap<T, SelectorTreeBranch>()
  getSelectorTree(stateTree: T) {
    if (!this.selectorTrees.has(stateTree)) {
      const newSelectorTree: SelectorTreeBranch = {
        propName: 'root'
      }
      this.selectorTrees.set(stateTree, newSelectorTree)
      return newSelectorTree
    }
    return this.selectorTrees.get(stateTree)!
  }

  runSelectorPointers(
    stateTree: T, 
    selectorPointers: Set<SelectorTreeBranch>,
    combinedPatches: JSONPatchEnhanced[]
  ) {

    const uniqueSelectorFunctions = new Set<SelectorMappingBase<any>>()

    const callSelector = (sub: SelectorMappingBase<T>) => {
      sub(stateTree, combinedPatches)
    }

    const addToSet = uniqueSelectorFunctions.add.bind(uniqueSelectorFunctions)

    const callSelectorOnLayerThenChildren = (layerPointers: SelectorTreeBranch[], isRootPointer = false) => {
      layerPointers.forEach((layerPointer) => {
        const { subs, children } = layerPointer
        if ( isRootPointer ) {
          subs?.forEach(addToSet)
        } else {
          subs?.filter((sub) => {
            return sub.options?.reactToAncestorChanges
          }).forEach(addToSet)
        }
        if ( children ) {
          callSelectorOnLayerThenChildren(Object.values(children))
        }
      })
    }

    callSelectorOnLayerThenChildren(selectorPointers as unknown as SelectorTreeBranch[], true)

    uniqueSelectorFunctions.forEach(callSelector)
  }
}

export const selectorsManager = new StateTreeSelectorsManager()

export type SelectorOptions = {
  reactToAncestorChanges?: boolean;
};

export type SelectorMappingBase<T> = {
  (s: T, patches: JSONPatchEnhanced[]): unknown;
  options?: SelectorOptions;
};

export const select = <T extends ObjectTree, MP extends SelectorMappingBase<T>>(
  stateTree: T, 
  selectors: string[],
  mappingFn: MP,
  options?: {
    reactToAncestorChanges?: boolean
  }
) => {
  const castSelectorManager = (selectorsManager as unknown as StateTreeSelectorsManager<T>)

  const selectorTree = castSelectorManager.getSelectorTree(stateTree)
  const observersSet = new Set<(input: ReturnType<MP>) => unknown>()
  const selectorWithObservers: SelectorMappingBase<T> = (...args) => {
    const value = mappingFn(...args)
    observersSet.forEach(obs => obs(value as ReturnType<MP>))
    return value
  }
  
  const pointers = selectors.map((selector) => {
    return addSelectorToTree(
      selectorTree,
      getSelectorPathArray(selector),
      selectorWithObservers,
      options
    )
  })
  
  return {
    reshape: () => {
      throw new Error(`reshape is no longer supported`)
    },
    observe: (fn: (input: ReturnType<MP>) => unknown) => {
      console.warn("observe is depreacated. Use just selectors or autorun instead")
      observersSet.add(fn)
      return () => {
        observersSet.delete(fn)
      }
    },
    dispose: () => {
      for (const pointer of pointers) {
        removeSelectorFromTree(
          pointer,
          selectorWithObservers
        )
      }
    }
  }
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

export const LIB_VERSION = '2.0.3beta'
