export const isObject = (thing: unknown): thing is object => {
  return typeof thing === 'object' && thing !== null
}
