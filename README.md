### vue 响应式模块及依赖收集的源码实现

------ 采用 monorepo 管理项目，目录结构如下：

```
.
├── packages
│   ├── compiler-core
│   │   ├── src
│   │   │   ├── index.ts
│   ├── reactivity
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── effect.ts
│   │   │   ├── ref.ts
│   │   │   ├── computed.ts
│   │   │   ├── reactive.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── runtime-core
│   │   ├── src
│   │   │   ├── index.ts
│   ├── runtime-dom
│   │   ├── src
│   │   │   ├── index.ts
│   ├── shared
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── PatchFlages.ts
│   │   │   ├── ShapFlahes.ts


```
-   `compiler-core`：抽象语法树的转化 以及代码explorer   依赖于 #https://template-explorer.vuejs.org/ 编写
-   `reactivity`：存放响应式模块的源码
-   `runtime-core`：h函数及render函数的编写 以及dom diff算法
-   `runtime-dom`：提供dom操作api 以及domdiff中用到的函数  依赖属性  // runtime-dom --> runtime-core ---> reactivity
-   `shared`：存放共享模块的源码

### 响应式模块 reactivity



### 总结

-   响应式模块：实现了数据响应式的功能，包括`effect`、`ref`、`computed`、`reactive`四个模块
-   依赖收集：实现了依赖收集功能，包括`effect`、`computed`、`reactive`、`ref`四个模块
-   自动派发：实现了自动派发功能，包括`effect`、`computed`、`reactive`、`ref`四个模块
-   采用 monorepo 管理项目，目录结构清晰，便于维护
-   代码实现清晰，易于理解
-   注释详细，易于理解
