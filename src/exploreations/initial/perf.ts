export const executeAndLog = (execution: Function, times: number = 10000) => {
    let t1 = 0
    let t2 = 0
    let totalTime = 0
    for ( let i = 0; i < times; i += 1 ) {
        t1 = performance.now();
        execution()
        t2 = performance.now()
        totalTime += t2 - t1
    }

    return totalTime / times
}