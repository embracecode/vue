

const queue = [] // 缓存当前要执行的队列

let isFlushing = false // 是否正在执行队列

const resolvedPromise = Promise.resolve() // 一个 Promise 对象，用于同步执行队列


// 如果同事在用一个组件中更新多个状态 job 肯定是同一个
// 同时开启一个异步任务
export function queueJob(job) { 
    if (!queue.includes(job)) { // 如果队列中不存在该 job，则添加到队列中（去重）
        queue.push(job)
    }
    if (!isFlushing) {
        isFlushing = true
        resolvedPromise.then(() => {
            isFlushing = false
            // 防止在更新过程中有一个任务进入队列 导致死循环
            const copyQueue = queue.slice() // 复制一份队列
            queue.length = 0 // 清空队列
            for (let i = 0; i < copyQueue.length; i++) {
                const job = copyQueue[i]
                job() // 执行队列中的 job
            }
            copyQueue.length = 0 // 清空队列
        })
    }
}


// 通过事件循环的机制完成延迟更新的操作