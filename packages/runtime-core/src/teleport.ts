import { ShapeFlags } from "@vue/shared";

export const Teleport = {
    __isTeleport: true,
    remove(vnode, unmountChildren) {
        const { shapeFlag, children } = vnode
        
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { 
            unmountChildren(children)
        }
    },
    process(oldVnode, newVnode, container, anchor, parentComponent, internals) {
        let { mountChildren, patchChildren, move } = internals;

        // 初始化
        if (!oldVnode) {
            const target = (newVnode.target = document.querySelector(newVnode.props.to))
            if (!target) {
                console.error(`Target element not found: ${newVnode.props.to}`)
                return
            }
            container = target
            mountChildren(newVnode.children, container, parentComponent)
            return
        } else {
            // 更新
            container = newVnode.target
            patchChildren(oldVnode, newVnode, container, parentComponent)
            // 两次传送的位置不一样
            if (oldVnode.props.to !== newVnode.props.to) { 
                const nextTarget = (newVnode.target = document.querySelector(newVnode.props.to))
                newVnode.children.forEach(child => {
                    move(child, nextTarget, anchor)
                })
            }
        }
    }
}

export const isTeleport = (val: any) => { 
    return !!val && val.__isTeleport === true
}