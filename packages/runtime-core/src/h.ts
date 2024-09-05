import { isArray, isObject } from "@vue/shared"
import { createVNode, isVNode } from "./createVnode"


export function h(type: any, propsOrChildren?: any, children?: any) { 
    let length = arguments.length
    if (length === 2) {
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            // 属性 或者是虚拟节点
            // h('div', h('a'))
            if (isVNode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren])
            } else {
                // h('div', { id: '1' }) 属性
                return createVNode(type, propsOrChildren)
            }
        }
        // 是数组或者文本
        return createVNode(type, null, propsOrChildren)
    } else {
        if (length > 3) {
            children = Array.from(arguments).slice(2)
        }
        if (length === 3 && isVNode(children)) {
            children = [children]
        }
        //  length ===3 length === 1
    }
    return createVNode(type, propsOrChildren, children)
}



