/**
 * WebSocket 消息推送连接
 * - VITE_WS_URL：完整 wss 地址；或相对路径如 /api/websocket/msg（与 HTTP 同源前缀，开发时走 Vite /api 代理）
 */
import { onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const TOKEN_KEY = 'pc-admin-token'

function resolveWsBaseUrl() {
  const raw = (import.meta.env.VITE_WS_URL || '').trim()
  if (raw.startsWith('/')) {
    if (typeof window === 'undefined') return ''
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}${raw}`
  }
  if (raw) return raw
  // 打包后 import.meta.env.DEV 为 false，若未配置 VITE_WS_URL 会永远连不上；与开发环境一致默认走同源 /api
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/api/websocket/msg`
  }
  return ''
}

export function useWebSocket(onMessage) {
  const authStore = useAuthStore()
  const { token } = storeToRefs(authStore)

  const wsRef = ref(null)
  const reconnectTimer = ref(null)
  const reconnectDelay = 3000
  /** 主动断开时不触发 onclose 里的自动重连 */
  let closingIntentionally = false

  function connect() {
    const baseUrl = resolveWsBaseUrl()
    if (!baseUrl) {
      console.warn('[WebSocket] 无法解析连接地址，跳过连接')
      return
    }

    const tokenVal = token.value || (typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : '')
    if (!tokenVal) {
      if (import.meta.env.DEV) {
        console.warn('[WebSocket] 无登录 token，跳过连接')
      }
      return
    }

    const url = baseUrl.includes('?')
      ? `${baseUrl}&token=${encodeURIComponent(tokenVal)}`
      : `${baseUrl}?token=${encodeURIComponent(tokenVal)}`

    closingIntentionally = false
    try {
      const ws = new WebSocket(url)
      wsRef.value = ws

      ws.onopen = () => {
        console.info('[WebSocket] 已连接', baseUrl.replace(/\?.*$/, ''))
        if (reconnectTimer.value) {
          clearTimeout(reconnectTimer.value)
          reconnectTimer.value = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
          onMessage?.(data)
        } catch {
          onMessage?.(event.data)
        }
      }

      ws.onclose = () => {
        wsRef.value = null
        if (closingIntentionally) {
          closingIntentionally = false
          return
        }
        const stillLoggedIn =
          (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) || token.value
        if (stillLoggedIn) {
          reconnectTimer.value = setTimeout(connect, reconnectDelay)
        }
      }

      ws.onerror = () => {
        console.warn('[WebSocket] 连接错误', baseUrl.replace(/\?.*$/, ''))
        ws.close()
      }
    } catch (e) {
      console.warn('WebSocket connect failed:', e)
      reconnectTimer.value = setTimeout(connect, reconnectDelay)
    }
  }

  function disconnect() {
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }
    if (wsRef.value) {
      closingIntentionally = true
      wsRef.value.close()
      wsRef.value = null
    }
  }

  watch(
    token,
    (t) => {
      disconnect()
      if (t) {
        connect()
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    disconnect()
  })

  return { ws: wsRef, connect, disconnect }
}
