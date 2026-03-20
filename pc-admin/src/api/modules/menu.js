import { request } from '../http'

/**
 * 将后端统一包装或分页字段中的「菜单树」解包为数组（兼容 R.data / list / records 等）
 * @param {*} payload
 * @returns {Array}
 */
export function normalizeMenuTreeResponse(payload) {
  if (payload == null) return []
  if (Array.isArray(payload)) return payload
  const inner =
    payload?.data ??
    payload?.result ??
    payload?.records ??
    payload?.list ??
    payload?.rows ??
    payload?.content
  if (Array.isArray(inner)) return inner
  // 少数实现把树根放在 children
  if (Array.isArray(payload?.children)) return payload.children
  // 单根节点（非数组）包一层
  const root = inner && typeof inner === 'object' ? inner : payload
  if (root && typeof root === 'object' && root.id != null && Array.isArray(root.children)) {
    return [root]
  }
  return []
}

/**
 * 获取当前登录用户树形菜单（已按权限过滤、排序）
 * 文档要求 query：endType=WEB|APP（Web 端必填 WEB）
 */
export function getMenusCurrentTree(params = {}) {
  const merged = { endType: 'WEB', ...params }
  return request({ url: '/menus/current-tree', method: 'get', params: merged }).then(normalizeMenuTreeResponse)
}

/**
 * 获取菜单列表（树形，按端类型筛选）— 用于系统管理「角色-菜单权限」配置全量树
 * @param {object} params - endType: 'WEB'|'APP', keyword?, enabled?
 */
export function getMenusTree(params = {}) {
  const merged = { endType: 'WEB', ...params }
  return request({ url: '/menus', method: 'get', params: merged }).then(normalizeMenuTreeResponse)
}
