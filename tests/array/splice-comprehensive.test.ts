import { describe, it, expect, vi } from 'vitest'

import { mutate, mutateFromPatches, select } from '../../src'

describe('array splice comprehensive tests', () => {
  it('splice with no removal but multiple additions', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.splice(1, 0, 'beautiful', 'day', '!')
    })

    expect(state.words).toEqual(['hello', 'beautiful', 'day', '!', 'world'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from splice with no removal but multiple additions', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(1, 0, 'beautiful', 'day', '!')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('splice removing multiple elements', () => {
    const state = {
      words: ['hello', 'beautiful', 'day', 'in', 'the', 'world'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.splice(1, 3)
    })

    expect(state.words).toEqual(['hello', 'the', 'world'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from splice removing multiple elements', () => {
    const state = {
      words: ['hello', 'beautiful', 'day', 'in', 'the', 'world'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(1, 3)
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    // Note: mutateFromPatches applies patches to the object structure
    expect(stateTarget).toEqual(state)
  })

  it('splice at beginning of array', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.splice(0, 1, 'goodbye')
    })

    expect(state.words).toEqual(['goodbye', 'world'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from splice at beginning of array', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(0, 1, 'goodbye')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('splice at end of array', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.splice(2, 0, '!')
    })

    expect(state.words).toEqual(['hello', 'world', '!'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from splice at end of array', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(2, 0, '!')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('splice with negative index', () => {
    const state = {
      words: ['a', 'b', 'c', 'd'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.splice(-2, 1, 'x')
    })

    // Note: splice with negative index in JavaScript starts from the end
    // -2 means start at 2nd from end (index 2), remove 1 element, add 'x'
    // The result should be ['a', 'b', 'x', 'd'] based on native JavaScript behavior
    expect(state.words).toEqual(['a', 'b', 'x', 'd'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from splice with negative index', () => {
    const state = {
      words: ['a', 'b', 'c', 'd'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(-2, 1, 'x')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    // Note: mutateFromPatches applies patches to the object structure
    expect(stateTarget).toEqual(state)
  })

  it('splice on empty array', () => {
    const state = {
      words: [] as string[],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.splice(0, 0, 'hello', 'world')
    })

    expect(state.words).toEqual(['hello', 'world'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from splice on empty array', () => {
    const state = {
      words: [] as string[],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(0, 0, 'hello', 'world')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('splice with more items to remove than exist', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.splice(0, 5, 'goodbye')
    })

    expect(state.words).toEqual(['goodbye'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from splice with more items to remove than exist', () => {
    const state = {
      words: ['hello', 'world'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.splice(0, 5, 'goodbye')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('splice with complex remove and add pattern', () => {
    const state = {
      words: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      // Replace "brown fox jumps" with "red cat leaps"
      modifiable.words.splice(2, 3, 'red', 'cat', 'leaps')
    })

    expect(state.words).toEqual(['the', 'quick', 'red', 'cat', 'leaps', 'over', 'the', 'lazy', 'dog'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from complex splice operation', () => {
    const state = {
      words: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      // Replace "brown fox jumps" with "red cat leaps"
      modifiable.words.splice(2, 3, 'red', 'cat', 'leaps')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })
})
