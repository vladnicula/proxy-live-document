import { isObject, deepDiff, proxyWrite, recursiveDiff } from "./utils";
import { executeAndLog } from './perf'

type RecuRecord<T> = Record<string, T> | T;

const addMockNodes = (doc: { nodes: Record<string, unknown> }) => {
  for (let i = 0; i < 10000; i += 1) {
    const id = `id-mock-${i}`;
    doc.nodes[id] = {
      id,
      hierarchy: {
        compId: "string",
        parentId: "string",
        position: "string",
        children: { id2: "true" }
      },
      attrs: {
        src: "image src"
      },
      style: {
        padding: {
          type: "static",
          content: "auto"
        },
        border: {
          type: "static",
          content: "auto"
        },
        height: {
          type: "static",
          content: "auto"
        },
        width: {
          type: "static",
          content: "auto"
        }
      }
    };
  }
};

export const myDocument: RecuRecord<
  RecuRecord<RecuRecord<RecuRecord<RecuRecord<string>>>>
> = {
  title: "Dynamita Impulsiva",
  nodes: {
    id1: {
      hierarchy: {
        compId: "string",
        parentId: "666",
        position: "string",
        children: { id2: "true" }
      },
      attrs: {
        src: "image src"
      },
      style: {
        padding: {
          type: "static",
          content: "auto"
        },
        border: {
          type: "static",
          content: "auto"
        },
        height: {
          type: "static",
          content: "auto"
        },
        width: {
          type: "static",
          content: "auto"
        }
      }
    }
  }
};

addMockNodes(myDocument as any);


const mutate = <T extends Record<string, unknown>>(
  document: T,
  change: <K>(d: K) => void
) => {
  const dirtyPaths = {};
  const changable = proxyWrite(document, dirtyPaths);
  change(changable);
  const diff = recursiveDiff(dirtyPaths, document, changable);
  return diff;
};

const resultAvg = executeAndLog(() => {
  mutate(myDocument, initialState => {
    initialState.nodes.id1.style = {
      ...initialState.nodes.id1.style,
      ceva: {
        content: '656',
        type: 'static'
      },
      padding: {
        content: '32px',
        type: 'static'
      }
    };
  
    Object.assign(initialState.nodes.id1.style, {
      ...initialState.nodes.id1.style,
      ceva: {
        content: '-42',
        type: 'static'
      }
    })
    
    initialState.nodes.id1.style.borderRadius = {
      content: '20',
      type: 'static'
    }
    initialState.nodes.id1.style.width = {
      content: '100%',
      type: 'static'
    };
  
    initialState.nodes.id1.hierarchy = {
      ...initialState.nodes.id1.hierarchy,
      parentId: "newParentId32"
    };
  
    initialState.nodes.id2 = {
      ceva: 22
    };
  
    initialState.nodes.id3 = {
      ceva: 451
    };
  
    initialState.nodes["id-mock-321"].style.padding.content = "32px";
  })
})


console.log(`Call to mutation changes took an average of ${resultAvg} milliseconds. On a document with ${
  Object.keys(myDocument.nodes).length
} nodes`);

// BUG. Changes are not applied in the end on the document DONE

// BUG. Object spread in node hierarchy does not work
// might provide solution: https://stackoverflow.com/questions/43185453/object-assign-and-proxies
// seems to work in browser, not so much in codesandbox. DONE. It was not needed in the end

// BUG. Speading objects does not set all spread keys. They end up missing in the 
// diff implementations. DONE. Was a poor implementation of the object deep diff

// BUG. Object assign of inner objects does not set all spread keys. They end up missing in the 
// dif implementations. Bug was in the recursiveDiff. I was getting a {} empty obj
// from the diff algorithm, and was setting it as the new value. I am now look to see
// if the changes are a empty {} and not registering at chage in the mutations list if
// that is the case.
// Suggestions. Improve this by adding a check in the proxy as well? Can't because
// that requires deep diffing during the execution not at the end.
// DONE. Same bug with diffing algorithm


// const deepDiffResult1 = deepDiff(
//   {
//     style: {
//       border: '1px solid red',
//     }
//   },
//   {
//     style: {
//       border: '1px solid red',
//     }
//   }
// )

// console.log(deepDiffResult1)

// const deepDiffResult2 = deepDiff(
//   {
//     style: {
//       border: '1px solid red',
//       ceva: 22
//     }
//   },
//   {
//     style: {
//       border: '1px solid red',
//       ceva: 33
//     }
//   }
// )

// console.log(deepDiffResult2)