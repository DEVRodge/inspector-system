/**
 * 设备台账相关接口，对接后端 /device/*
 */
import { http, request } from '../http'
import { assertBusinessOk } from '../businessResult'
import { getOrganizationsList } from './organization'

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
  return getOrganizationsList().then((data) => {
    const arr = Array.isArray(data) ? data : data?.list ?? []
    const list = arr.map((o) => (typeof o === 'string' ? { id: o, name: o } : { id: o.id, name: o.name ?? o.id }))
    return { list }
  })
}

export function getDevicePage(params = {}) {
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
  return request({ url: `/device/${id}`, method: 'get' })
    .then(assertBusinessOk)
    .then((data) => (data ? toKey(data) : null))
}

/** Apifox DeviceModifyParam */
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
  const payload = buildDevicePayload(data, true)
  return request({
    url: '/device',
    method: 'post',
    data: payload,
  }).then(assertBusinessOk)
}

export function updateDevice(id, data) {
  const payload = buildDevicePayload(data, false)
  return request({
    url: `/device/${id}`,
    method: 'put',
    data: payload,
  }).then(assertBusinessOk)
}

export function deleteDevice(id) {
  return request({ url: `/device/${id}`, method: 'delete' }).then(assertBusinessOk)
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

/**
 * 解析 POST /device/import 的响应，兼容 { success, count }、{ data: { count } }、仅 code 等写法。
 * @param {import('axios').AxiosResponse|unknown} axiosRes
 * @returns {{ successCount: number, errors: string[], successFlag: boolean|undefined, message?: string, codeOk: boolean }}
 */
export function parseDeviceImportResponse(axiosRes) {
  const raw = axiosRes && typeof axiosRes === 'object' && 'data' in axiosRes ? axiosRes.data : axiosRes
  if (raw == null || typeof raw !== 'object') {
    return { successCount: 0, errors: [], successFlag: undefined, message: undefined, codeOk: true }
  }
  let body = { ...raw }
  if (body.data != null && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const inner = body.data
    if (
      inner.success != null ||
      inner.count != null ||
      inner.successCount != null ||
      Array.isArray(inner.errors)
    ) {
      body = { ...body, ...inner }
    }
  }
  const errors = Array.isArray(body.errors) ? body.errors : []
  const toNum = (v) => {
    const x = Number(v)
    return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0
  }
  const successCount = toNum(
    body.successCount ??
      body.count ??
      body.total ??
      body.imported ??
      body.importedCount ??
      body.insertCount,
  )
  const code = body.code
  const codeOk = code === undefined || code === null || code === 0 || code === 200
  return {
    successCount,
    errors,
    successFlag: body.success,
    message: body.message ?? body.msg,
    codeOk,
  }
}
