import type { JSONPatchEnhanced } from ".";
import { isObject } from "./utils/isObject";

// When we remove an entity, we set the new value to NO_VALUE
// When we add an entity, we set the old value to NO_VALUE
// This way, we have support for falsy values as real values
export const NO_VALUE = Symbol('NoValue')
export interface MutationTreeNodeWithReplace {
    /** operation replace */
    op: "replace",
    /** replace has an old value, which might be falsy, but still exists */
    old: unknown,
    /** new value is again, probably falsy, but still exists */
    new: unknown,
    opCount: number
}

export interface MutationTreeNodeWithRemove {
    /** operation remove old contains old value */
    op: "remove",
    /** old value ca be fasly, but still exists */
    old: unknown
    opCount: number
 }
 
 export interface MutationTreeNodeWithAdd {
   /** operation add only contains a new value */
   op: "add",
   /** new value is can be falsy, but still exists */
   new: any
   opCount: number
 }
 
 export type MutationTreeNode = ( {} | MutationTreeNodeWithReplace | MutationTreeNodeWithRemove | MutationTreeNodeWithAdd) & {
   // /** 
   //  * dirty or not. If true, it meas at least one descedent (or self)
   //  * has a change. This flag is useful when creating patches
   //  * for syncronization because there are cases where a lot of reads
   //  * happen in a mutation and no write is done, leaving a lot of
   //  * branhces in the mutation tree that don't have any update and
   //  * can safely be ignored when the patch creation algorithm runs.
   //  */
   // d?: boolean
   k: string | number,
   p: null | MutationTreeNode
   /** the children of this node */
   c?: Record<string, MutationTreeNode>
 
   // /**
   //  * If a different ancestor node is already
   //  * containing this node's change.
   //  */
   // o?: null | MutationTreeNode
 }
 

/**
 * Given a mutaion node, it will look thru its ancestors
 * for a node that has a mutation operation and is not
 * owned by another mutation operation somewhere upper
 * in a tree. This is useful for sitautions when multiple
 * levels of a hierarchy have been altered in various ways
 * by a transaction, and a new write need to go to the 
 * top most entity that contains an operations, because that
 * is the place where the new values will have to exist
 * in the combined patches result.
 * 
 * Apart from the node that is the owner, we also need
 * to return the path, the breadcrumbs from the node
 * that we sent as a param and the destination that we found.
 * 
 */
export const getParentWithOperation = (mutationNode: MutationTreeNode) => {
    let lookupNode: MutationTreeNode = mutationNode
    let path = []
    while ( lookupNode.p ) {
        path.push(lookupNode.k)
        lookupNode = lookupNode.p
        if ('op' in lookupNode) {
            break
        }
    }

    if ( 'op' in lookupNode ) {
        return [lookupNode, path.reverse()] as [MutationTreeNode, string[]]
    }
    return null;
}

export const makeAndGetChildPointer = (mutationNode: MutationTreeNode, prop: string | number) => {
    mutationNode.c = mutationNode.c ?? {}
    
    if ( !mutationNode.c[prop] ) {
        mutationNode.c[prop] = {
            p: mutationNode,
            k: prop
        }
    }
    
    return mutationNode.c[prop]
}

export const createMutaitonInMutationTree = (
    mutationNode: MutationTreeNode, 
    oldValue: unknown,
    newValue: unknown,
    opCount: number
) => {
    // 1. check if this node contains an operation
    if ( "op" in mutationNode ) {
        // if the new value is NO_VALUE, it means we are deleting
        // this entity, so we can remove this element, meaning
        // we change the operation into a REMOVE and keep the
        // old value
        if ( newValue === NO_VALUE ) {
            // remove the new key from the object if it exists
            ('new' in mutationNode) ? delete mutationNode.new : null
            Object.assign(mutationNode, {
                op: "remove",
            })
        // if the value is normal, we just add it as the new value
        // and are done with it
        } else {
            Object.assign(mutationNode, {
                new: newValue,
                op: mutationNode.op === 'remove' ? 'replace' : mutationNode.op
            })
        }
        return
    }

    // 2. then handle the case where an ancestor has a mutation already
    const ownerInfo = getParentWithOperation(mutationNode)
    // if an ancestor of this path already has a operation,
    // we merge this mutation into that one
    if ( ownerInfo ) {
        const [ownerMutation, path] = ownerInfo
        // if the ownerMutation does not contain a 'new' key, it means
        // we are in a unsuported edge case where we are writing into 
        // a deleted entity, which is not technically possible, or 
        // if we are writing by any chance, we are writing in a object
        // which is detached from the root of our state, so we can 
        // ignore it.

        // TODO check delete/remove as well
        if ( ('new' in ownerMutation ) ) {
            let newToModify = ownerMutation.new as Record<string, unknown>
            path.pop()
            path.forEach((key) => {
                if ( !isObject(newToModify) ) {
                    throw new Error(`We tried to merge two new values, but the new place at ${path.join(', ')} encountered a non object at first encounter of the key ${key}`)
                }
                if ( key in newToModify ) {
                    newToModify = (newToModify as Record<string, any>)[key]
                }
            })

            // if we are setting the new value with nothing, meaning we delete
            if ( newValue === NO_VALUE ) {
                delete (newToModify as Record<string, unknown>)[mutationNode.k.toString()]
            } else {
                (newToModify as Record<string, unknown>)[mutationNode.k.toString()] = newValue
            }
        }


        // don't do anything else if owner exists
        return
    }

    // 3. then handle the case of a new operation being made, and merge all
    // descendent patches into this one.

    // if we did not have a parent with an operation, we will build one here
    // and then incorporate all the descendents that have operations into this
    // one
    let op: 'add' | 'remove' | 'replace' = 'replace'
    if ( oldValue === NO_VALUE ) {
        op = 'add'
    }
    if ( newValue === NO_VALUE ) {
        op = 'remove'
    }

    Object.assign(mutationNode, {
        op,
        opCount,
        d: true, // TODO remove
        ...(oldValue !== NO_VALUE? {old: oldValue} : {}),
        ...(newValue !== NO_VALUE? {new: newValue} : {}),
    })
    
    // after the node has been made, consume all descendents
    // note: we have a multi level tree, but there will only
    // be one pair of operations that we will find, meaning
    // we will have this node that is the local root of the
    // operation and a child somewhere deep down on each branch.
    // once a child is found, there will be no other descendenat
    // of that child that has operations, because of the 
    // parent checking section of this algorithm (if statement
    // above)
    if ( mutationNode.c ) {
        Object.values(mutationNode.c ?? {}).forEach((childNode) => {
            recursiveApplyChanges(childNode)
        })
    }
}

const recursiveApplyChanges = (mutationNode: MutationTreeNode) => {
    const { c } = mutationNode
    Object.values(c ?? {}).forEach((childNode) => {
        recursiveApplyChanges(childNode)
    })

    // we only care if we have OLD valuees when acumulating children
    // into a top mutation, because the value of the "new" part should
    // be available already in the source object.
    if ( 'old' in mutationNode ) {
        // the first old value might exist somewhere up the tree, not really as a direct parent
        const ownerInfo = getParentWithOperation(mutationNode)
        if ( !ownerInfo ) {
            throw new Error('We tried to merge a subtree of mutation but there was no parent with an old value above: Not sure if error')
        }
        const [targetNodeToReceiveOldValue, path] = ownerInfo
        if ( !('old' in targetNodeToReceiveOldValue) ) {
            throw new Error('We tried to merge a subtree of mutation but there was no parent with an old value above: Not sure if error')
        }
        // we should now have a targetNode that we should merge our object in.
        // we need to walk the path and assign at the end of that path.
        // we also need to make sure that the path exists. If it does not exist
        // I think we might need to create it.
        let pointerToObjectToModify = targetNodeToReceiveOldValue.old
        path.pop()
        path.forEach((key) => {
            if ( !isObject(pointerToObjectToModify) ) {
                throw new Error(`We tried to merge two old values, but the new place at ${path.join(', ')} encountered a non object at first encounter of the key ${key}`)
            }
            if ( key in pointerToObjectToModify ) {
                pointerToObjectToModify = (pointerToObjectToModify as Record<string, any>)[key]
            }
        })

        // if the key did not exist in the original object, we don't need to have a 
        // reference of the old value
        // if ( mutationNode.k in (pointerToObjectToModify as Record<string, unknown>)) {
            // console.log("pointerToObjectToModify", reversedPath, pointerToObjectToModify, mutationNode.old);
            // write the old value from this node in the right place
            // from an ancestor. Note, there might be a need to pop
            // the first item in path. We will have ot check
            ;(pointerToObjectToModify as Record<string, unknown>)[mutationNode.k.toString()] = mutationNode.old
            // mutationNode.o = targetNodeToReceiveOldValue
        // }

        // if this child has an operation, we can remove it, because the
        // old value from it was asimilated into the ancestor that has 
        // an operation
        if ( 'op' in mutationNode ) {
            delete (mutationNode as any).op
            delete (mutationNode as any).new
            delete (mutationNode as any).old
        }

    }

    // if we found a child that was added
    if ( 'op' in mutationNode && mutationNode.op === 'add' ) {

        // we might need to remove it from an ancestor that was
        // deleted
        // TODO this could be optimised and only checked in the parent
        const ownerInfo = getParentWithOperation(mutationNode)
        if ( !ownerInfo ) {
            throw new Error('We tried to merge a subtree of mutation but there was no parent with an old value above: Not sure if error')
        }
        const [targetNodeToReceiveOldValue, path] = ownerInfo

        if ('op' in targetNodeToReceiveOldValue && targetNodeToReceiveOldValue.op === 'remove' ) {
            let pointerToObjectToModify = targetNodeToReceiveOldValue.old
            path.pop()
            path.forEach((key) => {
                if ( !isObject(pointerToObjectToModify) ) {
                    throw new Error(`We tried to merge two old values, but the new place at ${path.join(', ')} encountered a non object at first encounter of the key ${key}`)
                }
                if ( key in pointerToObjectToModify ) {
                    pointerToObjectToModify = (pointerToObjectToModify as Record<string, any>)[key]
                }
            })

            delete (pointerToObjectToModify as Record<string, unknown>)[mutationNode.k.toString()]
        }

        // if this child has an operation, we can remove it, because the
        // old value from it was asimilated into the ancestor that has 
        // an operation
        if ( 'op' in mutationNode ) {
            delete (mutationNode as any).op
            delete (mutationNode as any).new
            delete (mutationNode as any).old
        }
    }
    
    if ( 'op' in mutationNode ) {
        delete (mutationNode as any).op
        delete (mutationNode as any).new
        delete (mutationNode as any).old
    }
}


export const getPatchesFromMutationTree = (mutationNode: MutationTreeNode) => {
    const patches: Array<JSONPatchEnhanced & {opCount : number }> = []
    accumulatePatchesFromMutationTree(mutationNode, patches)
    return patches.sort((a, b) => a.opCount - b.opCount).map((patch) => {
        const { opCount, ...rest } = patch
        return rest
    })
}

export const accumulatePatchesFromMutationTree = (
    mutationNode: MutationTreeNode, 
    acc: Array<JSONPatchEnhanced & {opCount : number }>, 
    pathArray: string[] = []
) => {
    if ("op" in mutationNode ) {
        acc.push({
            op: mutationNode.op,
            old: ('old' in mutationNode) ? mutationNode.old : undefined,
            value: ('new' in mutationNode) ? mutationNode.new : undefined,
            pathArray,
            opCount: mutationNode.opCount,
            path: `/${pathArray.join('/')}`
        })
        return
    }

    if ( mutationNode.c ) {
        Object.values(mutationNode.c).forEach((child) => {
            accumulatePatchesFromMutationTree(child, acc, [...pathArray, child.k as string])
        })
        return
    }

}
