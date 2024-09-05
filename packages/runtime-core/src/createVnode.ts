import { isArray, isString, ShapeFlags } from "@vue/shared"


export function isVNode(vnode: any) {
    return vnode && vnode.__v_isVNode
}

export function createVNode(type: any, props: any, children?: any) { 
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0 
    const vnode = { 
        type, 
        props, 
        children,  
        key: props?.key,
        __v_isVNode: true, // diff的key
        el: null, // 虚拟节点对应的真实节点
        shapeFlag
    } 
    if (children) {
        if (isArray(children)) {
            vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN  // ( vnode.shapeFlag = vnode.shapeFlage | ShapeFlags.ARRAY_CHILDREN )
        } else {
            children = String(children)
            vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN  // ( vnode.shapeFlag = vnode.shapeFlage | ShapeFlags.TEXT_CHILDREN )
        }
    }

    return vnode
}