import { describe, it, expect , vi} from 'vitest'

import { mutate, JSONPatchEnhanced } from "../src"

describe('nested mutate calls', () => {
  it('generates correct patches on each nested mutate call for the same object', () => {
    const state: Record<string, string> = {}

    let innerPatches1: JSONPatchEnhanced[] | Promise<JSONPatchEnhanced[]> = []
    let innerPatches2: JSONPatchEnhanced[] | Promise<JSONPatchEnhanced[]> = []

    const outerPatch = mutate(state, (modifiable) => {
      modifiable.changedTopLevelMutate = 'changed'
    
      innerPatches1 = mutate(state, (modifiable) => {
        modifiable.changedInnerLevel1Mutate = 'changed'
        
        innerPatches2 = mutate(state,  (modifiable) => {
          modifiable.changedInnerLevel2Mutate = 'changed'
        })!

      })!
      
    })

    expect(outerPatch).toHaveLength(3)
    expect(innerPatches1).toHaveLength(0)
    expect(innerPatches2).toHaveLength(0)

  })

  it('generates correct patches on each nested mutate call for different objects', () => {
    const state1: Record<string, string> = {}
    const state2: Record<string, string> = {}

    let outerPatchState2: JSONPatchEnhanced[] | Promise<JSONPatchEnhanced[]> = []
    let innerPatchState1: JSONPatchEnhanced[] | Promise<JSONPatchEnhanced[]> = []

    const outerPatchState1 = mutate(state1, (modifiable) => {
      modifiable.changedTopLevelMutate = 'changed'
    
      outerPatchState2 = mutate(state2, (modifiable) => {
        modifiable.changedInnerLevel1Mutate = 'changed'
        
        innerPatchState1 = mutate(state1,  (modifiable) => {
          modifiable.changedInnerLevel2Mutate = 'changed'
        })!

      })!
      
    })

    expect(outerPatchState1).toHaveLength(2)
    expect(outerPatchState2).toHaveLength(1)
    expect(innerPatchState1).toHaveLength(0)

  })
})