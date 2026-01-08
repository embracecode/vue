import { ShapeFlags } from "@vue/shared"
import { nodeOps } from "@vue/runtime-dom"

export const Teleport = {
    __isTeleport: true,
    process: (n1, n2, container, anchor, parentComponent, internals) => {
        const { mountChildren, patchChildren, move } = internals // 移动操作
        if (!n1) {
            const target = (n2.target = document.querySelector(n2.props.to))
            if (target) {
                mountChildren(n2.children, target, parentComponent)
            }
        } else {
            if(n2.props.to) n2.target = document.querySelector(n2.props.to)
            patchChildren(n1, n2, n2.target, parentComponent)
            if (n2.props.to !== n1.props.to) {
                const nextTarget = (n2.target = document.querySelector(n2.props.to))
                n2.children.forEach((c) => move(c, nextTarget, anchor))
            }
        }
    },
    remove(vnode, unmountChildren) { // 移除操作
        const { shapeFlag, children } = vnode
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(children)
        } else {
            nodeOps.remove(vnode.el)
        }
    }
}

export const isTeleport = (value) => {
    return value && value.__isTeleport
}