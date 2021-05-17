declare type ObjectTree = object;
declare type ProxyMapType<T extends ObjectTree> = WeakMap<T, T>;
export declare const Patcher: unique symbol;
declare type JSONPatch = {
    op: 'replace' | 'remove' | 'add';
    path: string;
    value: unknown;
    patchNumber?: number;
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
export declare const mutateFromPatches: <T extends object>(stateTree: T, patches?: JSONPatchEnhanced[] | undefined) => void;
export declare class MutationsManager {
    mutationMaps: Map<ObjectTree, ProxyMapType<ObjectTree>>;
    mutationDirtyPaths: Map<ObjectTree, Set<ProxyMutationObjectHandler<ObjectTree>>>;
    private getSubProxy;
    startMutation(target: ObjectTree): void;
    hasRoot(rootA: any): boolean;
    commit(target: ObjectTree): JSONPatchEnhanced[];
    mutate<T extends ObjectTree>(target: T, callback: (mutable: T) => unknown): JSONPatchEnhanced[] | undefined;
}
export declare const mutate: <T extends object>(stateTree: T, callback: (mutable: T) => unknown) => JSONPatchEnhanced[] | undefined;
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
    readonly proxyfyAccess: <T extends ObjectTree>(target: T, pathArray?: string[]) => T;
    constructor(params: {
        target: T;
        pathArray?: string[];
        dirtyPaths: Set<ProxyMutationObjectHandler<ObjectTree>>;
        proxyfyAccess: <T extends ObjectTree>(target: T, pathArray?: string[]) => T;
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
declare class StateTreeSelector<T extends ObjectTree, MP extends SeletorMappingBase<T>> {
    private selectorSet;
    private mappingFn;
    private lastSelectorValue;
    selectorName: string;
    private callbackSet;
    private disposeMethod;
    constructor(selectorSet: string[], mappingFn: MP, disposeMethod: Function, selectorName: string);
    reshape(callback: (selectorSet: string[][]) => string[][]): void;
    match(pathArrays: string[][]): false | string[];
    run(stateTree: T, pathsArray: JSONPatchEnhanced[]): void;
    observe(callback: (input: ReturnType<MP>) => unknown): () => void;
    dispose(): void;
}
declare type SeletorMappingBase<T> = (s: T, patches: JSONPatchEnhanced[]) => unknown;
export declare const select: <T extends object, MP extends SeletorMappingBase<T>>(stateTree: T, selectors: string[], mappingFn: MP, selectorName: string) => StateTreeSelector<T, MP>;
export declare const inversePatch: (patch: JSONPatchEnhanced) => JSONPatchEnhanced;
export {};
