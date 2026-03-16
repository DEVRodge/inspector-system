import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout } from '../api/modules/auth'
import { isMockEnabled } from '../api/http'

const TOKEN_KEY = 'pc-admin-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref({
    name: '系统管理员',
    role: '运维平台主管',
  })

  const isLoggedIn = computed(() => Boolean(token.value))

  async function login(username, password) {
    if (isMockEnabled) {
      token.value = 'mock-token'
      localStorage.setItem(TOKEN_KEY, token.value)
      return
    }
    const res = await apiLogin(username, password)
    const accessToken = res?.access_token ?? res?.accessToken ?? res?.token
    if (accessToken) {
      token.value = accessToken
      localStorage.setItem(TOKEN_KEY, accessToken)
      if (res?.user?.name) user.value.name = res.user.name
      if (res?.user?.roles?.[0]?.name) user.value.role = res.user.roles[0].name
    } else {
      throw new Error(res?.error_description ?? res?.msg ?? '登录失败')
    }
  }

  async function logout() {
    if (!isMockEnabled) {
      try {
        await apiLogout()
      } catch {
        // 忽略退出接口失败
      }
    }
    token.value = ''
    user.value = { name: '系统管理员', role: '运维平台主管' }
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout,
  }
})
