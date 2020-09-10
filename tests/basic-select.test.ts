import { mutate, select } from "../src"

describe('basic select', () => {
  it('select exactly the modified value', () => {

    const state = {
      observeMe: 'hello'
    }

    const callbackSpy = jest.fn()
    const callbackSpy2 = jest.fn()
    const mapperSpy = jest.fn()

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

    const callbackSpyThatShouldRun = jest.fn()
    const callbackSpyThatShouldNotRun = jest.fn()
    const mapperSpyThatShouldRun = jest.fn()
    const mapperSpyThatShouldNotRun = jest.fn()

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

    const callbackSpyThatShouldRun = jest.fn()
    const mapperSpyThatShouldRun = jest.fn()

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

    const callbackSpy = jest.fn()
    const callbackSpy2 = jest.fn()
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
  
})