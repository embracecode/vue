import { isArray, isFunction, isObject, isString, ShapeFlags } from "@vue/shared"
import { isTeleport } from "./component/teleport"


export function isVNode(vnode: any) {
    return vnode && vnode.__v_isVNode
}

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function isSameVnode(vnode1: any, vnode2: any) { 
    return vnode1.type === vnode2.type && vnode1.key === vnode2.key
}

export function createVNode(type: any, props: any, children?: any, patchFlag?) { 
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
        patchFlag,
    } 


    // 靶向更新
    if (currentBlock && patchFlag > 0) {
        currentBlock.push(vnode)
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

let currentBlock = null
export function openBlock(block) { 
    currentBlock = []
}

export function closeBlock() { 
    currentBlock = null
}

export function setupBlock(vnode) { 
    vnode.dynamicChildren = currentBlock // 当前elementBlock 会收集子节点 用当前的block收集
    closeBlock()
    return vnode
}

// block 有收集虚拟节点的功能
export function createElementBlock(type, props, children, patchFlag?) { 

    const vnode = createVNode(type, props, children, patchFlag)


    return setupBlock(vnode)
}

export function toDisplayString(value) {
    return isString(value)
        ? value : value == null
            ? '' : isObject(value)
                ? JSON.stringify(value) : String(value)
}

export { createVNode as createElementVnode }