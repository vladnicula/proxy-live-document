import { mutate, select } from '../src'

describe('computed props', () => {
  class WithComputedProps {

    firstName: string
    lastName: string

    get fullName () {
      return this.firstName + ' ' + this.lastName;
    }

    set fullName (value: string) {
      const parts = value.split(' ')
      this.firstName = parts[0]
      this.lastName = parts[0]
    }
  }

  it('supports computed props', () => {
    const stateWithComputedValues = new WithComputedProps()

    const callbackSpy = jest.fn()

    select(
      stateWithComputedValues,
      ['/fulLName'],
      callbackSpy
    )

    mutate(stateWithComputedValues, (state) => {
      state.firstName = 'John'
      state.lastName = 'Doe'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)


    mutate(stateWithComputedValues, (state) => {
      state.fullName = 'Vlad Nicula'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(2)
  })
})