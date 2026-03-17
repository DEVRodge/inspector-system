import { isMockEnabled, mockRequest, request } from '../http'

/**
 * 获取可指派人员树（部门-岗位-人员）
 * 后端可能返回树状结构，格式示例：
 * [{ id, name, children: [{ id, name, children: [{ id, name }] }] }]
 * 或 { value, label, children } 等，由后端约定
 * @returns {Promise<Array>} 树节点数组，叶子节点为可选中人员
 */
export async function getAssignableUserTree() {
  if (isMockEnabled) {
    return mockRequest(buildMockAssignTree())
  }

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

/** Mock：从 orgRows 构建 部门-岗位-人员 树，叶子 value 为用户 id（后端 assign 需要 handlerId） */
function buildMockAssignTree() {
  const orgRows = [
    { key: '1', dept: '运维部', post: '巡检员', name: '张三', status: '启用' },
    { key: '2', dept: '运维部', post: '巡检员', name: '李四', status: '启用' },
    { key: '3', dept: '设备部', post: '设备工程师', name: '王工', status: '启用' },
  ].filter((r) => r.status === '启用')
  const map = new Map()
  for (const r of orgRows) {
    if (!map.has(r.dept)) map.set(r.dept, new Map())
    const postMap = map.get(r.dept)
    if (!postMap.has(r.post)) postMap.set(r.post, [])
    postMap.get(r.post).push({ id: r.key, name: r.name })
  }

  const tree = []
  for (const [dept, postMap] of map) {
    const postNodes = []
    for (const [post, users] of postMap) {
      postNodes.push({
        value: `post_${dept}_${post}`,
        title: post,
        selectable: false,
        children: users.map((u) => ({
          value: u.id,
          title: u.name,
          selectable: true,
        })),
      })
    }
    tree.push({
      value: `dept_${dept}`,
      title: dept,
      selectable: false,
      children: postNodes,
    })
  }
  return tree
}

/**
 * 将后端返回的树结构统一为 TreeSelect 所需格式
 * 支持：{ id, name, children } 或 { value, label, children } 等
 */
function normalizeAssignTree(data) {
  const list = Array.isArray(data) ? data : data?.list ?? data?.children ?? []
  return list.map((node) => normalizeNode(node))
}

function normalizeNode(node) {
  const title = node.title ?? node.label ?? node.name ?? '-'
  const children = node.children
  const isLeaf = !children?.length
  // 叶子节点（人员）value 为用户 id，后端 assign 需要 handlerId；非叶子用 id/key
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
