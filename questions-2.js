// 防止effect 嵌套用例

import { effect } from "@vue/reactivity";

const state = reactive({
  name: "John",
  age: 20,
});


effect(() => {
  console.log(state.name);
  effect(() => {
    console.log(state.age);
  });
    console.log(state.name);
});