import { describe, it, expect , vi} from 'vitest'

import { applyJSONPatchOperation, Patcher, JSONPatchEnhanced } from "../src"

describe('applyJSONPatchOperation - instances', () => {
  class ElementStyle {
    [Patcher] = true
    private styles: Record<string, string> = {}
    setStyle (key: string, value: string) {
      this.styles[key] = value
    }

    getStyles () {
      return this.styles as Readonly<Record<string, string>>
    }

    applyPatch (patch: JSONPatchEnhanced) {
      const { op, pathArray } = patch
      if ( op === 'remove' ) {
        delete this.styles[pathArray[pathArray.length - 1]]
      }
    }
  }

  class ElementNode {
    [Patcher] = true
    readonly id: string
    private styles = new ElementStyle()

    constructor (id:string) {
      this.id = id;
    }

    getStyles () {
      return this.styles.getStyles()
    }

    setStyle (key: string, value: string) {
      this.styles.setStyle(key, value)
    }

    applyPatch (patch: JSONPatchEnhanced) {
      console.log('apply patch was here!', patch)
    }
  }

  class ElementHierarchy {
    [Patcher] = true
    private instances: Record<string, ElementNode> = {}

    addNode (node: ElementNode) {
      if ( Object.keys(this.instances).length > 2 ) {
        throw new Error(`Cannot have more than 3 nodes to simulate constraints`)
      } 
      this.instances[node.id] = node
    }

    getById (id: string) {
      return this.instances[id]
    }

    applyPatch (patch: JSONPatchEnhanced) {
      const { value, op, pathArray } = patch
      const lastPathPart = pathArray[pathArray.length-1]
      switch ( op ) {
        case 'add':
        case 'replace':
          const newNode = new ElementNode(pathArray[pathArray.length-1])
          this.addNode(newNode)
          const { styles } = value as Record<string, Record<string, string>>
          Object.keys(styles || {}).forEach((key) => {
            newNode.setStyle(key, styles[key])
          })
          break;
        case 'remove':
          delete this.instances[lastPathPart] 
          break;
      }
    }
  }

  class Document {
    [Patcher] = true
    nodes = new ElementHierarchy()
  }


  it('applies add on nested instances', () => {
    const testDoc = new Document()
    const op = {
      op: 'add' as 'add',
      pathArray: ['nodes', 'instances', 'id2'],
      path: 'nodes/instances/id2',
      value: {
        id: 'id2',
        styles: {
          backgroundColor: 'red'
        }
      }
    }
    applyJSONPatchOperation(op, testDoc)
    expect(testDoc.nodes.getById('id2')).toBeInstanceOf(ElementNode)
    expect(testDoc.nodes.getById('id2').getStyles()).toEqual({
      'backgroundColor': 'red'
    })
  })

  it('applies remove on nested instance structure', () => {
    const testDoc = new Document()
    const node = new ElementNode('id1')
    testDoc.nodes.addNode(node)
    node.setStyle('background', 'red')
    node.setStyle('border', 'blue')

    const op = {
      op: 'remove' as 'remove',
      pathArray: ['nodes', 'instances', 'id1', 'styles', 'background'],
      path: 'nodes/instances/id1/styles/background',
      value: undefined,
      old: undefined
    }
    applyJSONPatchOperation(op, testDoc)


    expect(node.getStyles()).toEqual({
      'border': 'blue'
    })
  })

  it('applies replace on nested replace structure', () => {
    const testDoc = new Document()
    const initialNode = new ElementNode('id1')
    testDoc.nodes.addNode(initialNode)
    initialNode.setStyle('background', 'red')
    initialNode.setStyle('border', 'blue')

    // const patches = mutate(testDoc, (mutable) => {
    //   const replacingNode = new ElementNode('id1')
    //   replacingNode.setStyle('padding', '22px')
    //   mutable.nodes.addNode(replacingNode)
    // })

    const patch =  {
      op: 'replace' as 'replace',
      path: '/nodes/instances/id1',
      old: {
        id: 'id1',
      },
      value: {
        styles: { padding: '22px' },
        id: 'id1',
      },
      pathArray: [ 'nodes', 'instances', 'id1' ]
    }

    applyJSONPatchOperation(patch, testDoc)

    expect(testDoc.nodes.getById('id1').getStyles()).toEqual({
      'padding': '22px'
    })

    expect(initialNode).not.toEqual(testDoc.nodes.getById('id1'))
  })


  it('applies prevents adding a 4th node according to domain constraints', () => {
    const testDoc = new Document()
    const initialNode1 = new ElementNode('id1')
    const initialNode2 = new ElementNode('id2')
    const initialNode3 = new ElementNode('id3')
    testDoc.nodes.addNode(initialNode1)
    testDoc.nodes.addNode(initialNode2)
    testDoc.nodes.addNode(initialNode3)

    // const patches = mutate(testDoc, (mutable) => {
    //   const replacingNode = new ElementNode('id1')
    //   replacingNode.setStyle('padding', '22px')
    //   mutable.nodes.addNode(replacingNode)
    // })

    const patch =  {
      op: 'add' as 'add',
      path: '/nodes/instances/id4',
      value: {
        styles: { padding: '22px' },
        id: 'id4',
      },
      pathArray: [ 'nodes', 'instances', 'id4' ]
    }

    const execution = () => {
      applyJSONPatchOperation(patch, testDoc)
    }
    expect(execution).toThrow()
  })
  
})