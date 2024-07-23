

// 防止重复收集依赖用例

const state = reactive({
    name: 'John',
    age: 20,
    flag: true
})

const _effect = effect(() => {
    console.log('run');
    app.innerHTML = state.flag + state.flag + state.flag
})