import { ShapeFlags } from "@vue/shared"

export function createRenderer(renderOptions) {
    // core中 不关心如何渲染

    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling
    } = renderOptions

    const mountChildren = (children, container) => {
        children.forEach(child => {
            patch(null, child, container)
        })
    }
    const mountElement = (vnode, container) => {
        const { type, props, children, shapeFlag } = vnode

        const el = hostCreateElement(type)
        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }
        // 儿子是个文本
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 儿子是个数组
            mountChildren(children, el)
        }
        hostInsert(el, container)
    }
    // 渲染走这里 更新也走这里
    const patch = (oldVnode, newVnode, container) => {
        if (oldVnode == newVnode) {
            // 两个节点渲染同一个元素直接跳过
            return
        }

        if (oldVnode === null) {
            // 初始化操作
            mountElement(newVnode, container)
        }
        
    }

    // 多次调用render 会进行虚拟节点的比较在进行更新
    const render = (vnode, container) => {
        // 虚拟节点变成真是节点
        patch(container._vnode || null, vnode, container)

        container._vnode = vnode
    }
    return {
        render
    }
}