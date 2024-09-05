import { ShapeFlags } from "@vue/shared"

export function createRenderer(renderOptions) {
    // core中不关心如何渲染

    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText, 
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,

    } = renderOptions

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            // child可能是纯文本元素
            patch(null, child, container)
        }
    }

    const mountElement = (vnode, container) => {
        
        // 这里只需要将虚拟节点渲染为真实节点
        const { type, props, children, shapeFlag } = vnode
        console.log(vnode, container, shapeFlag, 'mountElement');
        let el = document.createElement(type)

        // 处理props
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }

        // 处理children

        // 儿子是文本节点
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            console.log('children is array', children);
            
            mountChildren(children, el)
        } 
        // 将真实节点插入到容器中
        hostInsert(el, container)

        return el
    }

    // 渲染走这里 更新也走这里
    const patch = (oldVnode, newVnode, container) => {
        
        // 核心diff算法，将两个虚拟节点进行比较，并更新DOM树
        if (oldVnode == newVnode) return
        

        // 第一次做一个初始化操作
        if (oldVnode == null) {

            mountElement(newVnode, container)
        }


    }

    // 多次调用render 会进行虚拟节点的比较 在进行更新
    const render = (vnode, container) => {
        console.log(vnode, container, 'render');
        // 将虚拟节点渲染为真实节点
        patch(container._vnode || null, vnode, container)

        container._vnode = vnode
    }

    return {
        render
    }
}