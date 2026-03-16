import { request } from '../http'

/**
 * 获取当前登录用户树形菜单（已按权限过滤、排序）
 * @param {object} params - 可选，如 terminalType 端类型
 */
export function getMenusCurrentTree(params = {}) {
  return request({ url: '/menus/current-tree', method: 'get', params })
}

/**
 * 获取菜单列表（树形，按端类型筛选）
 * @param {object} params - endType: 'WEB'|'APP', keyword?, enabled?
 */
export function getMenusTree(params = {}) {
  return request({ url: '/menus', method: 'get', params })
}
