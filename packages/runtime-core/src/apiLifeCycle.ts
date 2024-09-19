import { currentInstance, setCurrentInstance, unsetCurrentInstance } from "./component";

export const enum LifeCycles { 
    BEFORE_MOUNT = 'bm', 
    MOUNTED ='m', 
    BEFORE_UPDATE = 'bu', 
    UPDATED = 'u', 
}

function createHooks(lifeCycle: LifeCycles) { 
    return (hook: Function, target = currentInstance) => { 
        if (target) { 
            //当前钩子是在组件中运行的


            // 看当前钩子是否已经存在，不存在则创建数组 { bm: [hook1, hook2], m: [hook3], bu: [hook4], u: [hook5] }
            const hooks = target[lifeCycle] || (target[lifeCycle] = [])



            const wrapHook = () => { 
                // 在钩子执行前把当前实例设置回去
                setCurrentInstance(target) // 设置当前实例
                hook.call(target) // 执行钩子函数
                unsetCurrentInstance() // 重置当前实例
            }
            hooks.push(wrapHook) // 这里会有问题 因为setup 执行完之后 会吧instanace清空
        }
    }
}

export const onBeforeMount = createHooks(LifeCycles.BEFORE_MOUNT)
export const onMounted = createHooks(LifeCycles.MOUNTED)
export const onBeforeUpdate = createHooks(LifeCycles.BEFORE_UPDATE)
export const onUpdated = createHooks(LifeCycles.UPDATED)

export const invokerLifeCycle = (lifeCycle) => { 
    for (let i = 0; i < lifeCycle.length; i++) {
        lifeCycle[i]()
    }
}