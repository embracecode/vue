


import { reactive } from "@vue/reactivity";
import { isObject } from "@vue/shared";
import { track, trigger } from "./reactiveEffects";
import { ReactiveFlags } from "./constants";




export const mutablesHandler: ProxyHandler<any> = {
    get(target, key, receiver) {

        // 这里判断是否是否被代理过
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        // 当取值的时候， 应该让响应式属性与对应的effect关联起来
        // 依赖收集 todo...
        
        track(target, key);
        
        const res = Reflect.get(target, key,receiver);
        if (isObject(res)) {
            return reactive(res);
        }
        return res;
    },
    set(target, key, value, receiver) {
        const oldValue = target[key];


        let result = Reflect.set(target, key, value, receiver);
        // 表示要触发更新
        if (oldValue !== value) {
            
            trigger(target, key, value, oldValue)
        }

        // 设置值的时候触发设置属性的effect 去重新执行


        return result
    }
};  