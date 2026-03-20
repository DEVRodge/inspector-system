/**
 * 与 AdminLayout `mapApiMenuToItems` 一致：菜单节点 path 规范化
 * @param {Record<string, unknown>} n
 * @returns {string | null}
 */
export function normalizeMenuNodePath(n) {
  if (!n || typeof n !== 'object') return null
  const path = n.path || n.key || ''
  if (!path) return null
  const s = String(path)
  return s.startsWith('/') ? s : `/${s}`
}

/**
 * 递归收集菜单树中所有可导航 path（含子节点）
 * @param {unknown} nodes
 * @returns {Set<string>}
 */
export function collectMenuPathsFromTree(nodes) {
  const set = new Set()
  if (!Array.isArray(nodes)) return set
  for (const n of nodes) {
    const key = normalizeMenuNodePath(n)
    if (key) set.add(key)
    if (n?.children && Array.isArray(n.children) && n.children.length > 0) {
      const child = collectMenuPathsFromTree(n.children)
      child.forEach((p) => set.add(p))
    }
  }
  return set
}
