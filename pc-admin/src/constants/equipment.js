/**
 * 设备台账 — Apifox DeviceModifyParam / DeviceVO
 * status 为接口固定枚举，非数据字典；与导入说明「运行中、检修中、停用」一致。
 */
export const DEVICE_STATUS_API_OPTIONS = [
  { value: 'RUNNING', label: '运行中' },
  { value: 'MAINTENANCE', label: '检修中' },
  { value: 'STOPPED', label: '停用' },
]
