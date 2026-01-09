

export function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}
export function isRef(value) {   
  return isObject(value) && '__v_isRef' in value
}

export function isFunction(fn) {
  return typeof fn === 'function'
}
export function isString(str) {
  return typeof str === 'string'
}
export * from './shapeFlags'
export * from './patchFlags'

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}


