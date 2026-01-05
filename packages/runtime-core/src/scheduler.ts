

const queue = [] // 缓存当前要执行的队列

let isFlushing = false
const resolvePromise = Promise.resolve()
// 如果同事在一个组件中更新多个状态 job 肯定是同一个
// 同时开启一个异步任务
export function queueJob(job) {
    if (!queue.includes(job)) { // 去重
        queue.push(job) // 让任务入队
    }
    if (!isFlushing) {
        isFlushing = true
        resolvePromise.then(() => {
            isFlushing = false
            const copy = queue.slice(0) // 拷贝一份 原因： 如果正在执行中任务新增了 可能会死循环
            queue.length = 0
            copy.forEach(job => job())
            copy.length = 0
        })
    }
}
// 通过事件循环的机制用微队列更新