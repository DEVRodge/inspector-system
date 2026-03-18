import { request } from '../http'

/**
 * 工作台统计（严格按接口文档）
 * GET /inspection/dashboard/stats
 */
export function getDashboardData() {
  return request({
    url: '/inspection/dashboard/stats',
    method: 'get',
  })
}
