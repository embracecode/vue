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
    if (context.source.startsWith('</')) {
        return true
    }
    return !context.source
}
function advancePositionWithMutation(context, source, endIndex) {
    let lineCount = 0
    let linPos = -1
    for (let i = 0; i < endIndex; i++) {
        if (source.charCodeAt(i) == 10) {
            lineCount++
            linPos = i
        }
    }
    context.line += lineCount
    context.offset += endIndex
    context.column = linPos === -1 ? context.column + endIndex : endIndex - linPos
}
function advanceBye(context, endIndex) {
    const source = context.source
    context.source = source.slice(endIndex)
    advancePositionWithMutation(context, source, endIndex)
}

function getCursor (context) {
    let { line, column, offset } = context
    return {
        line,
        column,
        offset
    }
}

function getSelection(context, start, end?) {
    end = end || getCursor(context)
    return {
        start,
        end,
        source: context.originalSource.slice(start.offset, end.offset)
    }
}

// 删除空格
function advanceSpaces(context) {
    const match = /^[\t\r\n\f ]+/.exec(context.source)
    if (match) {
        advanceBye(context, match[0].length)
    }
}
function parseTextData(context, endIndex) {
    const content = context.source.slice(0, endIndex)
    advanceBye(context, endIndex)
    return content
}

// getCursor 获取位置信息 根据当前上下文
// parseTextData 处理文本内容的 并且会更新最新偏移量信息
// advancePositionWithMutation  更新信息
// getSelection 获取当前开头和结尾的位置
// advanceby 解析的删除
function parseText(context) {
    let endTokens = ['<','{{'] // 找到离的最近的标识

    let endIndex = context.source.length // 先假设找不到
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i], 1)
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }
    // 创建 行列信息
    const start = getCursor(context)// 开始

    const content = parseTextData(context, endIndex) // 取内容
    
    // const contentEnd = getCursor(context) // 结束
    return {
        type: NodeTypes.TEXT,
        content,
        loc: getSelection(context, start)
    }
}




// 处理表达式
function parseInterpolation(context) {
    const start = getCursor(context)
    // 查找结束的大括号
    const closeIndex = context.source.indexOf('}}', 2)
    advanceBye(context, 2)
    const innerStart = getCursor(context)
    const innerEnd = getCursor(context)
    const rawContentLength = closeIndex - 2 // 原始内容的长度
    // 可以返回文本内容 并且可惜更新信息
    let preContent = parseTextData(context, rawContentLength)
    let content = preContent.trim()
    let startOffset = preContent.indexOf(content)
    if (startOffset > 0) {
        advancePositionWithMutation(innerStart, preContent, startOffset)
    }

    let endOffset = startOffset + content.length

    advancePositionWithMutation(innerEnd, preContent, endOffset)
    
    advanceBye(context, 2)

    return {
        type: NodeTypes.INTERPOLATION, // 表达式
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content,
            loc: getSelection(context, innerStart, innerEnd)
        },
        loc: getSelection(context, start) // 表达式相关的信息
    }

}

// 处理属性值
function parseAttributeValue(context) {
    let content
    const start = getCursor(context)
    const quote = context.source[0]
    if (quote === "'" || quote === '"') {
        advanceBye(context, 1)
        const endIndex = context.source.indexOf(quote, 1)
        content = parseTextData(context, endIndex)
        advanceBye(context, 1)
    } else {
        const match = /^[^\t\r\n\f >]+/.exec(context.source)
        if (match) {
            content = parseTextData(context, match[0].length)
        }
    }
    return {
        content,
        loc: getSelection(context, start)
    }
}

function parseAttibute(context) {
    const start = getCursor(context) 
    // 属性的名字
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
    const key = match[0]
    advanceBye(context, key.length)
    advanceSpaces(context)
    // 属性的值
    let value
    if (context.source.startsWith('=')) {
        advanceBye(context, 1)
        advanceSpaces(context)
        value = parseAttributeValue(context)
    }
    return {
        type: NodeTypes.ATTRIBUTE,
        name: key,
        value: {
            type: NodeTypes.TEXT,
            ...value
        },
        loc: getSelection(context, start)
    }
}

// 处理属性
function parseAttibutes(context) {
    const props = []
    // 简单的处理
    while(context.source.length > 0 && !context.source.startsWith('>')) {
        const prop = parseAttibute(context)
        props.push(prop)
        advanceSpaces(context)
    }
    return props
}

// 解析标签
function parseTag(context){
    const start = getCursor(context)
    const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)

    const tag = match[1]
    // 删除匹配到的内容
    advanceBye(context, match[0].length)
    // 移除空格
    advanceSpaces(context)

    // 处理属性
    const props = parseAttibutes(context)

    const isSelfClosing = context.source.startsWith('/>')
    advanceBye(context, isSelfClosing ? 2 : 1)
    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        isSelfClosing,
        loc: getSelection(context, start)
    }
}
function parseElement(context) {

    const ele = parseTag(context);
    // 儿子
    const children = parseChildren(context) // 处理儿子的时候可能没有儿子 没有儿子直接用startWith('</')判断

    // 闭合标签没有意义 直接移除掉 </ div>  后面的直接移除
    if (context.source.startsWith('</')) {
        parseTag(context)
    }

    (ele as any).children = children;
    // 计算最新的位置信息
    (ele as any).loc = getSelection(context, ele.loc.start)
    return ele
}
function parseChildren(context) {
    const nodes = [] as any
    while(!isEnd(context)) {
        const c = context.source // 当前解析的内容
        let node
        if (c.startsWith('{{')) { // {{}}
            node = parseInterpolation(context)
        } else if (c[0] === '<') { // <div></div>
            // node = parseElement(context)
            node = parseElement(context)
        } else { // 文本
            node = parseText(context)
        }
        nodes.push(node)
        // 状态机
    }
    // 干掉空节点
    for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.type === NodeTypes.TEXT) {
            if (!/[^\t\r\n\f ]/.test(node.content)) {
                nodes[i] = null // 空白字符清空
            } else {
                node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
            }
        }
    }
    return nodes.filter(Boolean)
}

function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        children
    }
}
export function parse(template) {
    // 根据template  产生一棵树
    const context = createParseContext(template)    
    const children = parseChildren(context)

    return createRoot(children)
}

