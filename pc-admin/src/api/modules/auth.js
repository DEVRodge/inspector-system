import { http, request } from '../http'

/**
 * 登录获取 token
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ access_token?: string }>}
 */
export function login(username, password) {
  const params = new URLSearchParams()
  params.append('grant_type', 'pwd')
  params.append('username', username)
  params.append('password', password)
  params.append('client_id', 'inspector_system')
  params.append('client_secret', '6fbd48fb996b74d889387f5698b7f7a0')

  return http.post('/oauth2/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then((res) => res.data)
}

/**
 * 退出登录
 */
export function logout() {
  return request({ url: '/login-out', method: 'post' })
}
