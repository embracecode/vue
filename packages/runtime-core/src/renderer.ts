import { ShapeFlags } from "@vue/shared"
import { isSameVnode } from "./createVnode"

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
        // 第一次渲染的使用让虚拟节点和要渲染的真实dom 创建关联 vnode.el = el
        // 第二次在渲染的时候 拿新的vnode 和上一次的vnode进行比较，更新对应的el元素 可以后续在服用这个dom元素
        let el = (vnode.el = hostCreateElement(type))

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

    const processElement = (oldVnode, newVnode, container) => { 
        // 第一次做一个初始化操作
        if (oldVnode == null) {

            mountElement(newVnode, container)
        } else {
            // 是相同节点 比较两个元素的属性
            patchElement(oldVnode, newVnode, container)
            
        }
    }

    const patchProps = (oldProps, newProps, el) => {
        // 新属性要全部生效
        for (let key in newProps) { 
            hostPatchProp(el, key, oldProps[key], newProps[key])
        }
        // 老的要删除掉
        for (let key in oldProps) { 
            if (!newProps || !(key in newProps)) { // 以前有的属性 现在么了 需要删除
                hostPatchProp(el, key, oldProps[key], null)
            }
        }
    }

    // 比较两个儿子的差异
    const patchKeyedChildren = (oldChildren, newChildren, el) => { 
        // 1. 减少比对范围 先头和头对比比完之后，在尾部和尾部对比 确定不一样的范围
        // 2. 头头比对和尾尾比对， 有新增的或者删除的 直接操作即可
    }

    const patchChildren = (oldVnode, newVnode, el) => { 
        // text children null  会有三种情况
        const oldChildren = oldVnode.children
        const newChildren = newVnode.children

        const prevShapeFlag = oldVnode.shapeFlag
        const newShapeFlag = newVnode.shapeFlag
       
        // let vnode1 = h('h1',{style: {color: 'red'}}, [h('a', '1'), h('a', 2)])
        // let vnode2 = h('h1',{a: 1}, 'abc')

        // 子元素比较情况

        // 新元素      旧元素      操作方式
        // 文本        数组        删除老儿子，设置文本内容
        // 文本        文本        设置文本即可
        // 文本        空          设置文本即可（与上面一致）
        // 数组        数组        diff算法
        // 数组        文本        清空文本进行挂载
        // 数组        空          进行挂载（与上面类似）
        // 空          数组        删除所有儿子
        // 空          文本        清空文本
        // 空          空          什么都不做

        // 总结会有六种情况
        // 1.新的是文本，老的是数组移除老的
        // 2.新的是文本，老的是文本，内容不相同替换
        // 3.老的是数组，新的是数组，全量diff算法
        // 4.老的是数组，新的不是数组，移除老的子节点
        // 5.老的是文本，新的是空
        // 6.老的是文本，新的是数组，进行挂载

        // 1.新的是文本，老的是数组移除老的
        if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) { // 新的是文本
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 老的是数组
                unmountChildren(oldChildren)
            }

            // 2.新的是文本，老的是文本，内容不相同替换
            if (oldVnode !== newVnode) {
                hostSetElementText(el, newChildren)
            }
        } else {
            // 3.老的是数组，新的是数组，全量diff算法
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 老的是数组
                if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 新的是数组
                    patchKeyedChildren(oldChildren, newChildren, el)
                } else { // 新的不是数组
                    //4.老的是数组，新的不是数组，移除老的子节点
                    unmountChildren(oldChildren)
                }
            } else { 

                // 5.老的是文本，新的是空
                if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) { // 新的是空
                    hostSetElementText(el, '')
                }
                // 6.老的是文本，新的是数组，进行挂载
                if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(newChildren, el)
                }

            }
        }

    }

    

    const patchElement = (oldVnode, newVnode, container) => { 
        // 1.比较元素的差异 需要服用原来的dom
        // 2.比较属性和元素的子节点

        let el = (newVnode.el = oldVnode.el) // 对老dom 元素的复用

        let oldProps = oldVnode.props || {}
        let newProps = newVnode.props || {}
        
        // hostpatchProps 只针对某一个属性 class style event attr
        patchProps(oldProps, newProps, el)

        patchChildren(oldVnode, newVnode, el)
    }

    // 渲染走这里 更新也走这里
    const patch = (oldVnode, newVnode, container) => {
        
        // 核心diff算法，将两个虚拟节点进行比较，并更新DOM树
        if (oldVnode == newVnode) return
        // 直接移除老的dom 初始化新的dom
        if (oldVnode && !isSameVnode(oldVnode, newVnode)) {
            unmount(oldVnode)
            oldVnode = null // 会执行后续n2 的初始化操作
        }
        processElement(oldVnode, newVnode, container) // 对元素的处理
    }

    const unmountChildren = (children) => { 
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            unmount(child)
        }
    }

    const unmount = (vnode) => { 
        hostRemove(vnode.el)
    }

    // 多次调用render 会进行虚拟节点的比较 在进行更新
    const render = (vnode, container) => {
        console.log(container, '**************');
        
        if (vnode == null) { // 要移除当前容器中的dom元素
            if (container._vnode) {
                
                unmount(container._vnode)
            }
        }
        // 将虚拟节点渲染为真实节点
        patch(container._vnode || null, vnode, container)

        container._vnode = vnode
    }

    return {
        render
    }
}