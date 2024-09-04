


import { nodeOps } from './nodeOps'

import patchProp from './patchProps'


const renderOptions = Object.assign({ patchProp }, nodeOps)


export {
    renderOptions
}
export * from '@vue/reactivity'