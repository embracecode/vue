// 主要是对元素节点属性的操作 class style  event

import patchAttr from "./modules/patchAttr";
import patchClass from "./modules/patchClass";
import patchEvent from "./modules/patchEvent";
import patchStyle from "./modules/patchStyle";



export default function patchProp(el, key, preValue, nextValue) {

    if (key === 'class') {
        return patchClass(el, nextValue)
    }
    else if (key === 'style') {
        return patchStyle(el, preValue, nextValue)
    }
    else if (key.startsWith('on')) {
        return patchEvent(el, key, nextValue)
    } else {
        return patchAttr(el, key, nextValue)
    }

}