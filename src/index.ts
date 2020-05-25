import { isObject, deepDiff } from "./utils";

type RecuRecord<T> = Record<string, T> | T;

const addMockNodes = (doc: { nodes: Record<string, unknown> }) => {
  for (let i = 0; i < 10; i += 1) {
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
    }
  }
};

addMockNodes(myDocument as any);

type DirtyPathMap = Record<string, unknown>;

const proxyWrite = <T extends Record<string, unknown>>(
  document: T,
  dirty: DirtyPathMap = {},
  path: Array<string> = []
) => {
  const cache: Record<
    string,
    {
      proxy: unknown;
      overwrite: unknown;
    }
  > = {};

  const result = new Proxy(document, {
    get: (entity, prop) => {
      if (typeof prop === "symbol") {
        return Reflect.get(entity, prop);
      }
      const entityValue = entity[prop];
      const propAsString = prop.toString();

      if (typeof entityValue !== "object" || entityValue === null) {
        return Reflect.get(entity, prop);
      }

      let childProxy = cache[propAsString];

      if (!childProxy) {
        const proxyToWrite = isObject(entityValue)
          ? proxyWrite(entityValue as Record<string, unknown>, dirty, [
              ...path,
              propAsString
            ])
          : entityValue;

        cache[propAsString] = {
          proxy: proxyToWrite,
          overwrite: null
        };

        childProxy = cache[propAsString];
      }

      if (childProxy.overwrite) {
        return childProxy.overwrite;
      }

      return childProxy.proxy;
    },

    set: (entity, prop, value) => {
      if (typeof prop === "symbol") {
        return Reflect.set(entity, prop, value);
      }
      const entityValue = entity[prop];
      const propAsString = prop.toString();

      console.log(`set`, prop, value);
      let childProxy = cache[propAsString];
      if (!childProxy) {
        cache[propAsString] = {
          proxy: isObject(entityValue)
            ? proxyWrite(entityValue as Record<string, unknown>, dirty, [
                ...path,
                propAsString
              ])
            : entityValue,
          overwrite: null
        };

        childProxy = cache[propAsString];
      }
      childProxy.overwrite = value;

      let subObject = dirty;
      for (let i = 0; i < path.length; i++) {
        const keyName = path[i];
        subObject[keyName] = subObject[keyName] || {};
        subObject = subObject[keyName] as DirtyPathMap;
      }

      subObject[propAsString] = true;

      return true;
    }
  });

  return result;
};

const recursiveDiff = <T extends Record<string, unknown>>(
  diffPaths: DirtyPathMap,
  document: T,
  changable: T,
  applyChanges: boolean = true
) => {
  return Object.keys(diffPaths).reduce((acc: Record<string, unknown>, key) => {
    if (diffPaths[key] === true) {
      acc[key] = {
        old: document[key],
        new: deepDiff(document[key], changable[key])
      };
      if (applyChanges) {
        document[key] = changable[key];
      }
    } else {
      const subObject = document[key];
      if (typeof subObject === "object" && subObject !== null)
        acc[key] = recursiveDiff(
          diffPaths[key] as Record<string, unknown>,
          subObject as Record<string, unknown>,
          changable[key] as Record<string, unknown>,
          applyChanges
        );
    }

    return acc;
  }, {});
};

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

const t0 = performance.now();

const changes = mutate(myDocument, initialState => {
  // initialState.nodes.id1.style = {
  //   ...initialState.nodes.id1.style,
  //   ceva: 22
  // };
  console.log(`proxy spread`, initialState.nodes.id1.style);
  // initialState.nodes.id1.style.borderRadius = 20;
  // initialState.nodes.id1.style.width = 20;

  // initialState.nodes.id1.hierarchy = {
  //   ...initialState.nodes.id1.hierarchy,
  //   parentId: "newParentId32"
  // };

  // initialState.nodes.id2 = {
  //   ceva: 22
  // };

  // initialState.nodes.id3 = {
  //   ceva: 451
  // };

  // initialState.nodes["id-mock-321"].style.padding.content = "32px";
});

const t1 = performance.now();
console.log(`Call to doSomething took ${t1 - t0} milliseconds.`);

// BUG. Changes are not applied in the end on the document DONE

// BUG. Object spread in node hierarchy does not work
// might provide solution: https://stackoverflow.com/questions/43185453/object-assign-and-proxies
console.log(
  changes,
  `by 'deep diff' in document with ${
    Object.keys(myDocument.nodes).length
  } nodes`
);
