import { request } from '../http'

/**
 * 解包 GET /dictionary/list 常见响应（裸数组、data、records、list）
 * @param {*} payload
 * @returns {Array}
 */
export function unwrapDictionaryList(payload) {
  if (payload == null) return []
  if (Array.isArray(payload)) return payload
  const inner =
    payload?.data ?? payload?.records ?? payload?.list ?? payload?.rows ?? payload?.result
  if (Array.isArray(inner)) return inner
  return []
}

/**
 * 按字典类型编码查询列表（启用项，用于下拉等）
 * @param {string} code
 */
export function getDictionaryList(code) {
  return request({ url: '/dictionary/list', method: 'get', params: { code } }).then(unwrapDictionaryList)
}

/**
 * 分页查询字典
 * @param {object} params
 */
export function getDictionaryPage(params) {
  return request({ url: '/dictionary/page', method: 'get', params })
}

/**
 * 根据主键查询
 * @param {number|string} id
 */
export function getDictionaryById(id) {
  return request({ url: `/dictionary/${id}`, method: 'get' })
}

/**
 * 新增字典项
 * @param {object} data
 */
export function createDictionary(data) {
  return request({ url: '/dictionary', method: 'post', data })
}

/**
 * 修改字典项
 * @param {number|string} id
 * @param {object} data
 */
export function updateDictionary(id, data) {
  return request({ url: `/dictionary/${id}`, method: 'put', data })
}

/**
 * 删除字典项
 * @param {number|string} id
 */
export function deleteDictionary(id) {
  return request({ url: `/dictionary/${id}`, method: 'delete' })
}
