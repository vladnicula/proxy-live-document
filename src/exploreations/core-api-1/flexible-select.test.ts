import { mutate, select } from "."

describe('flexible select', () => {
  it('selects any key in given object', () => {

    const stateTree = {
      givenObject: {
        key1: 'ceva',
        key2: 'atlceva',
        key3: 'yet another thing'
      } as Record<string, string>,
      ignoreMe: 23
    }

    const selector = select(
      stateTree, [
        `givenObject/*`
      ],
      (mappable) => {
        return Object.keys(mappable.givenObject)
      })

    const callbackSpy = jest.fn()
    selector.observe(callbackSpy)
    
    mutate(stateTree, (modifiable) => {
      modifiable.givenObject['key3'] = 'changed value'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(callbackSpy).toHaveBeenCalledWith(['key1', 'key2', 'key3'])

    mutate(stateTree, (modifiable) => {
      delete modifiable.givenObject['key3']
      delete modifiable.givenObject['key1']
    })

    expect(callbackSpy).toHaveBeenCalledTimes(2)
    expect(callbackSpy).toHaveBeenCalledWith(['key2'])

    mutate(stateTree, (modifiable) => {
      modifiable.givenObject['key5'] = '321'
      modifiable.givenObject['key6'] = '123'
    })

    expect(callbackSpy).toHaveBeenCalledTimes(3)
    expect(callbackSpy).toHaveBeenCalledWith(['key2', 'key5', 'key6'])

  })

 
})