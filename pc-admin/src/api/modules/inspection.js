/**
 * 巡检业务接口：模板、任务、记录
 * 对接后端 /inspection/*
 */
import { request } from '../http'
import { getFilePreviewUrl } from '@/utils/file'
import { formToCron } from '@/utils/cron'
import { formatDateTime } from '@/utils/dateTime'

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
      ? list
          .map((x) => {
            if (typeof x === 'object' && x != null) return x.id ?? x.deviceId ?? x.key
            return x
          })
          .map((v) => (v != null ? String(v) : ''))
          .filter(Boolean)
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
  return request({
    url: '/inspection/template',
    method: 'post',
    data: buildTemplatePayload(data),
  })
}

export function getTemplateItems(templateId) {
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
  const deviceIds = (data.deviceIds ?? data.deviceKeys ?? []).map((id) => (id != null ? String(id) : '')).filter(Boolean)
  const raw = {
    plan: data.plan?.trim?.(),
    cycle,
    cron: cron || undefined,
    team: data.team != null && data.team !== '' ? String(data.team) : undefined,
    owner: data.owner != null && data.owner !== '' ? String(data.owner) : undefined,
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
    data ? toKey(normalizeTaskRecord(data)) : null,
  )
}

export function createTask(data) {
  const payload = buildTaskPayload(data)
  return request({ url: '/inspection/task', method: 'post', data: payload }).then((data) =>
    data ? toKey(normalizeTaskRecord(data)) : null,
  )
}

export function updateTask(id, data) {
  const payload = buildTaskPayload(data)
  return request({ url: `/inspection/task/${id}`, method: 'put', data: payload }).then((data) =>
    data ? toKey(normalizeTaskRecord(data)) : null,
  )
}

export function deleteTask(id) {
  return request({ url: `/inspection/task/${id}`, method: 'delete' })
}

// ---------- 巡检记录 ----------
// Apifox：taskName / ownerName / executeTime|createTime / result+resultDesc；与前端 plan、inspector、submitTime 对齐

/** 解包分页：兼容 { records, total } 与 { data: { records, total } } */
function unwrapInspectionRecordPagePayload(payload) {
  const p =
    payload?.data != null && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? payload.data
      : payload
  const raw = p?.records ?? p?.list ?? []
  const total = p?.total ?? 0
  return { raw: Array.isArray(raw) ? raw : [], total: Number(total) || 0 }
}

/** 详情单条：兼容外层 data 包装 */
function unwrapInspectionRecordDetailPayload(payload) {
  if (payload == null) return null
  if (payload.data != null && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload
}

function countFilesInDevices(devices) {
  if (!Array.isArray(devices)) return 0
  return devices.reduce((n, d) => n + (Array.isArray(d?.files) ? d.files.length : 0), 0)
}

/** 巡检结果：优先中文描述，其次枚举转中文 */
function mapInspectionResultLabel(result, resultDesc) {
  if (resultDesc != null && String(resultDesc).trim() !== '') return String(resultDesc)
  const r = String(result ?? '')
    .trim()
    .toUpperCase()
  if (r === 'NORMAL') return '正常'
  if (r === 'ABNORMAL') return '异常'
  return result ?? '—'
}

function formatInspectionItemValue(val) {
  if (val === 'NORMAL' || val === 'normal') return '正常'
  if (val === 'ABNORMAL' || val === 'abnormal') return '异常'
  return val
}

/**
 * 将接口树形 items（含 children）扁平为 { name, value }[] 供表格展示
 * @param {unknown} items
 * @returns {Array<{ name: string, value: unknown }>}
 */
function flattenInspectionRecordItems(items) {
  if (!Array.isArray(items) || items.length === 0) return []
  const allLeaves = items.every((i) => !i?.children?.length && (i?.name != null || i?.value != null))
  if (allLeaves) {
    return items.map((i) => ({
      name: i.name ?? '',
      value: formatInspectionItemValue(i.value),
    }))
  }
  const rows = []
  for (const node of items) {
    if (node?.children?.length) {
      rows.push(...flattenInspectionRecordItems(node.children))
    } else if (node?.name != null || node?.value != null) {
      rows.push({
        name: node.name ?? '',
        value: formatInspectionItemValue(node.value),
      })
    }
  }
  return rows
}

/** 列表行 / 详情根对象字段对齐 */
function normalizeInspectionRecordRoot(raw) {
  if (!raw) return raw
  const r = toKey(raw)
  const devices = r.devices ?? []
  const photoCount =
    r.photos ??
    r.photoCount ??
    r.fileCount ??
    (typeof r.attachmentsCount === 'number' ? r.attachmentsCount : countFilesInDevices(devices))
  const rawSubmitTime = r.submitTime ?? r.executeTime ?? r.finishTime ?? r.createTime
  return {
    ...r,
    plan: r.plan ?? r.taskName ?? r.taskInfo?.name ?? '',
    inspector: r.inspector ?? r.ownerName ?? r.submitterName ?? r.submitUserName ?? r.userName ?? '',
    submitTime:
      rawSubmitTime != null && rawSubmitTime !== ''
        ? formatDateTime(rawSubmitTime)
        : '—',
    result: mapInspectionResultLabel(r.result, r.resultDesc),
    photos: typeof photoCount === 'number' ? photoCount : countFilesInDevices(devices),
  }
}

function mapRecordResultQueryForApi(result) {
  if (result === '正常') return 'NORMAL'
  if (result === '异常') return 'ABNORMAL'
  return result || undefined
}

export function getRecordPage(params = {}) {
  const q = {
    pageNumber: params.pageNumber ?? 1,
    pageSize: params.pageSize ?? 20,
    /** Apifox：keyword；部分网关仍用 plan */
    plan: params.plan || undefined,
    keyword: params.keyword || params.plan || undefined,
    device: params.device || undefined,
    inspector: params.inspector || undefined,
    result: mapRecordResultQueryForApi(params.result),
    startTime: params.startTime,
    endTime: params.endTime,
  }
  if (params.startTime) q['period.begin'] = params.startTime
  if (params.endTime) q['period.end'] = params.endTime
  return request({
    url: '/inspection/record/page',
    method: 'get',
    params: q,
  }).then((data) => {
    const { raw, total } = unwrapInspectionRecordPagePayload(data)
    return { list: raw.map((row) => normalizeInspectionRecordRoot(row)), total }
  })
}

export function getRecordById(id) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return request({ url: `/inspection/record/${id}`, method: 'get' }).then((data) => {
    const body = unwrapInspectionRecordDetailPayload(data)
    if (!body) return null
    const mapped = normalizeInspectionRecordRoot(body)
    if (mapped.devices?.length) {
      mapped.deviceResults = mapped.devices.map((d) => {
        const files = d.files ?? []
        const photoUrls = files.map((f) => getFilePreviewUrl(f, baseUrl)).filter(Boolean)
        const deviceCode = d.deviceCode ?? d.device
        const deviceName = d.deviceName
        const itemsFlat = flattenInspectionRecordItems(d.items ?? [])
        const resultLabel = mapInspectionResultLabel(d.result, d.resultDesc)
        return {
          ...d,
          deviceCode,
          deviceName,
          device: deviceName || deviceCode || '',
          result: resultLabel,
          items: itemsFlat,
          photoUrls,
        }
      })
    } else if (mapped.files?.length) {
      mapped.photoUrls = mapped.files.map((f) => getFilePreviewUrl(f, baseUrl)).filter(Boolean)
    }
    return mapped
  })
}

export function getRecordDevice(recordId, deviceCode) {
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
