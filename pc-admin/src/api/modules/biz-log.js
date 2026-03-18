import { request } from '../http'

function cleanParams(params = {}) {
  const clean = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v
  }
  return clean
}

/**
 * 业务日志分页查询
 * GET /inspection/biz-log/page
 */
export function getBizLogPage(params = {}) {
  return request({
    url: '/inspection/biz-log/page',
    method: 'get',
    params: cleanParams({
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 10,
      bizType: params.bizType,
      bizId: params.bizId,
      operation: params.operation,
      success: params.success,
      'period.begin': params.periodBegin,
      'period.end': params.periodEnd,
      keyword: params.keyword,
    }),
  }).then((data) => {
    const records = data?.records ?? data?.list ?? []
    return {
      list: Array.isArray(records) ? records : [],
      total: Number(data?.total ?? 0),
      current: Number(data?.current ?? params.pageNumber ?? 1),
      size: Number(data?.size ?? params.pageSize ?? 10),
    }
  })
}
