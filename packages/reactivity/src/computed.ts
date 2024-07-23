import { ReactiveEffect, trackRefValue, triggerRefValue } from "@vue/reactivity";
import { isFunction } from "@vue/shared";




class ComputedRefImpl {
    public _value
    public _effect
    public dep
    constructor(getter, public setter) {
        this._effect = new ReactiveEffect(
            () => getter(this._value),
            () => {
                // 计算属性值变化了应该重新执行渲染 effect
                triggerRefValue(this)
            }
        )
    }
    get value() { // 让计算属性收集对应的effect
        if (this._effect.dirty) { // 第一次是脏的 执行之后就不脏了
            this._value = this._effect.run()
            // 如果当前在effect中访问了计算属性， 计算属性是可以收集这个effect的 然后 计算属性值发生变化会重新执行effect
            trackRefValue(this)
        }

        return this._value
    }
    set value(newVal) { 
        this.setter(newVal)
    }
}


export function computed(getterOrOptins) { 

    
    const onlyGetter = isFunction(getterOrOptins)

    let getter 
    let setter
    if (onlyGetter) {
        getter = getterOrOptins
        setter = () => { }
    } else {
        getter = getterOrOptins.get
        setter = getterOrOptins.set
    }

    return new ComputedRefImpl(getter, setter) // 计算属性的ref
}