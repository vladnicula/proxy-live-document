import { SelectorMappingBase } from ".";
export interface SelectorTreeBranch {
    propName: string | number;
    children?: Record<string, SelectorTreeBranch>;
    subs?: Array<SelectorMappingBase<any>>;
    options?: {
        reactToAncestorChanges?: boolean;
    };
}
export declare const addSelectorToTree: (tree: SelectorTreeBranch, pathArray: (string | number)[], fn: SelectorMappingBase<any>, options?: {
    reactToAncestorChanges?: boolean | undefined;
} | undefined) => SelectorTreeBranch;
export declare const removeSelectorFromTree: (pointerRef: SelectorTreeBranch, fn: SelectorMappingBase<any>) => false | undefined;
export declare const getRefDescedents: (pointerRef: SelectorTreeBranch, childName: string | number) => SelectorTreeBranch[] | null;
export declare const countSelectorsInTree: (pointerRef: SelectorTreeBranch) => number;
export declare const getAllSubsOfSubtree: (pointers: SelectorTreeBranch[]) => Set<SelectorMappingBase<any>>;
