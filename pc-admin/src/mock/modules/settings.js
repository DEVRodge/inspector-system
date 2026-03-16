export const dictionaryRows = [
  { key: '1', category: '巡检结果状态', code: 'INSPECT_OK', label: '正常', status: '启用' },
  { key: '2', category: '巡检结果状态', code: 'INSPECT_ABNORMAL', label: '异常', status: '启用' },
  { key: '3', category: '设备状态', code: 'DEVICE_RUNNING', label: '运行中', status: '启用' },
  { key: '4', category: '设备状态', code: 'DEVICE_MAINT', label: '检修中', status: '启用' },
]

export const permissionRows = [
  { key: '1', role: '系统管理员', scope: '全部菜单与操作权限', users: 2, checkedKeys: ['dashboard', 'equipment', 'templates', 'tasks', 'records', 'exceptions', 'reports', 'settings'] },
  { key: '2', role: '设备工程师', scope: '设备台账、模板、异常管理', users: 5, checkedKeys: ['dashboard', 'equipment', 'templates', 'exceptions'] },
  { key: '3', role: '巡检主管', scope: '任务、记录、异常查看与处理', users: 8, checkedKeys: ['dashboard', 'tasks', 'records', 'exceptions'] },
]

export const menuTreeData = [
  { key: 'dashboard', title: '工作台' },
  { key: 'equipment', title: '设备台账' },
  { key: 'templates', title: '巡检模板' },
  { key: 'tasks', title: '计划任务' },
  { key: 'records', title: '巡检记录' },
  { key: 'exceptions', title: '异常管理' },
  { key: 'reports', title: '统计报表' },
  { key: 'settings', title: '系统管理' },
]

export const deptRows = [
  { key: '1', name: '运维部', code: 'OPS', sort: 1, status: '启用' },
  { key: '2', name: '设备部', code: 'DEV', sort: 2, status: '启用' },
  { key: '3', name: '信息部', code: 'IT', sort: 3, status: '启用' },
]

export const postRows = [
  { key: '1', name: '巡检员', code: 'INSPECTOR', deptId: '1', deptName: '运维部', sort: 1, status: '启用' },
  { key: '2', name: '设备工程师', code: 'ENGINEER', deptId: '2', deptName: '设备部', sort: 1, status: '启用' },
  { key: '3', name: '系统管理员', code: 'ADMIN', deptId: '3', deptName: '信息部', sort: 1, status: '启用' },
]

export const logRows = [
  { key: '1', time: '2025-09-12 09:12', operator: '赵六', module: '系统管理', action: '修改角色权限', result: '成功', ip: '192.168.1.10' },
  { key: '2', time: '2025-09-12 10:21', operator: '王工', module: '设备台账', action: '新增设备 INV-A-008', result: '成功', ip: '192.168.1.11' },
  { key: '3', time: '2025-09-12 11:35', operator: '张三', module: '任务管理', action: '创建临时复检任务', result: '成功', ip: '192.168.1.12' },
  { key: '4', time: '2025-09-12 14:00', operator: '李四', module: '异常管理', action: '指派异常工单', result: '成功', ip: '192.168.1.13' },
]
