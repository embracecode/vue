// 对节点元素的增删改查

export const nodeOps = {
    // 创建元素
    createElement(tag: string): Element {
        return document.createElement(tag)
    },
    // 插入元素
    insert(el: Element, parent: Node, anchor?: Node | null): void {
        parent.insertBefore(el, anchor)
    },
    // 删除自己
    remove(el: Element): void {
        const parent = el.parentNode
        if (parent) {
            parent.removeChild(el)
        }
    },
    // 创建文本节点
    createText(text: string): Text {
        return document.createTextNode(text)
    },
    // 获取元素的下一个元素
    nextSibling(el: Node): Node | null {
        return el.nextSibling
    },
    setText(node: Node, text: string): void { 
        node.nodeValue = text
    },
    // 设置元素节点Text
    setElementText(node: Node, text: string): void {
        node.textContent = text
    },
    // 获取节点的父元素
    parentNode(el: Node): Node | null {
        return el.parentNode
    }
}