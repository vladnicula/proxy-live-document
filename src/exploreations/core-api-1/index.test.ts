import { mutate } from './'

const document = {
  nodes: {} as Record<string, ElementNode>
}

class ElementNode {

  styles: Record<string, unknown> = {}

  setStyleByKey (key: string, value: unknown) {
    this.styles[key] = value
  }
}

const newAElement = new ElementNode()
const newBElement = new ElementNode()
newAElement.setStyleByKey('background', 'red')
newBElement.setStyleByKey('background', 'blue')

document.nodes['a'] = newAElement
document.nodes['b'] = newBElement

test("Typescript works", () => {
  const patch = mutate(document, (modifiable) => {
    modifiable.nodes.b.setStyleByKey('border-radius', '3px')
  
    // set same thing twice
    modifiable.nodes.a.setStyleByKey('border-radius', '3px')
    modifiable.nodes.a.setStyleByKey('border-radius', '4px')
  
    // overwride think
    modifiable.nodes.a.setStyleByKey('background', 'purple')
  
    // override with same value
    modifiable.nodes.b.setStyleByKey('background', 'blue')
  })
  
  // patch.forEach(patch => console.log(patch)) 

  expect(patch).not.toBe(null)
})

