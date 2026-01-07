import { currentInstance } from "./component";

export function provide (key, value) {
    //   父组件    子组件  子组件提供的新属性 和父组件没关系
    //   {a: 1}    {a: 1, b: 2}
    if (!currentInstance) return  // provide 的使用 建立在组件之上

    const parentProvide = currentInstance.parent?.provides // 获取父组件的provide
    let selfProvide = currentInstance.provides // 获取自己的provide
    if (parentProvide === selfProvide) { // 如果父组件的provide和自己的provide是同一个对象 就不需要进行provide了
        // 如果在子组件上新增了provides 需要拷贝一份
        selfProvide = currentInstance.provides = Object.create(selfProvide)    
    }
    selfProvide[key] = value
}

export function inject (key, defaultValue) {
    if (!currentInstance) return
    const parentProvide = currentInstance.parent?.provides
    if (parentProvide &&key in parentProvide) {
        return parentProvide[key]  // 直接从父组件上获取
    } else if (defaultValue) {
        if (typeof defaultValue === 'function') {
            return defaultValue()
        }
        return defaultValue
    }
}