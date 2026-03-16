/** 设备台账 mock 数据，供 task 等模块引用，避免与 data.js 循环依赖 */
export const equipmentRows = [
  { key: '1', code: 'DEV-A-001', type: '逆变器', name: 'A 区 1 号逆变器', model: 'SG320HX', voltage: '1500V', location: 'A 区东列', team: '运维部', date: '2023-06-18', status: '运行中' },
  { key: '2', code: 'DEV-A-018', type: '汇流箱', name: 'A 区 18 号汇流箱', model: 'HC-12', voltage: '1000V', location: 'A 区西列', team: '运维部', date: '2023-07-05', status: '运行中' },
  { key: '3', code: 'DEV-B-003', type: '箱变', name: 'B 区 3 号箱变', model: 'ZGS-1600', voltage: '10kV', location: 'B 区南侧', team: '设备部', date: '2023-08-05', status: '检修中' },
  { key: '4', code: 'DEV-C-011', type: '配电柜', name: 'C 区 11 号配电柜', model: 'GGD', voltage: '0.4kV', location: 'C 区北列', team: '信息部', date: '2024-01-20', status: '停用' },
]
