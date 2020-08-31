import { v4 as uuidv4 } from 'uuid'
import { select, mutate } from "../src"

describe('class hierarchy example', () => {
  class StaticValue {
    id: string
    type: 'static' = 'static'
    content: string | number | null = null

    constructor (content: string, id = uuidv4() ) {
      this.content = content
      this.id = id
    }
  }

  class DynamicValue {
    id: string
    type: 'dynamic' = 'dynamic'
    content: { refType: string, refId: string }

    constructor (content:  { refType: string, refId: string }, id = uuidv4() ) {
      this.content = content
      this.id = id
    }
  }
  
  class ElementNode {
    id: string
    type: string = ''
    styles: Record<string, StaticValue | DynamicValue> = {}

    constructor (id: string) {
      this.id = id
    }

    addNodeStyle (styleKey: string, styleValue: StaticValue | DynamicValue ) {
      this.styles[styleKey] = styleValue
    }
  }
  
  class Document {
    nodes: Record<string, ElementNode> = {}

    createNode (type: string) {
      const newId = uuidv4()
      const newNode = new ElementNode(newId)
      this.nodes[newId] = newNode
      newNode.type = type
      return newId
    }
  }

  const doc = new Document()
  const newNodeId = doc.createNode('div')
  doc.nodes[newNodeId].addNodeStyle('background-color', new StaticValue('red'))

  it('should capture mutation of document', () => {
    const someNewNodeId = uuidv4()

    const selector = select(doc, [
      `nodes/${someNewNodeId}`,
    ], (state) => {
      return {
        node: state.nodes[newNodeId]
      }
    })

    const observeSpy = jest.fn()

    selector.observe(observeSpy)

    mutate(doc, (state) => {
      const newNode = new ElementNode(someNewNodeId)
      newNode.type = 'div'
      state.nodes[someNewNodeId] = newNode
    })

    expect(observeSpy).toHaveBeenCalledTimes(1)
    expect(observeSpy).toBeCalledWith({
      node: doc.nodes[newNodeId]
    })
  })
})