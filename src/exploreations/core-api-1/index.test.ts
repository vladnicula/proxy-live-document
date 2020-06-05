import { mutate } from './'

const document = {
  nodes: {} as Record<string, ElementNode>
}

class ElementNode {

  styles: Record<string, unknown> = {}

  setStyleByKey (key: string, value: unknown) {
    debugger
    this.styles[key] = value
  }
}

const newAElement = new ElementNode()
const newBElement = new ElementNode()
newAElement.setStyleByKey('background', 'red')
newBElement.setStyleByKey('background', 'blue')

document.nodes['a'] = newAElement
document.nodes['b'] = newBElement

test("when setting a key on an object, the path includes the key that was set", () => {
  const patch1 = mutate(document, (modifiable) => {
    modifiable.nodes.b.setStyleByKey('borderRadius', '3px')
  })

  const expectedPath = 'nodes/b/styles/borderRadius'
  
  expect(patch1[0].path).not.toBeFalsy()
  expect(patch1[0].path).toEqual(expectedPath)
})

test("changes are readable inside mutation function immediatly after setting them", () => {
  mutate(document, (modifiable) => {
    modifiable.nodes.b.setStyleByKey('borderRadius', '3px')
    const thisValue = modifiable.nodes.b.styles['borderRadius']
    expect(thisValue).toEqual('3px')
    expect(modifiable.nodes.b.styles).toHaveProperty('borderRadius', '3px')
  })
})