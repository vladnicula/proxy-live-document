import merge from "lodash.merge"
import { describe, it, expect , vi} from 'vitest'

import { combinedJSONPatches, mutate, JSONPatchEnhanced } from "../src"

describe('json patchs combine', () => {

  it('correctly merges the same operations', () => {
    const opration = {
      op: 'add' as 'add',
      path: 'subObject/key3',
      value: 'value3 new value',
      pathArray: [ 'subObject', 'key3' ]
    }

    const resultSet = combinedJSONPatches([
      opration, {...opration}
    ])

    expect(resultSet).toHaveLength(1)
  })


  it('merges all operations of a subtree under an add operation', () => {
    const ops =  [
      {
        op: 'add',
        path: 'subObject/newPath',
        old: undefined,
        value: { key1: 'newPath value', key2: 'new path value 2', },
        pathArray: [ 'subObject', 'newPath' ]
      },
      {
        op: 'add',
        path: 'subObject/newPath/key3',
        old: undefined,
        value: 'new path value 3',
        pathArray: [ 'subObject', 'newPath', 'key3' ]
      },
      {
        op: 'remove',
        path: 'subObject/newPath/key2',
        old: 'new path value 2',
        value: undefined,
        pathArray: [ 'subObject', 'newPath', 'key2' ]
      }
    ] as JSONPatchEnhanced[]

    const mergedPatch = combinedJSONPatches(ops)

    // todo also write a test with adds on deeper levels not on first level
    expect(mergedPatch).toEqual([{
      op: 'add',
      path: 'subObject/newPath',
      old: undefined,
      value: { key1: 'newPath value', key3: 'new path value 3' },
      pathArray: [ 'subObject', 'newPath' ]
    }])
  })

  it('add l1 -> l2 -> l31 -> l41, add l2 -> l32 -> l42, remove l2  ', () => {
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

    const combined = combinedJSONPatches(changes!)
    expect(combined).toEqual([{
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

    const combined = combinedJSONPatches(changes!)
    expect(combined.length).toEqual(0)
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

    const combined = combinedJSONPatches(changes!)
    expect(combined).toEqual([{
      op: 'add',
      path: '/key2',
      pathArray: ['key2'],
      value: {
        key21: {
          key211: 'some value'
        }
      }
    }])
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


  it("correclty handles a delete followed by a new assignment as a replace", () => {
    const operations = [
      {
        op: 'remove' as const,
        path: '/nodes/1',
        old: {},
        value: undefined,
        pathArray: [ 'nodes', '1' ]
      },
      {
        op: 'add' as const,
        path: '/nodes/1',
        old: {},
        value: { new: 'stuff' },
        pathArray: [ 'nodes', '1' ]
      }
    ]

    const result = combinedJSONPatches(operations)
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('op', 'replace')
  })

})
