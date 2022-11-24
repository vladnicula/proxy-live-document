export function isPromise(p: any): p is Promise<unknown> {
    return (
        p !== null &&
        typeof p === 'object' &&
        typeof p.then === 'function' &&
        typeof p.catch === 'function'
    )
}
