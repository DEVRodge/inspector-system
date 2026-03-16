import { http, request } from '../http'

/**
 * 登录获取 token
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ access_token?: string }>}
 */
export function login(username, password) {
  const form = new FormData()
  form.append('grant_type', 'pwd') // 固定写死为 pwd
  form.append('username', username)
  form.append('password', password)
  form.append('client_id', 'inspector_system')
  form.append('client_secret', '6fbd48fb996b74d889387f5698b7f7a0')

  return http.post('/oauth2/token', form).then((res) => res.data)
}

/**
 * 退出登录
 */
export function logout() {
  return request({ url: '/login-out', method: 'post' })
}
