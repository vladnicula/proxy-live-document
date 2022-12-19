import { JSONPatchEnhanced, MutationTreeNode } from ".";
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
export declare const getParentWithOperation: (mutationNode: MutationTreeNode) => [MutationTreeNode, string[]] | null;
export declare const makeAndGetChildPointer: (mutationNode: MutationTreeNode, prop: string | number) => MutationTreeNode;
export declare const createMutaitonInMutationTree: (mutationNode: MutationTreeNode, oldValue: unknown, newValue: unknown) => void;
export declare const createMutaitonInMutationTree2: (mutationNode: MutationTreeNode, oldValue: unknown, newValue: unknown) => void;
export declare const getPatchesFromMutationTree: (mutationNode: MutationTreeNode) => JSONPatchEnhanced[];
export declare const accumulatePatchesFromMutationTree: (mutationNode: MutationTreeNode, acc: JSONPatchEnhanced[], pathArray?: string[]) => void;
