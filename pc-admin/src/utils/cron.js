/**
 * 计划任务 Cron 与表单的双向转换
 * Cron 5 段格式：分 时 日 月 周
 */

/**
 * 从表单配置生成 cron 字符串（周期任务）
 * @param {{ cycle: string, time?: string, cycleExtra?: { weekday?: number, day?: number, month?: number }, executeAt?: string }} form
 * @returns {string | null} 临时任务返回 null，周期任务返回 cron
 */
export function formToCron(form) {
  const { cycle, time, cycleExtra = {} } = form
  if (cycle === 'once') return null

  const [h = 0, m = 0] = (time || '08:00').toString().split(':').map(Number)
  const minute = Math.min(59, Math.max(0, m))
  const hour = Math.min(23, Math.max(0, h))

  switch (cycle) {
    case 'daily':
      return `${minute} ${hour} * * *`
    case 'weekly': {
      const w = cycleExtra.weekday != null ? cycleExtra.weekday : 1
      return `${minute} ${hour} * * ${w}`
    }
    case 'monthly': {
      const day = Math.min(31, Math.max(1, cycleExtra.day ?? 1))
      return `${minute} ${hour} ${day} * *`
    }
    case 'quarterly':
      return `${minute} ${hour} 1 1,4,7,10 *`
    case 'yearly': {
      const day = Math.min(31, Math.max(1, cycleExtra.day ?? 1))
      const month = Math.min(12, Math.max(1, cycleExtra.month ?? 1))
      return `${minute} ${hour} ${day} ${month} *`
    }
    default:
      return `${minute} ${hour} * * *`
  }
}

/**
 * 将 cron 解析为表单可用的 cycle / time / cycleExtra（仅支持本系统约定模式）
 * @param {string} cron - 5 段 cron：分 时 日 月 周
 * @returns {{ cycle: string, time: string, cycleExtra: object } | null} 无法解析时返回 null
 */
export function cronToForm(cron) {
  if (!cron || typeof cron !== 'string') return null
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return null

  const [min, hour, dayOfMonth, month, dayOfWeek] = parts
  const minute = parseInt(min, 10)
  const h = parseInt(hour, 10)
  if (Number.isNaN(minute) || Number.isNaN(h)) return null
  const time = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  // 每日：0 H m * * *
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { cycle: 'daily', time, cycleExtra: {} }
  }

  // 每周：0 H m * * w
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const w = parseInt(dayOfWeek, 10)
    if (!Number.isNaN(w) && w >= 0 && w <= 6) {
      return { cycle: 'weekly', time, cycleExtra: { weekday: w } }
    }
  }

  // 每月：0 H m D * *
  if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    const d = parseInt(dayOfMonth, 10)
    if (!Number.isNaN(d) && d >= 1 && d <= 31) {
      return { cycle: 'monthly', time, cycleExtra: { day: d } }
    }
  }

  // 季度：0 H m 1 1,4,7,10 *
  if (dayOfMonth === '1' && month === '1,4,7,10' && dayOfWeek === '*') {
    return { cycle: 'quarterly', time, cycleExtra: {} }
  }

  // 年度：0 H m D M *（单月）
  if (month !== '*' && !month.includes(',') && dayOfWeek === '*') {
    const d = parseInt(dayOfMonth, 10)
    const m = parseInt(month, 10)
    if (!Number.isNaN(d) && d >= 1 && d <= 31 && !Number.isNaN(m) && m >= 1 && m <= 12) {
      return { cycle: 'yearly', time, cycleExtra: { day: d, month: m } }
    }
  }

  return null
}
