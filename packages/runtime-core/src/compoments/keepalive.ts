import { ShapeFlags } from "@vue/shared"
import { onMounted, onUpdated } from "../apiLifecycle"
import { getCurrentInstance } from "../component"

export const KeepAlive = {
    __isKeepAlive: true,
    props: {
        max: Number
    },
    setup(props, {slots}) {
        const { max } = props
        const keys = new Set() // 用来记录那些组件缓存过
        const cache = new Map() // 创建一个缓存列表
        // 在这个组件中需要一些dom方法 可以将元素移动到一个div 中
        // 还可以卸载某个元素
        let pendingCacheKey = null
        const instance = getCurrentInstance()
        // keepalive 特有的两个钩子函数
        // 激活时执行
        const { move, createElement, unmount:_unmount } = instance.ctx.renderer
        function reset(vnode) {
            let { shapeFlag } = vnode
            if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
                shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
            }
            if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
                shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
            }
            vnode.shapeFlag = shapeFlag
        }
        function unmount(vnode, key) {
            reset(vnode)
            cache.delete(key)
            _unmount(vnode, instance)

        }
        function purneCacheEntry (key) {
            keys.delete(key)
            const cacheRes = cache.get(key) // 获取到之前缓存的dom 直接删除掉
            // 还原vnode上的标识 否则无法走移除逻辑
            unmount(cacheRes, key) // 先还原标识 再掉真实的删除dom
        }
        instance.ctx.activate = (vnode, container, anchor) => {
            // 将元素移入到入其中
            move(vnode, container, anchor)
        }
        // 失活时执行
        const storageContent = createElement('div')
        instance.ctx.deactivate = (vnode) => {
            move(vnode, storageContent, null) // 将dom 元素临时移动到div中 但是没有被销毁
            
        }
        const cacheSubTree = () => {
            cache.set(pendingCacheKey, instance.subTree) // 缓存到映射表
        }
        // 缓存的是组件  组件里面用subtree  subtree里面有el  把el移入到容器中
        onMounted(cacheSubTree)
        onUpdated(cacheSubTree)
        return () => {
            const vnode = slots.default && slots.default()
            const comp = vnode.type
            const key = vnode.key == null ? comp: vnode.key

            const cacheVnode = cache.get(key)
            pendingCacheKey = key
            if (cacheVnode) {
                // 如果有缓存 则直接用缓存里面的组件实例 不需要在创建新的实例
                vnode.component = cacheVnode.component
                vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE // 告诉组件不需要做初始化操作
                keys.delete(key)
                keys.add(key) // 刷新缓存为最新的
            } else {
                keys.add(key)
                console.log(max, keys.size)
                if (max && keys.size > max) { // 说明达到了缓存的最大个数
                    // 获取set中的第一个元素
                    purneCacheEntry(keys.values().next().value)
                }
            }
            // 这个组件不需要真的卸载 临时放到创建的dom 中
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
            return vnode // 等到组件加载完毕后再去缓存
        }
    }
}
export const isKeepAlive = (vnode) => vnode.type.__isKeepAlive