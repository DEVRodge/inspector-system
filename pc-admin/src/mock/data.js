export const dashboardStats = [
  { title: '设备总数', value: 286, suffix: '台', trend: '较上月 +12 台' },
  { title: '待执行任务', value: 18, suffix: '项', trend: '含 3 项今日到期' },
  { title: '处理中异常', value: 9, suffix: '条', trend: '待指派 2 条' },
  { title: '本月完成率', value: 96.2, suffix: '%', trend: '同比提升 4.3%' },
]

export const quickTodoList = [
  { title: 'A 区逆变器日检任务待下发', owner: '运维主管', deadline: '今天 14:00' },
  { title: '异常 #E20250912001 待闭环确认', owner: '设备管理员', deadline: '今天 18:00' },
  { title: '9 月模板版本需要复核', owner: '设备工程师', deadline: '明天 10:00' },
]

export const orgRows = [
  { key: '1', username: '13800000001', deptId: '1', dept: '运维部', postId: '1', post: '巡检员', name: '张三', phone: '13800000001', area: 'A 区', status: '启用' },
  { key: '2', username: '13800000002', deptId: '1', dept: '运维部', postId: '1', post: '巡检员', name: '李四', phone: '13800000002', area: 'B 区', status: '启用' },
  { key: '3', username: '13800000003', deptId: '2', dept: '设备部', postId: '2', post: '设备工程师', name: '王工', phone: '13800000003', area: '全厂', status: '启用' },
  { key: '4', username: '13800000004', deptId: '3', dept: '信息部', postId: '3', post: '系统管理员', name: '赵六', phone: '13800000004', area: '全厂', status: '停用' },
]

export { equipmentRows } from './equipment'

export const qrcodeRows = [
  { key: '1', device: 'INV-A-001', batch: '2025Q3', version: 'V1', status: '生效中', action: '预览 / 下载 / 打印' },
  { key: '2', device: 'INV-A-002', batch: '2025Q3', version: 'V1', status: '生效中', action: '预览 / 下载 / 打印' },
  { key: '3', device: 'INV-B-001', batch: '2025Q2', version: 'V2', status: '已重生成', action: '预览 / 下载 / 失效' },
]

export { taskRows } from './modules/task'

export const recordRows = [
  {
    key: '1',
    device: 'INV-A-001',
    plan: 'A 区逆变器日检',
    inspector: '张三',
    scanTime: '2025-09-12 08:11',
    submitTime: '2025-09-12 08:15',
    result: '正常',
    photos: 2,
    items: [
      { name: '设备外观', value: '正常' },
      { name: '油位状态', value: '正常' },
      { name: '渗漏油情况', value: '正常' },
    ],
    photoUrls: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
    ],
  },
  {
    key: '2',
    device: 'INV-A-002',
    plan: 'A 区逆变器日检',
    inspector: '张三',
    scanTime: '2025-09-12 08:23',
    submitTime: '2025-09-12 08:31',
    result: '异常',
    photos: 3,
    items: [
      { name: '设备外观', value: '正常' },
      { name: '油位状态', value: '异常' },
      { name: '渗漏油情况', value: '正常' },
    ],
    photoUrls: [
      'https://picsum.photos/400/300?random=3',
      'https://picsum.photos/400/300?random=4',
      'https://picsum.photos/400/300?random=5',
    ],
  },
  {
    key: '3',
    device: 'INV-B-001',
    plan: 'B 区逆变器日检',
    inspector: '李四',
    scanTime: '2025-09-12 09:02',
    submitTime: '2025-09-12 09:08',
    result: '正常',
    photos: 1,
    items: [
      { name: '设备外观', value: '正常' },
      { name: '油位状态', value: '正常' },
      { name: '渗漏油情况', value: '正常' },
    ],
    photoUrls: ['https://picsum.photos/400/300?random=6'],
  },
  {
    key: '4',
    device: 'INV-B-001',
    plan: 'B 区逆变器日检',
    inspector: '李四',
    scanTime: '2025-09-12 10:15',
    submitTime: '2025-09-12 10:22',
    result: '异常',
    photos: 2,
    items: [
      { name: '设备外观', value: '正常' },
      { name: '油位状态', value: '异常' },
      { name: '渗漏油情况', value: '正常' },
    ],
    photoUrls: [
      'https://picsum.photos/400/300?random=7',
      'https://picsum.photos/400/300?random=8',
    ],
  },
  {
    key: '5',
    device: 'INV-C-005',
    plan: '全厂周检',
    inspector: '赵班长',
    scanTime: '2025-09-11 14:30',
    submitTime: '2025-09-11 14:38',
    result: '异常',
    photos: 1,
    items: [
      { name: '设备外观', value: '异常' },
      { name: '油位状态', value: '正常' },
      { name: '渗漏油情况', value: '正常' },
    ],
    photoUrls: ['https://picsum.photos/400/300?random=9'],
  },
  {
    key: '10',
    plan: '全厂周检',
    inspector: '张三',
    scanTime: '2025-09-12 09:15',
    submitTime: '2025-09-12 09:45',
    result: '异常',
    photos: 8,
    deviceResults: [
      {
        device: 'DEV-A-001',
        deviceType: '逆变器',
        result: '正常',
        items: [
          { name: '设备外观', value: '正常' },
          { name: '油位状态', value: '正常' },
          { name: '渗漏油情况', value: '正常' },
        ],
        photoUrls: [
          'https://picsum.photos/400/300?random=10',
          'https://picsum.photos/400/300?random=11',
        ],
      },
      {
        device: 'DEV-A-018',
        deviceType: '汇流箱',
        result: '异常',
        items: [
          { name: '接线端子', value: '正常' },
          { name: '保险状态', value: '异常' },
          { name: '箱体密封', value: '正常' },
        ],
        photoUrls: [
          'https://picsum.photos/400/300?random=12',
          'https://picsum.photos/400/300?random=13',
          'https://picsum.photos/400/300?random=14',
        ],
      },
      {
        device: 'DEV-B-003',
        deviceType: '箱变',
        result: '正常',
        items: [
          { name: '油位状态', value: '正常' },
          { name: '异响异味', value: '正常' },
          { name: '接地情况', value: '正常' },
        ],
        photoUrls: ['https://picsum.photos/400/300?random=15'],
      },
      {
        device: 'DEV-C-011',
        deviceType: '配电柜',
        result: '正常',
        items: [
          { name: '柜门密封', value: '正常' },
          { name: '指示灯', value: '正常' },
        ],
        photoUrls: ['https://picsum.photos/400/300?random=16'],
      },
      {
        device: 'DEV-A-002',
        deviceType: '逆变器',
        result: '正常',
        items: [
          { name: '设备外观', value: '正常' },
          { name: '油位状态', value: '正常' },
          { name: '渗漏油情况', value: '正常' },
        ],
        photoUrls: ['https://picsum.photos/400/300?random=17'],
      },
    ],
  },
]

export const exceptionRows = [
  { key: '1', code: 'E20250912001', device: 'INV-A-002', desc: '运行指示异常闪烁', handler: '王工', deadline: '2025-09-12 18:00', status: '处理中', recordId: '2' },
  { key: '2', code: 'E20250912002', device: 'INV-B-001', desc: '油位偏低', handler: '李四', deadline: '2025-09-13 12:00', status: '待处理', recordId: '4' },
  { key: '3', code: 'E20250911008', device: 'INV-C-005', desc: '环境卫生不达标', handler: '赵班长', deadline: '2025-09-12 17:00', status: '已处理', recordId: '5' },
]

export const reportStats = [
  { title: '巡检完成率', value: '96.2%' },
  { title: '漏检率', value: '1.8%' },
  { title: '异常数量', value: '27 条' },
  { title: '整改及时率', value: '91.4%' },
]

export const settingGroups = [
  {
    title: '数据字典',
    desc: '巡检结果状态、设备状态、任务类型等基础字典管理',
    tags: ['状态字典', '设备类型', '组织编码'],
  },
  {
    title: '系统参数',
    desc: '附件大小、导出上限、二维码打印模板等',
    tags: ['附件规则', '导出参数', '打印模板'],
  },
  {
    title: '日志与消息规则',
    desc: '操作日志保留、催办、逾期提醒与闭环提醒',
    tags: ['审计日志', '催办规则', '通知策略'],
  },
]

export const menuBadges = {
  '/tasks': 3,
  '/exceptions': 2,
}
