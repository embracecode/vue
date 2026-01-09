//  编译分为散步  
// 1.需要将模板转化为AST
// 2.生产codegennode 
// 3.转化成render函数

import { NodeTypes } from './ast'

// 将模板转化为AST语法树
export * from './ast'
function createParseContext(template) {

    return {
        originalSource: template,
        source: template,
        column: 1,
        line: 1,
        offset: 0
    }
    
}
function isEnd(context) {
    return !context.source
}
function advanceBye(context, length) {
    context.source = context.source.slice(length)
    context.offset += length
    
}
function parseTextData(context, endIndex) {
    const content = context.source.slice(0, endIndex)
    advanceBye(context, endIndex)
    return content
}
function parseText(context) {
    let endTokens = ['<','{{'] // 找到离的最近的标识

    let endIndex = context.source.length // 先假设找不到
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i], 1)
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }
    const content = parseTextData(context, endIndex)
    return {
        type: NodeTypes.TEXT,
        content
    }
}
function parseChildren(context) {
    const nodes = [] as any
    while(!isEnd(context)) {
        const c = context.source // 当前解析的内容
        let node
        debugger
        if (c.startsWith('{{')) { // {{}}
            node = '表达式'
        } else if (c[0] === '<') { // <div></div>
            node = '元素'
        } else { // 文本
            node = parseText(context)
        }

        nodes.push(node)

        // 状态机
    }
    
    return nodes
}

function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        children
    }
}
function parse(template) {
    // 根据template  产生一棵树
    const context = createParseContext(template)    
    const children = parseChildren(context)

    return createRoot(children)
}

export {
    parse
}