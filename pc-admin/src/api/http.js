import axios from 'axios'

const MOCK_DELAY_MS = 220
const TOKEN_KEY = 'pc-admin-token'

export const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK !== 'false'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  const isAuthEndpoint =
    config.url?.includes('/oauth2/token') ||
    config.url?.includes('/login-out') ||
    config.url?.includes('/public/')
  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

export function request(config) {
  return http.request(config).then((response) => response.data)
}

export function mockRequest(factory, delay = MOCK_DELAY_MS) {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const payload = typeof factory === 'function' ? factory() : factory
      resolve(cloneData(payload))
    }, delay)
  })
}
