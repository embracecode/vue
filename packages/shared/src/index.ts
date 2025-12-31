

export function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}
export function isRef(value) {   
  return isObject(value) && '__v_isRef' in value
}

export function isFunction(fn) {
  return typeof fn === 'function'
}
export * from './shapeFlags'


