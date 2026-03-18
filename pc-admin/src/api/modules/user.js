import { request } from '../http'

/**
 * 分页查询用户
 * @param {{ pageNumber?: number, pageSize?: number, keyword?: string, organizationId?: number, positionId?: number, roleId?: string, enabled?: boolean }} params
 */
export function getUsers(params = {}) {
  const clean = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v
  }
  return request({ url: '/users', method: 'get', params: clean })
}

/**
 * 根据主键获取用户详情（含部门、岗位、角色）
 * @param {number|string} id
 */
export function getUserById(id) {
  return request({ url: `/user/${id}`, method: 'get' })
}

/**
 * 新增用户
 * @param {object} data - UserModifyParam: name, mobile, username, password?, enabled, organizationIds[], positionIds[], roleIds[]
 */
export function createUser(data) {
  return request({ url: '/user', method: 'post', data })
}

/**
 * 修改用户
 * @param {number|string} id
 * @param {object} data
 */
export function updateUser(id, data) {
  return request({ url: `/user/${id}`, method: 'put', data })
}

/**
 * 删除用户（软删除）
 * @param {number|string} id
 */
export function deleteUser(id) {
  return request({ url: `/user/${id}`, method: 'delete' })
}

/**
 * 重置用户密码
 * @param {number|string} id
 * @param {{ newPassword: string }} data
 */
export function resetUserPassword(id, data) {
  return request({ url: `/user/${id}/reset-password`, method: 'put', data })
}
