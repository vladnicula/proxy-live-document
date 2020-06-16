import { mutate, mutateFromPatches, select, combinedJSONPatches, Patcher, JSONPatchEnhanced } from "."

describe('mutate from patches', () => {
  it('applies patches on compatible structures', () => {

    const stateInClientOne = {
      observeMe: 'hello'
    }

    const stateInClientTwo = {...stateInClientOne}

    const patches = mutate(stateInClientOne, (modifiable) => {
      modifiable.observeMe = 'changed'
    })

    mutateFromPatches(stateInClientTwo, patches)

    expect(stateInClientTwo).toHaveProperty('observeMe', 'changed')
    expect(stateInClientOne).toHaveProperty('observeMe', 'changed')
  })

  it('applied patches trigger selector updates', () => {

    const stateInClientOne = {
      state: 1,
      observeMe: 'hello'
    }

    
    const stateInClientTwo = {...stateInClientOne, state: 2 }

    const patches = mutate(stateInClientOne, (modifiable) => {
      modifiable.observeMe = 'changed'
    })

    const observableCallback = jest.fn()

    select(
      stateInClientTwo,
      ['/observeMe'],
      (mappable) => mappable.observeMe
    )
    .observe(observableCallback)

    mutateFromPatches(stateInClientTwo, patches)
    
    expect(stateInClientTwo).toHaveProperty('observeMe', 'changed')
    expect(stateInClientOne).toHaveProperty('observeMe', 'changed')
    expect(observableCallback).toHaveBeenCalledTimes(1)
    expect(observableCallback).toHaveBeenCalledWith('changed')
  })

  it('can apply visible props in classes', () => {

    class Node {
      private elemType = 'div'

      get type () {
        return this.elemType
      }

      set type (value: string) {
        if ( value === 'nope' ) {
          throw Error(`No, I don't want to`)
        }
        this.elemType = value
      }

      operationThatChangesInternalType (elemType: string) {
        this.elemType = elemType 
      }

      operationThatChangesInternalTypeTheRightWay (elemType: string) {
        this.type = elemType 
      }
    }

    class Document {
      nodes: Record<string, Node> = {}
    }

    const doc = new Document()
    const otherDoc = new Document()
    const node1 = new Node()
    const node2 = new Node()
    doc.nodes['id1'] = node1
    otherDoc.nodes['id1'] = node2

    const patches = mutate(doc, (modifiable) => {
      modifiable.nodes['id1'].type = 'something-else'
    })

    const observableCallback = jest.fn()

    select(
      otherDoc,
      ['/nodes/id1/type'],
      (mappable) => mappable.nodes.id1
    )
    .observe(observableCallback)

    expect(node1).toHaveProperty('type', 'something-else')
    expect(node2).toHaveProperty('type', 'div')

    mutateFromPatches(otherDoc, patches)
    
    expect(observableCallback).toHaveBeenCalledTimes(1)
    expect(observableCallback).toHaveBeenCalledWith(node2)
    expect(node2).toHaveProperty('type', 'something-else')

    const patches2 = mutate(doc, (modifiable) => {
      modifiable.nodes['id1'].operationThatChangesInternalType('changed-via-method')
    })

    mutateFromPatches(otherDoc, patches2)
    expect(node2).toHaveProperty('type', 'changed-via-method')
    expect(observableCallback).toHaveBeenCalledTimes(1)

    const patches3 = mutate(doc, (modifiable) => {
      modifiable.nodes['id1'].operationThatChangesInternalTypeTheRightWay('changed-via-method')
    })

    mutateFromPatches(otherDoc, patches3)
    expect(node2).toHaveProperty('type', 'changed-via-method')
    expect(observableCallback).toHaveBeenCalledTimes(2)
  })

  it('applies deep via methods', () => {
    type StaticValue = {
      type: 'static',
      content: string
    }
    
    class ElementNode {
      readonly id: string
      private styles: Record<string, StaticValue> = {}

      constructor (id: string) {
        this.id = id
      }
      addStyleByKey(key: string, value: StaticValue) {
        this.styles[key] = value
      }
    }
    
    class ElementNodeHierarchy {
      [Patcher] = true
      instances: Record<string, ElementNode> = {}
      addNodeInstance(node: ElementNode) {
        this.instances[node.id] = node;
      }
      
      applyPatch (op: JSONPatchEnhanced) {
        if (op.op === 'add' ) {
          // needs to know about all subtree here. In a way, it's ok, beucase this 
          // entity is indeed a composition of the children. But it might
          // not know about its grand grand chhildren.
          const jsonValue = op.value as { id: string, styles: Record<string, StaticValue>}
          const node = new ElementNode(jsonValue.id)
          Object.keys(jsonValue.styles).map((styleKey) => node.addStyleByKey(styleKey, jsonValue.styles[styleKey]))
          this.addNodeInstance(node)
        }
      }
    }

    class Document {
      nodes: ElementNodeHierarchy = new ElementNodeHierarchy()
    }

    const doc1 = new Document()
    const doc2 = new Document()

    const patches = mutate(doc1, (mutable) => {
      const node = new ElementNode('id1')
      mutable.nodes.addNodeInstance(
        node
      )

      node.addStyleByKey('background', {type: 'static', 'content':'red'})
    })

    mutateFromPatches(doc2, patches)

    expect(doc2.nodes.instances).toHaveProperty('id1')
    expect(doc2.nodes.instances.id1).toBeInstanceOf(ElementNode)
    expect(doc2.nodes.instances.id1).toHaveProperty('styles', {
      background: {
        type: 'static',
        content: 'red'
      }
    })
  })

  it('can use combinedJSONPatches to sync larger chunks of changes', () => {
    const stateInClientOne = {
      observeMe: 'hello'
    }

    const stateInClientTwo = {...stateInClientOne}

    const patches1 = mutate(stateInClientOne, (modifiable) => {
      modifiable.observeMe = 'changed'
    })

    const patches2 = mutate(stateInClientOne, (modifiable) => {
      modifiable.newKey = 'new one here'
    })

    const allPatches = combinedJSONPatches([
      ...patches1,
      ...patches2
    ])

    mutateFromPatches(stateInClientTwo, allPatches)

    expect(stateInClientTwo).toHaveProperty('observeMe', 'changed')
    expect(stateInClientTwo).toHaveProperty('newKey', 'new one here')
    expect(stateInClientOne).toHaveProperty('observeMe', 'changed')
  })
})