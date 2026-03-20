import { request } from '../http'

/**
 * 获取可指派人员树（部门-岗位-人员）
 */
export async function getAssignableUserTree() {
  try {
    const data = await request({
      url: '/users/assignable-tree',
      method: 'get',
    })
    return normalizeAssignTree(data)
  } catch {
    return []
  }
}

function normalizeAssignTree(data) {
  const list = Array.isArray(data) ? data : data?.list ?? data?.children ?? []
  return list.map((node) => normalizeNode(node))
}

function normalizeNode(node) {
  const title = node.title ?? node.label ?? node.name ?? '-'
  const children = node.children
  const isLeaf = !children?.length
  const value = isLeaf ? (node.id ?? node.value ?? node.key) : (node.value ?? node.id ?? node.key)

  const item = {
    value: String(value),
    title,
    selectable: isLeaf,
  }
  if (!isLeaf) {
    item.children = children.map(normalizeNode)
  }
  return item
}
