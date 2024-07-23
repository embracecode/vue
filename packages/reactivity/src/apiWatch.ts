import { isFunction, isObject, isRef } from "@vue/shared"
import { ReactiveEffect } from "./effect"
import { isReactive } from "@vue/reactivity"




export function watch(source, cb, options = {} as any) { 
    return doWatch(source, cb, options)
}

export function watchEffect(getter, options = {} as any) { 
    return doWatch(getter, undefined, options)
}

// currentDepth 控制当前对象遍历到了哪一层
function tranverse(source, deep, currentDepth = 0, seen = new Set()) {
    if (!isObject(source)) {
        return source
    }
    if (deep) {
        if (currentDepth >= deep) {
            return source
        }
        currentDepth++ // 根据deep 判断是否是深度
    }
    if (seen.has(source)) {
        return source
    }

    for (let key in source) {
        tranverse(source[key], deep, currentDepth, seen)
    }

    seen.add(source)
    return source
}

function doWatch(source, cb, {deep, immediate}) { 

    const reactiveGetter = (source) => tranverse(source, deep === false ? 1 : undefined)
    // 产生一个可以给reactiveEffect使用的getter 需要对这个对象进行取值操作 取值后会关联当前的reactiveEffect 
    let getter
    if (isReactive(source)) {
        getter = () => reactiveGetter(source)
    } else if (isRef(source)) {
        getter = () => source.value
    } else if (isFunction(source)) { 
        getter = source
    }
    let oldValue

    let clear
    const oncleanup = (fn) => { 
        clear = () => {
            fn()
            clear = undefined
        }
    }
    const job = () => { 
        if (cb) {
            clear && clear() // 在执行回调前 先清除之前的回调
            const newValue = effect.run()
            cb(newValue, oldValue, oncleanup)
            oldValue = newValue
        } else {
            effect.run() // watchEffect 直接执行effect.run
        }
    }
    const effect = new ReactiveEffect(getter, job)
    if (cb) {
        if (immediate) { // 立即先执行一次回调
            job()
        } else {
            oldValue = effect.run()
        }
    } else {
        // watchEffect 
        effect.run()
    }

    const unWatch = () => { 
        effect.stop()
    }

    return unWatch
}