import { describe, it, expect } from 'vitest'
import { MutationTreeNode, NO_VALUE } from '../../src'
import { getPatchesFromMutationTree } from '../../src/mutation-map'

describe('producing patched from mutation trees', () => {
    it('should return empty patches from tree that has no ops', () => {
        const rootMutatioNode = {
            p: null,
            k: ''
        } as MutationTreeNode
        expect(getPatchesFromMutationTree(rootMutatioNode)).toHaveLength(0)
    })

    it("finds the ops on a deep level of the tree", () => {

        const root = {
            k: "root",
            p: null,
            c: {}
        } satisfies MutationTreeNode

        const layer1 = {
            p: root,
            k: "layer1",
            c: {},
        } satisfies MutationTreeNode

        // there was a layer2 = '100' when layer 2 did not exist
        const layer2 = {
            p: layer1,
            k: "layer2",
            op: 'add',
            new: '100',
            c: {}
        } satisfies MutationTreeNode

        root.c[layer1.k] = layer1
        layer1.c[layer2.k] = layer2

        const patches = getPatchesFromMutationTree(root)
        expect(patches).toHaveLength(1)
        expect(patches).toEqual([
            {
                op: 'add',
                pathArray: ['layer1', 'layer2'],
                path: '/layer1/layer2',
                value: '100'
            }
        ])
    })

    it("finds the ops on two different branches", () => {

        const root = {
            k: "root",
            p: null,
            c: {}
        } satisfies MutationTreeNode

        const layer1A = {
            p: root,
            k: "layer1A",
            c: {},
        } satisfies MutationTreeNode

        const layer1B = {
            p: root,
            k: "layer1B",
            op: 'replace',
            old: '-100',
            new: '100',
            c: {},
        } satisfies MutationTreeNode

        // there was a layer2 = '100' when layer 2 did not exist
        const layer2 = {
            p: layer1A,
            k: "layer2",
            op: 'add',
            new: '100',
            c: {}
        } satisfies MutationTreeNode

        root.c[layer1A.k] = layer1A
        root.c[layer1B.k] = layer1B
        layer1A.c[layer2.k] = layer2

        const patches = getPatchesFromMutationTree(root)
        expect(patches).toHaveLength(2)
        expect(patches).toEqual([
            {
                op: 'add',
                pathArray: ['layer1A', 'layer2'],
                path: '/layer1A/layer2',
                value: '100'
            },
            {
                op: 'replace',
                pathArray: ['layer1B'],
                path: '/layer1B',
                old: "-100",
                value: '100'
            }
        ])
    })

})