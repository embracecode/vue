### vue 响应式模块及依赖收集的源码实现

.
├── README.md
此项目是以包的形式运行 导入所需要的包在 effect 副作用函数中使用即可
运行此项目在 packages/reactivity/index.html live server 此页面
.

------ 采用 monorepo 管理项目，目录结构如下：

```
.
├── packages
│   ├── reactivity
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── effect.ts
│   │   │   ├── ref.ts
│   │   │   ├── computed.ts
│   │   │   ├── reactive.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── shared
│   │   ├── src
│   │   │   ├── index.ts

```

-   `reactivity`：存放响应式模块的源码
-   `shared`：存放共享模块的源码

### 响应式模块

-   `effect`：实现依赖收集和自动派发
-   `ref`：实现响应式数据
-   `computed`：实现计算属性
-   `reactive`：实现响应式对象

### 依赖收集

-   `effect`：通过`effect`函数包裹的函数，会被收集到依赖收集器中，并在函数执行时自动派发
-   `computed`：通过`computed`函数包裹的函数，会被收集到依赖收集器中，并在函数执行时自动派发
-   `reactive`：通过`reactive`函数包裹的对象，会被收集到依赖收集器中，并在对象属性被访问时自动派发

### 自动派发

-   `effect`：在函数执行时，会自动收集依赖，并触发依赖收集器中的依赖，使得依赖函数重新执行
-   `computed`：在函数执行时，会自动收集依赖，并触发依赖收集器中的依赖，使得依赖函数重新执行
-   `reactive`：在对象属性被访问时，会自动收集依赖，并触发依赖收集器中的依赖，使得依赖函数重新执行

### 总结

-   响应式模块：实现了数据响应式的功能，包括`effect`、`ref`、`computed`、`reactive`四个模块
-   依赖收集：实现了依赖收集功能，包括`effect`、`computed`、`reactive`、`ref`四个模块
-   自动派发：实现了自动派发功能，包括`effect`、`computed`、`reactive`、`ref`四个模块
-   采用 monorepo 管理项目，目录结构清晰，便于维护
-   代码实现清晰，易于理解
-   注释详细，易于理解
