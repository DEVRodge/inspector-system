import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout } from '../api/modules/auth'
import { useAppMenuStore } from './appMenu'
import { getUserById } from '../api/modules/user'
import {
  formatAuthoritiesFromClaims,
  parseJwtPayload,
  pickUserIdFromClaims,
} from '../utils/jwt'

const TOKEN_KEY = 'pc-admin-token'
const USER_PROFILE_KEY = 'pc-admin-user-profile'
const LAST_USERNAME_KEY = 'pc-admin-last-username'

function emptyUser() {
  return { name: '', role: '' }
}

function loadPersistedUser() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY)
    if (!raw) return emptyUser()
    const p = JSON.parse(raw)
    if (p && typeof p === 'object') {
      return {
        name: typeof p.name === 'string' ? p.name : '',
        role: typeof p.role === 'string' ? p.role : '',
      }
    }
  } catch {
    /* ignore */
  }
  return emptyUser()
}

function persistUserProfile(u) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify({ name: u.name, role: u.role }))
  } catch {
    /* ignore */
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(loadPersistedUser())

  const isLoggedIn = computed(() => Boolean(token.value))

  /**
   * OAuth2 token 接口通常只返回 access_token，不包含 user；
   * 通过 JWT 中的用户 id（若有）请求 GET /user/{id} 刷新右上角姓名与角色。
   * @param {string} [loginUsername] 登录时填写的账号，用于无 JWT 或无 id 时的兜底展示
   * @param {{ fallbackName?: string, fallbackRole?: string }} [embedded] token 响应里若自带 user，用于兜底避免被弱解析覆盖
   */
  async function hydrateUserProfile(loginUsername, embedded = {}) {
    const accessToken = token.value
    if (!accessToken) return

    const uname =
      (loginUsername && String(loginUsername).trim()) ||
      localStorage.getItem(LAST_USERNAME_KEY) ||
      ''
    if (loginUsername) {
      try {
        localStorage.setItem(LAST_USERNAME_KEY, String(loginUsername).trim())
      } catch {
        /* ignore */
      }
    }

    const fallbackName = embedded?.fallbackName
    const fallbackRole = embedded?.fallbackRole
    const claims = parseJwtPayload(accessToken)
    const userId = pickUserIdFromClaims(claims)

    if (userId) {
      try {
        const u = await getUserById(userId)
        const roleNames = (u?.roles || [])
          .map((r) => r?.name)
          .filter(Boolean)
        user.value = {
          name: u?.name || uname || '用户',
          role: roleNames.join('、') || formatAuthoritiesFromClaims(claims) || '—',
        }
        persistUserProfile(user.value)
        return
      } catch {
        /* 继续走 claims / 账号兜底 */
      }
    }

    const nameFromClaims =
      (claims && (claims.name ?? claims.nickname ?? claims.user_name ?? claims.preferred_username)) ||
      ''
    const roleFromClaims = formatAuthoritiesFromClaims(claims)
    user.value = {
      name:
        (typeof nameFromClaims === 'string' && nameFromClaims) ||
        (typeof fallbackName === 'string' && fallbackName) ||
        uname ||
        '用户',
      role: roleFromClaims || (typeof fallbackRole === 'string' && fallbackRole) || '—',
    }
    persistUserProfile(user.value)
  }

  async function login(username, password) {
    const trimmedUser = String(username || '').trim()
    const res = await apiLogin(username, password)
    const accessToken = res?.access_token ?? res?.accessToken ?? res?.token
    if (accessToken) {
      token.value = accessToken
      localStorage.setItem(TOKEN_KEY, accessToken)
      if (res?.user?.name) user.value.name = res.user.name
      if (res?.user?.roles?.[0]?.name) user.value.role = res.user.roles[0].name
      await hydrateUserProfile(trimmedUser, {
        fallbackName: res?.user?.name,
        fallbackRole: res?.user?.roles?.[0]?.name,
      })
    } else {
      throw new Error(res?.error_description ?? res?.msg ?? '登录失败')
    }
  }

  async function logout() {
    try {
      await apiLogout()
    } catch {
      // 忽略退出接口失败
    }
    token.value = ''
    user.value = emptyUser()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_PROFILE_KEY)
    localStorage.removeItem(LAST_USERNAME_KEY)
    useAppMenuStore().reset()
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout,
    hydrateUserProfile,
  }
})
