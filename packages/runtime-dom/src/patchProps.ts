

// 对节点元素的属性操作 class style event等

import patchAtrs from "./modules/patchAtrs";
import { patchClass } from "./modules/patchClass";
import patchEvent from "./modules/patchEvent";
import patchStyle from "./modules/patchStyle";





export default function patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: any) { 
    if (key === 'class') {
        return patchClass(el, nextValue);
    } else if (key === 'style') {
        return patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
        return patchEvent(el, key, nextValue)
    } else {
        return patchAtrs(el, key, nextValue);
    }
}