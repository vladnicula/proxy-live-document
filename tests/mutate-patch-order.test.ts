import { describe, it, expect } from 'vitest'

import { mutate } from '../src'

const document = {
  nodes: {
    a: {
      children: {},
      id: 'a',
      name: 'a'
    },
    b: {
      children: {},
      id: 'b',
      name: 'b'
    }
  } as Record<string, {
    children: Record<string, boolean>,
    id: string,
    name: string
    parentId?: string
  }>
}


describe.only('patch order from mutations', () => {
  
  it("when setting a key on an object, the path includes the key that was set", () => {
    const newNodeC = {
        children: {},
        id: 'c',
        name: 'c',
        parentId: 'a'
    }
    const patches = mutate(document, (modifiable) => {
        modifiable.nodes.c = newNodeC
        modifiable.nodes[newNodeC.parentId].children[newNodeC.id] = true
    })

    console.log('patches', patches)
    expect(patches).toHaveLength(2)
    expect(patches![0].path).toEqual('/nodes/c')
    expect(patches![1].path).toEqual('/nodes/a/children/c')
  })

})
