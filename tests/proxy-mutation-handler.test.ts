import { describe, it, expect, vi } from 'vitest'

import { ProxyMutationObjectHandler } from '../src'

describe('proxy mutation handler behaviour', () => {
  it('support hasOwnProperty', () => {
    const sourceObject = {
      x: 1,
    }

    const proxyedObject = new Proxy(
      sourceObject,
      new ProxyMutationObjectHandler({
        mutationNode: { p: null, k: '' },
        target: sourceObject,
        selectorPointerArray: [],
        dirtyPaths: new Set(),
        proxyfyAccess: () => {},
        incOpCount: () => 0,
      }),
    )
    expect(proxyedObject.hasOwnProperty).toBeTruthy()
  })
})
