import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getMenusCurrentTree } from '../api/modules/menu'

const CACHE_KEY = 'pc-admin-menu-tree-cache-v1'

function readSessionCache() {
  try {
    const s = sessionStorage.getItem(CACHE_KEY)
    if (!s) return null
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeSessionCache(tree) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(tree))
  } catch {
    /* ignore */
  }
}

function clearSessionCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * 侧边栏菜单：原始树（可序列化）、加载状态；支持 session 缓存与登录后预拉取
 */
export const useAppMenuStore = defineStore('appMenu', () => {
  /** @type {import('vue').Ref<Record<string, unknown>[]>} */
  const rawTree = ref([])
  /** idle | loading | ready | error */
  const status = ref('idle')
  const lastError = ref('')

  /**
   * @param {{ refreshOnly?: boolean }} options
   * - refreshOnly: 仅请求接口更新（用于有缓存时的后台刷新）；失败时保留已有 rawTree
   */
  async function fetchMenus(options = {}) {
    const { refreshOnly = false } = options
    lastError.value = ''

    if (!refreshOnly) {
      const cached = readSessionCache()
      if (cached && cached.length > 0) {
        rawTree.value = cached
        status.value = 'ready'
        fetchMenus({ refreshOnly: true }).catch(() => {})
        return
      }
    }

    const showLoading = !refreshOnly || rawTree.value.length === 0
    if (showLoading) {
      status.value = 'loading'
    }

    try {
      const tree = await getMenusCurrentTree({ endType: 'WEB' })
      const arr = Array.isArray(tree) ? tree : []
      rawTree.value = arr
      writeSessionCache(arr)
      status.value = arr.length > 0 ? 'ready' : 'error'
      if (arr.length === 0) {
        lastError.value = '未返回菜单数据'
      }
    } catch (e) {
      if (refreshOnly && rawTree.value.length > 0) {
        return
      }
      status.value = 'error'
      lastError.value = e?.message || '菜单加载失败'
      if (rawTree.value.length === 0) {
        rawTree.value = []
      }
    }
  }

  function reset() {
    rawTree.value = []
    status.value = 'idle'
    lastError.value = ''
    clearSessionCache()
  }

  return {
    rawTree,
    status,
    lastError,
    fetchMenus,
    reset,
  }
})
