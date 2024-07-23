import { isObject } from "@vue/shared";
import { mutablesHandler } from "./baseHandler";
import { ReactiveFlags } from "./constants";




const reactiveMap = new WeakMap();

function createReactiveObject(target) {
    // 统一做判断  响应式对象 必须是对象才可以
    if (!isObject(target)) {
        return target;
    }
    // 已经是响应式对象 直接返回
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target;
    }

    const exitsProxy = reactiveMap.get(target);
    // 如果该对象已被代理过直接返回
    if (exitsProxy) {
        return exitsProxy;
    }

    const proxy = new Proxy(target, mutablesHandler);
    // 根据对象缓存代理后的映射 
    reactiveMap.set(target, proxy);
    return proxy;
}

export function reactive(target) { 
    return createReactiveObject(target);
}

// 把对象转换成reactive
export function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
}

export function isReactive(value) {
    return !!(isObject(value) && value[ReactiveFlags.IS_REACTIVE])
}