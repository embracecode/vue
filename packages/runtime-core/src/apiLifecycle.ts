import { currentInstance, setCurrentInstance, unSetCurrentInstance } from "./component"

export const enum  LifeCycles {
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u'
}

function createHook(type) {
    return function (hook, target = currentInstance) {
        if (target) {
            // 看当前钩子函数是否存放过
            const hooks = target[type] || (target[type] = [])
            // 解决下述问题  让currentInstance 存储到函数内 在钩子执行前 对实例进行矫正
            const wrapHook = () => {
                setCurrentInstance(target)
                hook.call(target)
                unSetCurrentInstance()
            }

            hooks.push(wrapHook) // 这里有问题  因为setup 执行完之后就会青空实例
        }
    }
}

export const onBeforeMount = createHook(LifeCycles.BEFORE_MOUNT)
export const onMounted = createHook(LifeCycles.MOUNTED)
export const onBeforeUpdate = createHook(LifeCycles.BEFORE_UPDATE)
export const onUpdated = createHook(LifeCycles.UPDATED)

export function invokeLifeCycleHook(fns) {
    for (let i = 0; i < fns.length; i++) {
        fns[i]()
    }
}