"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.select = exports.pathMatchesSource = exports.observe = exports.ProxyMutationObjectHandler = exports.IObservableDomain = exports.mutate = exports.mutateFromPatches = exports.applyJSONPatchOperation = exports.combinedJSONPatches = exports.applyInternalMutation = exports.Patcher = void 0;
exports.Patcher = Symbol('Patcher');
// can we have a better way to define the type of this one?
let MutationProxyMap = new WeakMap();
let dirtyPaths = new Set();
/**
 * Was used to apply changes in the mutation function after all the operatoins finished.
 * I changed that to allow writing immediatly in the mutation. Now, when a class instance
 * makes a change somewhere deep in the tree, the change happens immedtialy. I keep track
 * of it in the json patch operations and can reason about it later on.
 *
 * This will come in handy for real time colaboraiton when changes from the server will be
 * captured and handled by clients.
 */
exports.applyInternalMutation = (mutations, stateTree) => {
    mutations.forEach(mutation => {
        exports.applyJSONPatchOperation(mutation, stateTree);
    });
};
exports.combinedJSONPatches = (operations) => {
    const skipMap = new Map();
    for (let i = 0; i < operations.length; i += 1) {
        const compareOp = operations[i];
        if (skipMap.has(compareOp)) {
            continue;
        }
        for (let j = 0; j < operations.length; j += 1) {
            const compareWithOp = operations[j];
            if (compareOp === compareWithOp || skipMap.has(compareWithOp)) {
                continue;
            }
            if (compareWithOp.path.includes(compareOp.path)
                && combineIntersectedPathOperations(compareOp, compareWithOp)) {
                skipMap.set(compareWithOp, true);
            }
        }
    }
    return operations.filter((op) => !skipMap.has(op));
};
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
const combineIntersectedPathOperations = (into, from) => {
    const pathTarget = into.path;
    const pathFrom = from.path;
    if (!pathFrom.includes(pathTarget)) {
        return false;
    }
    switch (into.op) {
        case "remove":
            return true;
        case "add":
            mergeWithParentAdd(into, from);
            return true;
        case "replace":
            return true;
        default:
            return false;
    }
};
const mergeWithParentAdd = (into, from) => {
    const mergeIntoValue = into.value;
    const subPath = from.path.replace(into.path, '');
    const subPathArray = subPath.split('/').filter(part => !!part);
    exports.applyJSONPatchOperation({
        ...from,
        path: subPath,
        pathArray: subPathArray
    }, mergeIntoValue);
};
exports.applyJSONPatchOperation = (operation, stateTree) => {
    const { op, pathArray, value } = operation;
    const pathArrayLen = pathArray.length;
    if (!pathArrayLen) {
        return;
    }
    let currentStateTree = stateTree;
    let itPathPart;
    let lastPatcher = currentStateTree.hasOwnProperty(exports.Patcher) ? {
        entity: currentStateTree,
        pathArray: [...pathArray]
    } : null;
    for (let i = 0; i < pathArrayLen - 1; i += 1) {
        itPathPart = pathArray[i];
        if (!currentStateTree.hasOwnProperty(itPathPart)) {
            throw new Error(`applyJSONPatchOperation cannot walk json patch path ${pathArray.join('/')}. Cannot access path ${[...pathArray].slice(0, i).join('/')}.`);
        }
        currentStateTree = currentStateTree[itPathPart];
        if (currentStateTree.hasOwnProperty(exports.Patcher)) {
            lastPatcher = {
                entity: currentStateTree,
                pathArray: [...pathArray].slice(i + 1)
            };
        }
    }
    const lastPathPart = pathArray[pathArrayLen - 1];
    if (lastPatcher && `applyPatch` in lastPatcher.entity && typeof lastPatcher.entity.applyPatch === 'function') {
        const subPathArray = operation.pathArray.filter((pathPart) => (lastPatcher === null || lastPatcher === void 0 ? void 0 : lastPatcher.pathArray.indexOf(pathPart)) !== -1);
        const subPathString = subPathArray.join('/');
        lastPatcher.entity.applyPatch({
            ...operation,
            path: subPathString,
            pathArray: subPathArray
        });
        return;
    }
    switch (op) {
        case 'add':
        case 'replace':
            Object.assign(currentStateTree, { [lastPathPart]: value });
            break;
        case 'remove':
            delete currentStateTree[lastPathPart];
            break;
    }
};
exports.mutateFromPatches = (stateTree, patches) => {
    exports.mutate(stateTree, (mutatable) => {
        for (let i = 0; i < patches.length; i += 1) {
            exports.applyJSONPatchOperation(patches[i], mutatable);
        }
    });
};
exports.mutate = (stateTree, callback) => {
    const proxy = proxyfyAccess(stateTree);
    callback(proxy);
    const patch = Array.from(dirtyPaths).reduce((acc, value) => {
        const { pathArray: path, ops } = value;
        const sourcePath = path.length ? `/${path.join('/')}` : '';
        for (let i = 0; i < ops.length; i += 1) {
            const op = ops[i];
            acc.push({
                ...op,
                path: `${sourcePath}/${op.path}`,
                pathArray: [...path, op.path]
            });
        }
        return acc;
    }, []);
    const combinedPatches = exports.combinedJSONPatches(patch);
    MutationProxyMap = new WeakMap();
    dirtyPaths = new Set();
    selectorsManager.processPatches(stateTree, combinedPatches);
    return combinedPatches;
};
const proxyfyAccess = (target, path = []) => {
    let proxy = MutationProxyMap.get(target);
    if (!proxy) {
        proxy = new Proxy(target, new ProxyMutationObjectHandler(path));
        MutationProxyMap.set(target, proxy);
    }
    return proxy;
};
/**
 * When working with domain objects, it's probably best to have a
 * method that serializes them so we can 'snapshot' how they origianlly
 * looked like before a changed appened. Without this, object spreads
 * on those object might not create the best results.
 *
 * For the first phase of this, I'm only looking at plain objects in
 * the initial algorithm. In the second phase this might come in handy.
 */
class IObservableDomain {
}
exports.IObservableDomain = IObservableDomain;
class ProxyMutationObjectHandler {
    constructor(pathArray) {
        this.deleted = {};
        this.original = {};
        this.ops = [];
        this.pathArray = pathArray;
    }
    get(target, prop) {
        if (typeof prop === "symbol" || prop === 'hasOwnProperty') {
            return Reflect.get(target, prop);
        }
        if (typeof prop === 'string' && this.deleted.hasOwnProperty(prop)) {
            return undefined;
        }
        const subEntity = target[prop];
        if (typeof subEntity === 'object' && subEntity !== null) {
            return proxyfyAccess(subEntity, [...this.pathArray, prop]);
        }
        return subEntity;
    }
    set(target, prop, value) {
        // console.log('set handler called', [prop, value], this.path)
        // TODO consider moving this from a global into a normal var
        dirtyPaths.add(this);
        let opType = 'add';
        if (target[prop]) {
            opType = value ? 'replace' : 'remove';
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
        if (!this.original.hasOwnProperty(prop) && target.hasOwnProperty(prop)) {
            this.original[prop] = target[prop];
        }
        /**
         * JSON Patch values should not have reference to mutable
         * objects that are set. If we set them as references then
         * later modifications will appear in them.
         */
        let opValue = value;
        if (typeof value === 'object' && value !== null) {
            opValue = { ...value };
        }
        /**
         * Same thing for the old value. If we reference an object
         * that object will no longer hold the old values after the
         * mutation.
         */
        let opOriginal = this.original[prop];
        if (typeof opOriginal === 'object' && opOriginal !== null) {
            opOriginal = { ...opOriginal };
        }
        this.ops.push({
            op: opType,
            path: `${prop}`,
            old: opOriginal,
            value: opValue,
        });
        return Reflect.set(target, prop, value);
    }
    /**
     * Proxy trap for delete keyword
     */
    deleteProperty(target, prop) {
        if (prop in target) {
            if (typeof prop === 'string') {
                dirtyPaths.add(this);
                this.deleted[prop] = true;
                if (!this.original.hasOwnProperty(prop)) {
                    this.original[prop] = target[prop];
                }
                let opOriginal = this.original[prop];
                if (typeof opOriginal === 'object' && opOriginal !== null) {
                    opOriginal = { ...opOriginal };
                }
                this.ops.push({
                    op: 'remove',
                    path: `${prop}`,
                    old: opOriginal,
                    value: undefined
                });
            }
        }
        return Reflect.deleteProperty(target, prop);
    }
    /**
     * Proxy trap for Object.getOwnPropertyDescriptor()
     */
    getOwnPropertyDescriptor(target, prop) {
        if (typeof prop === 'string' && this.deleted[prop]) {
            return undefined;
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
    }
    /**
     * Proxy trap for when looking at what keys we have
     */
    ownKeys(target) {
        return Reflect.ownKeys(target);
    }
    /**
     * Proxy trap for when looking at what keys we have
     */
    has(target, key) {
        return Reflect.has(target, key);
    }
}
exports.ProxyMutationObjectHandler = ProxyMutationObjectHandler;
class ProxySelectorObjectHandler {
    constructor(pathArray) {
        this.pathArray = pathArray;
    }
    get(target, prop) {
        return Reflect.get(target, prop);
    }
}
exports.observe = (stateTree, selector) => {
    const selectionProxy = new Proxy(stateTree, new ProxySelectorObjectHandler([]));
    selector(selectionProxy);
};
exports.pathMatchesSource = (source, target) => {
    if (source.indexOf('**') === -1 && source.length !== target.length) {
        return false;
    }
    for (let i = 0; i < source.length; i += 1) {
        /**
         * If this level of the path is static and is matched we
         * continue to the next path
         */
        if (source[i] === target[i]) {
            continue;
        }
        /**
         * if we match anything and still have something to match
         * we continue to look at the next entities
         */
        if (source[i] === '*' && target[i]) {
            continue;
        }
        /**
         * if the source ends with "**", and target[i] still exists
         * it means we have a subtree there, we can match it and not
         * look inside it anymore.
         */
        if (i + 1 === source.length && source[i] === '**' && target[i]) {
            return true;
        }
        /**
         * When source and target are not equal, and all special cases of * or **
         * are treated before this line of code, we basically say it's a do go
         */
        if (target[i] !== source[i]) {
            return false;
        }
    }
    return true;
};
const pathsMatchAnySources = (source, target) => {
    for (let i = 0; i < source.length; i += 1) {
        for (let j = 0; j < target.length; j += 1) {
            if (exports.pathMatchesSource(source[i], target[j])) {
                return target[j];
            }
        }
    }
    return false;
};
class StateTreeSelector {
    constructor(selectorSet, mappingFn, disposeMethod) {
        this.callbackSet = new Set();
        this.mappingFn = mappingFn;
        this.disposeMethod = disposeMethod;
        this.selectorSet = selectorSet.map((stringPath) => {
            if (stringPath.startsWith('/')) {
                return stringPath.substr(1).split('/');
            }
            return stringPath.split('/');
        });
    }
    match(pathArrays) {
        const selectorSet = this.selectorSet;
        return pathsMatchAnySources(selectorSet, pathArrays);
    }
    run(stateTree, pathsArray) {
        const mappedValue = this.mappingFn(stateTree, pathsArray);
        this.callbackSet.forEach((callback) => {
            callback(mappedValue);
        });
    }
    observe(callback) {
        if (this.callbackSet.has(callback)) {
            throw new Error(`this callback was already registered. If you run things twice, create two different callbacks`);
        }
        this.callbackSet.add(callback);
    }
    dispose() {
        this.disposeMethod();
    }
}
class StateTreeSelectorsManager {
    constructor() {
        this.selectorMap = new WeakMap();
    }
    registerSelector(stateTree, selector) {
        let selectorForThisTree = this.selectorMap.get(stateTree);
        if (!selectorForThisTree) {
            selectorForThisTree = {
                selectors: []
            };
            this.selectorMap.set(stateTree, selectorForThisTree);
        }
        selectorForThisTree.selectors.push(selector);
    }
    removeSelector(stateTree, selector) {
        const selectorForThisTree = this.selectorMap.get(stateTree);
        if (!selectorForThisTree) {
            return;
        }
        const pos = selectorForThisTree.selectors.indexOf(selector);
        if (pos !== -1) {
            selectorForThisTree.selectors = [
                ...selectorForThisTree.selectors.slice(0, pos),
                ...selectorForThisTree.selectors.slice(pos + 1)
            ];
        }
    }
    processPatches(stateTree, combinedPatches) {
        const selectors = this.selectorMap.get(stateTree);
        if (!selectors || !selectors.selectors || selectors.selectors.length === 0) {
            return;
        }
        const pathArrays = combinedPatches.map((patch) => patch.pathArray);
        for (let i = 0; i < selectors.selectors.length; i += 1) {
            const itSelector = selectors.selectors[i];
            const matchedPath = itSelector.match(pathArrays);
            if (matchedPath) {
                itSelector.run(stateTree, combinedPatches);
            }
        }
    }
}
const selectorsManager = new StateTreeSelectorsManager();
exports.select = (stateTree, selectors, mappingFn) => {
    const castSelectorManager = selectorsManager;
    const selector = new StateTreeSelector(selectors, mappingFn, () => {
        castSelectorManager.removeSelector(stateTree, selector);
    });
    castSelectorManager.registerSelector(stateTree, selector);
    return selector;
};
//# sourceMappingURL=index.js.map