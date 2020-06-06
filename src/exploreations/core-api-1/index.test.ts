import merge from 'lodash.merge'

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

test("when setting a key on an object, the path includes the key that was set", () => {
  const patch1 = mutate(document, (modifiable) => {
    modifiable.nodes.b.setStyleByKey('borderRadius', '3px')
  })

  const expectedPath = '/nodes/b/styles/borderRadius'
  
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

test("changes from mutation get applied to docunmet after mutation", () => {
  mutate(document, (modifiable) => {
    modifiable.nodes.b.setStyleByKey('borderRadius', '3px')
  })

  const thisValue = document.nodes.b.styles['borderRadius']
  expect(thisValue).toEqual('3px')
  expect(document.nodes.b.styles).toHaveProperty('borderRadius', '3px')
})

test("simple operations add", () => {
  const source: Record<string, string> = {}
  const changes = mutate(source, (modifiable) => {
    modifiable.addedKey = 'value'
    expect(modifiable.addedKey).toEqual('value')
    expect(modifiable).toHaveProperty('addedKey', 'value')
  })

  expect(source.addedKey).toEqual('value')
  expect(source).toHaveProperty('addedKey', 'value')

  expect(changes).toHaveLength(1)
  expect(changes[0]).toEqual({
    op: 'add',
    path: '/addedKey',
    pathArray: ['addedKey'],
    value: 'value'
  })
})

test("simple operations modify", () => {
  const INITIAL_VAL = "initialValue"
  const NEW_VAL = 'newValue'
  const TARGET_KEY = 'modKey'

  const source: Record<string, string> = {
    [TARGET_KEY]: INITIAL_VAL
  }
  const changes = mutate(source, (modifiable) => {
    modifiable[TARGET_KEY] = NEW_VAL
    expect(modifiable[TARGET_KEY]).toEqual(NEW_VAL)
    expect(modifiable).toHaveProperty(TARGET_KEY, NEW_VAL)
  })

  expect(source[TARGET_KEY]).toEqual(NEW_VAL)
  expect(source).toHaveProperty(TARGET_KEY, NEW_VAL)

  expect(changes).toHaveLength(1)
  expect(changes[0]).toEqual({
    op: 'replace',
    path: `/${TARGET_KEY}`,
    pathArray: [TARGET_KEY],
    value: NEW_VAL,
    old: INITIAL_VAL
  })
})

test("simple operations delete", () => {
  const INITIAL_VAL = "initialValue"
  const TARGET_KEY = 'removeableKey'

  const source: Record<string, string> = {
    [TARGET_KEY]: INITIAL_VAL
  }
  const changes = mutate(source, (modifiable) => {
    delete modifiable[TARGET_KEY]
    expect(modifiable[TARGET_KEY]).toEqual(undefined)
    expect(modifiable).not.toHaveProperty(TARGET_KEY)
  })

  expect(source[TARGET_KEY]).toEqual(undefined)
  expect(source).not.toHaveProperty(TARGET_KEY)

  expect(changes).toHaveLength(1)
  expect(changes[0]).toEqual({
    op: 'remove',
    path: `/${TARGET_KEY}`,
    pathArray: [TARGET_KEY],
    old: INITIAL_VAL
  })
})

test("object deep merge", () => {
  const source: Record<string, string | Record<string, string>> = {
    subObject: {
      key1: 'value1',
      key2: 'value2',
    }
  }

  const changes = mutate(source, (modifiable) => {
    merge(modifiable, {
      subObject: {
        key2: 'value2 updated',
        key3: 'value3 new value',
      }
    })
  })
 
  expect(changes).toEqual([
    {
      op: 'replace',
      path: '/subObject/key2',
      old: 'value2',
      value: 'value2 updated',
      pathArray: [ 'subObject', 'key2' ]
    },
    {
      op: 'add',
      path: '/subObject/key3',
      old: undefined,
      value: 'value3 new value',
      pathArray: [ 'subObject', 'key3' ]
    }
  ])

})