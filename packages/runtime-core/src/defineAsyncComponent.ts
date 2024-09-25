import { ref } from "@vue/reactivity"
import { h } from "@vue/runtime-dom"
import { isFunction } from "@vue/shared"


// 可以是对象 可以是函数
export function defineAsyncComponent(options) { 

    if (isFunction(options)) {
        options = { loader: options }
    }

    return {
        setup() {
            const { loader, errorComponent, timeout, delay, loadingComponent, onError } = options
            const loaded = ref(false)

            const loading = ref(false)

            const error = ref(false)

            let lodingTimer = null
            if (delay) {
                lodingTimer = setTimeout(() => {
                    loading.value = true
                }, delay)
            }
            
            let attempts = 0
            function loadFunc() {
                return loader().catch(err => {
                    // 这里手动处理异常
                    if (onError) { 
                        return new Promise((resolve, reject) => {
                            const retry = () => resolve(loadFunc())
                            const fail = () => reject(err)
                            onError(err, retry, fail, ++attempts)
                        })
                    } else {
                        throw err // 将错误继续传递
                     }
                })
            }


            let Comp = null
            loadFunc().then(component => {
                Comp = component
                loaded.value = true
            }).catch((err) => { 
                error.value = err
                console.log(error.value);
                
            }).finally(() => {
                loading.value = false

                // 无论组件加载成功失败 都不需要在切换成loading状态
                if (lodingTimer) {
                    clearTimeout(lodingTimer)
                    lodingTimer = null
                }
            })

            if (timeout) {
                setTimeout(() => {
                    if (!loaded.value) {
                        error.value = `Timeout of ${timeout}ms exceeded.`
                        throw new Error(error.value)
                    }
                }, timeout)
            }

            const placeholder = h('div')
            return () => { 
                // 应该在组件没渲染完成的时候 渲染个注释节点站位  没写生成注释节点的函数
                if (loaded.value) {
                    return h(Comp)
                } else if (error.value && errorComponent) { 
                    return h(errorComponent)
                } else if (loading.value && loadingComponent)  {
                    return h(loadingComponent)
                } else {
                    return placeholder
                }
            }
        }
    }
}