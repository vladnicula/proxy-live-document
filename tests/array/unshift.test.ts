import { describe, it, expect, vi } from 'vitest'

import { mutate, mutateFromPatches, select } from '../../src'

describe('array unshift tests', () => {
  it('unshift single item', () => {
    const state = {
      words: ['world'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.unshift('hello')
    })

    expect(state.words).toEqual(['hello', 'world'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from unshift single item', () => {
    const state = {
      words: ['world'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.unshift('hello')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('unshift multiple items', () => {
    const state = {
      words: ['world'],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.unshift('hello', 'beautiful', 'day')
    })

    expect(state.words).toEqual(['hello', 'beautiful', 'day', 'world'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from unshift multiple items', () => {
    const state = {
      words: ['world'],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.unshift('hello', 'beautiful', 'day')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('unshift on empty array', () => {
    const state = {
      words: [],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/words/*'], (currentState) => {
      mapperSpy(currentState.words)
    })

    mutate(state, (modifiable) => {
      modifiable.words.unshift('hello', 'world')
    })

    expect(state.words).toEqual(['hello', 'world'])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from unshift on empty array', () => {
    const state = {
      words: [],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.words.unshift('hello', 'world')
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('unshift with complex objects', () => {
    const state = {
      users: [{ id: 2, name: 'Bob' }],
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/users/*'], (currentState) => {
      mapperSpy(currentState.users)
    })

    mutate(state, (modifiable) => {
      modifiable.users.unshift({ id: 1, name: 'Alice' })
    })

    expect(state.users).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from unshift with complex objects', () => {
    const state = {
      users: [{ id: 2, name: 'Bob' }],
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.users.unshift({ id: 1, name: 'Alice' })
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })

  it('unshift with nested array selector', () => {
    const state = {
      data: {
        items: [{ id: 2 }],
      },
    }

    const mapperSpy = vi.fn()
    const selector = select(state, ['/data/items/*'], (currentState) => {
      mapperSpy(currentState.data.items)
    })

    mutate(state, (modifiable) => {
      modifiable.data.items.unshift({ id: 1 })
    })

    expect(state.data.items).toEqual([{ id: 1 }, { id: 2 }])
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    selector.dispose()
  })

  it('apply patches from unshift with nested array selector', () => {
    const state = {
      data: {
        items: [{ id: 2 }],
      },
    }

    const stateTarget = JSON.parse(JSON.stringify(state))

    const patches = mutate(state, (modifiable) => {
      modifiable.data.items.unshift({ id: 1 })
    }) ?? []

    mutateFromPatches(stateTarget, patches)

    expect(stateTarget).toEqual(state)
  })
})
