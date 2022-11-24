import { describe, it, expect , vi} from 'vitest'

import { ProxyMutationObjectHandler } from "../src"

describe('proxy mutation handler behaviour', () => {

  it('support hasOwnProperty', () => {
    const sourceObject = {
      x: 1
    }

    const proxyedObject = new Proxy(sourceObject, new ProxyMutationObjectHandler({}))
    expect(proxyedObject.hasOwnProperty).toBeTruthy()
  })

})