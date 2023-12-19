import { describe, it, expect , vi } from 'vitest'

import { mutate, mutateFromPatches, select } from "../../src"

describe('basic select over array', () => {
  it('pushing into array behaves similar to adding a key to an object', () => {

    const state = {
      words: ['hello', 'world']
    }

    const mapperSpy = vi.fn()

    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      }
    )

    const patches = mutate(state, (modifiable) => {
      modifiable.words.push('!')
    })

    expect(mapperSpy).toHaveBeenCalledTimes(1)
    expect(mapperSpy).toHaveBeenCalledWith(['hello', 'world', '!'])

    // console.log('patches', patches)
    expect(patches).toHaveLength(1)
    expect(patches![0].op).toEqual('add')
    expect(patches![0].pathArray).toStrictEqual(['words', '-'])
    expect(patches![0].value).toStrictEqual(['!'])

    selector.dispose()
  })

  it('popping from an array behaves similar to removing a key to an object', () => {

    const state = {
      words: ['hello', 'world', '!']
    }

    const mapperSpy = vi.fn()
    const resultsCallSpy = vi.fn()

    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      }
    )

    const patches = mutate(state, (modifiable) => {
      const result = modifiable.words.pop()
      resultsCallSpy(result)
    })

    expect(mapperSpy).toHaveBeenCalledTimes(1)
    expect(resultsCallSpy).toHaveBeenCalledTimes(1)
    expect(resultsCallSpy).toHaveBeenCalledWith('!')

    expect(mapperSpy).toHaveBeenCalledWith(['hello', 'world'])


    // console.log('patches', patches)
    expect(patches).toHaveLength(1)
    expect(patches![0].op).toEqual('remove')
    expect(patches![0].pathArray).toStrictEqual(['words', '2'])
    expect(patches![0].old).toStrictEqual('!')

    selector.dispose()
  })

  it('shifting from an array behaves similar to removing a key to an object', () => {

    const state = {
      words: ['hello', 'world', '!']
    }

    const mapperSpy = vi.fn()
    const resultsCallSpy = vi.fn()


    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      }
    )

    const patches = mutate(state, (modifiable) => {
      const result = modifiable.words.shift()
      resultsCallSpy(result)
    })

    expect(mapperSpy).toHaveBeenCalledTimes(1)
    expect(resultsCallSpy).toHaveBeenCalledTimes(1)
    expect(resultsCallSpy).toHaveBeenCalledWith('hello')

    expect(mapperSpy).toHaveBeenCalledWith(['world', '!'])


    // console.log('patches', patches)
    expect(patches).toHaveLength(1)
    expect(patches![0].op).toEqual('remove')
    expect(patches![0].pathArray).toStrictEqual(['words', '0'])
    expect(patches![0].old).toStrictEqual('hello')

    selector.dispose()
  })

  it('pushing multiple values acts as multiple pushes', () => {
    const state = {
      words: ['hello', 'world']
    }

    const mapperSpy = vi.fn()

    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      }
    )

    const patches = mutate(state, (modifiable) => {
      modifiable.words.push('!', 'How', 'are', 'you?')
    })

    expect(mapperSpy).toHaveBeenCalledTimes(1)
    expect(mapperSpy).toHaveBeenCalledWith(['hello', 'world', '!', 'How', 'are', 'you?'])

    // console.log('patches', patches)
    expect(patches).toHaveLength(1)
    expect(patches![0].op).toEqual('add')
    expect(patches![0].pathArray).toStrictEqual(['words', '-'])
    expect(patches![0].value).toStrictEqual(['!', 'How', 'are', 'you?'])

    selector.dispose()
  })

  it('replacing an array value behaves similar to replacing a key in an object', () => {

    const state = {
      words: ['hello', 'world', '!']
    }

    const mapperSpy = vi.fn()

    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      }
    )

    const patches = mutate(state, (modifiable) => {
      modifiable.words[1] = 'Vlad'
    })

    expect(mapperSpy).toHaveBeenCalledTimes(1)
    expect(mapperSpy).toHaveBeenCalledWith(['hello', 'Vlad', '!'])

    // console.log('patches', patches)

    expect(patches).toHaveLength(1)
    expect(patches![0].op).toBe('replace')
    expect(patches![0].pathArray).toStrictEqual(['words', '1'])
    expect(patches![0].value).toBe('Vlad')

    selector.dispose()
  })

  it('replacing an array with another one behaves similar to replacing a key in an object', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const mapperSpy = vi.fn()

    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      },
      {
        reactToAncestorChanges: true
      }
    )

    const patches = mutate(state, (modifiable) => {
      modifiable.words = ['goodbye', 'Vlad', '!']
    })

    expect(mapperSpy).toHaveBeenCalledTimes(1)
    expect(mapperSpy).toHaveBeenCalledWith(['goodbye', 'Vlad', '!'])

    // console.log('patches', patches)

    expect(patches).toHaveLength(1)
    expect(patches![0].op).toBe('replace')
    expect(patches![0].pathArray).toStrictEqual(['words'])
    expect(patches![0].value).toStrictEqual(['goodbye', 'Vlad', '!'])

    selector.dispose()
  })

  it('removeing via delete', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const mapperSpy = vi.fn()

    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      }
    )

    const patches = mutate(state, (modifiable) => {
      const { words } = modifiable
      delete words[1]
    })

    expect(mapperSpy).toHaveBeenCalledTimes(1)
    expect(mapperSpy).toHaveBeenCalledWith(['hello', undefined, '!'])

    // console.log('patches', patches)

    expect(patches).toHaveLength(1)

    // BEWARE. Remove here replaces with undefined actually. For arrays it is 
    // very different! The array DOES NOT SHRINK! My intution would be that it
    // should be a replace with undefined not a remove, but it would require
    // implementing a different mutation logic for arrays.
    expect(patches![0].op).toBe('remove')
    expect(patches![0].pathArray).toEqual(['words', "1"])
    expect(patches![0].value).toBe(undefined)

    selector.dispose()
  })

  it('removeing via splice', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const mapperSpy = vi.fn()

    const selector = select(
      state,
      // select similar to reacting to words[key] = something
      ['/words/*'],
      (currentState) => {
        mapperSpy(currentState.words)
      }
    )

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(1, 1)
    })

    expect(state.words).toHaveLength(2)
    expect(patches).toHaveLength(1)
    expect(patches![0].op).toBe('remove')
    expect(patches![0].pathArray).toEqual(['words', '1'])

    selector.dispose()
  })
  
  it('apply patches for arrays when removing items', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patchesForSplice = mutate(state, (modifiable) => {
      modifiable.words.splice(0, 1)
    }) ?? []

    mutateFromPatches(stateTarget, patchesForSplice)

    // console.log('state', state)
    // console.log('stateTarget', stateTarget)

    expect(stateTarget).toEqual(state)

  })

  it('apply patches for arrays when adding items', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patchesForPush = mutate(state, (modifiable) => {
      modifiable.words.push('new', 'words')
    }) ?? []

    mutateFromPatches(stateTarget, patchesForPush)

    // console.log('patchesForPush', patchesForPush)
    // console.log('state', state)
    // console.log('stateTarget', stateTarget)
    
    expect(stateTarget).toEqual(state)
  })

  it('apply patches for arrays when replacing items', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patchesForReplace = mutate(state, (modifiable) => {
      modifiable.words[1] = 'Vlad'
    }) ?? []

    mutateFromPatches(stateTarget, patchesForReplace)

    // console.log('state', state)
    // console.log('stateTarget', stateTarget)

    expect(stateTarget).toEqual(state)
  })

  it('apply patches for arrays when using shift', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patchesForReplace = mutate(state, (modifiable) => {
      modifiable.words.shift()
    }) ?? []

    mutateFromPatches(stateTarget, patchesForReplace)

    // console.log('state', state)
    // console.log('stateTarget', stateTarget)

    expect(stateTarget).toEqual(state)
  })

  it('apply patches for arrays when using unshift', () => {
    const state = {
      words: ['hello', 'world', '!']
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patchesForReplace = mutate(state, (modifiable) => {
      modifiable.words.unshift('User:')
    }) ?? []

    mutateFromPatches(stateTarget, patchesForReplace)

    // console.log('state', state)
    // console.log('stateTarget', stateTarget)

    expect(stateTarget).toEqual(state)
  })

})
