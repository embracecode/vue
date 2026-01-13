//  编译分为散步  
// 1.需要将模板转化为AST
// 2.生产codegennode 
// 3.转化成render函数

import { NodeTypes, parse } from './parse'
import { CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, CREATE_TEXT_VNODE, helperNameMap, OPEN_BLOCK, TO_DISPLAY_STRING } from './runtimeHelper'
import { transform } from './transform'

function createCodegenContext(ast) {
    const context = {
        code:``,
        level:0,
        helper(name){
            return `_${helperNameMap[name]}`
        },
        push(code){
            context.code += code
        },
        indent()  {
            newLine(++context.level)
        },
        deindent(noNewLine= false){ 
            if (noNewLine) {
                --context.level
            } else {
                newLine(--context.level)
            }
        },
        newLine () {
            newLine(context.level)
        }
    }
    function newLine(n) {
        context.push('\n' + '  '.repeat(n))
    }
    return context
}

function genFunctionPreamble(ast, context) {
    const { push, indent, deindent, newLine } = context
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(
            item => `${helperNameMap[item]} : ${context.helper(item)}`
        )} } = Vue`)
        newLine()
    }
    
    push(`return function render(_ctx, _cache) {`)
}
// s生成文本
function genText(node, context) {
    const { push } = context
    push(JSON.stringify(node.content))
}

// 生成表达式
function genInterpolation(node, context) {
    const { push, helper } = context
    push(`${helper(TO_DISPLAY_STRING)}(`)
    genNode(node.content, context)
    push(`)`)
}
function genExpression(node, context) {
    const { push } = context
    push(node.content)
}

function genPropsAccessExp(props, context) {
    const { push, indent, deindent, newLine } = context
    push(`{`)
    indent()
    for (let i = 0; i < props.length; i++) {
        const prop = props[i]
        push(`${JSON.stringify(prop.key)}: `)
        push(`${JSON.stringify(prop.value)} `)
        if (i < props.length - 1) {
            push(`,`)
            newLine()
        }
    }
    deindent()
    push(`}`)
}

function genVnodeCall(node, context) {
    const { push, indent, deindent, newLine, helper } = context

    const { tag, props, children, isBlock } = node
    if (isBlock) {
        push(`(${helper(OPEN_BLOCK)}(),`)
    }
    const h = isBlock ? CREATE_ELEMENT_BLOCK : CREATE_ELEMENT_VNODE
    push(`${helper(h)}(`)

    push(JSON.stringify(tag))
    console.log('node', node)
    if (props && props.properties) {
        genPropsAccessExp(props.properties, context)
        push(`,`)
    }
    

    if (children.length && children.length === 1) {
        genNode(children[0], context)
    } else if (children.length > 1) {
        genNodeList(children, context)
    }
    if (isBlock) {
        push(`)`)
    }
    push(`)`)
    
}


function genNodeList(nodes, context) {
    const { push, indent, deindent, newLine } = context
    push(`[`)
    indent()
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (i > 0) {
            newLine()
        }
        genNode(node, context)
    }
    deindent()
    push(`]`)
}
function genTextCall(node, context) {
    const { push, helper } = context
    push(`${helper(CREATE_TEXT_VNODE)}(`)
    genNode(node.children[0], context)
    push(`)`)
    push(`,`)
}

function genNode(node, context) {
    const { push, indent, deindent, newLine } = context

    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context)
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context)
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context)
            break;
        case NodeTypes.VNODE_CALL:
            genVnodeCall(node, context)
            break;
        case NodeTypes.TEXT_CALL:
            genTextCall(node, context)
            break;
        case NodeTypes.ELEMENT:
            genVnodeCall(node, context)
            break;
        default:
            break;
    }
}

function generate(ast) {
    const context = createCodegenContext(ast)
    
    genFunctionPreamble(ast, context)
    const { push, indent, deindent, newLine } = context
    indent()
    push(`return `)
    if (ast.codegenNode) {
        genNode(ast.codegenNode, context)
    } else {
        push(`null`)
    }

    deindent()
    push(`}`)
    console.log(context.code)
}
export function compile(template) {
    const ast = parse(template)
    console.log('ast', ast)
    // 代码转化
    transform(ast)

    return generate(ast)
    
}

export {
    parse
}