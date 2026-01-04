//  求最长递增子序列

function getSequence(arr) {
    const res = [0]
    const p = res.slice(0) // 用于存放索引的
    const len = arr.length
    let start
    let end
    let middle
    for (let i=0; i<len; i++) {
        const arrI= arr[i]
        if (arrI !== 0) { // 为了vue3 而处理掉数组中的0的情况
            // 拿出结果集里的最后一项和当前项作比对
            let resLastIndex = res[res.length - 1]
            if (arr[resLastIndex] < arrI) {
                p[i] = res[res.length - 1] // 正常放入的就是前面一个节点的索引就是res中的最后一个
                res.push(i)
                continue
            }
        }
        start = 0
        end = res.length - 1
        while (start < end) {
            middle = ((start + end) / 2) | 0 // 向下取整
            if (arr[res[middle]] < arrI) {
                start = middle + 1
            } else {
                end = middle
            }
        }
        if (arrI < arr[res[start]]) {
            p[i] = res[start - 1] // 找到这个节点的前一个节点
            res[start] = i
        }
    } // 到这里求出了最长递增子序列个数 需要创建前驱节点来倒序追溯（应为最后一个节点不会错）正确的子序列

    console.log(res,'-------',p)

    // p为前驱节点的列表 需要根据最后一个节点做追溯
    let resLen = res.length
    let last = res[resLen - 1]// 去除最后一项
    while (resLen-- > 0) {
        res[resLen] = last
        last = p[last] // 在数组中找到最后一个
    }

    return res
}

console.log(getSequence([2,3,1,5,6,8,7,9,4]))