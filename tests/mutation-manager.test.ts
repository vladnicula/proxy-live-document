import { MutationsManager } from "../src"

const mutationManager = new MutationsManager()

describe('behaviour of mutation manager', () => {

  it('keep references of root objects being mutated', () => {
    const rootA = {}
    const rootB = {}
    mutationManager.startMutation(rootA)
    expect(mutationManager.hasRoot(rootA)).toEqual(true)
    expect(mutationManager.hasRoot(rootB)).toEqual(false)
    mutationManager.commit(rootA)

    expect(mutationManager.hasRoot(rootA)).toEqual(false)
    expect(mutationManager.hasRoot(rootB)).toEqual(false)
    
  })

})