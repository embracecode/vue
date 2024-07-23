import {
    reactive, 
    effect,
    computed
} from './reactivity.js'
let obj = {
    name: 'John',
    age: 25,
    flag: true,
    address: {
        city: 'New York',
    }
}
const state = reactive(obj)
const fullName = computed({
    get(oldname){
        console.log('old', oldname);
        return state.name +'1111111111'  
    },
    set(v){
        console.log(v);
    }
})
// 多次访问fullName，fullName只会执行一次effect，并缓存结果
effect(() => {
    console.log(fullName.value);
    console.log(fullName.value);
    console.log(fullName.value);
})

setTimeout(() => {
    fullName.value = '111'
}, 1000)
// 描述计算属性的实现原理
// 1. 计算属性内部维护了一个dirty 默认为true 运行过一次之后更改为false 只有当依赖的值发生变化时dirty才会变为true
// 2. 计算属性也是一个effect 依赖的属性回收集这个计算属性  当依赖的发生变化后 会重新执行computedEffect 并且让dirty变为true
// 3. 计算属性是具备收集依赖的能力 收集对应的effect 依赖的值发生了变化 会触发effect重新执行