import { CREATE_ELEMENT_VNODE, CREATE_TEXT_VNODE, FRAGMENT } from "./runtimeHelper";

export enum NodeTypes {
    ROOT = 0,
    ELEMENT = 1,
    TEXT = 2,
    COMMENT = 3,
    SIMPLE_EXPRESSION = 4,
    INTERPOLATION = 5,
    ATTRIBUTE = 6,
    DIRECTIVE = 7,
    COMPOUND_EXPRESSION = 8,
    IF = 9,
    IF_BRANCH = 10,
    FOR = 11,
    TEXT_CALL = 12,
    VNODE_CALL = 13,
    JS_CALL_EXPRESSION = 14,
    JS_OBJECT_EXPRESSION = 15,
    JS_PROPERTY = 16,
    JS_ARRAY_EXPRESSION = 17,
    JS_FUNCTION_EXPRESSION = 18,
    JS_CONDITIONAL_EXPRESSION = 19,
    JS_CACHE_EXPRESSION = 20,
    JS_BLOCK_STATEMENT = 21,
    JS_TEMPLATE_LITERAL = 22,
    JS_IF_STATEMENT = 23,
    JS_ASSIGNMENT_EXPRESSION = 24,
    JS_SEQUENCE_EXPRESSION = 25,
    JS_RETURN_STATEMENT = 26
}

export function createCallExpression(context, args) {
    let name = context.helper(CREATE_TEXT_VNODE)
    return {
        // createTextVnode
        type: NodeTypes.JS_CALL_EXPRESSION,
        arguments: args,
        callee: name
    }
}


export function createVnodeCall(context, tag, props, children) {
    let name
    if (tag !== FRAGMENT) {
        name = context.helper(CREATE_ELEMENT_VNODE)
    }
    return {
        // createElementVnode
        type: NodeTypes.VNODE_CALL,
        // arguments: [tag, props, children],
        tag,
        props, 
        children,
        callee: name ? name : null
    }
}

export function createObjectExpression(properties) {

    // {a:1,b:2,c:3}
    return {
        type: NodeTypes.JS_OBJECT_EXPRESSION,
        properties
    }
}