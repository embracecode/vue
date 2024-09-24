import { getCurrentInstance } from "../component";
import { h } from "../h";


/* enterFrom, enterActive, enterTo, leaveFrom, leaveActive, leaveTo */


function nextFrame(fn) {
    requestAnimationFrame(() => {
        requestAnimationFrame(fn)
    })
}

export function resolveTransitionProps(props) {
    const {
        name = 'v',
        enterFromClass = `${name}-enter-from`,
        enterActiveClass = `${name}-enter-active`,
        enterToClass = `${name}-enter-to`,
        leaveFromClass = `${name}-leave-from`,
        leaveActiveClass = `${name}-leave-active`,
        leaveToClass = `${name}-leave-to`,
        onBeforeEnter,
        onEnter,
        onAfterEnter,
        onLeave,
        onAfterLeave,
    } = props 

    return {
        onBeforeEnter(el) {
            onBeforeEnter && onBeforeEnter(el) 
            el.classList.add(enterFromClass)
            el.classList.add(enterActiveClass)
        },
        onEnter(el, done) {
            const resolve = () => {
                el.classList.remove(enterActiveClass)
                el.classList.remove(enterToClass)
                done && done()
            }
            
            onEnter && onEnter(el, resolve)
            // 添加类名后不能马上移除
            nextFrame(() => { // 保证动画结束后再移除类名
                el.classList.remove(enterFromClass)
                el.classList.add(enterToClass)

                if (!onEnter || onEnter.length <= 1) {
                    el.addEventListener('transitionend', resolve)
                }
            })
        },
        onAfterEnter(el) {
            // todo....
        },
        onLeave(el, done) {
            const resolve = () => {
                el.classList.remove(leaveActiveClass)
                el.classList.remove(leaveToClass)
                done && done()
            }
            onLeave && onLeave(el, resolve)
            el.classList.add(leaveFromClass) //  leave 和 leaveFrom  保证 Leave前先绘制 然后在leaveActiveClass
            document.body.offsetHeight // 触发 repaint 立刻绘制
            el.classList.add(leaveActiveClass)

            nextFrame(() => { // 保证动画结束后再移除类名
                el.classList.remove(leaveFromClass)
                el.classList.add(leaveToClass)

                if (!onLeave || onLeave.length <= 1) {
                    el.addEventListener('transitionend', resolve)
                }
            })
        },
        onAfterLeave(el) {
            // todo.... 
        },
    }
}

export function Transition(props, { slots }) {
    console.log('Transition', props, slots);

    // 函数式组件功能比较少 为了方便  函数式组件处理了属性 处理属性后传递给有状态的组件
    return h(BaseTransitionImpl, resolveTransitionProps(props), slots)
}

const BaseTransitionImpl = { // 真正的组件只需要渲染的时候调用封装后的钩子函数即可
    props: {
        onBeforeEnter: Function,
        onEnter: Function,
        onLeave: Function,


        onAfterEnter: Function,
        onAfterLeave: Function,
    },
    setup(props, { slots }) {
        
        return () => {
            const vnode = slots.default && slots.default()

            // const instance = getCurrentInstance()

            if (!vnode) return

            // 渲染前 （离开） 渲染后 （进入） 钩子函数
            // const oldvnode = instance.subTree // 旧vnode
            vnode.transition = {
                beforeEnter: props.onBeforeEnter,
                enter: props.onEnter,
                leave: props.onLeave,

                afterEnter: props.onAfterEnter,
                beforLeave: props.onLeave,
            }
            return vnode
        }
    }
}