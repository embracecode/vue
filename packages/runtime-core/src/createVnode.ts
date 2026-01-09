import { isFunction, isObject, isString, ShapeFlags } from "@vue/shared"
import { isTeleport } from "./compoments/teleport"

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export function isVnode(vnode) {
    return vnode && vnode.__v_isVnode
}
export function isSameVnode(vnode1, vnode2) {
    return vnode1.type === vnode2.type && vnode1.key === vnode2.key
}

export function createVnode(type, props, children?, patchFlag?) {
    const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isTeleport(type)
    ? ShapeFlags.TELEPORT // 传送
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 组件
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT // 函数式组件
    : 0
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        key: props?.key, // diff算法需要的key
        el: null, // 虚拟节点对于的真是元素
        shapeFlag,
        ref: props?.ref,
        patchFlag,
    }
    // 收集动态节点
    if (currentBlock && patchFlag > 0) {
        currentBlock.push(vnode)
    }
    if (children) {
        if(Array.isArray(children)) {
            vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
            for(let i = 0; i < children.length; i++){
                if(typeof children[i] === 'string' || typeof children[i] === 'number'){
                    children[i] = createVnode(Text, null, String(children[i]))
                }
            }
        } else if(isObject(children)){
            vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN // 组件的孩子
        } else {
            children = String(children)
            vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
        }
    }
    return vnode
}
let currentBlock = null
export function openBlock() {
    console.log('openBlock')
    currentBlock = [] // 用于收集动态节点
}

export function closeBlock() {
    currentBlock = null
}

export function setupBlock(vnode) {
    vnode.dynamicChildren = currentBlock // 当前elementblock 会收集子节点 用当前block来收集
    closeBlock()
    return vnode
}
export function toDisplayString(value) {
    return isString(value)
    ? value
    : value == null
    ? ''
    : isObject(value) 
    ? JSON.stringify(value) 
    : String(value)
}

// block 有收集虚拟节点的功能
export function createElementBlock(type, props, children,patchFlag?) {
    const vnode = createVnode(type, props, children,patchFlag)
    return setupBlock(vnode)
}

export { createVnode as createElementVNode }