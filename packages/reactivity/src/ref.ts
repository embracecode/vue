

import { activeEffect, trackEffect, triggerEffects } from "./effect"
import { toReactive } from "./reactive"
import { createDeps } from "./reactiveEffects"
import { isObject, isRef } from "@vue/shared"



export function ref(value) { 
    return createRef(value)
}

function createRef(value) {
    return new RefImpl(value)
}
 
class RefImpl {
    __v_isRef = true
    _value // 用来保存ref值
    dep // 用与收集effect
    constructor(public rawValue) {
        this._value = toReactive(rawValue)
    }
    
    get value() {

        trackRefValue(this) // 收集依赖
        return this._value
    }
    
    set value(newValue) {
       if (newValue !== this.rawValue) {
           this.rawValue = newValue
           this._value = newValue

           triggerRefValue(this) // 触发依赖
       }
    }
}
export function trackRefValue(ref) {
    if (activeEffect) {
        // 收集依赖
        trackEffect(activeEffect, ref.dep = ref.dep || createDeps(() => ref.dep = null, "Ref"))
    }
}

export function triggerRefValue(ref) {
    let deps = ref.dep
    if (deps) {
        // 触发依赖更新
        triggerEffects(deps)
    }
}


export function toRef(object, key) { 
    return new ObjectRefImpl(object, key)
}

export function toRefs(object) { 
    const result = {}
    for (const key in object) {
        result[key] = toRef(object, key)
    }
    return result
}

class ObjectRefImpl {
    __v_isRef = true
    constructor(public _object, public _key) {
        
    }
    
    get value() {
        return this._object[this._key]
    }
    
    set value(newValue) {
        this._object[this._key] = newValue
    }
}

export function proxyRefs(object) { 
    return new Proxy(object, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)            
            if (isRef(value)) {
                // 在访问的时候做一层代理
                return value.value
            } else if (isObject(value)) {
                return proxyRefs(value)
            } else {
                return value
            }
        },
        set(target, key, value, receiver) {
            const oldValue = target[key]
            if (isRef(oldValue) && !isRef(value)) {
                // 老值是ref 修改值得时候要给.value 赋值
                oldValue.value = value
                return true
            } else {
                return Reflect.set(target, key, value, receiver)
            }
        }
    })
}