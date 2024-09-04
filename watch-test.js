
// watch onClearUp的测试用例

function getData(timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(timeout)
        }, timeout)
    })
}

let timeout = 3000
watch(refvalue, async (newValue, oldValue, onCleanup) => {
    let flag = true
    timeout -= 1000
    // 注释掉onCleanup的调用 会先1000 在2000  应该是1000之后不变
    onCleanup(() => {
        flag = false
    })
    let r = await getData(timeout)
    
    if (flag) {
        app.innerHTML = r
    }
    
}, {
    flush: 'sync'
})

setTimeout(() => {
    refvalue.value = 'World'
    refvalue.value = 'Vue3'
}, 1000)