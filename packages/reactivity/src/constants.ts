
export enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}

export enum DirtyLevel {
    Dirty = 4, // 脏值 意味着取值的时候要重新运行计算属性
    Nodirty = 0 // 非脏值 使用上一次的缓存结果
}