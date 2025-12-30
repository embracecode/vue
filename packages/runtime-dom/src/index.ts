export * from '@vue/reactivity'

import { nodeOps } from './nodeOps'
import patchProp from './patchProp'

// 将节点操作和属性操作放在一起
const renderOptions = Object.assign({patchProp}, nodeOps)

console.log(renderOptions);
function createRenderer() {

}

export {
    renderOptions
}
// createRenderer(renderer).render()