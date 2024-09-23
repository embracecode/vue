import { isArray, isFunction, isObject, isString, ShapeFlags } from "@vue/shared"
import { isTeleport } from "./teleport"


export function isVNode(vnode: any) {
    return vnode && vnode.__v_isVNode
}

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function isSameVnode(vnode1: any, vnode2: any) { 
    return vnode1.type === vnode2.type && vnode1.key === vnode2.key
}

export function createVNode(type: any, props: any, children?: any) { 
    const shapeFlag = isString(type)
        ? ShapeFlags.ELEMENT // 元素节点
        : isTeleport(type) // 传送门节点
        ? ShapeFlags.TELEPORT
        : isObject(type)
        ? ShapeFlags.STATEFUL_COMPONENT // 组件
        : isFunction(type)
        ? ShapeFlags.FUNCTIONAL_COMPONENT  // 函数式组件 
        : 0 
    const vnode = { 
        type, 
        props, 
        children,  
        key: props?.key,
        __v_isVNode: true, // diff的key
        el: null, // 虚拟节点对应的真实节点
        shapeFlag,
        ref: props?.ref,
    } 
    if (children) {
        if (isArray(children)) {
            vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN  // ( vnode.shapeFlag = vnode.shapeFlage | ShapeFlags.ARRAY_CHILDREN )
        } else if (isObject(children)) { // 组件的孩子（插槽）
            vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN  // ( vnode.shapeFlag = vnode.shapeFlage | ShapeFlags.SLOTS_CHILDREN )
        } else {
            children = String(children)
            vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN  // ( vnode.shapeFlag = vnode.shapeFlage | ShapeFlags.TEXT_CHILDREN )
        }
    }

    return vnode
}