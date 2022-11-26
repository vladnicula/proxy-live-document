import { describe, it, expect , vi} from 'vitest'
import { mutate, autorun, selectorsManager } from "../../src"
import { countSelectorsInTree } from '../../src/selector-map'

describe('autorun', () => {
  it('creates simple autorun reaction', () => {
    const stateObject = {
        count: 32 
    }

    const autorunFn = vi.fn()

    autorun(stateObject, (state) => {
        autorunFn()
        const x = state.count
        // x does not need to do anything
    }) 

    expect(autorunFn).toHaveBeenCalledTimes(1)

    mutate(stateObject, (state) => {
        state.count += 1
    })

    expect(autorunFn).toHaveBeenCalledTimes(2)

    mutate(stateObject, (state) => {
        state.count += 1
    })

    expect(autorunFn).toHaveBeenCalledTimes(3)
  })

  it('creates autorun reaction that changes what is selects over dynamically', () => {
    const stateObject = {
        count: 32,
        anotherThing: 0
    }

    const autorunFn = vi.fn()

    autorun(stateObject, (state) => {
        autorunFn()
        if ( state.anotherThing > 0 ) {
            const x = state.count
        } 
        // x does not need to do anything
    }) 

    expect(autorunFn).toHaveBeenCalledTimes(1)

    mutate(stateObject, (state) => {
        state.count += 1
    })

    // our selector does not run becasue the count
    // is not registered initially, because the autorun
    // did not get into the if branch to see the count
    expect(autorunFn).toHaveBeenCalledTimes(1)

    mutate(stateObject, (state) => {
        state.anotherThing = 1
    })

    // we changed the anotherThing, and autorun has executed
    // the function. Now we should have a registered select
    // for the cout variable
    expect(autorunFn).toHaveBeenCalledTimes(2)

    mutate(stateObject, (state) => {
        state.count += 1
    })

    // now the autorun runs for count as well
    expect(autorunFn).toHaveBeenCalledTimes(3)
  })

  it("autorun over nested objects", () => {
    const stateObject = {
        toggle: false,
        nodes: {
            1: {
                title: "Hello"
            },
            2: {
                title: "World"
            }
        }
    }

    const autorunFn = vi.fn()

    autorun(stateObject, (state) => {
        if ( state.toggle ) {
            autorunFn(state.nodes[1].title)
        } else {
            autorunFn(state.nodes[2].title)
        }
    })

    expect(autorunFn).toHaveBeenCalledTimes(1)
    expect(autorunFn).toHaveBeenCalledWith(stateObject.nodes[2].title)

    mutate(stateObject, (state) => {
        state.nodes[2].title = 'People'
    })


    expect(autorunFn).toHaveBeenCalledTimes(2)
    expect(autorunFn).toHaveBeenCalledWith(stateObject.nodes[2].title)

    mutate(stateObject, (state) => {
        state.nodes[1].title = 'What is up '
    })

    expect(autorunFn).toHaveBeenCalledTimes(2)

    mutate(stateObject, (state) => {
        state.nodes[1].title = 'Howdy '
        state.toggle = true
    })

    expect(autorunFn).toHaveBeenCalledTimes(3)
    expect(autorunFn).toHaveBeenCalledWith(stateObject.nodes[1].title)

  })

  it("can handle getters", () => {
    class DomainEntity {
        fName: string = 'John'
        lName: string = 'Snow'

        age: number = 32
        
        get fullName () {
            return this.fName + ' ' + this.lName
        }
    }

    const stateObject = new DomainEntity()
    const autorunFn = vi.fn()

    autorun(stateObject, (state) => {
        autorunFn(state.fullName)
    })

    expect(autorunFn).toHaveBeenCalledTimes(1)
    expect(autorunFn).toHaveBeenCalledWith(stateObject.fullName)

    mutate(stateObject, (state) => {
        state.age = 40
    })

    expect(autorunFn).toHaveBeenCalledTimes(1)

    mutate(stateObject, (state) => {
        state.fName = "Bobby"
    })

    expect(autorunFn).toHaveBeenCalledTimes(2)
    expect(autorunFn).toHaveBeenCalledWith(stateObject.fullName)

  })

  it.only("correctly cleans up all selectors on each run", () => {
    const stateObject = {
        count: 32 
    }

    const autorunFn = vi.fn()

    autorun(stateObject, (state) => {
        autorunFn(state.count)
    }) 

    const selectorTree = selectorsManager.getSelectorTree(stateObject)

    expect(countSelectorsInTree(selectorTree)).toBe(1)

    mutate(stateObject, (state) => {
        state.count += 1
    })

    expect(countSelectorsInTree(selectorTree)).toBe(1)

    mutate(stateObject, (state) => {
        state.count += 1
    })

    expect(countSelectorsInTree(selectorTree)).toBe(1)
  })

  it("correclty cleans up selectors in branching autorun", () => {
    const stateObject = {
        toggle: false,
        nodes: {
            1: {
                title: "Hello"
            },
            2: {
                title: "World"
            }
        }
    }

    const autorunFn = vi.fn()
    const selectorTree = selectorsManager.getSelectorTree(stateObject)

    autorun(stateObject, (state) => {
        if ( state.toggle ) {
            autorunFn(state.nodes[1].title)
        } else {
            autorunFn(state.nodes[2].title)
        }
    })

    expect(countSelectorsInTree(selectorTree)).toBe(2)

    mutate(stateObject, (state) => {
        state.nodes[2].title = 'People'
    })


    expect(countSelectorsInTree(selectorTree)).toBe(2)

    mutate(stateObject, (state) => {
        state.nodes[1].title = 'What is up '
    })

    expect(countSelectorsInTree(selectorTree)).toBe(2)

    mutate(stateObject, (state) => {
        state.nodes[1].title = 'Howdy '
        state.toggle = true
    })

    expect(countSelectorsInTree(selectorTree)).toBe(2)
  })

})
