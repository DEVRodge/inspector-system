import { request } from '../http'

/**
 * 分页查询角色
 * @param {{ pageNumber: number, pageSize: number, keyword?: string, name?: string, enabled?: boolean }} params
 */
export function getRoles(params) {
  return request({ url: '/roles', method: 'get', params })
}

/**
 * 获取角色菜单（可按端类型筛选）
 * @param {number|string} id 角色主键
 * @param {{ endType?: 'WEB'|'APP' }} params
 */
export function getRoleMenus(id, params = {}) {
  return request({ url: `/role/${id}/menus`, method: 'get', params })
}

/**
 * 获取角色下的用户 id 列表
 * @param {number|string} id 角色主键
 */
export function getRoleUserIds(id) {
  return request({ url: `/role/${id}/userid/list`, method: 'get' })
}

/**
 * 保存角色与菜单关系（单菜单）
 * @param {number|string} roleId
 * @param {number} menuId
 */
export function saveRoleMenuMapping(roleId, menuId) {
  return request({ url: `/role/${roleId}/menu-mapping`, method: 'post', params: { menuId } })
}

/**
 * 移除角色与菜单关系（单菜单）
 * @param {number|string} roleId
 * @param {number} menuId
 */
export function deleteRoleMenuMapping(roleId, menuId) {
  return request({ url: `/role/${roleId}/menu-mapping`, method: 'delete', params: { menuId } })
}

/**
 * 新增角色
 * @param {object} data - { name, remark?, enabled }
 */
export function createRole(data) {
  return request({ url: '/role', method: 'post', data })
}

/**
 * 修改角色
 * @param {number|string} id
 * @param {object} data
 */
export function updateRole(id, data) {
  return request({ url: `/role/${id}`, method: 'put', data })
}

/**
 * 删除角色
 * @param {number|string} id
 */
export function deleteRole(id) {
  return request({ url: `/role/${id}`, method: 'delete' })
}
