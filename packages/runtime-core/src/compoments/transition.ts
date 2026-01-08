
import { h } from "../h"


function nextFrame (fn) {
    requestAnimationFrame(() => {
        requestAnimationFrame(fn)
    })
}
/* 过渡动画 enterFrom, enterActive, enterTo, leveFrom leaveActive leaveTo*/
export function resolveTransitionProps (props) {
    const { name = 'v',
        enterFromClass = `${name}-enter-from`,
        enterActiveClass = `${name}-enter-active`,
        enterToClass = `${name}-enter-to`,
        leaveFromClass = `${name}-leave-from`,
        leaveActiveClass = `${name}-leave-active`,
        leaveToClass = `${name}-leave-to`,
        onBeforeEnter,
        onEnter,
        onLeave,
        onBeforeLeave,
        onAfterLeave,
        onAfterEnter
     } = props
     return {
         onBeforeEnter(el) {
            onBeforeEnter && onBeforeEnter(el)
            el.classList.add(enterFromClass)
            el.classList.add(enterActiveClass)
         },
         onEnter(el, done) {
            const resolve = () => {
                el.classList.remove(enterToClass)
                el.classList.remove(enterActiveClass)
                done && done()
            }
            onEnter && onEnter(el, resolve)
            
            nextFrame(() => { // 保证动画的产生
                el.classList.remove(enterFromClass)
                el.classList.add(enterToClass)
                if (!onEnter || onEnter.length <= 1) {
                    el.addEventListener('transitionend', resolve)
                }
            })
         },
         onLeave(el, done) {
            const resolve = () => {
                el.classList.remove(leaveActiveClass)
                el.classList.remove(leaveToClass)
                done && done()
            }
            onLeave && onLeave(el, resolve)
            el.classList.add(leaveFromClass) // 当前状态red 当调用leavefrom 变成yellow  需要有状态过度  所以需要重新渲染当前页面
            document.body.offsetHeight // 立刻绘制成黄色
            el.classList.add(leaveActiveClass)
            nextFrame(() => {
                el.classList.remove(leaveFromClass)
                el.classList.add(leaveToClass)
                if (!onLeave || onLeave.length <= 1) {
                    el.addEventListener('transitionend', resolve)
                }
            })
         },
         onBeforeLeave(el) {
            onBeforeLeave && onBeforeLeave(el)
            el.classList.add(leaveFromClass)
            el.classList.add(leaveActiveClass)
         },
         onAfterLeave(el) {
            el.classList.remove(leaveFromClass)
            el.classList.remove(leaveActiveClass)
            onAfterLeave && onAfterLeave(el)
         },
         onAfterEnter(el) {
            el.classList.remove(enterFromClass)
            el.classList.remove(enterActiveClass)
            onAfterEnter && onAfterEnter(el)
         }
     }
    
}
export function Transition (props, { slots}) {
    console.log('Transition', props, slots)
    //  函数式组件的功能比较少 为了方便函数是组件处理属性
    // 处理属性后传递给状态组件 setup组件
    return h(
        BaseTransition,
        resolveTransitionProps(props),
        slots
    )
    
}
const BaseTransition = { // 真正的组件 只需要在渲染的时候调用封装后的钩子函数
    props: {
        onBeforeEnter: Function,
        onEnter: Function,
        onAfterEnter: Function,
        onBeforeLeave: Function,
        onLeave: Function,
        onAfterLeave: Function
    },
    setup(props, { slots }) {
        
        return () => {
            const vnode = slots.default && slots.default()
            if (!vnode) {
                return
            }
            // 渲染前（离开） 和渲染后（进入）
            // const oldvode = instance.subTree // 之前的虚拟节点

            // 可以先这样写 因为 props 可能有其他属性
            vnode.transition = {
                beforeEnter: props.onBeforeEnter,
                enter: props.onEnter,
                afterEnter: props.onAfterEnter,
                beforeLeave: props.onBeforeLeave,
                leave: props.onLeave,
                afterLeave: props.onAfterLeave
            }
            return vnode
        }
    }
}

