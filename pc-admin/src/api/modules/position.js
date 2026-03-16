import { request } from '../http'

/**
 * 查询岗位
 * @param {object} params
 */
export function getPositions(params = {}) {
  return request({ url: '/positions', method: 'get', params })
}

/**
 * 根据 id 列表获取岗位
 * @param {number[]|string} ids
 */
export function getPositionsByIds(ids) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids
  return request({ url: '/position/ids', method: 'get', params: { ids: idStr } })
}

/**
 * 通过 ID 查询岗位
 * @param {number|string} id
 */
export function getPositionById(id) {
  return request({ url: `/position/${id}`, method: 'get' })
}

/**
 * 新增岗位
 * @param {object} data
 */
export function createPosition(data) {
  return request({ url: '/position', method: 'post', data })
}

/**
 * 修改岗位
 * @param {number|string} id
 * @param {object} data
 */
export function updatePosition(id, data) {
  return request({ url: `/position/${id}`, method: 'put', data })
}

/**
 * 删除岗位
 * @param {number|string} id
 */
export function deletePosition(id) {
  return request({ url: `/position/${id}`, method: 'delete' })
}
