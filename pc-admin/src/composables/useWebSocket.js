/**
 * WebSocket 消息推送连接
 * 使用 VITE_WS_URL 环境变量，部署到云服务器时在 .env.production 中修改为 wss://域名/websocket/msg
 */
import { onMounted, onUnmounted, ref } from 'vue'

const TOKEN_KEY = 'pc-admin-token'

export function useWebSocket(onMessage) {
  const wsRef = ref(null)
  const reconnectTimer = ref(null)
  const reconnectDelay = 3000

  function connect() {
    const baseUrl = import.meta.env.VITE_WS_URL
    if (!baseUrl || import.meta.env.VITE_ENABLE_MOCK === 'true') return

    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    const url = baseUrl.includes('?') ? `${baseUrl}&token=${encodeURIComponent(token)}` : `${baseUrl}?token=${encodeURIComponent(token)}`
    try {
      const ws = new WebSocket(url)
      wsRef.value = ws

      ws.onopen = () => {
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
        if (localStorage.getItem(TOKEN_KEY)) {
          reconnectTimer.value = setTimeout(connect, reconnectDelay)
        }
      }

      ws.onerror = () => {
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
      wsRef.value.close()
      wsRef.value = null
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return { ws: wsRef, connect, disconnect }
}
