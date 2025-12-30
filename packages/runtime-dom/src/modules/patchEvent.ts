

function createInvoker(value) {
    const invoker = (e) => invoker.value(e)
    invoker.value = value // value就是事件处理函数  修改invoker.value就是修改事件处理函数
    return invoker
}

export default function patchEvent(el, key, value) {
    // 写出来此方法
    const invokers = el._vei || (el._vei = {})
    const eventNames = key.slice(2).toLowerCase()

    const exisitInvoker = invokers[key] // 是否存在同名的事件绑定
    if (exisitInvoker && value) {
        // 事件换绑定
        return exisitInvoker.value = value
    }

    if (value) {
        const invoker = invokers[key] = createInvoker(value)
        return el.addEventListener(eventNames, invoker)
    }
    if (exisitInvoker) {
        // 现在没有 以前有
        el.removeEventListener(eventNames, exisitInvoker)
        invokers[key] = null
    }
}