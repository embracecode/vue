// 主要是对元素的增删改查
export const nodeOps = {
    createElement: (tag) => document.createElement(tag),
    insert: (el, parent, anchor) => parent.insertBefore(el, anchor || null),
    remove: (el) => {
        const parent = el.parentNode
        if (parent) {
            parent.removeChild(el)
        }
    },
    setElementText: (el, text) => el.textContent = text, // 元素设置文本内容
    createText: (text) => document.createTextNode(text),
    setText: (el, text) => el.nodeValue = text, // 设置文本
    parentNode: (node) => node.parentNode,
    nextSibling: (node) => node.nextSibling
}