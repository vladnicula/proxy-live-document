import { mutate, observe } from "."

describe('basic observe', () => {
  it('observe exactly the modified value', () => {

    const state = {
      observeMe: 'hello'
    }

    observe(
      state, 
      (selectable) => selectable.observeMe,
      (currentState) => {
        console.log("I am modified", currentState)
      }
    )

    mutate(state, (modifiable) => {
      state.observeMe = 'changed'
    })
  })
})