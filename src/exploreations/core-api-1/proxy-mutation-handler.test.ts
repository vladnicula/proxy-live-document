import { ProxyMutationObjectHandler } from "."

describe('proxy mutation handler behaviour', () => {

  it('support hasOwnProperty', () => {
    const sourceObject = {
      x: 1
    }

    const proxyedObject = new Proxy(sourceObject, new ProxyMutationObjectHandler([]))
    expect(proxyedObject.hasOwnProperty).toBeTruthy()
  })

})