import { pathMatchesSource } from "."

describe('pathMatchesSource', () => {

  it('should match exact source', () => {
    const source = ['nodes', 'id1', 'styles']
    const target = ['nodes', 'id1', 'styles']

    expect(pathMatchesSource(source, target)).toBeTruthy()
  })

  it('should match any key on certain level with "*"', () => {
    const source = ['nodes', '*', 'styles']
    const target1 = ['nodes', 'id1', 'styles']
    const target2 = ['nodes', 'id2', 'styles']
    const target3 = ['not-nodes', 'id1', 'styles']

    expect(pathMatchesSource(source, target1)).toBeTruthy()
    expect(pathMatchesSource(source, target2)).toBeTruthy()
    expect(pathMatchesSource(source, target3)).toBeFalsy()
  })

  it('should match /nodes/*/styles/**', () => {
    const source = ['nodes', '*', 'styles', '**']
    const target1 = ['nodes', 'id1', 'styles', 'something']
    const target2 = ['nodes', 'id2', 'styles', 'something-else']

    // not good paths
    const target3 = ['not-nodes', 'id1', 'styles', 'not-relevant']
    const target4 = ['nodes', 'id1', 'styles']
    const target5 = ['nodes', 'id1', 'not-styles', 'whatever']

    expect(pathMatchesSource(source, target1)).toBeTruthy()
    expect(pathMatchesSource(source, target2)).toBeTruthy()

    expect(pathMatchesSource(source, target3)).toBeFalsy()
    expect(pathMatchesSource(source, target4)).toBeFalsy()
    expect(pathMatchesSource(source, target5)).toBeFalsy()
  })

  it('should correctly treat un-equal lengths of source and target', () => {
    const source = ['nodes', 'id1', 'styles']
    const target1 = ['nodes', 'id1', 'styles']
    // not good
    const target2 = ['nodes', 'id2', 'styles', 'something-else']

    expect(pathMatchesSource(source, target1)).toBeTruthy()

    expect(pathMatchesSource(source, target2)).toBeFalsy()
  })

  it('should match ** only on subtree, not on self reference change', () => {
    const source = ['nodes', 'id1', 'styles', '**']
    const target1 = ['nodes', 'id1', 'styles', 'oktotrigger']
    // not good, styles should not match styles/**
    const target2 = ['nodes', 'id2', 'styles']

    expect(pathMatchesSource(source, target1)).toBeTruthy()

    expect(pathMatchesSource(source, target2)).toBeFalsy()
  })
})