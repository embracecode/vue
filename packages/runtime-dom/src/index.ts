


import { nodeOps } from './nodeOps'

import patchProp from './patchProps'

import { createRenderer } from '@vue/runtime-core'

const renderOptions = Object.assign({ patchProp }, nodeOps)

export const render = (vnode, container) => {
    return createRenderer(renderOptions).render(vnode, container)
}

export * from '@vue/runtime-core'

// runtime-dom ---> runtime-core ---> reactivity