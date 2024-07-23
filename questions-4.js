
// 代码分支切换用例



const state = reactive({
    name: 'John',
    age: 20,
    flag: true
})

const _effect = effect(() => {
    console.log('run');
    app.innerHTML = state.flag ? state.name : state.age
})

setTimeout(() => {
    state.flag = false
    setTimeout(() => {
        state.name = 'Mike'
    }, 1000)
}, 1000)  