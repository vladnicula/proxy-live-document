import { describe, it, expect , vi} from 'vitest'
import { select, selectorsManager, StateTreeSelectorsManager } from '../../src'

import { addSelectorToTree, SelectorTreeBranch, removeSelectorFromTree, getAllSubsOfSubtree } from '../../src/selector-map'

describe('Selector Utility: Remove', () => {

    it("removes selector sub from tree", () => {
        const selectorFn1 = () => {}
        const selectorFn2 = () => {}
        let tree: SelectorTreeBranch = { propName: "root"}

        addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        const refLeaf2 = addSelectorToTree(
            tree,
            ['intermediary', "leaf2"],
            selectorFn2
        )

        expect(tree.children?.intermediary.children?.leaf1.subs).toContain(selectorFn1)
        expect(tree.children?.intermediary.children?.leaf2.subs).toContain(selectorFn2)

        removeSelectorFromTree(
            refLeaf2,
            selectorFn2
        )

        expect(tree.children?.intermediary.children?.leaf2.subs).toHaveLength(0)
    })

    it("silently fails if removing does not find item", () => {
        const selectorFn1 = () => {}
        const notSelectorFn = () => {}
        let tree: SelectorTreeBranch = { propName: "root"}

        const refLeaf1 = addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )


        expect(tree.children?.intermediary.children?.leaf1.subs).toContain(selectorFn1)
        expect(tree.children?.intermediary.children?.leaf1.subs).toHaveLength(1)

        removeSelectorFromTree(
            refLeaf1,
            notSelectorFn
        )

        expect(tree.children?.intermediary.children?.leaf1.subs).toContain(selectorFn1)
        expect(tree.children?.intermediary.children?.leaf1.subs).toHaveLength(1)
        
    })

    it("selector dispose correclty works using the removeSelectorFromTree", () => {
        const meh = { something: 32 }
        const selector = select(meh, ['/something'], () => {})
        const castSelectorManager = (selectorsManager as unknown as StateTreeSelectorsManager<any>)
        const selectorTree = castSelectorManager.getSelectorTree(meh)

        expect(getAllSubsOfSubtree([selectorTree])).toHaveLength(1)
        selector.dispose()
        expect(getAllSubsOfSubtree([selectorTree])).toHaveLength(0)
    })
})
