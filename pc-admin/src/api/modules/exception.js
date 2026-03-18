/**
 * 异常管理接口（严格对齐 /inspection/exception/*）
 */
import { request } from '../http'

export const EXCEPTION_STATUS_MAP = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  CLOSED: '已关闭',
}

export const EXCEPTION_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待处理' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'CLOSED', label: '已关闭' },
]

function normalizeException(item) {
  if (!item) return null
  const statusApi = item.status
  const statusDesc = item.statusDesc ?? EXCEPTION_STATUS_MAP[statusApi] ?? statusApi ?? ''
  return {
    ...item,
    key: String(item.id ?? item.key ?? ''),
    id: item.id ?? item.key,
    code: item.exceptionNo ?? item.code ?? '',
    exceptionNo: item.exceptionNo ?? item.code ?? '',
    device: item.deviceCode ?? item.device ?? '',
    deviceCode: item.deviceCode ?? item.device ?? '',
    desc: item.description ?? item.desc ?? '',
    description: item.description ?? item.desc ?? '',
    handlerName: item.handlerName ?? '',
    handler: item.handlerName ?? item.handler ?? '',
    statusApi,
    status: statusDesc,
    statusDesc,
    files: Array.isArray(item.files) ? item.files : [],
    recordDeviceFiles: Array.isArray(item.recordDeviceFiles) ? item.recordDeviceFiles : [],
  }
}

function cleanParams(params = {}) {
  const clean = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v
  }
  return clean
}

export function getExceptionPage(params = {}) {
  const onlyMine = !!params.onlyMine
  const url = onlyMine ? '/inspection/exception/my-page' : '/inspection/exception/page'
  return request({
    url,
    method: 'get',
    params: cleanParams({
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      keyword: params.keyword,
      status: params.status,
      'period.begin': params.periodBegin,
      'period.end': params.periodEnd,
      onlyMine: params.onlyMine,
    }),
  }).then((data) => {
    const records = data?.records ?? data?.list ?? []
    return {
      list: (Array.isArray(records) ? records : []).map(normalizeException),
      total: Number(data?.total ?? 0),
      current: Number(data?.current ?? params.pageNumber ?? 1),
      size: Number(data?.size ?? params.pageSize ?? 20),
    }
  })
}

export function getExceptionById(id) {
  return request({ url: `/inspection/exception/${id}`, method: 'get' }).then((data) =>
    data ? normalizeException(data) : null,
  )
}

export function assignException(exceptionId, handlerId) {
  return request({
    url: '/inspection/exception/assign',
    method: 'post',
    data: { exceptionId: String(exceptionId), handlerId: String(handlerId) },
  })
}

export function processException(exceptionId, data = {}) {
  return request({
    url: '/inspection/exception/process',
    method: 'post',
    data: {
      exceptionId: String(exceptionId),
      processResult: data.processResult,
      fileIds: (data.fileIds ?? []).map((id) => String(id)),
    },
  })
}
