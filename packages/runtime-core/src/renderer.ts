import { ShapeFlags, hasOwn, isRef } from "@vue/shared"
import { isSameVnode, Text, Fragment, createVnode } from "./createVnode"
import { getSequence } from "./seq"
import { reactive, ReactiveEffect } from "@vue/reactivity"
import { queueJob } from "./scheduler"
import { createComponentInstance, setupComponent } from "./component"
import { invokeLifeCycleHook } from "./apiLifecycle"
import { isKeepAlive } from "./compoments/keepalive"


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
    
    const mountChildren = (children, container, parentComponent) => {
        for (let i = 0; i < children.length; i++) {
            patch(null, children[i], container, null, parentComponent)
        }
    }
    const mountElement = (vnode, container, anchor, parentComponent) => {
        const { type, props, children, shapeFlag, transition } = vnode
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
            mountChildren(children, el, parentComponent)
        }

        if (transition) {
            transition.beforeEnter(el)
        }

        hostInsert(el, container, anchor)

        if (transition) {
            transition.enter(el)
        }
    }
    const processElement = (oldVnode, newVnode, container, anchor, parentComponent) => {
        if (oldVnode === null) {
            // 初始化操作
            mountElement(newVnode, container, anchor, parentComponent)
        } else {
            // 两个元素一样
            patchElement(oldVnode, newVnode, container, parentComponent)
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
    const unmountChildren = (children, parentComponent) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i], parentComponent)
        }
    }
    // vue3 中分为两种比较  全量diff(递归diff)  快速diff（靶向更新）--》基于模板编译
    // 比较两个儿子的差异
    const patchKeyedChildren = (oldChildVnode, newChildVnode, container, parentComponent) => {
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
                unmount(oldChildVnode[i], parentComponent)
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
            for (let i = s1; i <= e1; i++) {
                const oldVnode = oldChildVnode[i]
                const newIndex = keyToNewIndexMap.get(oldVnode.key) // 通过key找到对应的索引
                if (newIndex == undefined) {// 新的里面找不到老的就删除掉
                    unmount(oldVnode, parentComponent)
                } else {
                    // 有可能 i 等于0 的情况与 newIndexToOldMapIndex为零的情况重复 为了保证0 是没有比对过的元素 直接 i+ 1
                    newIndexToOldMapIndex[newIndex - s2] = i + 1
                    // 比较新老节点的差异 更新属性和儿子
                    console.log(oldVnode, newChildVnode[newIndex], '-----');
                    patch(oldVnode, newChildVnode[newIndex], container, parentComponent)// 可以复用了 但是位置不对需要调整位置
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
                    patch(null, newVnode, container, anchor, parentComponent)
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
    const patchChildren = (oldVnode, newVnode, el, parentComponent) => {
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
                unmountChildren(c1, parentComponent)
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
                    patchKeyedChildren(c1, c2, el, parentComponent)
                } else {
                    // 4.老的是数组，新的不是数组，移除老的节点
                    unmountChildren(c1, parentComponent)
                }
            } else {
                if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    // 5.老的是文本，新的是空，移除老的节点
                    hostSetElementText(el, '')
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 6.老的是文本，新的是数组
                    mountChildren(c2, el, parentComponent)
                }
            }
            
        }
    }
    const patchElement = (oldVnode, newVnode, container, parentComponent) => {
        // 1. 比较元素的差异  肯定需要复用dom
        // 2. 比较属性和元素的子节点
        let el = (newVnode.el = oldVnode.el) // 对dom的复用
        let oldProps = oldVnode.props || {}
        let newProps = newVnode.props || {}
        // hostPatchProp 只针对某一个属性处理 class style on attr
        patchProps(oldProps, newProps, el)
        // 比较儿子节点
        patchChildren(oldVnode, newVnode, el, parentComponent)
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
    const processFragment = (oldVnode, newVnode, container, parentComponent) => {
        if (oldVnode == null) {
            // 初始化操作
            mountChildren(newVnode.children, container, parentComponent)
        } else {
            // 更新操作
            patchChildren(oldVnode, newVnode, container, parentComponent)
        }
    }
    const updateComponentPreRender = (instance, next) => {
        instance.next = {}
        instance.vnode = next
        updateProps(instance, instance.props, next.props || {})
        // 组件更新的时候需要更新插槽
        Object.assign(instance.slots, next.children)
    }

    function renderComponent(instance) {
        const { render, vnode, proxy, attrs, slots } = instance
        if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            return render.call(proxy, proxy)
        } else {
            // 函数组件  在vue3 中没有性能优化 也不推荐使用函数式组件
            return vnode.type(attrs, { slots })
        }

    }
    const setupRenderEffect = (instance, container, anchor, parentComponent) => {
        const { render } = instance
        const componentUpdateFn = () => { // 组件的更新函数
            const { bm, m } = instance
            if (!instance.isMounted) {
                if (bm) {
                    invokeLifeCycleHook(bm)
                }
                // 要在这里作区分 是第一次初渲染还是第二次更新渲染 如果是更新 需要比对新老节点变化
                // 这里render不仅仅是组件的data 也要包含组件的props attrs
                // const subTree = render.call(instance.proxy, instance.proxy)
                const subTree = renderComponent(instance)

                patch(null, subTree, container, anchor, instance)
                instance.isMounted = true
                instance.subTree = subTree

                if (m) {
                    invokeLifeCycleHook(m)
                }
            } else {
                // 基于状态的组件更新
                const { next, bu, u } = instance
                if (next) { // 属性或者插槽有更新 
                    // 更新组件在渲染之前
                    updateComponentPreRender(instance, next)
                }
                if (bu) {
                    invokeLifeCycleHook(bu)
                }
                // 要在这里作区分 是第一次初渲染还是第二次更新渲染 如果是更新 需要比对新老节点变化
                // const subTree = render.call(instance.proxy, instance.proxy)
                const subTree = renderComponent(instance)
                patch(instance.subTree, subTree, container, anchor, instance)
                instance.subTree = subTree

                if (u) {
                    invokeLifeCycleHook(u)
                }
            }
            
        }
        
        const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))

        const update = (instance.update = () => effect.run()) // 更新函数
        update()
    }
    // 挂载组件
    const mountComponent = (vnode, container, anchor, parentComponent) => {

        // 1.先创建组件实例
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent))
        
        if(isKeepAlive(vnode)) {
            instance.ctx.renderer = {
                createElement: hostCreateElement, // 内部需要创建一个div 缓存dom
                move(vnode, container, anchor) { // 需要把之前的dom 放入到容器中
                    hostInsert(vnode.component.subTree.el, container, anchor)
                },
                unmount, // 如果组件切换了 需要将容器中的元素移除
            }
        }
        
        // 2.给实例属性赋值
        setupComponent(instance)
        // 3.创建effect函数
        setupRenderEffect(instance, container, anchor, parentComponent)


        // 把下面的步骤抽离为上述内容

        // 组件可以基于自己的状态重新渲染  effect
        // const { data = () => {}, render, props: propsOptinos = {} } = vnode.type
        // const state = reactive(data()) // 组件的状态
        // const instance = {
        //     state, // 状态
        //     vnode, // 组件的虚拟节点
        //     subTree: null, // 组件的子树（组件的渲染内容）
        //     isMounted: false, // 是否挂载
        //     update: null, // 组件的更新函数
        //     props: {},
        //     attrs: {},
        //     propsOptinos,
        //     component: null,
        //     proxy: null, // 用来代理组件的state props attrs 方便使用者的访问
        // }
        // // 更具propsOptions 来区分处props 和 attrs
        // vnode.component = instance
        // 元素的更新  newVnode.el = oldVnode.el
        // 组件的更新  newVnode.component.subTree.el = oldVnode.component.subTree.el


        // initProps(instance, vnode.props)
        // const publicPropertys = {
        //     $attrs: (instance) => instance.attrs,
        //     $slots: (instance) => instance.slots,
        //     // ...
        // }
        // instance.proxy = new Proxy(instance, {
        //     get(target, key) {
        //         const { state, props, attrs } = target
        //         if (state && hasOwn(state, key)) {
        //             return state[key]
        //         } else if (props && hasOwn(props, key)) {
        //             return props[key]
        //         }
        //         // 对于一些无法修改的属性 只能去读取 $attrs  $solts
        //         const getter = publicPropertys[key]
        //         if (getter) {
        //             return getter(target)
        //         }
                
        //     },
        //     set(target, key, value) {
        //         const { state, props, attrs } = target
        //         if (state && hasOwn(state, key)) {
        //             state[key] = value
        //         } else if (props && hasOwn(props, key)) {
        //             console.warn('props not support set')
        //             return false
        //         }
        //         return true
        //     }
        // })


        // const componentUpdateFn = () => { // 组件的更新函数
        //     if (!instance.isMounted) {
        //         // 要在这里作区分 是第一次初渲染还是第二次更新渲染 如果是更新 需要比对新老节点变化
        //         // 这里render不仅仅是组件的data 也要包含组件的props attrs
        //         const subTree = render.call(instance.proxy, instance.proxy)
        //         patch(null, subTree, container, anchor)
        //         instance.isMounted = true
        //         instance.subTree = subTree
        //     } else {
        //         // 基于状态的组件更新
        //         const subTree = render.call(instance.proxy, instance.proxy)
        //         patch(instance.subTree, subTree, container, anchor)
        //         instance.subTree = subTree
        //     }
            
        // }
        
        // const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))

        // const update = (instance.update = () => effect.run()) // 更新函数
        // update()
    }

    const hasPropsChange = (preProps, nextProps) => {
        const oldKey = Object.keys(preProps)
        if (oldKey.length !== Object.keys(nextProps).length) {
            return true
        }
        for (let i = 0; i < oldKey.length; i++) {
            const key = oldKey[i]
            if (preProps[key] !== nextProps[key]) {
                return true
            }
        }
        return false
    }
    // 组件属性更新 重新渲染逻辑
    const updateProps = (instance, preProps, nextProps) => {
        if (hasPropsChange(preProps, nextProps || {})) { // 看属性是否存在变化
            for (const key in nextProps) {
                // 用新的覆盖所有老的
                instance.props[key] = nextProps[key]
            }
            for (const key in instance.props) {
                // 删除老的多余的
                if (!(key in nextProps)) {
                    delete instance.props[key]
                }
            }
        }
    }
    const shouldComponentUpdate = (oldVnode, newVnode) => {
        const { props: preProps, children: preChildren} = oldVnode
        const { props: nextProps, children: nextChildren} = newVnode
        if (preChildren || nextChildren) { // 如果有插槽直接渲染
            return true
        }
        if (preProps === nextProps) {
            return false
        }
        // 如果属性不一致则更新组件
        return hasPropsChange(preProps, nextProps || {})
        // updateProps(instance,preProps, nextProps)
    }
    const upDateComponent = (oldVnode, newVnode) => {
        const instance = (newVnode.component = oldVnode.component) // 复用组件的实例
        // const { props: preProps} = oldVnode
        // const { props: nextProps} = newVnode
        // updateProps(instance,preProps, nextProps )
        // 属性更新和状态更新放在一块 更容易管理 而不是像上述内容内容更新属性写一个更新组件写一个
        if(shouldComponentUpdate(oldVnode, newVnode)){
            instance.next = newVnode // 如果调用update方法的时候有next 属性 说明是属性更新 或者插槽更新
            instance.update() // 让更新逻辑统一
        }
    }
    // 处理组件
    const processComponent = (oldVnode, newVnode, container, anchor, parentComponent) => {
        if (oldVnode == null) {
            if (newVnode.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
                // 需要走keepalive 中的激活方法
                parentComponent.ctx.activate(newVnode, container, anchor)
            } else {
                // 初始化逻辑
                mountComponent(newVnode, container, anchor, parentComponent)
            }
        } else {
            // 更新
            upDateComponent(oldVnode, newVnode)
        }
    }
    // 渲染走这里 更新也走这里
    const patch = (oldVnode, newVnode, container, anchor = null, parentComponent = null) => {
        if (oldVnode == newVnode) {
            // 两个节点渲染同一个元素直接跳过
            return
        }
        // 两个元素不一样 直接移除老的dom 初始化新的dom元素
        if (oldVnode && !isSameVnode(oldVnode, newVnode)) {
            unmount(oldVnode, parentComponent)
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
        const { type, shapeFlag, ref } =  newVnode
        switch (type) {
            case Text:
                processText(oldVnode, newVnode, container)
                break
            case Fragment:
                processFragment(oldVnode, newVnode, container, parentComponent)
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    // 对元素处理
                    processElement(oldVnode, newVnode, container, anchor, parentComponent)
                } else if (shapeFlag & ShapeFlags.TELEPORT) { // 传送
                    type.process(oldVnode, newVnode, container, anchor, parentComponent, {
                        mountChildren,
                        patchChildren,
                        move(vnode, container, anchor) {
                            // 此方法可以将组件或者dom 元素移动到指定位置
                            let targetEl = vnode.component ? vnode.component.subTree.el : vnode.el
                            hostInsert(targetEl, container, anchor)
                        }
                    })
                } else if(shapeFlag & ShapeFlags.COMPONENT) {
                    // 对组件的处理 vue3的函数组件（没有性能优势了） 与 状态组件
                    processComponent(oldVnode, newVnode, container, anchor, parentComponent)
                }
        }
        if (ref !== null) {
            setRef(ref, newVnode)
        }
        
    }
    function setRef(rawRef, vnode) {
        let refValue = vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT ? vnode.component.exposed || vnode.component.proxy : vnode.el
        if (isRef(rawRef)) {
            rawRef.value = refValue
        }
    }
    const unmount = (vnode, parentComponent) => {
        const { shapeFlag, transition, el } = vnode
        const performRemove = () => {
            hostRemove(el)
        }
        if(shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
            // 需要找keepalive 组件找失活逻辑
            parentComponent.ctx.deactivate(vnode)
        } else if (vnode.type === Fragment) {
            unmountChildren(vnode.children, parentComponent)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
            unmount(vnode.component.subTree, parentComponent)
        } else if(shapeFlag & ShapeFlags.TELEPORT) {
            vnode.type.remove(vnode, unmountChildren)
        } else {
            if (transition) {
                transition.leave(el, performRemove)
            } else {
                performRemove()
            }
            
        }
    }
    // 多次调用render 会进行虚拟节点的比较在进行更新
    const render = (vnode, container) => {
        if (vnode == null) {
            // 移除当前容器的dom元素
            if (container._vnode) {
                unmount(container._vnode, null)
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