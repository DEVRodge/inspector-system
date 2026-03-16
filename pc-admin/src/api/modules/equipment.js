/**
 * 设备台账相关接口，由后端实现
 *
 * 责任部门列表：GET /api/equipment/departments
 *   - 返回: { list: [{ id, name }] } 或 { list: string[] }
 *
 * 导出模板：GET /api/equipment/template
 *   - 返回 Excel 文件流，Content-Disposition: attachment; filename="设备台账导入模板.xlsx"
 *
 * 导出 Excel：GET /api/equipment/export
 *   - Query: keyword, type, status（可选，与列表筛选一致）
 *   - 返回 Excel 文件流，Content-Disposition: attachment; filename="设备台账_YYYY-MM-DD.xlsx"
 *
 * 导入设备：POST /api/equipment/import
 *   - Content-Type: multipart/form-data
 *   - Body: file (Excel 文件)
 *   - 返回: { success: boolean, count?: number, errors?: string[] }
 */
import { http, isMockEnabled, mockRequest, request } from '../http'
import { getOrganizationsList } from './organization'

export function getDepartments() {
  if (isMockEnabled) {
    return mockRequest(() => ({
      list: [
        { id: '1', name: '运维部' },
        { id: '2', name: '设备部' },
        { id: '3', name: '信息部' },
      ],
    }))
  }
  return getOrganizationsList().then((data) => {
    const arr = Array.isArray(data) ? data : data?.list ?? []
    const list = arr.map((o) => (typeof o === 'string' ? { id: o, name: o } : { id: o.id, name: o.name ?? o.id }))
    return { list }
  })
}

export function exportTemplate() {
  return http.get('/equipment/template', {
    responseType: 'blob',
  })
}

export function exportExcel(params = {}) {
  return http.get('/equipment/export', {
    params,
    responseType: 'blob',
  })
}

export function importEquipment(file) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/equipment/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
