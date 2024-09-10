import { ShapeFlags } from "@vue/shared"
import { isSameVnode, Text } from "./createVnode"
import { getSequence } from "./seq"

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

    const mountElement = (vnode, container, anchor) => {
        
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
            mountChildren(children, el)
        } 
        // 将真实节点插入到容器中
        hostInsert(el, container, anchor)

        return el
    }
    // 处理元素
    const processElement = (oldVnode, newVnode, container, anchor) => { 
        // 第一次做一个初始化操作
        if (oldVnode == null) {

            mountElement(newVnode, container, anchor)
        } else {
            // 是相同节点 比较两个元素的属性
            patchElement(oldVnode, newVnode, container)
            
        }
    }


    // 处理文本
    const processText = (oldVnode, newVnode, container) => { 
        if (oldVnode == null) {
            // 虚拟节点关联真实节点 将真实节点插入到元素中
            hostInsert(newVnode.el = hostCreateText(newVnode.children), container)
        } else {
            const el = (newVnode.el = oldVnode.el) 
            if (oldVnode.children !== newVnode.children) { 
                hostSetText(el, newVnode.children)
            }
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
    // vue3 中分为两种 一个是全量diff(递归dff)  一个是快速diss（靶向更新）
    const patchKeyedChildren = (oldChildren, newChildren, el) => { 
        // 1. 减少比对范围 先头和头对比比完之后，在尾部和尾部对比 确定不一样的范围
        // 2. 头头比对和尾尾比对， 有新增的或者删除的 直接操作即可
        // [a, b, c]
        // [a, b, d, e]
        let i = 0
        let oldend = oldChildren.length - 1
        let newend = newChildren.length - 1
        // 从前往后比
        while (i <= oldend && i <= newend) { 
            const oldChild = oldChildren[i]
            const newChild = newChildren[i]
            if (isSameVnode(oldChild, newChild)) { // 相同节点 比较属性和子节点(递归比较子节点)
                patch(oldChild, newChild, el)
            } else {
                break
            }
            i++
        }
        // oldend到c的位置终止 newend到e的位置终止2 3 2
        console.log('oldend', oldend, 'newend', newend, 'i', i);

        // [a, b, c]
        // [d, e, b, c]
        // 从后往前比
        while (i <= oldend && i <= newend) { 
            const oldChild = oldChildren[oldend]
            const newChild = newChildren[newend]
            if (isSameVnode(oldChild, newChild)) { // 相同节点 比较属性和子节点(递归比较子节点)
                patch(oldChild, newChild, el)
            } else {
                break
            }
            
            oldend--
            newend--
        }
        // oldend到c的位置终止 newend到e的位置终止 0 1 0

        // 处理增加和删除的特殊情况 删除 [a,b,c] [a,b]        [c,a,b] [a, b]
        // 增加  [a,b] [a,b,c]   [a,b] [c,a,b] 
        
        // 最终比对乱序情况
        
        
        // [a, b] [a, b, c]   i=2  oldend=1 newend=2  i>oldend && i <=newend
        // [a, b] [c, a, b]   i=0 oldend=-1 newend=0  i>oldend && i <=newend
        
        if (i > oldend) { // 新的多
            if (i <= newend) {// 有插入的部分
                let nextElPos = newend + 1 // 找到插入位置 
                let anchor = newChildren[nextElPos]?.el
                while (i <= newend ) {
                    patch(null, newChildren[i], el, anchor)
                    i++
                }
            }
        } else if (i > newend) {
            // 老的多
            // [a,b,c,d,e] [a,b,c,d]  i=4 oldend=4 newend=3 i<=oldend && i>newend
            // [c,a,b]   [a,b]  i=0 oldend = 0 newend = -1 i<=oldend && i>newend
            while (i <= oldend) { 
                // 删除掉老的节点
                unmount(oldChildren[i])
                i++
            }

        } else {
            // 特殊方式进行处理乱序比对
            let oldStart = i
            let newStart = i

            const keytoNewIndexMap = new Map() // 以新的节点为准做一个映射表 看老的节点在新的里面是否有 有则复用 没有删除
            let toBePatched = newend - newStart + 1 // 要插入的元素数量
            let newIndexToOldIndexMap = new Array(toBePatched).fill(0) // 新索引到老索引的映射表 [4,2,3,0]
            // 根据[4,2,3,0] 求出最长递增子序列的索引 [1, 2]


            // 遍历新的做一个映射表
            for (i = newStart; i <= newend; i++) {
                const newChild = newChildren[i]
                keytoNewIndexMap.set(newChild.key, i)
            }
            console.log(keytoNewIndexMap, 'keytoNewIndexMap');
            // 遍历老的节点在新的里面是否有 有则复用 没有删除
            for (i = oldStart; i <= oldend; i++) {
                const oldChild = oldChildren[i]
                const newIndex = keytoNewIndexMap.get(oldChild.key)
                if (newIndex) { // 复用
                    // i 可能是0 的情况 为了保证0 是没比对过的元素 直接加1
                    newIndexToOldIndexMap[newIndex - newStart] = i + 1 // 避免歧义
                    patch(oldChild, newChildren[newIndex], el)
                    keytoNewIndexMap.delete(oldChild.key)
                } else { // 删除
                    unmount(oldChild)
                }
            }
            
            // 调整顺序
            // 按照新元素的位置 倒序插入insertBefore 通过参照物往前面插入
            // 插入的过程有可能新的元素使老的没有的 需要创建 
            // let toBePatched = newend - newStart + 1 // 要插入的元素数量
            
            
            let increaseingSequence = getSequence(newIndexToOldIndexMap) // 最长递增子序列
            
            // 获取最长递增子序列的最后一项
            let j = increaseingSequence.length - 1


            // 倒序插入
            for (let i = toBePatched - 1; i >= 0; i--) {
                // [a,b,c,d,e,Q,f,g]
                // [a,b,e,c,d,h,f,g]
                let newIndex = i + newStart  // 找最后一个需要更新的节点的位置 获取此节点的下一个节点作为参照物插入
                let anchor = newChildren[newIndex + 1]?.el // 找到插入位置
                // 如果新节点的属性不存在el 则说名该属性是新增元素
                let newVnode = newChildren[newIndex] 
                if (!newVnode.el) {
                    patch(null, newVnode, el, anchor) // 创建新元素
                } else {
                    if (i === increaseingSequence[j]) { // 找到最长递增子序列的最后一项
                        j-- // 往前移动一位 做了diff 算法的优化
                    } else { // 插入到老的元素之前
                        hostInsert(newVnode.el, el, anchor) // 插入到老的元素之前
                    }
                }
            }
        }
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
    const patch = (oldVnode, newVnode, container, anchor = null) => {
        
        // 核心diff算法，将两个虚拟节点进行比较，并更新DOM树
        if (oldVnode == newVnode) return
        // 直接移除老的dom 初始化新的dom
        if (oldVnode && !isSameVnode(oldVnode, newVnode)) {
            unmount(oldVnode)
            oldVnode = null // 会执行后续n2 的初始化操作
        }

        const { type } = newVnode
        switch (type) { 
            case Text:
                processText(oldVnode, newVnode,container)
                
                break
            default:
                processElement(oldVnode, newVnode, container, anchor) // 对元素的处理
                // 文本节点的比较
        }

        

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
        } else {
            // 将虚拟节点渲染为真实节点
            patch(container._vnode || null, vnode, container)

            container._vnode = vnode
        }
    }

    return {
        render
    }
}