



// 编译主要分为三步
// 1. 需要将模板转化成ast语法树
// 2. 通过ast语法树转化生成codegennode
// 3. 转化成字符串（render函数）

import { NodeTypes } from "./ast"

// 将模板转化为ast语法树

function createParserContext(template) { 
    return {
        originalSource: template, // 原始的字符串模板不能做改变
        source: template, // 操作的字符串
        line: 1, // 行数
        column: 1, // 列数
        offset: 0, // 偏移量
    }
}

function isEnd(context) { 
    return !context.source
}

function parseChildren(context) {
    const nodes = []
    const c = context.source

    
    while (!isEnd(context)) { 
        let node
        if (c.startsWith('{{')) { // 处理插值表达式 {{ }}
            node = '表达式'
        } else if (c[0] === '<') { // 处理元素节点 <div> </div>
            node = parseElement(context)
        } else { // 处理文本节点
            node = parseText(context)
        }
        nodes.push(node)
    }
    return nodes
}

function parse(template) { 
    // 根据template生成一棵树  包含 line  column  offser 

    const context = createParserContext(template) // 创建解析器上下文
    return createRoot(parseChildren(context)) // 解析器的入口函数
}
function createRoot(children) { 
    return {
        type: NodeTypes.ROOT, 
        children
    }
}

function advanceBy(context, endIndex) { 
    let c = context.source
    context.source = c.slice(endIndex) // 截取字符串
}
function advanceSpace(context) { 
    // 匹配空格
    const match = /^[ \t\n\r]+/.exec(context.source) // 匹配空格
    if (match) { 
        advanceBy(context, match[0].length) // 跳过空格
    }

}

function parseTag(context) { 
    const match =/^<\/?([a-z][^ \t\n\r/>]*)/.exec(context.source) // 匹配标签名 
    const tag = match[1]
    advanceBy(context, match[0].length) // 跳过标签名

    advanceSpace(context) // 跳过空格

    const isSelfClosing = context.source.startsWith('/>') // 是否自闭合
    advanceBy(context, isSelfClosing ? 2 : 1) // 跳过自闭合标签

    return {
        type: NodeTypes.ELEMENT,
        tag,
        isSelfClosing,
        loc: {}
    }
}

function parseElement(context) { 


    const ele = parseTag(context); // 解析标签名

    if (context.source.startsWith('</')) {
        parseTag(context) // 跳过结束标签
    }

    (ele as any).children = []; // 解析子节点
    (ele as any).loc = getSelection(context, ele.loc.start) // 元素节点的位置信息

    return ele
    
}



function parseTextData(context, endIndex) { 
    const text = context.source.slice(0, endIndex) // 截取文本
    advanceBy(context, endIndex)
    return text

} 
function parseText(context) { 
    let tokens = ['<', '{{'] // 找当前文本节点离哪一个字符最近

    let endIndex = context.source.length // 先假设找不到

    for (let i = 0; i < tokens.length; i++) {
        const index = context.source.indexOf(tokens[i], 1) // 找出第一个符合的字符的位置
        if (index !== -1 && index < endIndex) { // 如果找到的位置比之前的位置更靠前
            endIndex = index // 更新最靠前的位置
        }
    }

    // 0-endIndex 之间的字符串就是文本节点
    let content = parseTextData(context, endIndex) // 解析文本节点
    return {
        type: NodeTypes.TEXT,
        content
    }
}

export {
    parse
}