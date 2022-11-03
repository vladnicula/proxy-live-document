import { SeletorMappingBase } from ".";

export interface SelectorTreeBranch extends SelectorTreeRoot {
    propName: string
}

export interface SelectorTreeRoot {
    children?: Record<string, SelectorTreeBranch>
    subs?: Array<SeletorMappingBase<unknown>>
}

export const addSelectorToTree = (
    tree: SelectorTreeRoot,
    pathArray: string[],
    fn: SeletorMappingBase<unknown>
) => {
    let currentPathInTree = tree
    let currentPathInArray = [...pathArray]
    while ( currentPathInArray.length ) {
        const item = currentPathInArray.shift()!
        currentPathInTree.children ??= {}
        currentPathInTree.children[item] ??= {
            propName: item
        }
        currentPathInTree = currentPathInTree.children[item]
    }
    currentPathInTree.subs ??= []
    currentPathInTree.subs.push(fn)
    return currentPathInTree
}

export const removeSelectorFromTree = (
    pointerRef: SelectorTreeRoot | SelectorTreeBranch,
    fn: SeletorMappingBase<unknown>
) => {
    if ( !pointerRef.subs ) {
        return false
    }
    const pos = pointerRef.subs?.indexOf(fn)
    if ( pos === -1 ) {
        return false
    }

    pointerRef.subs = [
        ...pointerRef.subs.slice(0, pos),
        ...pointerRef.subs.slice(pos + 1)
    ]
}

export const getRefDescedents = (
    pointerRef: SelectorTreeBranch,
    childName: string
) => {
    const isDoubleStar = pointerRef.propName === '**'
    if  ( !pointerRef.children ) {
        if ( isDoubleStar ) {
            return pointerRef
        }
        return null
    }

    const refs = []
    const matchedChild = pointerRef.children[childName]
    
    if ( isDoubleStar ) {
        refs.push(pointerRef)
    }

    if ( matchedChild ) {
        refs.push(matchedChild)
    }


    if ( pointerRef.children['*'] ) {
        refs.push(pointerRef.children['*'])
    }

    if ( pointerRef.children['**'] ) {
        refs.push(pointerRef.children['**'])
    }

    return refs.length ? refs : null
}

