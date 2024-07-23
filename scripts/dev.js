// 这个文件会帮我们打包packages里面的代码，最终打包出js文件

// node scripts/dev.js reactivity -f esm  node 执行的文件  要打包的包名  -f esm 打包格式


// 解析命令行的参数
import minimist from "minimist";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import esbuild from "esbuild";
// esm使用commonjs模块 
// 当前文件的绝对路径 拿到的路径是file:///d:/vue3relatio  需要转化成 url://d:/vue3relation
const __filename = fileURLToPath(import.meta.url); 
// node中的esm模块没有 __dirname 
const __dirname = dirname(__filename); // 当前文件的目录
const require = createRequire(import.meta.url); // 引入模块  在node esm中使用require


const args = minimist(process.argv.slice(2));

const packageName = args._[0]; // 要打包的包名
const format = args.f || "iife"; // 打包格式


const entry = resolve(__dirname, `../packages/${packageName}/src/index.ts`); // 入口文件
const pkg = require(resolve(__dirname, `../packages/${packageName}/package.json`)); // 包的package.json文件

esbuild.context({
    entryPoints: [entry],
    outfile: resolve(__dirname, `../packages/${packageName}/dist/${packageName}.js`),
    bundle: true, // 打包成一个文件
    platform: "browser", // 打包浏览器环境
    sourcemap: true, // 生成sourcemap
    format: format, // 打包格式
    globalName: pkg.buildOptions?.name, // 全局变量名(iife格式才有 (function(){return this}())  需要全局变量接受)
}).then((ctx) => {
    console.log(`start dev`);
    return ctx.watch(); // 监听文件变化持续打包
})
