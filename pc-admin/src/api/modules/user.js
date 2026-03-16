import { request } from '../http'

/**
 * 分页查询用户
 * @param {{ pageNumber: number, pageSize: number, keyword?: string, organizationId?: number, positionId?: number, roleId?: string, enabled?: boolean }} params
 */
export function getUsers(params) {
  return request({ url: '/users', method: 'get', params })
}

/**
 * 根据主键获取用户详情（含部门、岗位、角色）
 * @param {number|string} id
 */
export function getUserById(id) {
  return request({ url: `/user/${id}`, method: 'get' })
}
