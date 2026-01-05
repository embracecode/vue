import { reactive } from "@vue/reactivity"
import { hasOwn, isFunction } from "@vue/shared"

export function createComponentInstance (vnode) {
    const instance = {
        data: null, // 状态
        vnode, // 组件的虚拟节点
        subTree: null, // 组件的子树（组件的渲染内容）
        isMounted: false, // 是否挂载
        update: null, // 组件的更新函数
        props: {},
        attrs: {},
        propsOptinos: vnode.type.props, // 用户声明的属性
        component: null,
        proxy: null, // 用来代理组件的state props attrs 方便使用者的访问
    }
    return instance
}
// 初始化属性
const initProps = (instance, rowProps) => {
    const props = {}
    const attrs = {}
    const propsOptions = instance.propsOptinos || {} // 用户在组件中定义的
    if (rowProps) { // rowProps 用户传入的属性但是有可能在组件中未定义
        for (const key in rowProps) {
            if (propsOptions[key]) {
                props[key] = rowProps[key]
            } else {
                attrs[key] = rowProps[key]
            }
        }
    }
    // 源码中用的shallowReactive
    instance.props = reactive(props) // props 不需要深度响应式 组件不允许更改传递过来的属性
    instance.attrs = attrs
}
const publicPropertys = {
    $attrs: (instance) => instance.attrs,
    $slots: (instance) => instance.slots,
    // ...
}
const handlerProps = {
    get(target, key) {
        const { data, props, attrs } = target
        if (data && hasOwn(data, key)) {
            return data[key]
        } else if (props && hasOwn(props, key)) {
            return props[key]
        }
        // 对于一些无法修改的属性 只能去读取 $attrs  $solts
        const getter = publicPropertys[key]
        if (getter) {
            return getter(target)
        }
        
    },
    set(target, key, value) {
        const { data, props, attrs } = target
        if (data && hasOwn(data, key)) {
            data[key] = value
        } else if (props && hasOwn(props, key)) {
            console.warn('props not support set')
            return false
        }
        return true
    }
}
export function setupComponent (instance) { // 给组件实例赋值
    const { vnode } = instance
    // 赋值属性
    initProps(instance, vnode.props)
    // 赋值代理对象 使用户取值方便
    instance.proxy = new Proxy(instance, handlerProps)

    const { data, render } = vnode.type
    if (!isFunction(data)) return console.warn('data must be a function')
    // data 中拿到组件的状态
    instance.data = reactive(data.call(instance.proxy))
    instance.render = render
}