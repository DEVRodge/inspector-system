import { isMockEnabled, mockRequest, request } from '../http'
import { getReportMockData } from '../../mock/modules/report'

export function getReportData(params = {}) {
  if (isMockEnabled) {
    return mockRequest(() => getReportMockData(params.period))
  }

  return request({
    url: '/reports/overview',
    method: 'get',
    params,
  })
}
