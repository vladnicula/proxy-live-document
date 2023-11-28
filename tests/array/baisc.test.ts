import { describe, it, expect , vi } from 'vitest'

import { mutate, select } from "../../src"

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
    expect(patches![0].pathArray).toStrictEqual(['words', '2'])
    expect(patches![0].value).toBe('!')

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
    expect(patches![0].pathArray).toStrictEqual(['words', '1'])
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
      modifiable.words.splice(0, 1)
    })

    // console.log('patches', patches)

    // not ideal, it will "replace" all items in the array that are not deleted,
    // but it is a true operation actually.
    expect(patches).toHaveLength(3)

    selector.dispose()
  })

})
