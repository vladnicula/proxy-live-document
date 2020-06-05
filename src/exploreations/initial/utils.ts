import isEqual from "lodash.isequal";

export const isObject = (obj: unknown) =>
  typeof obj === "object" && obj !== null;

export const deepDiff = <T, K>(
  source: T,
  target: K
) => {
  if (isEqual(source, target)) {
    return null;
  }

  if (isObject(source) && isObject(target)) {

    const targetChanges = Object.keys(target as Record<string, unknown>).reduce(
      (acc: Record<string, unknown>, key: string) => {
        const sourceValue = (source as Record<string, unknown>)[key];
        const targetValue = (target as Record<string, unknown>)[key];
        const changes = deepDiff(sourceValue, targetValue)

        if ( changes ) {
          console.log(key, changes)
          acc[key] = changes
        }

        return acc;
      },

      {}
    );

    Object.keys(source as Record<string, unknown>).reduce(
      (acc: Record<string, unknown>, key: string) => {
        const sourceValue = (source as Record<string, unknown>)[key];
        const targetValue = (target as Record<string, unknown>)[key];

        if (sourceValue && !targetValue) {
          acc[key] = {
            old: sourceValue,
            new: undefined
          };
        }

        return acc;
      },

      targetChanges
    );

    if ( Object.keys(targetChanges).length ) {
      return targetChanges;
    }
    return null
  }

  return {
    old: source,
    new: target
  }
};

export type DirtyPathMap = Record<string, unknown>;

export const recursiveDiff = <T extends Record<string, unknown>>(
  diffPaths: DirtyPathMap,
  document: T,
  changable: T,
  applyChanges: boolean = true
) => {
  return Object.keys(diffPaths).reduce((acc: Record<string, unknown>, key) => {
    if (diffPaths[key] === true) {
      const changes =  deepDiff(document[key], changable[key])
      if ( !changes ) {
        return acc
      }
      acc[key] = changes
      
      if (applyChanges) {
        document[key] = changable[key];
      }
    } else {
      const subObject = document[key];
      if (typeof subObject === "object" && subObject !== null) {
        acc[key] = recursiveDiff(
          diffPaths[key] as Record<string, unknown>,
          subObject as Record<string, unknown>,
          changable[key] as Record<string, unknown>,
          applyChanges
        );
      }
    }

    return acc;
  }, {});
};


export const proxyWrite = <T extends Record<string, unknown>>(
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

    // has: (entity, prop) => {
    //   const propAsString = prop.toString()
    //   const childValue = cache[propAsString]; 
    //   return !!childValue || prop in entity
    // },

    get: (entity, prop) => {
      /**
       * Symbols get passed on the entity. Not sure if ideal but ok for now.
       */
      if (typeof prop === "symbol") {
        return Reflect.get(entity, prop);
      }
      const entityValue = entity[prop];
      const propAsString = prop.toString();

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
