import { applyJSONPatchOperationV2 as applyJSONPatchOperation, Patcher } from "."

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
  }

  class ElementHierarchy {
    [Patcher] = true
    private instances: Record<string, ElementNode> = {}

    addNode (node: ElementNode) {
      this.instances[node.id] = node
    }

    getById (id: string) {
      return this.instances[id]
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

  // it('applies remove on nested plain structure', () => {
  
  // })

  // it('applies replace on nested plain structure', () => {
   
  // })
  
})