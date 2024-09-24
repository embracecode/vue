import { getCurrentInstance, onMounted, onUpdated } from "@vue/runtime-core"
import { ShapeFlags } from "@vue/shared"






export const KeepAlive = {
    name: 'KeepAlive',
    __isKeepAlive: true,
    props: {
        max: Number
    },
    setup(props, { slots }) {
        const { max } = props
        // 缓存表 
        const keys = new Set() // 记录那些组件缓存过
        const cache = new Map() // <keepalive><xxx key="a" /> </keepalive>
        let pendingCacheKey = null
        const instance = getCurrentInstance()

        const cacheSubTree = () => {
            cache.set(pendingCacheKey, instance.subTree) // 缓存组件的虚拟节点， 里面有组件的dom元素
        }
        console.log(instance);
        
        const { move, createElement, unmount: _unmount } = instance.ctx.renderer
        function reset(vnode) {
            let shapeFlag = vnode.shapeFlag
            if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
                shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE // 去掉组件缓存标识
            } 
            if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
                shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE // 去掉组件不需要移除标识
            }
            vnode.shapeFlag = shapeFlag // 还原vnode的标识
        }

        function unmount(vnode) { 
            reset(vnode) // 还原vnode的标识
            _unmount(vnode) // 还原之后删除真实的dom
        }
        
        function pruneCacheEntry(key: any) { 
            keys.delete(key)
            const cacgedVnode = cache.get(key) // 获取到之前缓存过的
            cache.delete(key)
            // 还原vnode上的标识 否则无法走移除逻辑


            unmount(cacgedVnode) // 走真实的删除dom操作
        }



        // 这里是keepalive组件特有的初始化方法
        // 激活时执行
        instance.ctx.activated = (vnode, container, anchor) => {
            move(vnode, container, anchor) // 将元素直接一入到dom中
        }
        // 卸载时执行
        const StorageContent = createElement('div')
        instance.ctx.deactivate = (vnode) => {
            move(vnode, StorageContent, null) // 将dom元素临时移动到创建的容器中 但是没有被销毁
        }

        onMounted(() => {
            // 把keepalive的子组件做个映射表缓存起来
            cacheSubTree()
        })
        onUpdated(() => {
            cacheSubTree()
        })
        // 缓存的是组件 组件上面有subtree subtree上有el  把el移动到页面中

        return () => {
            const vnode = slots?.default()
            // 在这个组件中需要一些方法 可以将元素移动到一个div中
            // 还可以卸载某个元素
            const comp = vnode.type

            const key = vnode.key == null ? comp : vnode.key
            
            const cachedVnode = cache.get(key)
            pendingCacheKey = key
            if (cachedVnode) {
                vnode.component = cachedVnode.component  // 直接复用缓存里面的组件实例
                vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE // 标记为组件缓存 不要做初始化操作


                // lru算法 刷新缓存
                keys.delete(key)
                keys.add(key)

            } else {
                keys.add(key)
                if (max && keys.size > max) {
                    // 达到了最大的缓存个数

                    // 获取set 中的第一个元素 keys.values().next().value  keys.values() 是一个迭代器 
                    pruneCacheEntry(keys.values().next().value) // 移除最久没有使用的缓存
                }
            }
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE // 这个组件不需要真的移除 卸载的dom 临时放到容器中
            return vnode
        }
    }
}

export const isKeepAlive = (comp: any) => { 
    return!!(comp && comp.type.__isKeepAlive)
}