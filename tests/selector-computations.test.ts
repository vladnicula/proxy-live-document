import { describe, it, expect , vi} from 'vitest'
import { mutate, select } from "../src"

// clone deep function
const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj))

const myStateTemplate: {
  nodesById: Record<
    string,
    {
      title: string;
      styles?: Record<string, any>;
    }
  >;
} = {
  nodesById: {
    "1": {
      title: "node without styles",
    },
    "2": {
      title: "node with styles",
      styles: {
        padding: 10,
      },
    },
  },
};

describe('selector reaction to ancestors', () => {
  it('selector does not run when parent is deleted', () => {
    
    const myState = cloneDeep(myStateTemplate)
    
    const callbackSpy = vi.fn()
    select(myState, ["nodesById/2/styles"], () => {
      callbackSpy("nodesById/2/styles selector running");
      // console.log("nodesById/2/styles selector running");
    })
    
    select(myState, ["nodesById/2/*"], () => {
      callbackSpy("nodesById/2/* selector running")
      // console.log("nodesById/2/* selector running")
    })
    
    mutate(myState, (doc) => {
      delete doc.nodesById["2"];
    });

    expect(callbackSpy).toHaveBeenCalledTimes(0)

    mutate(myState, (doc) => {
      doc.nodesById["2"] = {
        title: "node with styles",
        styles: {
          padding: 10,
        },
      }
    })

    expect(callbackSpy).toHaveBeenCalledTimes(0)
  
  })

  it('selector runs when key is deleted and selector listens to all keys', () => {
    const myState = cloneDeep(myStateTemplate)
    
    const callbackSpy = vi.fn()

    select(myState, ["nodesById/*"], () => {
      callbackSpy("nodesById/* selector running")
      // console.log("nodesById/* selector running")
    })

    mutate(myState, (doc) => {
      delete doc.nodesById["2"];
    });

    expect(callbackSpy).toHaveBeenCalledTimes(1)
  })

  it('selector runs when key is deleted and selectors listens to ** ', () => {
    const myState = cloneDeep(myStateTemplate)
    
    const callbackSpy = vi.fn()

    select(myState, ["nodesById/2/styles/padding"], () => {
      callbackSpy("nodesById/2/styles selector running with ancestor reactivity")
    }, { reactToAncestorChanges: true})

    select(myState, ["nodesById/2/styles/padding"], () => {
      callbackSpy("nodesById/2/styles selector running with ancestor reactivity")
    })

    mutate(myState, (doc) => {
      delete doc.nodesById["2"];
    });

    expect(callbackSpy).toHaveBeenCalledTimes(1)
  })

  it('selector runs when key is deleted and selectors listens to ** ', () => {
    const myState = cloneDeep(myStateTemplate)
    
    const callbackSpy = vi.fn()

    select(myState, ["nodesById/2/styles/padding"], () => {
      callbackSpy("nodesById/2/styles selector running with ancestor reactivity")
    }, { reactToAncestorChanges: true})

    select(myState, ["nodesById/1/styles/padding"], () => {
      callbackSpy("nodesById/1/styles selector running with ancestor reactivity")
    }, { reactToAncestorChanges: true})

    select(myState, ["nodesById/2/styles/padding"], () => {
      callbackSpy("nodesById/2/styles selector running with ancestor reactivity")
    })

    mutate(myState, (doc) => {
      delete doc.nodesById["1"];
      delete doc.nodesById["2"];
    });

    expect(callbackSpy).toHaveBeenCalledTimes(2)
  })

})