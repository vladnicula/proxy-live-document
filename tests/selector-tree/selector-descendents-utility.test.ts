import { addSelectorToTree, getRefDescedents, SelectorTreeRoot } from '../../src/selector-map'

describe('Selector Utility: Descendents', () => {

    it("gets descendent according to prop name", () => {
        const selectorFn1 = () => {}
        let tree: SelectorTreeRoot = {}

        const leaf1RefFromAdd = addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        const leaf1RefFromAdvance = getRefDescedents(
            tree.children!.intermediary,
            'leaf1'
        )

        expect(leaf1RefFromAdvance).toBeTruthy()
        expect(leaf1RefFromAdvance).toHaveLength(1)
        expect(leaf1RefFromAdvance![0]).toEqual(leaf1RefFromAdd)
       
    })

    it("gets two pointers when * is found", () => {
        const selectorFn1 = () => {}
        let tree: SelectorTreeRoot = {}

        const leaf1RefFromAdd = addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        const leaf1RefStarFromAdd = addSelectorToTree(
            tree,
            ['intermediary', '*'],
            selectorFn1
        )

        const leaf1RefFromAdvance = getRefDescedents(
            tree.children!.intermediary,
            'leaf1'
        )

        expect(leaf1RefFromAdvance).toBeTruthy()
        expect(leaf1RefFromAdvance).toHaveLength(2)
        expect(leaf1RefFromAdvance).toContain(leaf1RefFromAdd)
        expect(leaf1RefFromAdvance).toContain(leaf1RefStarFromAdd)
    })

    it("gets two pointers when ** is found", () => {
        const selectorFn1 = () => {}
        let tree: SelectorTreeRoot = {}

        const leaf1RefFromAdd = addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        const leaf1RefStarFromAdd = addSelectorToTree(
            tree,
            ['intermediary', '**'],
            selectorFn1
        )

        const leaf1RefFromAdvance = getRefDescedents(
            tree.children!.intermediary,
            'leaf1'
        )

        expect(leaf1RefFromAdvance).toBeTruthy()
        expect(leaf1RefFromAdvance).toHaveLength(2)
        expect(leaf1RefFromAdvance).toContain(leaf1RefFromAdd)
        expect(leaf1RefFromAdvance).toContain(leaf1RefStarFromAdd)
    })

    it("Returns null when * or fixed name", () => {
        const selectorFn1 = () => {}
        let tree: SelectorTreeRoot = {}

        const leaf1RefFromAdd = addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        const leaf1RefStarFromAdd = addSelectorToTree(
            tree,
            ['intermediary', '*'],
            selectorFn1
        )

        const starUnmatchedDescendent = getRefDescedents(
            tree.children!.intermediary.children!['*'],
            'notFound'
        )

        const normalUnmatchedDescendent = getRefDescedents(
            tree.children!.intermediary.children!['leaf1'],
            'notFound'
        )

        expect(starUnmatchedDescendent).toBeNull()
        expect(normalUnmatchedDescendent).toBeNull()
    })

    it("Returns returns same ** node when not found", () => {
        const selectorFn1 = () => {}
        let tree: SelectorTreeRoot = {}

        const doubleStarRef = addSelectorToTree(
            tree,
            ['intermediary', '**'],
            selectorFn1
        )

        addSelectorToTree(
            tree,
            ['someOtherPath', '**', 'someLeaf'],
            selectorFn1
        )

        const doubleStarUnmatchedResponse = getRefDescedents(
            tree.children!.intermediary.children!['**'],
            'notFound'
        )

        const doubleStarUnmatchedResponse2 = getRefDescedents(
            tree.children!.someOtherPath.children!['**'],
            'notFound'
        )

        expect(doubleStarUnmatchedResponse).toEqual(doubleStarRef)
        expect(doubleStarUnmatchedResponse2).toHaveLength(1)
    })

    it("returns null when children exist but none match", () => {
        const selectorFn1 = () => {}
        let tree: SelectorTreeRoot = {}
        addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )
        const aNullResponse = getRefDescedents(
            tree.children!.intermediary,
            'notFound'
        )

        expect(aNullResponse).toBeNull()
    })

})
