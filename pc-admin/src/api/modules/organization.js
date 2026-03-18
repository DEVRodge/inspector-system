import { request } from '../http'

/**
 * 查询组织机构（树形）
 * @param {{ name?: string, enabled?: boolean, ids?: number[] }} params
 */
export function getOrganizations(params = {}) {
  return request({ url: '/organizations', method: 'get', params })
}

/**
 * 查询组织机构列表（扁平）
 * @param {{ name?: string, enabled?: boolean }} params - 服务端筛选（若后端支持）
 */
export function getOrganizationsList(params = {}) {
  return request({ url: '/organizations/list', method: 'get', params })
}

/**
 * 根据 ID 获取组织机构
 * @param {number|string} id
 */
export function getOrganizationById(id) {
  return request({ url: `/organizations/${id}`, method: 'get' })
}

/**
 * 根据部门 id 查询部门岗位和职位信息
 * @param {number|string} id
 */
export function getPostAndPosition(id) {
  return request({ url: `/organizations/postAndPosition/${id}`, method: 'get' })
}

/**
 * 新增组织机构
 * @param {object} data - { name, parentId?, remark?, enabled?, sort? }
 */
export function createOrganization(data) {
  return request({ url: '/organization', method: 'post', data })
}

/**
 * 修改组织机构
 * @param {number|string} id
 * @param {object} data
 */
export function updateOrganization(id, data) {
  return request({ url: `/organization/${id}`, method: 'put', data })
}

/**
 * 删除组织机构
 * @param {number|string} id
 */
export function deleteOrganization(id) {
  return request({ url: `/organization/${id}`, method: 'delete' })
}
