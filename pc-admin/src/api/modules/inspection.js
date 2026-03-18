/**
 * 巡检业务接口：模板、任务、记录
 * 对接后端 /inspection/*
 */
import { isMockEnabled, mockRequest, request } from '../http'
import { getFilePreviewUrl } from '@/utils/file'
import { formToCron } from '@/utils/cron'
import { templateRows } from '../../mock/modules/template'
import { recordRows } from '../../mock/data'

function toKey(item) {
  if (!item) return item
  const key = item.id ?? item.key
  return { ...item, key: String(key) }
}

/** 将后端任务响应统一为前端期望格式（与接口文档对齐） */
function normalizeTaskRecord(raw) {
  if (!raw) return raw
  const r = raw?.data ?? raw
  const deviceIds = r.deviceIds ?? (() => {
    const list = r.deviceIdList ?? r.deviceList ?? []
    return Array.isArray(list)
      ? list.map((x) => (typeof x === 'object' && x != null ? Number(x.id ?? x.deviceId ?? x.key) : Number(x))).filter((n) => !Number.isNaN(n))
      : []
  })()
  return {
    ...r,
    key: String(r.id ?? r.key ?? ''),
    plan: r.plan ?? r.taskName ?? r.name,
    team: r.team ?? r.organizationId,
    owner: r.owner ?? r.userId,
    deviceIds: deviceIds.length ? deviceIds : (r.deviceIds ?? []),
  }
}

// ---------- 巡检模板 ----------

export function getTemplatePage(params = {}) {
  if (isMockEnabled) {
    return mockRequest(() => {
      let list = templateRows.map((r) => ({ ...r, itemCount: r.items?.length ?? 0, requiredCount: r.items?.filter((i) => i.required)?.length ?? 0 }))
      const { deviceType, keyword, pageNumber = 1, pageSize = 20 } = params
      if (deviceType) list = list.filter((r) => r.deviceType === deviceType)
      if (keyword) {
        const kw = String(keyword).toLowerCase()
        list = list.filter((r) => (r.name && r.name.toLowerCase().includes(kw)))
      }
      const total = list.length
      const start = (pageNumber - 1) * pageSize
      list = list.slice(start, start + pageSize)
      return { list: list.map(toKey), total }
    })
  }
  return request({
    url: '/inspection/template/page',
    method: 'get',
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      deviceType: params.deviceType,
      keyword: params.keyword || undefined,
    },
  }).then((data) => {
    const raw = data?.records ?? data?.list ?? []
    const total = data?.total ?? 0
    return { list: raw.map(toKey), total }
  })
}

export function getTemplateById(id) {
  if (isMockEnabled) {
    return mockRequest(() => {
      const r = templateRows.find((t) => String(t.key) === String(id))
      return r ? toKey({ ...r, items: r.items ?? [] }) : null
    })
  }
  return request({ url: `/inspection/template/${id}`, method: 'get' }).then((data) => (data ? toKey(data) : null))
}

export function deleteTemplate(id) {
  return request({ url: `/inspection-template/${id}`, method: 'delete' })
}

export function updateTemplate(id, data) {
  return request({
    url: `/inspection-template/${id}`,
    method: 'put',
    data: buildTemplatePayload(data),
  })
}

function buildTemplatePayload(data) {
  const raw = {
    name: data.name?.trim?.(),
    deviceType: data.deviceType,
    description: data.description?.trim?.() || undefined,
    version: data.version?.trim?.() || undefined,
    status: data.status,
  }
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

export function createTemplate(data) {
  if (isMockEnabled) {
    return mockRequest(() => ({ id: `${Date.now()}`, key: `${Date.now()}`, ...data }))
  }
  return request({
    url: '/inspection/template',
    method: 'post',
    data: buildTemplatePayload(data),
  })
}

export function getTemplateItems(templateId) {
  if (isMockEnabled) {
    return mockRequest(() => {
      const t = templateRows.find((r) => String(r.key) === String(templateId))
      return (t?.items ?? []).map((it, i) => toKey({ ...it, key: it.key ?? `i${i}` }))
    })
  }
  return request({
    url: '/inspection/template/item/list',
    method: 'get',
    params: { templateId },
  }).then((data) => {
    const arr = data?.records ?? data?.list ?? data ?? []
    return arr.map((it, i) => toKey({ ...it, key: it.id ?? it.key ?? `i${i}` }))
  })
}

/** Apifox: defaultValue 枚举 NORMAL | ABNORMAL，前端展示用「正常」「异常」 */
function toDefaultValueEnum(val) {
  if (val === '正常') return 'NORMAL'
  if (val === '异常') return 'ABNORMAL'
  return val ?? 'NORMAL'
}

export function createTemplateItem(data) {
  if (isMockEnabled) {
    return mockRequest(() => ({ id: `i${Date.now()}`, ...data }))
  }
  const payload = {
    templateId: data.templateId,
    name: data.name ?? data.title,
    type: data.type ?? 'radio',
    required: !!data.required,
    rule: data.rule ?? '',
    defaultValue: toDefaultValueEnum(data.defaultValue),
    sort: data.sort ?? 0,
  }
  return request({
    url: '/inspection/template/item',
    method: 'post',
    data: payload,
  })
}

export function updateTemplateItem(id, data) {
  if (isMockEnabled) {
    return mockRequest(() => ({ id, ...data }))
  }
  const payload = {
    name: data.name ?? data.title,
    type: data.type ?? 'radio',
    required: !!data.required,
    rule: data.rule ?? '',
    defaultValue: toDefaultValueEnum(data.defaultValue),
    sort: data.sort ?? 0,
  }
  return request({
    url: `/inspection/template/item/${id}`,
    method: 'put',
    data: payload,
  })
}

export function deleteTemplateItem(id) {
  if (isMockEnabled) {
    return mockRequest(() => ({ success: true }))
  }
  return request({
    url: `/inspection/template/item/${id}`,
    method: 'delete',
  })
}

// ---------- 计划任务 ----------

const CYCLE_MAP = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', quarterly: 'QUARTERLY', yearly: 'YEARLY', once: 'ONCE' }

function toCycleEnum(cycle) {
  const c = cycle ? String(cycle).toLowerCase() : ''
  return CYCLE_MAP[c] ?? cycle
}

export function buildTaskPayload(data) {
  const cycle = toCycleEnum(data.cycle)
  const cron =
    data.cron ??
    formToCron({
      cycle: data.cycle,
      time: data.time,
      cycleExtra: data.cycleExtra ?? {},
      executeAt: data.executeAt,
    })
  const deviceIds = (data.deviceIds ?? data.deviceKeys ?? []).map((id) => Number(id)).filter((n) => !Number.isNaN(n))
  const raw = {
    plan: data.plan?.trim?.(),
    cycle,
    cron: cron || undefined,
    team: data.team != null && data.team !== '' ? Number(data.team) : undefined,
    owner: data.owner != null && data.owner !== '' ? Number(data.owner) : undefined,
    enabled: data.enabled !== false,
    deviceIds,
  }
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== null))
}

export function getTaskPage(params = {}) {
  return request({
    url: '/inspection/task/page',
    method: 'get',
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      enabled: params.enabled,
      keyword: params.keyword || undefined,
    },
  }).then((data) => {
    const raw = data?.records ?? data?.list ?? []
    const total = data?.total ?? 0
    return {
      list: raw.map((r) => toKey(normalizeTaskRecord(r))),
      total,
      current: data?.current ?? params.pageNumber ?? 1,
      size: data?.size ?? params.pageSize ?? 20,
    }
  })
}

export function getTaskById(id) {
  return request({ url: `/inspection/task/${id}`, method: 'get' }).then((data) =>
    data ? toKey(normalizeTaskRecord(data)) : null
  )
}

export function createTask(data) {
  const payload = buildTaskPayload(data)
  return request({ url: '/inspection/task', method: 'post', data: payload }).then((data) =>
    data ? toKey(normalizeTaskRecord(data)) : null
  )
}

export function updateTask(id, data) {
  const payload = buildTaskPayload(data)
  return request({ url: `/inspection/task/${id}`, method: 'put', data: payload }).then((data) =>
    data ? toKey(normalizeTaskRecord(data)) : null
  )
}

export function deleteTask(id) {
  return request({ url: `/inspection/task/${id}`, method: 'delete' })
}

// ---------- 巡检记录 ----------

export function getRecordPage(params = {}) {
  if (isMockEnabled) {
    return mockRequest(() => {
      let list = [...recordRows]
      const { plan, device, inspector, result, startTime, endTime, pageNumber = 1, pageSize = 20 } = params
      if (plan) {
        const kw = String(plan).toLowerCase()
        list = list.filter((r) => r.plan?.toLowerCase().includes(kw))
      }
      if (device) {
        const kw = String(device).toLowerCase()
        list = list.filter((r) => {
          if (r.deviceResults?.length) return r.deviceResults.some((d) => d.device?.toLowerCase().includes(kw))
          return r.device?.toLowerCase().includes(kw)
        })
      }
      if (inspector) {
        const kw = String(inspector).toLowerCase()
        list = list.filter((r) => r.inspector?.toLowerCase().includes(kw))
      }
      if (result) list = list.filter((r) => r.result === result)
      if (startTime && endTime) {
        list = list.filter((r) => {
          const d = r.submitTime?.slice(0, 10)
          return d && d >= startTime && d <= endTime
        })
      }
      const total = list.length
      const start = (pageNumber - 1) * pageSize
      list = list.slice(start, start + pageSize)
      return { list: list.map(toKey), total }
    })
  }
  return request({
    url: '/inspection/record/page',
    method: 'get',
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      plan: params.plan || undefined,
      device: params.device || undefined,
      inspector: params.inspector || undefined,
      result: params.result,
      startTime: params.startTime,
      endTime: params.endTime,
    },
  }).then((data) => {
    const raw = data?.records ?? data?.list ?? []
    const total = data?.total ?? 0
    return { list: raw.map(toKey), total }
  })
}

export function getRecordById(id) {
  if (isMockEnabled) {
    return mockRequest(() => {
      const r = recordRows.find((rec) => String(rec.key) === String(id))
      return r ? toKey(r) : null
    })
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return request({ url: `/inspection/record/${id}`, method: 'get' }).then((data) => {
    if (!data) return null
    const mapped = toKey(data)
    if (mapped.devices?.length) {
      mapped.deviceResults = mapped.devices.map((d) => {
        const files = d.files ?? []
        const photoUrls = files.map((f) => getFilePreviewUrl(f, baseUrl)).filter(Boolean)
        return { ...d, device: d.deviceCode ?? d.device, photoUrls }
      })
    } else if (mapped.files?.length) {
      mapped.photoUrls = mapped.files.map((f) => getFilePreviewUrl(f, baseUrl)).filter(Boolean)
    }
    return mapped
  })
}

export function getRecordDevice(recordId, deviceCode) {
  if (isMockEnabled) {
    return mockRequest(() => {
      const rec = recordRows.find((r) => String(r.key) === String(recordId))
      if (!rec) return null
      if (rec.deviceResults?.length) {
        const dr = rec.deviceResults.find((d) => d.device === deviceCode)
        return dr ?? null
      }
      if (rec.device === deviceCode) {
        return {
          device: rec.device,
          deviceType: '-',
          result: rec.result,
          items: rec.items ?? [],
          photoUrls: rec.photoUrls ?? [],
        }
      }
      return null
    })
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return request({
    url: '/inspection/record/device',
    method: 'get',
    params: { recordId, deviceCode },
  }).then((data) => {
    if (!data) return null
    const files = data.files ?? []
    const photoUrls = files.map((f) => getFilePreviewUrl(f, baseUrl)).filter(Boolean)
    return { ...data, photoUrls }
  })
}
