import dayjs from 'dayjs'

/**
 * 后端时间戳转毫秒。Java 秒级多为 10 位，JS/部分 Long 为毫秒 13 位。
 * 小于 1e12 的数值按「秒」处理（现代毫秒时间戳均 ≥ 1e12）。
 * @param {unknown} value
 * @returns {number | null}
 */
export function backendTimeToMs(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n < 1e12) return Math.round(n * 1000)
  return Math.round(n)
}

/**
 * @param {unknown} value
 * @returns {import('dayjs').Dayjs | null}
 */
export function parseBackendDateTime(value) {
  const ms = backendTimeToMs(value)
  if (ms != null) return dayjs(ms)
  if (typeof value === 'string' || value instanceof Date) {
    const d = dayjs(value)
    return d.isValid() ? d : null
  }
  return null
}

/**
 * 全局展示：时间戳（秒/毫秒）/ ISO / 日期字符串 → 本地格式化
 * @param {unknown} value
 * @param {string} [pattern]
 * @returns {string}
 */
export function formatDateTime(value, pattern = 'YYYY-MM-DD HH:mm:ss') {
  if (value == null || value === '') return '—'
  const ms = backendTimeToMs(value)
  if (ms != null) return dayjs(ms).format(pattern)
  const d = dayjs(value)
  return d.isValid() ? d.format(pattern) : String(value)
}

/**
 * 仅日期
 * @param {unknown} value
 * @returns {string}
 */
export function formatDate(value) {
  return formatDateTime(value, 'YYYY-MM-DD')
}
