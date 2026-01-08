import { ref } from "@vue/reactivity"
import { h } from "./h"
import { isFunction, isObject } from "@vue/shared"

export function defineAsyncComponent(options) {
    if (isFunction(options)) {
        options = {
            loader: options
        }
    }

    return {
        setup() {
            const { loader, errorComponent, timeout, delay, loadingComponent, onError } = options
            const loaded = ref(false)
            const error = ref(false) // 是否超时
            const loading = ref(false)
            let loadingTimer
            if (delay) {
                loadingTimer = setTimeout(() => {
                    loading.value = true
                }, delay)
            }
            let comp = null

            let index = 0
            function retryLoading() {
                
                return loader().catch((err) => {
                    // 这里我们手动处理异常
                    if (onError) {
                        return new Promise((resolve, reject) => {
                            const retry = () => resolve(retryLoading())
                            const fail = () => reject(err)
                            onError(err, retry, fail, ++index)
                        })
                    } else {
                        throw err // 将错误往后传
                    }
                })
            }

            retryLoading().then((component) => {
                console.log(component.__esModule, component[Symbol.toStringTag], component)
                // 如果component是一个模块
                if (component && (component.__esModule || component[Symbol.toStringTag] === "Module")) {
                    comp = component.default
                } else {
                    comp = component
                }
                loaded.value = true
            }).catch((err) => {
                error.value = err
            }).finally(() => {
                loading.value = false
                // 无论成功失败 都不需要在切换loading
                clearTimeout(loadingTimer)
            })
            if (timeout) {
                let timer = setTimeout(() => {
                    error.value = true
                    clearTimeout(timer)
                    throw new Error('组件加载失败')
                }, timeout)
            }
            const placeHolder = h('div', '')
            return () => {
                //  如果没加载完成 原本是渲染注释节点 这里只是为了看效果
                if (loaded.value) {
                    return h(comp)
                } else if (error.value && errorComponent) {
                    return h(errorComponent)
                } else if (loading.value && loadingComponent) { // 加载中的组件
                    return h(loadingComponent)
                } else {
                    return placeHolder
                }
            }
        }
    }
}