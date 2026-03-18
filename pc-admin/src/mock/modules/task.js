import { equipmentRows } from '../equipment'

export { equipmentRows }

/** 执行周期：每日、每周、每月、季度、年度、临时任务（value 与 Apifox 枚举一致） */
export const TASK_CYCLES = [
  { value: 'DAILY', label: '每日' },
  { value: 'WEEKLY', label: '每周' },
  { value: 'MONTHLY', label: '每月' },
  { value: 'QUARTERLY', label: '季度' },
  { value: 'YEARLY', label: '年度' },
  { value: 'ONCE', label: '临时任务' },
]

/** 是否启用选项 */
export const TASK_ENABLED_OPTIONS = [
  { value: true, label: '启用' },
  { value: false, label: '禁用' },
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

/** 计划任务列表（与 Apifox InspectionTaskVO 对齐：team/owner 为 id，enabled，deviceIds） */
export const taskRows = [
  {
    key: '1',
    plan: 'A 区逆变器日检',
    cycle: 'DAILY',
    time: '08:00',
    cycleExtra: {},
    executeAt: null,
    cron: '0 8 * * *',
    team: 1,
    teamName: '运维部',
    owner: 1,
    ownerName: '张三',
    enabled: true,
    deviceIds: [1, 2],
  },
  {
    key: '2',
    plan: 'B 区逆变器日检',
    cycle: 'DAILY',
    time: '08:00',
    cycleExtra: {},
    executeAt: null,
    cron: '0 8 * * *',
    team: 1,
    teamName: '运维部',
    owner: 2,
    ownerName: '李四',
    enabled: true,
    deviceIds: [2, 3],
  },
  {
    key: '3',
    plan: '全厂周检',
    cycle: 'WEEKLY',
    time: '09:30',
    cycleExtra: { weekday: 1 },
    executeAt: null,
    cron: '30 9 * * 1',
    team: 1,
    teamName: '运维部',
    owner: 3,
    ownerName: '王五',
    enabled: true,
    deviceIds: [1, 2, 3, 4],
  },
  {
    key: '4',
    plan: '临时专项检查',
    cycle: 'ONCE',
    time: null,
    cycleExtra: {},
    executeAt: '2025-09-15 14:30',
    cron: '30 14 15 9 *',
    team: 2,
    teamName: '设备部',
    owner: 4,
    ownerName: '王工',
    enabled: true,
    deviceIds: [3],
  },
  {
    key: '5',
    plan: '年度大检',
    cycle: 'YEARLY',
    time: '09:00',
    cycleExtra: { month: 1, day: 1 },
    executeAt: null,
    cron: '0 9 1 1 *',
    team: 2,
    teamName: '设备部',
    owner: 4,
    ownerName: '王工',
    enabled: false,
    deviceIds: [1, 2, 3, 4],
  },
]

/** 根据 deviceIds 或 deviceKeys 获取设备列表（用于展示） */
export function getDevicesByKeys(keys = []) {
  if (!keys.length) return []
  const keySet = new Set(keys.map((k) => String(k)))
  return equipmentRows.filter((e) => keySet.has(String(e.key)) || keySet.has(String(e.id ?? e.key)))
}
