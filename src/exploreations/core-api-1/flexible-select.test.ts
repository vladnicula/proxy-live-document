import { mutate, select } from "."

describe('flexible select', () => {
  it('selects any key in given object', () => {

    const stateTree = {
      givenObject: {
        key1: 'ceva',
        key2: 'atlceva',
        key3: 'yet another thing'
      } as Record<string, string>,
      ignoreMe: 23
    }

    const selector = select(
      stateTree, [
        `givenObject/*`
      ],
      (mappable) => {
        return Object.keys(mappable.givenObject)
      })

    const callbackSpy = jest.fn()
    selector.observe(callbackSpy)
    
    mutate(stateTree, (modifiable) => {
      modifiable.givenObject['key3'] = 'changed value'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(callbackSpy).toHaveBeenCalledWith(['key1', 'key2', 'key3'])

    mutate(stateTree, (modifiable) => {
      delete modifiable.givenObject['key3']
      delete modifiable.givenObject['key1']
    })

    expect(callbackSpy).toHaveBeenCalledTimes(2)
    expect(callbackSpy).toHaveBeenCalledWith(['key2'])

    mutate(stateTree, (modifiable) => {
      modifiable.givenObject['key5'] = '321'
      modifiable.givenObject['key6'] = '123'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(3)
    expect(callbackSpy).toHaveBeenCalledWith(['key2', 'key5', 'key6'])

  })

  it('selects any time a subtree changes, regardless of levels', () => {

    const stateTree = {
      subtree1: {
        a: { a1: 'ceva' },
        b: { b1: 'something in b', b2: { b21: 'leaf in b', b22: 'another leaf in b'} },
        c: { c1: 'yet another thing', c2: 'more leafes in c', c3: { c31: { c311: 'very deep leaf '} } }
      } as Record<string, Object>,
      ignoreMe: 23
    }

    const selector = select(
      stateTree, [
        `subtree1/**`
      ],
      (mappable) => {
        return mappable.subtree1
      })

    const callbackSpy = jest.fn()
    selector.observe(callbackSpy)
    
    mutate(stateTree, (modifiable) => {
      Object.assign(
        modifiable.subtree1.a,
        {key3: 'changed value'}
      )
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(stateTree.subtree1.a).toHaveProperty('key3', 'changed value')
    expect(callbackSpy.mock.calls[0][0]).toEqual(stateTree.subtree1)

    mutate(stateTree, (modifiable) => {
      delete modifiable.subtree1.b.b2.b22
    })

    expect(callbackSpy).toHaveBeenCalledTimes(2)
    expect(callbackSpy.mock.calls[0][0]).toEqual(stateTree.subtree1)

    mutate(stateTree, (modifiable) => {
      modifiable.subtree1.b.b2.b22 = '321'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(3)
    expect(callbackSpy.mock.calls[0][0]).toEqual(stateTree.subtree1)

  })

  it('selects /named/*/named2/** path type', () => {

    const stateTree = {
      nodes: {
        nodeid1: {
          id: 1,
          styles: {
            paddingTop: {
              content: '32px'
            },
            marginTop: {
              content: '32px'
            },
            borderTop: {
              content: '32px'
            }
          }
        },
        nodeid2: {
          id: 2,
          styles: {
            paddingTop: {
              content: '32px'
            },
            marginTop: {
              content: '32px'
            },
            borderTop: {
              content: '32px'
            }
          }
        }
      }
    }

    const selector = select(
      stateTree, [
        `nodes/*`,
        `nodes/*/styles/**`
      ],
      (_, matchedPacthes) => {
        const nodeIdsThatChangedTheirStyles = matchedPacthes.map((jsonPatch) => jsonPatch.pathArray[1])
        return nodeIdsThatChangedTheirStyles
      })

    const callbackSpy = jest.fn()
    selector.observe(callbackSpy)
    
    mutate(stateTree, (modifiable) => {
      modifiable.nodes.nodeid1.styles.marginTop.content = 'auto'
      modifiable.nodes.nodeid2.styles.marginTop.content = 'auto'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(callbackSpy).toHaveBeenCalledWith(['nodeid1', 'nodeid2'])

    mutate(stateTree, (modifiable) => {
      modifiable.nodes.nodeid3 = {
          nodeid3: {
            id: 3,
            styles: {
              paddingTop: {
                content: '32px'
              },
              marginTop: {
                content: '32px'
              },
              borderTop: {
                content: '32px'
              }
            }
          }
        }
      
    })

    expect(callbackSpy).toHaveBeenCalledTimes(2)
    expect(callbackSpy).toHaveBeenCalledWith(['nodeid3'])
  })

  it('select /named/*/named2/** path ignores paths that are not relevant', () => {
    const stateTree = {
      nodes: {
        nodeid1: {
          id: 1,
          styles: {
            paddingTop: {
              content: '32px'
            },
            marginTop: {
              content: '32px'
            },
            borderTop: {
              content: '32px'
            }
          }
        },
        nodeid2: {
          id: 2,
          styles: {
            paddingTop: {
              content: '32px'
            },
            marginTop: {
              content: '32px'
            },
            borderTop: {
              content: '32px'
            }
          }
        }
      }
    }

    const selector = select(
      stateTree, [
        `nodes/*/styles/**`
      ],
      (_, matchedPacthes) => {
        const nodeIdsThatChangedTheirStyles = matchedPacthes.map((jsonPatch) => jsonPatch.pathArray[1])
        return nodeIdsThatChangedTheirStyles
      })

    const callbackSpy = jest.fn()
    selector.observe(callbackSpy)

    mutate(stateTree, (modifiable) => {
      modifiable.nodes.nodeid4 = {
          nodeid4: {
            id: 4,
          }
        }
      
    })

    expect(callbackSpy).toHaveBeenCalledTimes(0)
  })

})