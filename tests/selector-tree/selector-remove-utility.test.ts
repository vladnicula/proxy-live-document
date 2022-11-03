import { addSelectorToTree, SelectorTreeRoot, removeSelectorFromTree } from '../../src/selector-map'

describe('Selector Utility: Remove', () => {

    it("removes selector sub from tree", () => {
        const selectorFn1 = () => {}
        const selectorFn2 = () => {}
        let tree: SelectorTreeRoot = {}

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
        let tree: SelectorTreeRoot = {}

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
})
