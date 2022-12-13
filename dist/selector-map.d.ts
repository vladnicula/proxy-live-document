import { SeletorMappingBase } from ".";
export interface SelectorTreeBranch {
    propName: string | number;
    children?: Record<string, SelectorTreeBranch>;
    subs?: Array<SeletorMappingBase<any, any>>;
}
export declare const addSelectorToTree: (tree: SelectorTreeBranch, pathArray: (string | number)[], fn: SeletorMappingBase<any, any>) => SelectorTreeBranch;
export declare const removeSelectorFromTree: (pointerRef: SelectorTreeBranch, fn: SeletorMappingBase<any, any>) => false | undefined;
export declare const getRefDescedents: (pointerRef: SelectorTreeBranch, childName: string | number) => SelectorTreeBranch[] | null;
export declare const getAllSubsOfSubtree: (pointers: SelectorTreeBranch[]) => Set<SeletorMappingBase<any, any>>;
