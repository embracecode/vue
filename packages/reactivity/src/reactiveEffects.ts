import { activeEffect, trackEffect, triggerEffects } from "./effect";


// 存放收集的依赖   

const targetMap = new WeakMap();

export const createDeps = (cleanup, key) => { 
    const deps: any = new Map()
    deps.cleanup = cleanup
    deps.name = key // 自定义表示 用于记录是服务与哪个属性 方便观察调试 没什么实际作用
    return deps
}

// weakMap = {obj: Map{  key: Map{ effect, effect }}
// {
//     { name: 'John', age: 30 }: { 
//         name: { effect, effect }
//     }
// }

export function track(target, key) {
    // activeEffect  全局的effect 有这个属性说明是在effect 内部访问的需要手机依赖 反之不需要收集
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            // createDeps里面的回调函数 用于后面清理不需要的属性的effect
            depsMap.set(key, (dep = createDeps(() => { depsMap.delete(key) }, key)));
        }
        trackEffect(activeEffect, dep); // 将当前的effect 放入到对应的映射（dep）中 后续可以根据值的改变触发effect的重新执行
         console.log(targetMap);
    }
}



export function trigger(target, key, value, oldValue) { 
    const depsMap = targetMap.get(target);

    if (!depsMap) {
        return
    }
    let dep = depsMap.get(key);
    // 有值说明修改的属性是需要触发effect 重新执行的
    if (dep) {
        // 触发依赖更新
        triggerEffects(dep);
    }

}


