import { ShapeFlags } from "@vue/shared"
import { isSameVnode } from "./createVnode"


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
        // 第一次渲染的时候 让虚拟节点对应的真实节点 创建关联 vnode.el = 真是dom
        // 第二次渲染新的vnode 可以和上一次的vnode进行对比 之后进行对应的el元素 可以后续复用这个元素
        const el = (vnode.el = hostCreateElement(type))
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
    const processElement = (oldVnode, newVnode, container) => {
        if (oldVnode === null) {
            // 初始化操作
            mountElement(newVnode, container)
        } else {
            // 两个元素一样
            patchElement(oldVnode, newVnode, container)
        }
    }
    const patchProps = (oldProps, newProps, el) => {
        // 新的全部生效
        for (const key in newProps) {
            hostPatchProp(el, key, oldProps[key], newProps[key]) 
        }
        // 老的有 新的没有 删除掉老的 
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null)
            }
        }
    }
    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i])
        }
    }
    const patchChildren = (oldVnode, newVnode, el) => {
        // text array null
        const c1 = oldVnode.children
        const c2 = newVnode.children
        const prevShapeFlag = oldVnode.shapeFlag // 之前的shapeFlag
        const shapeFlag = newVnode.shapeFlag // 新的shapeFlag

        // 比较儿子的几种情况
        // 新儿子       旧儿子           操作方式
        // 文本         数组            删除老儿子，设置文本内容
        // 文本         文本            更新文本内容
        // 文本         null            更新文本内容
        // 数组         数组            diff算法
        // 数组         文本            清空文本，进行挂载
        // 数组         null            进行挂载
        // null         数组            删除所有老儿子
        // null         文本            清空文本
        // null         null            无操作

        // 操作的几种类型
        // 1.新的是文本，老的数数组移除老的
        // 2.新的是文本老的也是文本， 内容不相同 直接替换
        // 3.老的是数组，新的也是数组 全量diff算法
        // 4.老的是数组，新的不是数组，移除老的节点
        // 5.老的是文本，新的是空
        // 6.老的是文本，新的是数组
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 1.新的是文本 老的是数组
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                console.log('老的是数组，新的是文本', c1)
                unmountChildren(c1)
            }
            // 2.新的是文本 老的不是数组
            if (c1 !== c2) {
                hostSetElementText(el, c2)
            }
        }
        else {
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 3.老的是数组，新的也是数组 全量diff算法
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 全量diff
                    console.log('diff')
                } else {
                    // 4.老的是数组，新的不是数组，移除老的节点
                    unmountChildren(c1)
                }
            } else {
                if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    // 5.老的是文本，新的是空，移除老的节点
                    hostSetElementText(el, '')
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 6.老的是文本，新的是数组
                    mountChildren(c2, el)
                }
            }
            
        }
    }
    const patchElement = (oldVnode, newVnode, container) => {
        // 1. 比较元素的差异  肯定需要复用dom
        // 2. 比较属性和元素的子节点
        let el = (newVnode.el = oldVnode.el) // 对dom的复用
        let oldProps = oldVnode.props || {}
        let newProps = newVnode.props || {}
        // hostPatchProp 只针对某一个属性处理 class style on attr
        patchProps(oldProps, newProps, el)
        // 比较儿子节点
        patchChildren(oldVnode, newVnode, el)
        // 3. 比较文本
    }
    // 渲染走这里 更新也走这里
    const patch = (oldVnode, newVnode, container) => {
        if (oldVnode == newVnode) {
            // 两个节点渲染同一个元素直接跳过
            return
        }
        // 两个元素不一样 直接移除老的dom 初始化新的dom元素
        if (oldVnode && !isSameVnode(oldVnode, newVnode)) {
            unmount(oldVnode)
            oldVnode = null // 新虚拟节点重新走初始化逻辑
        }
        // 抽离为processElement
        // if (oldVnode === null) {
        //     // 初始化操作
        //     mountElement(newVnode, container)
        // } else {
            
        //     // 两个元素一样
        //     patchElement(oldVnode, newVnode, container)
        // }
        processElement(oldVnode, newVnode, container)
    }
    const unmount = (vnode) => {
        hostRemove(vnode.el)
    }
    // 多次调用render 会进行虚拟节点的比较在进行更新
    const render = (vnode, container) => {
        if (vnode == null) {
            // 移除当前容器的dom元素
            unmount(container._vnode)
        }
        // 虚拟节点变成真是节点
        patch(container._vnode || null, vnode, container)

        container._vnode = vnode
    }
    return {
        render
    }
}