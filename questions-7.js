
// [a,b,c,d,e,f,g]  老元素
// [a,b,e,c,d,h,f,g]  新元素

// c d  e  [2,3, 4]   元素在数组中的位置
// e c d h [4,2, 3,0] // 新元素在老数组中的位置 0  表示新增数据


// 通过上面两个序列 可以求出来最终这样的结果 就可以保证某些元素不用动
// 需要求出来 [c,d] 对应的位置 [0 , 1]

//  需要求连续性最强的子序列
// 贪心算法 + 二分查找


// 2 3 7 6 8 4 9 11 -->求最长子序列个数



// 实现最长递增子序列



function getSequence(arr) { 
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
// console.log(getSequence([2, 6, 7, 8, 9, 11]));
console.log(getSequence([2,3,1,5,6,8,7,9,4]));




