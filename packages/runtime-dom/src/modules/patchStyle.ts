

export default function patchStyle(el, prevValue, nextValue) {
    let style = el.style;
    // { color: 'black', fontSize: '14px' }    新 { backgroundColor: 'white' }
    for (const key in nextValue) {
        style[key] = nextValue[key]; // 新样式全部生效
    }
    if (prevValue) {
        for (const key in prevValue) { 
            //看以前的属性是否存在于新样式中，如果不存在，则移除
            if (nextValue) {
                if (nextValue[key] == null) {
                    style[key] = ""; // 移除旧样式
                }
            }
        }
    }
}