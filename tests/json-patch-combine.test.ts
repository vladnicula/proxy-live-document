import merge from "lodash.merge"
import { describe, it, expect } from 'vitest'

import { mutate, JSONPatchEnhanced } from "../src"

describe('json patchs combine', () => {

  it('add l1 -> l2 -> l31 -> l41, add l2 -> l32 -> l42, remove l2', () => {
    const source: Record<string, string | Record<string, string>> = {}

    const changes = mutate(source, (modifiable) => {
      merge(modifiable, {
      l1: {
        lRemaining: 'this should remain',
        l2: {
          l31: {
            l41: 'l41 added'
          }
        }
      }
      })

      merge(modifiable, {
        l1: {
          l2: {
            l32: {
              l42: 'l42 added'
            }
          }
        }
      })

      delete (modifiable.l1 as Record<string, string>).l2
    })

    // const combined = combinedJSONPatches(changes!)
    expect(changes).toEqual([{
      op: 'add',
      path: '/l1',
      pathArray: ['l1'],
      value: {lRemaining: 'this should remain'}
    }])
  })

  it('ignores delete that does not target any key', () => {
    const source: Record<string, string | Record<string, string>> = {
      subObject: {
        key1: 'value1',
        key2: 'value2',
      }
    }

    const changes = mutate(source, (modifiable) => {
      delete (modifiable.subObject as Record<string, string>).key3
    })

    // const combined = combinedJSONPatches(changes!)
    expect(changes!.length).toEqual(0)
  })

  it('handles remove on deeper key of newly added object', () => {
    const source: Record<string, string | Record<string, unknown>> = {
      key1: {
        key11: 'value1',
        key12: 'value2',
      }
    }

    const changes = mutate(source, (modifiable) => {
      merge(modifiable, {
        key2: {
          key21: {
            key211: 'some value',
            key212: 'this will be deleted'
          }
        }
      })
      

      delete (modifiable.key2 as Record<string, Record<string, unknown>>).key21.key212
    })

    // const combined = combinedJSONPatches(changes!)
    expect(source).toEqual({
      key1: {
        key11: 'value1',
        key12: 'value2',
      },
      key2: {
        key21: {
          key211: 'some value',
        }
      }
    })
    expect(changes).toEqual([{
      op: 'add',
      path: '/key2',
      pathArray: ['key2'],
      value: {
        key21: {
          key211: 'some value'
        }
      }
    }])
  })


  it('replace will merge over adds', () => {
    const source: Record<string, string | Record<string, string>> = {
      replaceMe: {
        key1: 'value1',
        key2: 'value2',
      }
    }

    const changes = mutate(source, (modifiable) => {
      merge(modifiable, {
        replaceMe: {
          key3: 'value3',
          key4: 'value4',
        }
      })

      modifiable.replaceMe = 'I replaced you'
    })

    expect(changes).toHaveLength(1)
    expect(source).toEqual({
      replaceMe: 'I replaced you'
    })
  })

  it("handles replace followed by remove as remove", () => {
    const obj = {
      x: 1
    } as Record<string, any>

    const patches = mutate(obj, (state) => {
      state.x = 32
      delete state.x
    })!

    // console.log(patches)

    expect(patches).toHaveLength(1)
    expect(patches[0].op).toEqual('remove')
    expect(patches[0].path).toEqual('/x')
    expect(patches[0].old).toEqual(1)
  })

  it("handles remove followed by add as replace", () => {
    const obj = {
      x: 1
    } as Record<string, any>

    const patches = mutate(obj, (state) => {
      delete state.x
      state.x = 32
    })!

    expect(patches).toHaveLength(1)
    expect(patches[0].op).toEqual('replace')
    expect(patches[0].path).toEqual('/x')
    expect(patches[0].old).toEqual(1)
    expect(patches[0].value).toEqual(32)
  })

  it("handles two deletes on two levels of the same nested object as one delete with correct old source value", () => {
    const obj = {
      abc: { field: 5, somethingElse: 32 },
    } as Record<string, any>

    const patches = mutate(obj, (state) => {
      delete state.abc.field
      delete state.abc
    })!
  
    expect(patches[0].op).toEqual('remove')
    expect(patches[0].path).toEqual('/abc')
    expect(patches[0].old).toEqual({ field: 5, somethingElse: 32 })
  })

  it('handles field update followed by remove with the old value from the removed object', () => {
    const obj = {
      abc: { field: 5, somethingElse: 32 },
    } as Record<string, any>

    const patches = mutate(obj, (state) => {
      state.abc.field = 'different value'
      delete state.abc
    })!

    // console.log(patches)
    expect(patches[0].op).toEqual('remove')
    expect(patches[0].path).toEqual('/abc')
    expect(patches[0].old).toEqual({ field: 5, somethingElse: 32 })

  })

})

export interface JSONPatchTreeNode {
  old?: unknown,
  value?: unknown,
  // root of tree has key null
  key: null | string,
  // root of tree has parent null
  parent: null | JSONPatchTreeNode,
  children?: Record<string, JSONPatchTreeNode>
}
