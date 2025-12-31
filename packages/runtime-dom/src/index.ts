

import { nodeOps } from './nodeOps'
import patchProp from './patchProp'

import { createRenderer } from '@vue/runtime-core'
// 将节点操作和属性操作放在一起
const renderOptions = Object.assign({patchProp}, nodeOps)


// 采用dmo api 来进行渲染
export const render = (vnode, container) => createRenderer(renderOptions).render(vnode, container)

export * from '@vue/runtime-core'
// runtime-dom --> runtime-core ---> reactivity

// createRenderer(renderer).render()