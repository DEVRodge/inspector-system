/**
 * 计划任务 Cron 与表单的双向转换
 * 后端使用 XXL-Job，cron 为 7 段格式：秒 分 时 日 月 周 年
 * 周：1=周日 2=周一 ... 7=周六（Quartz/XXL-Job 约定）
 */

const CYCLE_ONCE = 'once'
const CYCLE_DAILY = 'daily'
const CYCLE_WEEKLY = 'weekly'
const CYCLE_MONTHLY = 'monthly'
const CYCLE_QUARTERLY = 'quarterly'
const CYCLE_YEARLY = 'yearly'
const CRON_WEEKDAY_TOKENS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function normalizeCycle(cycle) {
  return cycle ? String(cycle).toLowerCase() : ''
}

function weekdayToCronToken(weekday) {
  const idx = Number(weekday)
  return CRON_WEEKDAY_TOKENS[idx] ?? 'MON'
}

function cronTokenToWeekday(token) {
  if (token == null) return null
  const normalized = String(token).trim().toUpperCase()
  const tokenIndex = CRON_WEEKDAY_TOKENS.indexOf(normalized)
  if (tokenIndex >= 0) return tokenIndex

  // Quartz/XXL-Job 数字周：1=SUN, 2=MON, ... 7=SAT
  if (/^\d+$/.test(normalized)) {
    const quartzW = parseInt(normalized, 10)
    if (quartzW >= 1 && quartzW <= 7) return quartzW - 1
  }

  // 仅支持单个星期值；范围、列表不回填到单选控件
  return null
}

/**
 * 执行时间转为 cron（一次性任务）
 * @param {string} datetimeStr - "YYYY-MM-DD HH:mm"
 * @returns {string} XXL-Job 7 段 cron：秒 分 时 日 月 周 年
 */
export function executeAtToCron(datetimeStr) {
  if (!datetimeStr || typeof datetimeStr !== 'string') return ''
  const parts = datetimeStr.trim().split(/\s+/)
  if (parts.length < 2) return ''
  const [datePart, timePart] = parts
  const [y, m, d] = datePart.split(/[-/]/).map(Number)
  const [h, min] = timePart.split(':').map(Number)
  if (Number.isNaN(m) || Number.isNaN(d) || Number.isNaN(h) || Number.isNaN(min)) return ''
  const second = 0
  const minute = Math.min(59, Math.max(0, min))
  const hour = Math.min(23, Math.max(0, h))
  const day = Math.min(31, Math.max(1, d))
  const month = Math.min(12, Math.max(1, m))
  const year = Number.isNaN(y) || y < 1970 ? new Date().getFullYear() : y
  return `${second} ${minute} ${hour} ${day} ${month} ? ${year}`
}

/**
 * 从表单配置生成 XXL-Job cron 字符串（7 段：秒 分 时 日 月 周 年）
 * @param {{ cycle: string, time?: string, cycleExtra?: { weekday?: number, day?: number, month?: number }, executeAt?: string }} form
 * @returns {string | null} 一次性任务返回 executeAt 对应的 cron，周期任务返回 cron
 */
export function formToCron(form) {
  const { cycle, time, cycleExtra = {}, executeAt } = form
  const c = normalizeCycle(cycle)
  if (c === CYCLE_ONCE) {
    return executeAt ? executeAtToCron(executeAt) : null
  }

  const [h = 0, m = 0] = (time || '08:00').toString().split(':').map(Number)
  const second = 0
  const minute = Math.min(59, Math.max(0, m))
  const hour = Math.min(23, Math.max(0, h))

  switch (c) {
    case CYCLE_DAILY:
      return `${second} ${minute} ${hour} * * ?`
    case CYCLE_WEEKLY: {
      const w = cycleExtra.weekday != null ? cycleExtra.weekday : 1
      return `${second} ${minute} ${hour} ? * ${weekdayToCronToken(w)}`
    }
    case CYCLE_MONTHLY: {
      const day = Math.min(31, Math.max(1, cycleExtra.day ?? 1))
      return `${second} ${minute} ${hour} ${day} * ?`
    }
    case CYCLE_QUARTERLY:
      return `${second} ${minute} ${hour} 1 1,4,7,10 ?`
    case CYCLE_YEARLY: {
      const day = Math.min(31, Math.max(1, cycleExtra.day ?? 1))
      const month = Math.min(12, Math.max(1, cycleExtra.month ?? 1))
      return `${second} ${minute} ${hour} ${day} ${month} ?`
    }
    default:
      return `${second} ${minute} ${hour} * * ?`
  }
}

/**
 * 将 cron 解析为表单可用的 cycle / time / cycleExtra
 * 支持 XXL-Job 7 段（秒 分 时 日 月 周 年）及兼容 5 段（分 时 日 月 周）
 * @param {string} cron - 7 段或 5 段 cron
 * @returns {{ cycle: string, time: string, cycleExtra: object } | null} 无法解析时返回 null
 */
export function cronToForm(cron) {
  if (!cron || typeof cron !== 'string') return null
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return null

  let second, minute, hour, dayOfMonth, month, dayOfWeek, year
  if (parts.length >= 7) {
    [second, minute, hour, dayOfMonth, month, dayOfWeek, year] = parts
  } else if (parts.length >= 6) {
    [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts
    year = ''
  } else {
    [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    second = '0'
    year = ''
  }

  const minVal = parseInt(minute, 10)
  const hVal = parseInt(hour, 10)
  if (Number.isNaN(minVal) || Number.isNaN(hVal)) return null
  const time = `${String(hVal).padStart(2, '0')}:${String(minVal).padStart(2, '0')}`

  const isWild = (v) => v === '*' || v === '?'

  // 每日：* * ? 或 * * *
  if (isWild(dayOfMonth) && (isWild(month) || month === '*') && (isWild(dayOfWeek) || dayOfWeek === '?')) {
    return { cycle: 'daily', time, cycleExtra: {} }
  }

  // 每周（7/6 段）：? * w，支持 SUN/MON... 或 Quartz 数字 1-7
  if (dayOfMonth === '?' && (isWild(month) || month === '*') && dayOfWeek !== '*' && dayOfWeek !== '?') {
    const weekday = cronTokenToWeekday(dayOfWeek)
    if (weekday != null) {
      return { cycle: 'weekly', time, cycleExtra: { weekday } }
    }
  }

  // 每周（5 段兼容）：* * w（分 时 日 月 周，周 0-6）
  if (isWild(dayOfMonth) && (isWild(month) || month === '*') && dayOfWeek !== '*' && dayOfWeek !== '?') {
    const w = parseInt(dayOfWeek, 10)
    if (!Number.isNaN(w) && w >= 0 && w <= 6) {
      return { cycle: 'weekly', time, cycleExtra: { weekday: w } }
    }
  }

  // 每月：D * ?
  if (dayOfMonth !== '*' && dayOfMonth !== '?' && (isWild(month) || month === '*') && (isWild(dayOfWeek) || dayOfWeek === '?')) {
    const d = parseInt(dayOfMonth, 10)
    if (!Number.isNaN(d) && d >= 1 && d <= 31) {
      return { cycle: 'monthly', time, cycleExtra: { day: d } }
    }
  }

  // 季度：1 1,4,7,10 ?
  if (dayOfMonth === '1' && month === '1,4,7,10' && (isWild(dayOfWeek) || dayOfWeek === '?')) {
    return { cycle: 'quarterly', time, cycleExtra: {} }
  }

  // 年度：D M ?（单月）
  if (dayOfMonth !== '*' && dayOfMonth !== '?' && month !== '*' && !month.includes(',') && (isWild(dayOfWeek) || dayOfWeek === '?')) {
    const d = parseInt(dayOfMonth, 10)
    const m = parseInt(month, 10)
    if (!Number.isNaN(d) && d >= 1 && d <= 31 && !Number.isNaN(m) && m >= 1 && m <= 12) {
      if (year && year !== '*' && year !== '?') {
        const y = parseInt(year, 10)
        if (!Number.isNaN(y)) {
          const executeAt = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${time}`
          return { cycle: 'once', time, cycleExtra: {}, executeAt }
        }
      }
      return { cycle: 'yearly', time, cycleExtra: { day: d, month: m } }
    }
  }

  // 一次性任务：D M ? [年]（日、月为具体数字，有年则为 once）
  if (dayOfMonth !== '*' && dayOfMonth !== '?' && month !== '*' && !month.includes(',') && (isWild(dayOfWeek) || dayOfWeek === '?')) {
    const d = parseInt(dayOfMonth, 10)
    const m = parseInt(month, 10)
    if (!Number.isNaN(d) && d >= 1 && d <= 31 && !Number.isNaN(m) && m >= 1 && m <= 12) {
      const y = year && year !== '*' && year !== '?' ? parseInt(year, 10) : new Date().getFullYear()
      const executeAt = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${time}`
      return { cycle: 'once', time, cycleExtra: {}, executeAt }
    }
  }

  return null
}
