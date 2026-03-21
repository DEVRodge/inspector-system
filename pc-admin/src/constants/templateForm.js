/** 巡检项录入方式（与模板表单一致） */
export const INSPECTION_ITEM_TYPES = [{ value: 'radio', label: '正常/异常' }]

/**
 * 巡检模板状态（接口文档：InspectionTemplateCreateParam / InspectionTemplateVO，枚举 ENABLED | DRAFT）
 * 非数据字典，不请求 /dictionary/list
 */
export const TEMPLATE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'ENABLED', label: '启用中' },
]

export function getTemplateStatusLabel(value) {
  return TEMPLATE_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '—'
}
