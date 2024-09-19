import { proxyRefs, reactive } from "@vue/reactivity"
import { hasOwn, isFunction, ShapeFlags } from "@vue/shared"


export function createComponentInstance(vnode, parentComponent) {
    // debugger
    // 创建一个组件的实例  用来判断是第一次渲染还是更新渲染
    const componentInstance = {
        data: null, // 组件的状态
        vnode, // 组件的虚拟节点
        subTree: null, // 组件的子树
        isMounted: false, // 组件是否已经挂载
        update: null, // 组件的更新函数
        props: {}, // 组件用defineProps声明的属性
        attrs: {}, // 组件的属性
        slots: {}, // 组件的插槽
        emit: () => { }, // 组件的事件
        propsOptions: vnode.type.props, // 用户声明组件的props
        component: null, // 组件的实例
        proxy: null, //代理对象 让用户方便访问 propx attrs data等
        setupState: {}, // 组件的setup返回值
        exposed: null, // 组件的暴露出去的属性
        parent: parentComponent, // 组件的父组件
        // 所有的provide 都一样
        provides: parentComponent ? parentComponent.provides : Object.create(null),
        // inject: parentComponent ? parentComponent.inject : Object.create(null),
    }
    return componentInstance
}

// 初始化组件的props 传入 实例 和 所有属性
const initProps = (componentInstance, rawProps) => { 
    const props = {}
    const attrs = {}
    const propsOptions = componentInstance.propsOptions || {} // 用户在组件中定义的
    if (rawProps) {
        for (let key in rawProps) {
            const value = rawProps[key]
            if (key in propsOptions) {
                props[key] = value 
            } else {
                attrs[key] = value
            }
        }
    }
    componentInstance.props = reactive(props) // props不需要深度响应  源码中是shallowReactive 因为组件不能更改属性值
    componentInstance.attrs = attrs
}

const initSlots = (instance, children) => { 
    if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        instance.slots = children
    } else {
        instance.slots = {}
    }
}

const publicProperty = {
    $attrs: (instance) => instance.attrs,
    $slots: (instance) => instance.slots,
    //...
}

const handler = {
    get(target, key) {
        const { data, props, setupState } = target
        if (data && hasOwn(data, key)) {
            return data[key]
        } else if (props && hasOwn(props, key)) {
            return props[key]
        } else if (setupState && hasOwn(setupState, key)) {
            return setupState[key]
        }
        const getter = publicProperty[key]
        if (getter) {
            return getter(target)
        }
    },
    set(target, key, value) { 
        const { data, props, setupState } = target
        if (data && hasOwn(data, key)) {
            data[key] = value
        } else if (props && hasOwn(props, key)) {
            // 可以修改属性中的嵌套属性 内部不会报错 但是不合法
            // props[key] = value
            console.warn(`props is readonly.`)
            return false
        } else if (setupState && hasOwn(setupState, key)) {
            setupState[key] = value
        }
        return true
    },
}

export function setupComponent(instance) { 
    const { vnode } = instance
    // 赋值属性
    initProps(instance, vnode.props)
    // 赋值插槽
    initSlots(instance, vnode.children)
    // 赋值代理对象
    instance.proxy = new Proxy(instance, handler)

    const { data, render, setup } = vnode.type

    instance.render = render // 组件的渲染函数
    if (setup) {
        const setupContext = {
            attrs: instance.attrs,
            // props: instance.props,
            emit(event, ...args) {
                const EventName = `on${event[0].toUpperCase()}${event.slice(1)}`
                const handler = instance.vnode.props[EventName]
                handler && handler(...args)
            },
            slots: instance.slots,
            expose(value) {
                instance.exposed = value
            }
        }
        setCurrentInstance(instance) // 设置当前实例
        const setupResult = setup(instance.proxy, setupContext)
        unsetCurrentInstance() // 解除当前实例

        if (isFunction(setupResult)) { 
            instance.render = setupResult // 组件的渲染函数
        } else {
            instance.setupState = proxyRefs(setupResult) // 将返回的值做脱ref
        }
    }

    // optionsAPi
    if (data) {
        if (!isFunction(data)) {
            console.warn(`data function is not supported.`)
            return
        } else {
            instance.data = reactive(data.call(instance.proxy)) // 组件的状态  响应式数据
        }
    }   
}

export let currentInstance = null

export const getCurrentInstance = () => currentInstance

export const setCurrentInstance = (instance) => {
    currentInstance = instance
}

export const unsetCurrentInstance = () => {
    currentInstance = null
}