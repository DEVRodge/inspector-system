import { http, request } from '../http'

const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID || 'inspector_system'
const clientSecret = import.meta.env.VITE_OAUTH_CLIENT_SECRET || ''

/**
 * 登录获取 token
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ access_token?: string }>}
 */
export function login(username, password) {
  const form = new FormData()
  form.append('grant_type', 'pwd')
  form.append('username', username)
  form.append('password', password)
  form.append('client_id', clientId)
  form.append('client_secret', clientSecret)

  return http.post('/oauth2/token', form).then((res) => res.data)
}

/**
 * 退出登录
 */
export function logout() {
  return request({ url: '/login-out', method: 'post' })
}
