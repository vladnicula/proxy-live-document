import { describe, it, expect, vi } from 'vitest'

import { mutate, mutateFromPatches, select } from '../../src'

describe('array splice edge cases', () => {
  it('splice can remove and add items at the same time', () => {
    const state = {
      words: ['hello', 'world', '!'],
    }

    const mapperSpy = vi.fn()

    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    // Remove 1 item at index 1 and insert 2 new items
    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(1, 1, 'beautiful', 'day')
    })

    expect(state.words).toEqual(['hello', 'beautiful', 'day', '!'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('splice can add items without removing', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(1, 0, 'beautiful')
    })

    expect(state.words).toEqual(['hello', 'beautiful', 'world'])
  })

  it('apply patches from splice with remove and add', () => {
    const state = {
      words: ['hello', 'world', '!'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches =
      mutate(state, (modifiable) => {
        modifiable.words.splice(1, 1, 'beautiful', 'day')
      }) ?? []

    console.log('patches from splice replace:', patches)

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('reverse array should generate patches', () => {
    const state = {
      words: ['a', 'b', 'c'],
    }

    const mapperSpy = vi.fn()

    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    const patches = mutate(state, (modifiable) => {
      modifiable.words.reverse()
    })

    expect(state.words).toEqual(['c', 'b', 'a'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('sort array should generate patches', () => {
    const state = {
      words: ['c', 'a', 'b'],
    }

    const mapperSpy = vi.fn()

    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    const patches = mutate(state, (modifiable) => {
      modifiable.words.sort()
    })

    expect(state.words).toEqual(['a', 'b', 'c'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })
})
