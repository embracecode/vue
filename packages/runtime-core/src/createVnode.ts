import { isString, ShapeFlags } from "@vue/shared"

export function isVnode(vnode) {
    return vnode && vnode.__v_isVnode
}export function createVnode(type, props, children?) {
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        key: props && props.key, // diff算法需要的key
        el: null, // 虚拟节点对于的真是元素
        shapeFlag
    }
    if (children) {
        if(Array.isArray(children)) {
            vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
        } else {
            children = String(children)
            vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
        }
    }
    return vnode
}