import { isMockEnabled, mockRequest, request } from '../http'

const DEFAULT_CHANNEL = 'CHANNEL_SITE'

export function getUnreadTotal(channelType = DEFAULT_CHANNEL) {
  if (isMockEnabled) {
    return mockRequest(3)
  }

  return request({
    url: `/msg-record/un-read/total/${channelType}`,
    method: 'get',
  })
}

export function getMessageList(params = {}) {
  const { pageNumber = 1, pageSize = 10, channelType = DEFAULT_CHANNEL, ...rest } = params

  if (isMockEnabled) {
    return mockRequest(() => ({
      total: 3,
      pages: 1,
      records: [
        {
          id: 1,
          msgSceneName: '系统通知',
          msgContent: '欢迎使用光伏厂区设备巡检数字化系统。',
          businessType: 'SYSTEM',
          msgType: 'SYSTEM_NOTICE',
          hasRead: false,
          sendTime: new Date().toISOString(),
        },
        {
          id: 2,
          msgSceneName: '任务提醒',
          msgContent: '您有新的巡检任务待处理，请尽快查看。',
          businessType: 'TASK',
          msgType: 'TASK_REMIND',
          hasRead: false,
          sendTime: new Date().toISOString(),
        },
        {
          id: 3,
          msgSceneName: '异常处理',
          msgContent: '设备 A-01 有新的异常记录，请关注整改进度。',
          businessType: 'EXCEPTION',
          msgType: 'EXCEPTION_ALERT',
          hasRead: true,
          sendTime: new Date().toISOString(),
        },
      ],
    }))
  }

  return request({
    url: '/msg-records',
    method: 'get',
    params: {
      pageNumber,
      pageSize,
      channelType,
      ...rest,
    },
  })
}

export function readAll(channelType = DEFAULT_CHANNEL) {
  if (isMockEnabled) {
    return mockRequest({})
  }

  return request({
    url: `/msg-record/read-all/${channelType}`,
    method: 'put',
  })
}

export function readBatch(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return Promise.resolve({})
  }

  if (isMockEnabled) {
    return mockRequest({})
  }

  return request({
    url: '/msg-record/read-batch',
    method: 'put',
    data: ids,
  })
}

