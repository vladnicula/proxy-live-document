import { describe, it, expect , vi} from 'vitest'

import { addSelectorToTree, SelectorTreeBranch } from '../../src/selector-map'

describe('Selector Utility: Add', () => {
    it("creates first selector node in selector tree", () => {
        const selectorFn = () => {}
        const tree: SelectorTreeBranch = { propName: 'root' }
        
        addSelectorToTree(
            tree,
            ['intermediary', 'leaf'],
            selectorFn
        )


        expect(tree).toHaveProperty('children')
        expect(tree.children?.intermediary).toHaveProperty('children')
        expect(tree.children?.intermediary.children).toHaveProperty('leaf')
        expect(tree.children?.intermediary.children?.leaf).toHaveProperty('subs')
        expect(tree.children?.intermediary.children?.leaf.subs).toHaveLength(1)
        expect(tree.children?.intermediary.children?.leaf).not.toHaveProperty('children')
        expect(tree.children?.intermediary.children?.leaf.subs?.[0]).toBe(selectorFn)
    })

    it("creates second selector branching off common path", () => {
        const selectorFn1 = () => {}
        const selectorFn2 = () => {}
        let tree: SelectorTreeBranch = { propName: 'root'}

        addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        addSelectorToTree(
            tree,
            ['intermediary', 'someSubObject', "leaf2"],
            selectorFn2
        )

        expect(tree.children?.intermediary).toHaveProperty('children')
        expect(tree.children?.intermediary.children).toHaveProperty('leaf1')
        expect(tree.children?.intermediary.children?.leaf1.subs).toContain(selectorFn1)

        expect(tree.children?.intermediary.children).toHaveProperty('someSubObject')
        expect(tree.children?.intermediary.children?.someSubObject).toHaveProperty('children')
        expect(tree.children?.intermediary.children?.someSubObject.children).toHaveProperty('leaf2')
        expect(tree.children?.intermediary.children?.someSubObject.children?.leaf2.subs).toContain(selectorFn2)

    })

    it("creates second selector in same path", () => {
        const selectorFn1 = () => {}
        const selectorFn2 = () => {}
        let tree: SelectorTreeBranch = { propName: 'root'}

        addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        addSelectorToTree(
            tree,
            ['intermediary', "leaf1"],
            selectorFn2
        )

        expect(tree.children?.intermediary).toHaveProperty('children')
        expect(tree.children?.intermediary.children).toHaveProperty('leaf1')
        expect(tree.children?.intermediary.children?.leaf1).not.toHaveProperty('children')
        expect(tree.children?.intermediary.children?.leaf1.subs).toContain(selectorFn1)
        expect(tree.children?.intermediary.children?.leaf1.subs).toContain(selectorFn2)
    })

    it("returns pointer towards the node that accepted the subscription", () => {
        const selectorFn1 = () => {}
        const tree: SelectorTreeBranch = { propName: 'root'}

        const refToLeaf1 = addSelectorToTree(
            tree,
            ['intermediary', 'leaf1'],
            selectorFn1
        )

        expect(tree.children?.intermediary.children?.leaf1).toBe(refToLeaf1)
    })
})
