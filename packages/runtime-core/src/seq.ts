export function getSequence(arr) { 
    const result = [0] // 存的是索引
    const parentIndex = [0] // 存的是父节点索引
    const leng = arr.length
    let start
    let end
    let middle
    for (let i = 0; i < leng; i++) { 
        const arrI = arr[i]
        if (arrI !== 0) { // 用在vue3 中 去掉零的情况 [5,3,4,0] 0 不要
            // 拿出结果集中的最后一样与当前项作对比
            let resultLastIndex = result[result.length - 1]
            if (arr[resultLastIndex] < arrI) {
                // 正常放入的时候 放的是前一个节点的索引 也就是rusult的最后一个元素
                parentIndex[i] = result[result.length - 1]

                result.push(i)
                continue
            }

        }
        start = 0
        end = result.length - 1
        while (start < end) { 
            middle = Math.floor((start + end) / 2)
            if (arr[result[middle]] < arrI) {
                start = middle + 1
            } else {
                end = middle
            }
        }
        
        if (arrI < arr[result[start]]) {
            parentIndex[i] = result[start - 1] // 找到那个节点的前一个结点
            result[start] = i
        }
    }
    // parentIndex 为前驱节点的列表 需要根据最有一个节点做追溯

    let resultLeng = result.length
    let resulLast = result[resultLeng - 1] // 取出最后一项

    while(resultLeng-- > 0) {
        result[resultLeng] = resulLast
        resulLast = parentIndex[resulLast]
    }

    // 需要创建一个前驱节点 进行倒叙追溯 （因为最后一项是不会错的）
    return result
}