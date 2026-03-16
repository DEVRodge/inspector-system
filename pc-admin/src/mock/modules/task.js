import { equipmentRows } from '../equipment'

export { equipmentRows }

/** 执行周期：每日、每周、每月、季度、年度、临时任务 */
export const TASK_CYCLES = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '季度' },
  { value: 'yearly', label: '年度' },
  { value: 'once', label: '临时任务' },
]

/** 任务状态 */
export const TASK_STATUSES = [
  { value: '待执行', label: '待执行' },
  { value: '执行中', label: '执行中' },
  { value: '已完成', label: '已完成' },
  { value: '已逾期', label: '已逾期' },
  { value: '已关闭', label: '已关闭' },
]

/** 星期选项（每周） */
export const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
]

/** 计划任务列表（含设备 key 列表、执行周期、执行时间、cron） */
export const taskRows = [
  {
    key: '1',
    plan: 'A 区逆变器日检',
    cycle: 'daily',
    time: '08:00',
    cycleExtra: {},
    executeAt: null,
    cron: '0 8 * * *',
    team: '运维部',
    owner: '张三',
    status: '执行中',
    deviceKeys: ['1', '2'],
  },
  {
    key: '2',
    plan: 'B 区逆变器日检',
    cycle: 'daily',
    time: '08:00',
    cycleExtra: {},
    executeAt: null,
    cron: '0 8 * * *',
    team: '运维部',
    owner: '李四',
    status: '待执行',
    deviceKeys: ['2', '3'],
  },
  {
    key: '3',
    plan: '全厂周检',
    cycle: 'weekly',
    time: '09:30',
    cycleExtra: { weekday: 1 },
    executeAt: null,
    cron: '30 9 * * 1',
    team: '运维部',
    owner: '王五',
    status: '待执行',
    deviceKeys: ['1', '2', '3', '4'],
  },
  {
    key: '4',
    plan: '临时专项检查',
    cycle: 'once',
    time: null,
    cycleExtra: {},
    executeAt: '2025-09-15 14:30',
    cron: null,
    team: '设备部',
    owner: '王工',
    status: '待执行',
    deviceKeys: ['3'],
  },
  {
    key: '5',
    plan: '年度大检',
    cycle: 'yearly',
    time: '09:00',
    cycleExtra: { month: 1, day: 1 },
    executeAt: null,
    cron: '0 9 1 1 *',
    team: '设备部',
    owner: '王工',
    status: '待执行',
    deviceKeys: ['1', '2', '3', '4'],
  },
]

/** 根据 deviceKeys 获取设备列表（用于展示） */
export function getDevicesByKeys(keys = []) {
  if (!keys.length) return []
  return equipmentRows.filter((e) => keys.includes(e.key))
}
