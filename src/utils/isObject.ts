export const isObject = (thing: any): thing is object => {
    return typeof thing === 'object' && thing !== null
}
