import { isMockEnabled, mockRequest, request } from '../http'
import { getDashboardMockData } from '../../mock/modules/dashboard'

export function getDashboardData() {
  if (isMockEnabled) {
    return mockRequest(getDashboardMockData)
  }

  return request({
    url: '/dashboard/overview',
    method: 'get',
  })
}
