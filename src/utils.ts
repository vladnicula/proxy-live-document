import isEqual from "lodash.isequal";

export const isObject = (obj: unknown) =>
  typeof obj === "object" && obj !== null;

export const deepDiff = <T extends unknown, K extends unknown>(
  source: T,
  target: K
) => {
  if (isEqual(source, target)) {
    return {};
  }

  // console.log(`deepDiff`, source, target);

  if (isObject(source) && isObject(target)) {
    const targetChanges = Object.keys(target as Record<string, unknown>).reduce(
      (acc: Record<string, unknown>, key: string) => {
        const sourceValue = (source as Record<string, unknown>)[key];
        const targetValue = (target as Record<string, unknown>)[key];
        if (!isEqual(sourceValue, targetValue)) {
          acc[key] =
            isObject(sourceValue) && isObject(targetValue)
              ? deepDiff(sourceValue, targetValue)
              : targetValue;
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
          acc[key] = undefined;
        }

        return acc;
      },

      targetChanges
    );

    return targetChanges;
  }

  return target;
};
