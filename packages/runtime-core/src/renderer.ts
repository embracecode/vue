import { ShapeFlags } from "@vue/shared"
import { isSameVnode, Text, Fragment } from "./createVnode"
import { getSequence } from "./seq"
import { reactive, ReactiveEffect } from "@vue/reactivity"


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
    const mountElement = (vnode, container, anchor) => {
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
        hostInsert(el, container, anchor)
    }
    const processElement = (oldVnode, newVnode, container, anchor) => {
        if (oldVnode === null) {
            // 初始化操作
            mountElement(newVnode, container, anchor)
        } else {
            // 两个元素一样
            patchElement(oldVnode, newVnode, container,)
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
    // vue3 中分为两种比较  全量diff(递归diff)  快速diff（靶向更新）--》基于模板编译
    // 比较两个儿子的差异
    const patchKeyedChildren = (oldChildVnode, newChildVnode, container) => {
        // 1. 减少比对范围 先从头开始比较 再从尾开始比较 确定不一样的范围
        // 2. 从头比对，再从尾比对 如果有多余的 或者新增的直接操作即可
        let i = 0 // 开始比对的索引
        let e1= oldChildVnode.length - 1 // 第一个数组的尾部索引
        let e2 = newChildVnode.length - 1 // 第二个数组
        // 1. 从头开始比对
        while (i <= e1 && i <= e2) { // 有任何一个超出范围就结束
            const oldChild = oldChildVnode[i]
            const newChild = newChildVnode[i]
            if (isSameVnode(oldChild, newChild)) {
                patch(oldChild, newChild, container) // 更新当前节点的属性和儿子
            } else {
                break
            }
            i++
        }
        // 2. 从尾开始比对
        while (i <= e1 && i <= e2) {
            const oldChild = oldChildVnode[e1]
            const newChild = newChildVnode[e2]
            if (isSameVnode(oldChild, newChild)) {
                patch(oldChild, newChild, container) // 更新当前节点的属性和儿子
            } else {
                break
            }
            e1--
            e2--
        }
        
        // 处理增加和删除的特殊情况
        if (i > e1) { // 说明新的比老的多
            if (i <= e2) { // 有插入的部分
               const nextPos = e2 + 1 // 看一下当前节点的 下一个节点是否存在
               let anchor = newChildVnode[nextPos]?.el // 看看下一个节点是否存在
               while (i <= e2) {
                   patch(null, newChildVnode[i], container, anchor)
                   i++
               }
            }
        } 
        else if (i > e2) { // 老的多新的少
            while (i <= e1) {
                unmount(oldChildVnode[i])
                i++
            }
        // 以上确认不变化的节点并对插入和移除做了处理
        // 后续就是特殊的比对方式了
        } else {
            let s1 = i
            let s2 = i
            // 做一个映射表 用于快速查找， 看老节点是否在新的里面还有， 没有就删除，有就更新
            const keyToNewIndexMap = new Map()
            let toBePatched = e2 - s2 + 1 // 要倒序插入的个数
            // 记录了新节点的位置在老节点的位置索引 根据这个索引求出一个最长递增子序列
            // 然后根据最长地址子序列在倒序插入的时候 如果该序列包含倒序插入的索引 就直接跳过不需要移动
            let newIndexToOldMapIndex = new Array(toBePatched).fill(0)

            for (let i = s2; i <= e2; i++) {
                const vnode = newChildVnode[i]
                keyToNewIndexMap.set(vnode.key, i)
            }
            console.log(keyToNewIndexMap);
            for (let i = s1; i <= e1; i++) {
                const oldVnode = oldChildVnode[i]
                const newIndex = keyToNewIndexMap.get(oldVnode.key) // 通过key找到对应的索引
                if (newIndex == undefined) {// 新的里面找不到老的就删除掉
                    unmount(oldVnode)
                } else {
                    // 有可能 i 等于0 的情况与 newIndexToOldMapIndex为零的情况重复 为了保证0 是没有比对过的元素 直接 i+ 1
                    newIndexToOldMapIndex[newIndex - s2] = i + 1
                    // 比较新老节点的差异 更新属性和儿子
                    patch(oldVnode, newChildVnode[newIndex], container)// 可以复用了 但是位置不对需要调整位置
                }
            }
            // 调整顺序
            // 我们可以按照新的队列 倒序插叙insertbefore 通过参照物往前面插入
            // 插入的过程中可能新的元素多 需要创建
            let increasingSeq = getSequence(newIndexToOldMapIndex)
            let j = increasingSeq.length - 1

            for (let i = toBePatched - 1; i >= 0; i--) {
                const newIndex = s2 + i
                const newVnode = newChildVnode[newIndex]
                const anchor = newChildVnode[newIndex + 1]?.el
                // patch(null, newVnode, container, anchor)
                if (!newVnode.el) { // 表示新增的还未创建真实dom需要创建并插入
                    patch(null, newVnode, container, anchor)
                } else {
                    if (i != increasingSeq[j]) {
                        // 这里是  倒序插入点
                        hostInsert(newVnode.el, container, anchor)
                    } else {
                        j-- // 做了diff算法的优化
                    }
                }
            } // 倒序比对每一个元素做插入操作

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
                    // console.log('diff')
                    patchKeyedChildren(c1, c2, el)
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
    // 处理文本类型
    const processText = (oldVnode, newVnode, container) => {
        if (oldVnode == null) {
            // 初始化操作
            // 1.虚拟节点要关联真实节点
            // 2.将节点插入到容器中
            hostInsert(newVnode.el = hostCreateText(newVnode.children), container)
        } else {
            // 更新操作
            const el = (newVnode.el = oldVnode.el)
            if (newVnode.children !== oldVnode.children) {
                hostSetText(el, newVnode.children)
            }
        }
    }
    // 处理文档碎片
    const processFragment = (oldVnode, newVnode, container) => {
        if (oldVnode == null) {
            // 初始化操作
            mountChildren(newVnode.children, container)
        } else {
            // 更新操作
            patchChildren(oldVnode, newVnode, container)
        }
    }
    // 挂载组件
    const mountComponent = (vnode, container, anchor) => {
        // 组件可以基于自己的状态重新渲染  effect
        const { data = () => {}, render } = vnode.type
        const state = reactive(data()) // 组件的状态
        const instance = {
            state, // 状态
            vnode, // 组件的虚拟节点
            subTree: null, // 组件的子树（组件的渲染内容）
            isMounted: false, // 是否挂载
            update: null // 组件的更新函数
        }
        const componentUpdateFn = () => { // 组件的更新函数
            if (!instance.isMounted) {
                // 要在这里作区分 是第一次初渲染还是第二次更新渲染 如果是更新 需要比对新老节点变化
                const subTree = render.call(state, state)
                patch(null, subTree, container, anchor)
                instance.isMounted = true
                instance.subTree = subTree
            } else {
                // 基于状态的组件更新
                const subTree = render.call(state, state)
                patch(instance.subTree, subTree, container, anchor)
                instance.subTree = subTree
            }
            
        }
        
        const effect = new ReactiveEffect(componentUpdateFn, () => update())

        const update = (instance.update = () => effect.run()) // 更新函数
        update()
    }
    // 处理组件
    const processComponent = (oldVnode, newVnode, container, anchor) => {
        if (oldVnode == null) {
            // 初始化逻辑
            mountComponent(newVnode, container, anchor)
        } else {
            // 更新
            // patchComponent(oldVnode, newVnode)
        }
    }
    // 渲染走这里 更新也走这里
    const patch = (oldVnode, newVnode, container, anchor = null) => {
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

        const { type, shapeFlag } =  newVnode
        switch (type) {
            case Text:
                processText(oldVnode, newVnode, container)
                break
            case Fragment:
                processFragment(oldVnode, newVnode, container)
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    // 对元素处理
                    processElement(oldVnode, newVnode, container, anchor)
                } else if(shapeFlag & ShapeFlags.COMPONENT) {
                    // 对组件的处理 vue3的函数组件（没有性能优势了） 与 状态组件
                    processComponent(oldVnode, newVnode, container, anchor)
                }
        }
        
    }
    const unmount = (vnode) => {
        if (vnode.type === Fragment) {
            unmountChildren(vnode.children)
        } else {
            hostRemove(vnode.el)
        }
    }
    // 多次调用render 会进行虚拟节点的比较在进行更新
    const render = (vnode, container) => {
        if (vnode == null) {
            // 移除当前容器的dom元素
            if (container._vnode) {
                unmount(container._vnode)
            }
        } else {
            // 虚拟节点变成真是节点
            patch(container._vnode || null, vnode, container)

            container._vnode = vnode
        }
    }
    return {
        render
    }
}