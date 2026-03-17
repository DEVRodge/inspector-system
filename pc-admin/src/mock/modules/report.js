const periodMap = {
  week: {
    labels: ['03-07', '03-08', '03-09', '03-10', '03-11', '03-12', '03-13'],
    completionRate: [91, 93, 95, 94, 96, 97, 96],
    exceptionCount: [8, 6, 7, 5, 6, 4, 5],
  },
  month: {
    labels: ['第1周', '第2周', '第3周', '第4周'],
    completionRate: [92, 95, 97, 96],
    exceptionCount: [34, 28, 22, 27],
  },
  quarter: {
    labels: ['1 月', '2 月', '3 月'],
    completionRate: [90, 94, 96],
    exceptionCount: [42, 35, 27],
  },
  year: {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    completionRate: [88, 90, 91, 92, 93, 94, 95, 94, 95, 96, 96, 96.2],
    exceptionCount: [32, 28, 30, 26, 25, 24, 22, 24, 23, 27, 26, 27],
  },
}

const personWorkload = [
  { key: '1', name: '张三', tasks: 42, devices: 156, exceptions: 3, completionRate: 98 },
  { key: '2', name: '李四', tasks: 38, devices: 142, exceptions: 4, completionRate: 95 },
  { key: '3', name: '王五', tasks: 35, devices: 128, exceptions: 2, completionRate: 97 },
  { key: '4', name: '王工', tasks: 28, devices: 98, exceptions: 5, completionRate: 89 },
  { key: '5', name: '赵六', tasks: 22, devices: 76, exceptions: 1, completionRate: 96 },
]

const exceptionDistribution = [
  { name: '待处理', value: 6, color: '#faad14' },
  { name: '处理中', value: 12, color: '#1677ff' },
  { name: '已处理', value: 9, color: '#52c41a' },
]

const riskDevices = [
  {
    key: '1',
    device: 'INV-A-002',
    inspections: 17,
    exceptions: 4,
    completionRate: '89%',
    latestIssue: '运行指示异常闪烁',
  },
  {
    key: '2',
    device: 'INV-B-001',
    inspections: 15,
    exceptions: 3,
    completionRate: '92%',
    latestIssue: '油位偏低',
  },
  {
    key: '3',
    device: 'INV-C-005',
    inspections: 14,
    exceptions: 2,
    completionRate: '95%',
    latestIssue: '环境卫生不达标',
  },
]

export function getReportMockData(period = 'month') {
  const trend = periodMap[period] || periodMap.month

  return {
    activePeriod: period,
    stats: [
      { key: 'completion', title: '巡检完成率', value: 96.2, suffix: '%', diff: '+2.4%', formula: '巡检完成率 = 已完成任务数 / 应执行任务数 × 100%' },
      { key: 'exceptions', title: '异常数量', value: 27, suffix: '条', diff: '-5 条', formula: '异常数量 = 统计周期内产生的异常记录数' },
    ],
    trend,
    personWorkload,
    exceptionDistribution,
    riskDevices,
  }
}
