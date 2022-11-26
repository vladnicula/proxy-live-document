import { SelectorTreeBranch } from "./selector-map";
export declare type ObjectTree = object;
export declare type ProxyMapType<T extends ObjectTree> = WeakMap<T, T>;
export declare const Patcher: unique symbol;
export declare const WatcherProxy: unique symbol;
export declare const TargetRef: unique symbol;
declare type JSONPatch = {
    op: 'replace' | 'remove' | 'add';
    path: string;
    value: unknown;
    old?: unknown;
};
export declare type JSONPatchEnhanced = JSONPatch & {
    pathArray: string[];
};
/**
 * Was used to apply changes in the mutation function after all the operatoins finished.
 * I changed that to allow writing immediatly in the mutation. Now, when a class instance
 * makes a change somewhere deep in the tree, the change happens immedtialy. I keep track
 * of it in the json patch operations and can reason about it later on.
 *
 * This will come in handy for real time colaboraiton when changes from the server will be
 * captured and handled by clients.
 */
export declare const applyInternalMutation: <T extends object>(mutations: JSONPatchEnhanced[], stateTree: T) => void;
export declare const combinedJSONPatches: (operations: JSONPatchEnhanced[]) => JSONPatchEnhanced[];
export declare const applyJSONPatchOperation: <T extends object>(operation: JSONPatchEnhanced, stateTree: T) => void;
export declare const mutateFromPatches: <T extends object>(stateTree: T, patches: JSONPatchEnhanced[]) => void;
export declare class MutationsManager {
    mutationMaps: Map<ObjectTree, ProxyMapType<ObjectTree>>;
    mutationDirtyPaths: Map<ObjectTree, Set<ProxyMutationObjectHandler<ObjectTree>>>;
    mutationSelectorPointers: Map<ObjectTree, Array<SelectorTreeBranch>>;
    private getSubProxy;
    startMutation(target: ObjectTree): void;
    hasRoot(rootA: any): boolean;
    commit(target: ObjectTree): JSONPatchEnhanced[];
    mutate<T extends ObjectTree>(target: T, callback: (mutable: T) => unknown): JSONPatchEnhanced[] | undefined;
}
export declare const mutate: <T extends object>(stateTree: T, callback: (mutable: T) => unknown) => JSONPatchEnhanced[] | undefined;
export declare const autorun: <T extends object>(stateTree: T, callback: (observable: T) => unknown) => void;
/**
 * When working with domain objects, it's probably best to have a
 * method that serializes them so we can 'snapshot' how they origianlly
 * looked like before a changed appened. Without this, object spreads
 * on those object might not create the best results.
 *
 * For the first phase of this, I'm only looking at plain objects in
 * the initial algorithm. In the second phase this might come in handy.
 */
export declare abstract class IObservableDomain {
    abstract toJSON: () => Record<string, unknown>;
    abstract fromJSON: (input: Record<string, unknown>) => void;
}
export declare class ProxyMutationObjectHandler<T extends object> {
    readonly pathArray: string[];
    readonly deleted: Record<string, boolean>;
    readonly original: Partial<T>;
    readonly targetRef: T;
    readonly ops: JSONPatch[];
    readonly dirtyPaths: Set<ProxyMutationObjectHandler<ObjectTree>>;
    readonly proxyfyAccess: <T extends ObjectTree>(target: T, newPointers: SelectorTreeBranch[], pathArray?: string[]) => T;
    readonly selectorPointerArray: Array<SelectorTreeBranch>;
    readonly writeSelectorPointerArray: Array<SelectorTreeBranch>;
    constructor(params: {
        target: T;
        pathArray?: string[];
        selectorPointerArray: Array<SelectorTreeBranch>;
        dirtyPaths: Set<ProxyMutationObjectHandler<ObjectTree>>;
        proxyfyAccess: <T extends ObjectTree>(target: T, newPointers: SelectorTreeBranch[], pathArray?: string[]) => T;
    });
    get<K extends keyof T>(target: T, prop: K): any;
    set<K extends keyof T>(target: T, prop: K, value: T[K]): boolean;
    /**
     * Proxy trap for delete keyword
     */
    deleteProperty<K extends keyof T>(target: T, prop: K): boolean;
    /**
     * Proxy trap for Object.getOwnPropertyDescriptor()
     */
    getOwnPropertyDescriptor<K extends keyof T>(target: T, prop: K): PropertyDescriptor | undefined;
    /**
     * Proxy trap for when looking at what keys we have
     */
    ownKeys(target: T): (string | number | symbol)[];
    /**
     * Proxy trap for when looking at what keys we have
     */
    has<K extends keyof T>(target: T, key: K): boolean;
}
export declare const pathMatchesSource: (source: string[], target: string[]) => boolean;
declare class StateTreeSelectorsManager<T extends ObjectTree> {
    selectorTrees: WeakMap<T, SelectorTreeBranch>;
    getSelectorTree(stateTree: T): SelectorTreeBranch;
    runSelectorPointers(stateTree: T, selectorPointers: SelectorTreeBranch[], combinedPatches: JSONPatchEnhanced[]): void;
}
export declare const selectorsManager: StateTreeSelectorsManager<object>;
export declare type SeletorMappingBase<T> = (s: T, patches: JSONPatchEnhanced[]) => unknown;
export declare const select: <T extends object, MP extends SeletorMappingBase<T>>(stateTree: T, selectors: string[], mappingFn: MP) => {
    reshape: () => never;
    observe: (fn: (input: unknown) => unknown) => () => void;
    dispose: () => void;
};
export declare const inversePatch: (patch: JSONPatchEnhanced) => JSONPatchEnhanced;
export {};
