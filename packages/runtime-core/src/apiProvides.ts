import { currentInstance } from "./component";

export function provide(key, value) {
    if (!currentInstance) return // 建立在组件基础上的
    const parentProvides = currentInstance.parent?.provides // 获取父组件的provides

    let curProvides = currentInstance.provides
    if (parentProvides === curProvides) { 
        // 如果子组件上新增了provides则需要拷贝一份全新的 
        curProvides = currentInstance.provides = Object.create(curProvides) 
    } 

    curProvides[key] = value // 为当前组件的provides添加key-value对\
}


export function inject(key, defaultValue = undefined) { 
    
    if (!currentInstance) return // 建立在组件基础上的
    const parentProvides = currentInstance.parent?.provides // 获取父组件的provides
    
    if (parentProvides && key in parentProvides) { 
        // 如果父组件上有提供的key则返回父组件的提供值 
        return parentProvides[key] 
    } else if (defaultValue !== undefined) { 
        // 如果没有提供则返回默认值 
        return defaultValue 
    } else { 
        // 如果没有提供且没有默认值则报错 
        const name = currentInstance.name 
        console.warn(
            `Injection "${key}" not found`,
            `injection "${key}" not found in ${name ? `component "${name}"` : "current instance"}.`
        ) 
        return 
    }
}