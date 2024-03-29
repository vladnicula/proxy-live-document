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
    const docClone = JSON.parse(JSON.stringify(document))
    const patches = mutate(docClone, (modifiable) => {
        // order of the operations is important
        // the const parent here is needed before 
        // the change is made
        const parent = modifiable.nodes[newNodeC.parentId]
        modifiable.nodes[newNodeC.id] = newNodeC
        parent.children[newNodeC.id] = true
    })

    // console.log('patches', patches)
    expect(patches).toHaveLength(2)
    expect(patches![0].path).toEqual('/nodes/c')
    expect(patches![1].path).toEqual('/nodes/a/children/c')
  })

  it('does not generate patch if the old and new value are the same', () => {
    const docClone = JSON.parse(JSON.stringify(document))

    const patches = mutate(docClone, (modifiable) => {
      modifiable.nodes.a.name = 'a'
    })
    expect(patches).toHaveLength(0)
  })

  it('does not generate patch if delete key does not exist', () => {
    const docClone = JSON.parse(JSON.stringify(document))

    const patches = mutate(docClone, (modifiable) => {
      delete modifiable.nodes.x
    })
    expect(patches).toHaveLength(0)
  })

})
