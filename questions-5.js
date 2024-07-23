


// scheduler 用例
let obj = {
    name: 'John',
    age: 25,
    flag: true,
    address: {
        city: 'New York',
    }
}
const state = reactive(obj)

const _effect = effect(() => {
    app.innerHTML = state.flag ? state.name : state.age
}, {
    scheduler: () => {
        console.log('数据更新了 不重新渲染走自己的逻辑');
        _effect()
    }
})