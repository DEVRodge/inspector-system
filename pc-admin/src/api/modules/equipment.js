/**
 * 设备台账相关接口，对接后端 /device/*
 *
 * 列表：GET /device/page
 * 详情：GET /device/{id}
 * 新增：POST /device
 * 修改：PUT /device/{id}
 * 删除：DELETE /device/{id}
 * 导出模板：GET /device/import/template
 * 导出 Excel：GET /device/export
 * 导入设备：POST /device/import
 */
import { http, isMockEnabled, mockRequest, request } from '../http'
import { getOrganizationsList } from './organization'
import { equipmentRows } from '../../mock/equipment'

function toKey(item) {
  if (!item) return item
  const key = item.id ?? item.key
  return {
    ...item,
    key: String(key),
    team: item.organizationName ?? item.team,
    date: item.commissionDate ?? item.date,
  }
}

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

export function getDevicePage(params = {}) {
  if (isMockEnabled) {
    return mockRequest(() => {
      let list = [...equipmentRows]
      const { keyword, type, status, pageNumber = 1, pageSize = 20 } = params
      if (keyword) {
        const kw = String(keyword).toLowerCase()
        list = list.filter(
          (r) =>
            (r.code && r.code.toLowerCase().includes(kw)) ||
            (r.name && r.name.toLowerCase().includes(kw)),
        )
      }
      if (type) list = list.filter((r) => r.type === type)
      if (status) list = list.filter((r) => r.status === status)
      const total = list.length
      const start = (pageNumber - 1) * pageSize
      list = list.slice(start, start + pageSize)
      return { list: list.map(toKey), total }
    })
  }
  return request({
    url: '/device/page',
    method: 'get',
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      keyword: params.keyword || undefined,
      type: params.type,
      status: params.status,
    },
  }).then((data) => {
    const raw = data?.records ?? data?.list ?? []
    const total = data?.total ?? 0
    return { list: raw.map(toKey), total }
  })
}

export function getDeviceById(id) {
  if (isMockEnabled) {
    return mockRequest(() => {
      const r = equipmentRows.find((e) => String(e.key) === String(id) || String(e.id) === String(id))
      return r ? toKey({ ...r, id: r.key ?? r.id }) : null
    })
  }
  return request({ url: `/device/${id}`, method: 'get' }).then((data) => (data ? toKey(data) : null))
}

/** Apifox DeviceModifyParam: code, type, name, status 必填；organizationId, commissionDate 等可选 */
function buildDevicePayload(data, forCreate = false) {
  const raw = {
    code: data.code,
    name: data.name,
    type: data.type,
    status: forCreate ? (data.status ?? 'RUNNING') : data.status,
    model: data.model,
    voltage: data.voltage,
    location: data.location,
    organizationId: data.organizationId,
    commissionDate: data.commissionDate ?? data.date,
  }
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )
}

export function createDevice(data) {
  if (isMockEnabled) {
    return mockRequest(() => ({ id: `${Date.now()}`, ...data }))
  }
  const payload = buildDevicePayload(data, true)
  return request({
    url: '/device',
    method: 'post',
    data: payload,
  })
}

export function updateDevice(id, data) {
  if (isMockEnabled) {
    return mockRequest(() => ({ id, ...data }))
  }
  const payload = buildDevicePayload(data, false)
  return request({
    url: `/device/${id}`,
    method: 'put',
    data: payload,
  })
}

export function deleteDevice(id) {
  if (isMockEnabled) {
    return mockRequest(() => ({ success: true }))
  }
  return request({ url: `/device/${id}`, method: 'delete' })
}

export function exportTemplate() {
  return http.get('/device/import/template', {
    responseType: 'blob',
  })
}

export function exportExcel(params = {}) {
  return http.get('/device/export', {
    params: {
      keyword: params.keyword || undefined,
      type: params.type,
      status: params.status,
    },
    responseType: 'blob',
  })
}

export function importEquipment(file) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/device/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
