import { describe, it, expect , vi} from 'vitest'

import { mutate, select } from "../src"

describe('basic select', () => {
  it('select exactly the modified value', () => {

    const state = {
      observeMe: 'hello'
    }

    const callbackSpy = vi.fn()
    const callbackSpy2 = vi.fn()
    const mapperSpy = vi.fn()

    const selector = select(
      state, 
      ['/observeMe'],
      (currentState) => {
        mapperSpy()
        return {
          someValue: currentState.observeMe,
          somethingElse: 'this'
        }
      }
    )


    selector.observe(callbackSpy)
    selector.observe(callbackSpy2)
    mutate(state, (modifiable) => {
      modifiable.observeMe = 'changed'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(callbackSpy2).toHaveBeenCalledTimes(1)
    
    expect(callbackSpy.mock.calls[0][0]).toEqual({
      someValue: 'changed',
      somethingElse: 'this'
    })
    expect(callbackSpy2.mock.calls[0][0]).toEqual({
      someValue: 'changed',
      somethingElse: 'this'
    })
    expect(mapperSpy).toHaveBeenCalledTimes(1)
  })

  it('select triggers only on relevant path', () => {

    const state = {
      observeMe: 'hello',
      iDontCare: 'should not trigger'
    }

    const callbackSpyThatShouldRun = vi.fn()
    const callbackSpyThatShouldNotRun = vi.fn()
    const mapperSpyThatShouldRun = vi.fn()
    const mapperSpyThatShouldNotRun = vi.fn()

    const selectorThatShouldRun = select(
      state, 
      ['/observeMe'],
      (currentState) => {
        mapperSpyThatShouldRun()
        return {
          someValue: currentState.observeMe,
          somethingElse: 'this'
        }
      }
    )

    const selector2ThatShouldNotRun = select(
      state, 
      ['/iDontCare'],
      (currentState) => {
        mapperSpyThatShouldNotRun()
        return {
          someValue: currentState.iDontCare,
          somethingElse: 'this'
        }
      }
    )



    selectorThatShouldRun.observe(callbackSpyThatShouldRun)
    selector2ThatShouldNotRun.observe(callbackSpyThatShouldNotRun)

    mutate(state, (modifiable) => {
      modifiable.observeMe = 'changed'
    })

    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(1)
    expect(callbackSpyThatShouldNotRun).toHaveBeenCalledTimes(0)
    expect(callbackSpyThatShouldRun.mock.calls[0][0]).toEqual({
      someValue: 'changed',
      somethingElse: 'this'
    })
    expect(mapperSpyThatShouldRun).toHaveBeenCalledTimes(1)
    expect(mapperSpyThatShouldNotRun).toHaveBeenCalledTimes(0)
  })

  it('select support multple paths', () => {

    const state = {
      observeMe: 'something',
      observeMeToo: 'i am here',
      dontObserveMe: 'i am not supposed to be observed'
    }

    const callbackSpyThatShouldRun = vi.fn()
    const mapperSpyThatShouldRun = vi.fn()

    const selectorThatShouldRun = select(
      state, 
      [
        '/observeMe',
        '/observeMeToo',
      ],
      (currentState) => {
        mapperSpyThatShouldRun()
        return {
          someValue: currentState.observeMe,
          somethingElse: 'this'
        }
      }
    )



    selectorThatShouldRun.observe(callbackSpyThatShouldRun)

    mutate(state, (modifiable) => {
      modifiable.dontObserveMe = 'changed'
    })

    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(0)

    mutate(state, (modifiable) => {
      modifiable.observeMe = 'hello'
    })

    expect(mapperSpyThatShouldRun).toHaveBeenCalledTimes(1)
    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(1)
    expect(callbackSpyThatShouldRun.mock.calls[0][0]).toEqual({
      someValue: 'hello',
      somethingElse: 'this'
    })

    mutate(state, (modifiable) => {
      modifiable.observeMeToo = 'hello too'
    })

    expect(mapperSpyThatShouldRun).toHaveBeenCalledTimes(2)
    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(2)
    expect(callbackSpyThatShouldRun.mock.calls[1][0]).toEqual({
      someValue: 'hello',
      somethingElse: 'this'
    })
  })

  it('support unsubing from subscriptions', () => {
    const state = {
      observeMe: 'something',
    }

    const selectorThatShouldRun = select(
      state, 
      [
        '/observeMe',
      ],
      (currentState) => {
        return {
          someValue: currentState.observeMe,
        }
      }
    )

    const callbackSpy = vi.fn()
    const callbackSpy2 = vi.fn()
    const unsub1 = selectorThatShouldRun.observe(callbackSpy)
    const unsub2 = selectorThatShouldRun.observe(callbackSpy2)

    mutate(state, (modifiable) => {
      modifiable.observeMe = 'hello'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(callbackSpy2).toHaveBeenCalledTimes(1)

    unsub1()
    mutate(state, (modifiable) => {
      modifiable.observeMe = 'hello again'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(callbackSpy2).toHaveBeenCalledTimes(2)

    unsub2()
    mutate(state, (modifiable) => {
      modifiable.observeMe = 'hello again'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(callbackSpy2).toHaveBeenCalledTimes(2)
  })

  it.skip('allows reshaping the selection array while keeping all bound observers', () => {
    const state = {
      key1: 'something',
      key2: 'something-else'
    }

    const selectorThatWillBeReshaped = select(
      state, 
      [
        '/key1',
      ],
      (currentState) => {
        return {
          someValue: currentState.key1,
        }
      }
    )

    const callbackSpy = vi.fn()

    selectorThatWillBeReshaped.observe(callbackSpy)

    mutate(state, (modifiable) => {
      modifiable.key1 = 'hello on key1'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)


    mutate(state, (modifiable) => {
      modifiable.key2 = 'hello on key2'
    })

    // callback does not get called again because selector is on key1, and we
    // changed key2
    expect(callbackSpy).toHaveBeenCalledTimes(1)
     
    // selectorThatWillBeReshaped.reshape((selectors) => {
    //   return [...selectors, [`key2`]]
    // })

    mutate(state, (modifiable) => {
      modifiable.key2 = 'hello on key2 a second time'
    })

    // now we are listening to both key1 and key2
    expect(callbackSpy).toHaveBeenCalledTimes(2)
    

    
    mutate(state, (modifiable) => {
      modifiable.key1 = 'hello on key1 a second time'
    })

    // now we are listening to both key1 and key2
    expect(callbackSpy).toHaveBeenCalledTimes(3)


    // selectorThatWillBeReshaped.reshape((selectors) => {
    //   return [[`key2`]]
    // })

    mutate(state, (modifiable) => {
      modifiable.key2 = 'hello on key2 a trhid time'
    })

    // now we are listening only on key2
    expect(callbackSpy).toHaveBeenCalledTimes(4)

    mutate(state, (modifiable) => {
      modifiable.key1 = 'hello on key1 a trhid time'
    })

    // now we are listening only on key2
    expect(callbackSpy).toHaveBeenCalledTimes(4)
  })

  it('can run multiple identical selectors', () => {
    const state = {
      key1: 'something',
    }

    const selector1 = select(
      state, 
      [
        '/key1',
      ],
      (currentState) => {
        return {
          someValue: currentState.key1,
        }
      }
    )

    //order matters a lot
    const callback1 = vi.fn()
    selector1.observe(callback1)


    // must be after observe
    const selector2 = select(
      state, 
      [
        '/key1',
      ],
      (currentState) => {
        return {
          someValue: currentState.key1,
        }
      }
    )

    const callback2 = vi.fn()

    selector2.observe(callback2)

    mutate(state, (mutable) => {
      mutable.key1 = 'changed'
    })

    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).toHaveBeenCalledTimes(1)


  })
  
})