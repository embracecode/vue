import { PatchFlags } from '@vue/shared'
import { createCallExpression, createObjectExpression, createVnodeCall, NodeTypes, parse } from './parse'
import { CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, FRAGMENT, OPEN_BLOCK, TO_DISPLAY_STRING } from './runtimeHelper'
// dom的遍历方式  先序遍历  后续

//  先处理元素 -》文本 -》 在执行文本处理后 -》 在执行元素的文本处理后   类似组件的挂在流程
function transformElement(node, context) {
    if (NodeTypes.ELEMENT == node.type) {
        //  退出函数  元素的文本处理后
        return function () {
            let { tag, props, children } = node
            // let vnodeTag = `"${tag}"`
            // let vnodeProps = props.length ? `[${props.map(p => `${p.name}: ${p.value}`).join(', ')}]` : null
            // let vnodeChildren = children.length ? children.map(c => c.content).join('') : 'null'
            // node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren)

            let vnodeTag = tag
            let properties = []
            for(let i = 0; i < props.length; i++) {
                let { name, value } = props[i]
                properties.push({ key: name, value: value.content })
            }
            const propsExpression = properties.length > 0 ? createObjectExpression(properties) : null
            let vnodeChildren = null
            // if (children.length === 1) {
            //     vnodeChildren = children[0]
            // } else if (children.length > 1) {
            //     vnodeChildren = children
            // }
            vnodeChildren = children
            node.codegenNode = createVnodeCall(context, vnodeTag, propsExpression, vnodeChildren)
        }
    }
}

function isText(node) {
    return NodeTypes.TEXT === node.type || NodeTypes.INTERPOLATION === node.type
}

function transformText(node, context) {
    if (NodeTypes.ELEMENT == node.type || NodeTypes.ROOT == node.type) {
        // 注意处理顺序  要等待子节点全部处理后  再赋值给父元素
        //  退出函数  文本处理后
        return function () {
            // 元素合并
            const children = node.children
            let container = null
            let hasText = false
            for(let i = 0; i < children.length; i++) {
                let child = children[i]
                if (isText(child)) {
                    hasText = true
                    for(let j = i + 1; j < children.length; j++) {
                        let next = children[j]
                        if (isText(next)) {
                            if (!container) {
                                container = children[i] = {
                                    type: NodeTypes.COMPOUND_EXPRESSION,
                                    children: [child]
                                }
                            }
                            container.children.push(' + ', next)
                            children.splice(j, 1)
                            j--
                        } else {
                            container = null
                            break
                        }
                    }
                }
            }

            // 需要看一下处理后的儿子 文本节点是不是只有一个 只有一个不调用createTextVnode  而是调用toDisplayString
            if (!hasText || children.length === 1) {
                return
            }

            // createTextVnode  需要传递的PatchFlag
            for(let i = 0; i < children.length; i++) {
                let child = children[i]
                if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
                    const args = []
                    args.push(child)
                    if (child.type !== NodeTypes.TEXT) {
                        args.push(PatchFlags.TEXT)
                    }

                    children[i] = {
                        type: NodeTypes.TEXT_CALL, // createTextVnode
                        children: [child],
                        codegenNode: createCallExpression(context, args)
                    }
                }
            }

        }
    }
}


function transformExpression(node, context) {
    if (NodeTypes.INTERPOLATION == node.type) {
        node.content.content = `_ctx.${node.content.content}`
    }
}


function createTransformContext(root) {
    const context = {
        currentNode: root,
        parent: null,
        // createElementVnode  createTextVnode   toDisplayString
        transformNode: [
            transformElement,
            transformText,
            transformExpression
        ],
        helpers: new Map(),
        helper(key) {
            let count = context.helpers.get(key) || 0
            context.helpers.set(key, count + 1)
            return key
        },
        removeHelper(key) {
            const count = context.helpers.get(key)
            if (count) {
                let c = count - 1
                if (!c) {
                    context.helpers.delete(key)
                } else {
                    context.helpers.set(key, c)
                }
            }
        }
    }
    return context
}


function traverseNode(node, context) {
    context.currentNode = node
    const transforms = context.transformNode
    const exits = [] // 元素函数  文本函数 表达式的函数
    for (let i = 0; i < transforms.length; i++) {
        const exit = transforms[i](node, context)
        exit && exits.push(exit)
    }

    switch (node.type) {
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            for(let i = 0; i < node.children.length; i++) {
                context.parent = node
                traverseNode(node.children[i], context)
            }
            break
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break
    }
    context.currentNode = node  // 因为 traverseNode 会把node变成子节点  所以在执行完之后要还原

    let i = exits.length
    if (i > 0) {
        while (i--) {
            exits[i]()
        }
        
    }

}
// 对根节点的处理  三种情况
// 根节点是文本 直接把文本丢进去
// 根节点单个元素 删除createElementVnode 创建openBlock  createElementBlock
// 根节点是多个元素 创建openBlock  createElementBlock（fragment, null, [createElementVnode]）
    
function createRootCodegenNode(ast, context) {
    let { children } = ast
    if (children.length == 1) {
        let child = children[0]
        if (child.type === NodeTypes.ELEMENT) {
            ast.codegenNode = child.codegenNode
            context.removeHelper(CREATE_ELEMENT_VNODE)
            context.helper(CREATE_ELEMENT_BLOCK)
            context.helper(OPEN_BLOCK)
            ast.codegenNode.isBlock = true
        } else {
            ast.codegenNode = child
        }
    } else if (children.length > 1) {
        // 产生一个fragment 标签
        ast.codegenNode = createVnodeCall(context, context.helper(FRAGMENT), null, children)
        context.helper(OPEN_BLOCK)
        context.helper(CREATE_ELEMENT_BLOCK)
        ast.codegenNode.isBlock = true

        
        
    }
}

export function transform(ast) {
    const context = createTransformContext(ast)

    traverseNode(ast, context);
    
    createRootCodegenNode(ast, context)
    ast.helpers = [...context.helpers.keys()]
}