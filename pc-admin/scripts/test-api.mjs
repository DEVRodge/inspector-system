#!/usr/bin/env node
/**
 * 接口联调测试脚本
 * 用法: node scripts/test-api.mjs [BASE_URL]
 * 示例: node scripts/test-api.mjs http://localhost:8080/api
 *
 * 需先启动后端服务，并确保 CORS 允许跨域
 */
const BASE_URL = process.argv[2] || process.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const CLIENT_ID = process.env.VITE_OAUTH_CLIENT_ID || 'inspector_system'
const CLIENT_SECRET = process.env.VITE_OAUTH_CLIENT_SECRET || '6fbd48fb996b74d889387f5698b7f7a0'

let token = null

async function request(method, path, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { method, headers, ...options })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

async function test(name, fn) {
  try {
    const result = await fn()
    if (result?.ok !== false) {
      console.log(`✅ ${name}`)
      return true
    }
    console.log(`❌ ${name}: ${result?.status} ${JSON.stringify(result?.data)}`)
    return false
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`)
    return false
  }
}

async function main() {
  console.log(`\n🔗 测试接口: ${BASE_URL}\n`)

  // 1. 登录
  const loginOk = await test('POST /oauth2/token 登录', async () => {
    const body = new URLSearchParams({
      grant_type: 'password',
      username: 'admin',
      password: 'admin123',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
    const url = `${BASE_URL.replace(/\/$/, '')}/oauth2/token`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json().catch(() => ({}))
    if (data.access_token) {
      token = data.access_token
      return { ok: true }
    }
    return { ok: false, status: res.status, data }
  })

  if (!loginOk) {
    console.log('\n⚠️ 登录失败，请检查：')
    console.log('  1. 后端服务是否已启动')
    console.log('  2. BASE_URL 是否正确（如 http://localhost:8080/api）')
    console.log('  3. 用户名/密码、client_id/client_secret 是否与后端一致')
    process.exit(1)
  }

  // 2. 需认证的接口
  await test('GET /menus/current-tree 当前用户菜单', () => request('GET', '/menus/current-tree'))
  await test('GET /organizations 组织机构', () => request('GET', '/organizations'))
  await test('GET /organizations/list 组织机构列表', () => request('GET', '/organizations/list'))
  await test('GET /users 用户列表', () => request('GET', '/users?pageNumber=1&pageSize=10'))
  await test('GET /positions 岗位列表', () => request('GET', '/positions'))
  await test('GET /dictionary/page 数据字典分页', () => request('GET', '/dictionary/page?pageNumber=1&pageSize=10'))

  // 3. 登出
  await test('POST /login-out 登出', () => request('POST', '/login-out'))

  console.log('\n📋 测试完成\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
