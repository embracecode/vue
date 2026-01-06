import { isObject, isString, ShapeFlags } from "@vue/shared"

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export function isVnode(vnode) {
    return vnode && vnode.__v_isVnode
}
export function isSameVnode(vnode1, vnode2) {
    return vnode1.type === vnode2.type && vnode1.key === vnode2.key
}

export function createVnode(type, props, children?) {
    const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 组件
    : 0
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        key: props?.key, // diff算法需要的key
        el: null, // 虚拟节点对于的真是元素
        shapeFlag
    }
    if (children) {
        if(Array.isArray(children)) {
            vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
        } else if(isObject(children)){
            vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN // 组件的孩子
        } else {
            children = String(children)
            vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
        }
    }
    return vnode
}