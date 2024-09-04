

export default function patchEvent(el, name, nextValue) {
    // vei =  vue event invoker 
    const invokers = el._vei || (el._vei = {});

    const EventName = name.slice(2).toLowerCase();


    const existingInvoker = invokers[name]; // 是否已存在重名的事件绑定

    if (nextValue && existingInvoker) {
        // 如果存在，则更新value值
        return (existingInvoker.value = nextValue)
    }

    if (nextValue) { 
        const invoker = (invokers[name] = createInvoker(nextValue));
        return el.addEventListener(EventName, invoker);
    }

    if (existingInvoker) { // 现在没有 以前有   移除事件绑定
        el.removeEventListener(EventName, existingInvoker);
        delete invokers[name];
    }
    
}

function createInvoker(value) { 

    const invoker = (e) => {
        invoker.value(e)
    };
    invoker.value = value;// 更改invoker中的value值 可以修改调用对应的函数
    return invoker;
}