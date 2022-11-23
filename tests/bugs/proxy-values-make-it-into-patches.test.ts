import { describe, it, expect , vi} from 'vitest'

import { mutate } from "../../src"

describe("proxy values make it inot patchess", () => {
    it("asignments of element inside mutaiton does not have proxy ref", () => {
        const obj = {
            nodes: {
                1: { nodeId: 1},
                2: { nodeId: 2}
            }
        } as { 
            nodes: Record<string, {nodeId: number}>
            someOtherKey?: any 
        }

        const patches = mutate(obj, state => {
            const node1 = state.nodes[1]
            state.someOtherKey = node1
        })

        // console.log(typeof patches?.[0].value)

        expect(patches).toHaveLength(1)
        expect(patches?.[0]).toHaveProperty('path', '/someOtherKey')
    })
})