import { DirtyLevel } from "./constants";



export function effect(fn, options?) {

    // 创建一个effect实例， 只有依赖发生了变化 就会执行scheduler回调函数
    const _effect = new ReactiveEffect(fn, () => {
        _effect.run()
    });
    _effect.run();

    // 用户传的配置合并到effect实例上
    if (options) {
        Object.assign(_effect, options)
    }
    // 可以把run方法交给外界， 让用户选择合适的时机配合scheduler调度执行
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect; // 给runner上挂载effect实例 可以获取到effect的一些属性
    return runner;
}
//  全局的 activeEffect
export let activeEffect = null;


function preCleanEffect(effect) {

    effect._depsLength = 0;
    effect._tracdId ++ // 每次执行effect id就会加一 如果当前同一个effect执行 id就是相同的
}

function postCleanEffect(effect) {
    // { flageffect, nameeffect, xxxeffect, bbbeffect }
    // { flageffect, ageeffect }
    // 需要把老的多余的清除掉
    if (effect.dep.length > effect._depsLength) {
        for (let i = effect._depsLength; i < effect.dep.length; i++) {
            cleanDepEffect(effect.dep[i], effect) // 删除映射表中多余的effect
        }
        effect.dep.length = effect._depsLength // 更新删除后依赖列表的长度
    }
}

// effectScope.stop() 可以停止所有的effect 不参加响应式处理 需要用的active
export class ReactiveEffect {

    _tracdId = 0 // 用于记录当前的effect 执行的次数 后续作比较

    dep = [] // 让effect 记录被哪个属性所收集
    _depsLength = 0

    _runnning = 0 // 标记当前effect 是否正在执行

    _dirtyLevel = DirtyLevel.Dirty
    public active = true; // 创建的effect 是响应式的  默认是激活的
    // 如果依赖项发生了变化后 重新执行  run()
    constructor(public fn, public scheduler) { }

    public get dirty() {
        return this._dirtyLevel === DirtyLevel.Dirty
    }
    public set dirty(value) {
        this._dirtyLevel = value ? DirtyLevel.Dirty : DirtyLevel.Nodirty       
    }
    run() {
        this._dirtyLevel = DirtyLevel.Nodirty // 每次运行后变为nodirty
        if (!this.active) {
            return this.fn();  // 不是激活的执行后 不用做额外处理
        }

        // 是激活的下面要做依赖收集
        // 防止 effect 嵌套
        let lastEffect = activeEffect;
        try {
            activeEffect = this;

            // effect 重新执行前 需要把上一次的依赖情况清掉（处理分支切换不必要的更新）
            preCleanEffect(this)
            this._runnning++
            return this.fn();
        } finally {
            this._runnning--
            postCleanEffect(this)
            activeEffect = lastEffect;
        }
    }
    stop() {
        if (this.active) {
            this.active = false;
            preCleanEffect(this)
            postCleanEffect(this)
        }
    }
}

function cleanDepEffect(dep, effect) { 
    dep.delete(effect) // 依赖收集的effect  移除
    if (dep.size === 0) {
        dep.cleanup()
    }
}

// 双向记忆  dep记录effect  effect记录dep
export function trackEffect(effect, dep) {
    // 需要重新的收集依赖 把没用的删除掉（这是之前版本）
    // dep.set(effect, effect._tracdId); // 收集依赖
    // effect.dep[effect._depsLength++] = dep; // 记录依赖的effect

    console.log(dep.get(effect), effect._tracdId);
    // 这两个值不一样 需要做依赖收集 过滤了重复收集的问题（处理分支切换不必要的更新以及重复）
    if (dep.get(effect) !== effect._tracdId) { 
        dep.set(effect, effect._tracdId); // 优化了多余的收集
        let oldDep = effect.dep[effect._depsLength];
        // {flageffect, nameeffect}
        // {flageffect, ageeffect}
        
        // 如果没有存过 让effect 记录dep  如果存过了 直接跳过
        if (oldDep !== dep) {
            
            if (oldDep) {
                // 如果老的有值 说明对比的是第二次  删除掉老的 
                cleanDepEffect(oldDep, effect)
            }
            // 换成新的
            effect.dep[effect._depsLength++] = dep
        } else { // 表示已经存过了
            effect._depsLength++
        }
    }
    //上面代码解决了防止没必要的更新 例如：
    // const _effect = effect(() => {
    //     console.log('run');
    //     app.innerHTML = state.flag ? state.name : state.age
    // })
    
    // setTimeout(() => {
    //     state.flag = false
    //     setTimeout(() => {
    //         state.name = 'Mike'
    //     }, 1000)
    // }, 1000)  
}

export function triggerEffects(dep) { 
    for (const effect of dep.keys()) {
        // 当前值是不脏的  需要把当前值变为脏的
        if (effect._dirtyLevel < DirtyLevel.Dirty) {
            effect._dirtyLevel = DirtyLevel.Dirty
        }

        // 如果effect 正在执行 就不用再次执行了  防止死循环 math.random() 设置一个随机数防止每次都执行
        if (!effect._runnning) {
            if (effect.scheduler) {
                effect.scheduler()
            }
        }
    }

}