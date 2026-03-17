/**
 * 异常管理接口
 * 对接后端 /inspection/exception/*
 */
import { isMockEnabled, mockRequest, request } from '../http'
import { exceptionRows } from '@/mock/data'

const STATUS_MAP = { PENDING: '待处理', PROCESSING: '处理中', CLOSED: '已处理' }
const STATUS_TO_API = { 待处理: 'PENDING', 处理中: 'PROCESSING', 已处理: 'CLOSED' }

function toKey(item) {
  if (!item) return item
  const key = item.id ?? item.key
  const status = item.status
  const statusDesc = STATUS_MAP[status] ?? status ?? item.statusDesc
  return {
    ...item,
    key: String(key),
    code: item.exceptionNo ?? item.code,
    device: item.deviceCode ?? item.device,
    desc: item.description ?? item.desc,
    handler: item.handlerName ?? item.handler ?? '',
    status: statusDesc,
    statusApi: status,
  }
}

export function getExceptionPage(params = {}) {
  if (isMockEnabled) {
    return mockRequest(() => {
      let list = [...exceptionRows]
      const { keyword, status, pageNumber = 1, pageSize = 20 } = params
      if (keyword) {
        const kw = String(keyword).toLowerCase()
        list = list.filter(
          (r) =>
            (r.code && r.code.toLowerCase().includes(kw)) ||
            (r.device && r.device.toLowerCase().includes(kw)) ||
            (r.deviceName && r.deviceName.toLowerCase().includes(kw)),
        )
      }
      if (status) {
        const apiStatus = STATUS_TO_API[status] ?? status
        list = list.filter((r) => (STATUS_TO_API[r.status] ?? r.status) === apiStatus)
      }
      const total = list.length
      const start = (pageNumber - 1) * pageSize
      list = list.slice(start, start + pageSize)
      return { list: list.map(toKey), total }
    })
  }

  return request({
    url: '/inspection/exception/page',
    method: 'get',
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      keyword: params.keyword || undefined,
      status: params.status ? STATUS_TO_API[params.status] ?? params.status : undefined,
      'period.begin': params.periodBegin,
      'period.end': params.periodEnd,
      onlyMine: params.onlyMine,
    },
  }).then((data) => {
    const raw = data?.records ?? data?.list ?? []
    const total = data?.total ?? 0
    return { list: raw.map(toKey), total }
  })
}

export function getExceptionById(id) {
  if (isMockEnabled) {
    return mockRequest(() => {
      const r = exceptionRows.find((e) => String(e.key) === String(id))
      return r ? toKey({ ...r, files: [], recordDeviceFiles: [] }) : null
    })
  }

  return request({ url: `/inspection/exception/${id}`, method: 'get' }).then((data) =>
    data ? toKey(data) : null,
  )
}

export function assignException(exceptionId, handlerId) {
  if (isMockEnabled) {
    return mockRequest(() => ({}))
  }

  return request({
    url: '/inspection/exception/assign',
    method: 'post',
    data: { exceptionId: Number(exceptionId), handlerId: Number(handlerId) },
  })
}

export function processException(exceptionId, data = {}) {
  if (isMockEnabled) {
    return mockRequest(() => ({}))
  }

  return request({
    url: '/inspection/exception/process',
    method: 'post',
    data: {
      exceptionId: Number(exceptionId),
      processResult: data.processResult,
      fileIds: data.fileIds,
    },
  })
}
