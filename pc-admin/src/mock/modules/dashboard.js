import { exceptionRows, quickTodoList } from '../data'
import { TASK_CYCLES, taskRows } from './task'

const overviewCards = [
  {
    key: 'devices',
    title: '设备总数',
    value: 286,
    suffix: '台',
    trend: '较上月 +12 台',
    formula: '设备总数 = 设备台账总数',
  },
  {
    key: 'todayTasks',
    title: '今日应执行任务',
    value: 64,
    suffix: '项',
    trend: '已完成 46 项',
    formula: '今日应执行任务 = 当日应执行的任务数量',
  },
  {
    key: 'exceptions',
    title: '待处理异常',
    value: 9,
    suffix: '条',
    trend: '待指派 2 条',
    formula: '待处理异常 = 待处理状态的异常条数',
  },
  {
    key: 'completionRate',
    title: '本月完成率',
    value: 96.2,
    suffix: '%',
    trend: '同比提升 4.3%',
    formula: '本月完成率 = 本月已完成任务数 / 本月应执行任务数 × 100%',
  },
]

const taskDistribution = [
  { name: '已完成', value: 46, color: '#52c41a' },
  { name: '执行中', value: 12, color: '#1677ff' },
  { name: '待执行', value: 18, color: '#faad14' },
  { name: '已逾期', value: 4, color: '#ff4d4f' },
]

const deviceStatusDistribution = [
  { name: '运行中', value: 264, color: '#52c41a' },
  { name: '检修中', value: 15, color: '#1677ff' },
  { name: '停用', value: 7, color: '#d9d9d9' },
]

const personLoads = [
  { key: '1', name: '张三', dept: '运维部', assigned: 22, completed: 18, exceptions: 2, completionRate: 98 },
  { key: '2', name: '李四', dept: '运维部', assigned: 20, completed: 14, exceptions: 3, completionRate: 94 },
  { key: '3', name: '王工', dept: '设备部', assigned: 14, completed: 10, exceptions: 2, completionRate: 91 },
  { key: '4', name: '赵六', dept: '信息部', assigned: 8, completed: 4, exceptions: 2, completionRate: 88 },
]

const recentNotices = [
  {
    key: '1',
    title: '待处理异常需优先指派',
    desc: '建议优先处理待处理异常与重复故障设备。',
  },
  {
    key: '2',
    title: 'A 区逆变器日检模板已发布新版本',
    desc: '版本 V1.3 将于明日 08:00 生效。',
  },
  {
    key: '3',
    title: '本周导出任务量较上周增长 18%',
    desc: '可提前核对报表口径与导出字段。',
  },
]

export function getDashboardMockData() {
  return {
    overviewCards,
    completionSummary: {
      completedTasks: 46,
      plannedTasks: 64,
      pendingExceptions: 9,
    },
    taskDistribution,
    deviceStatusDistribution,
    personLoads,
    todoList: quickTodoList,
    exceptionList: exceptionRows,
    taskList: taskRows.map((r) => ({
      ...r,
      type: TASK_CYCLES.find((c) => c.value === r.cycle)?.label ?? r.cycle,
      devices: r.deviceKeys?.length ?? 0,
    })),
    notices: recentNotices,
  }
}
