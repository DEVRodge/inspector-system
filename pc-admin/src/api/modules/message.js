import { request } from '../http'

const DEFAULT_CHANNEL = 'CHANNEL_SITE'

export function getUnreadTotal(channelType = DEFAULT_CHANNEL) {
  return request({
    url: `/msg-record/un-read/total/${channelType}`,
    method: 'get',
  }).then((res) => {
    if (typeof res === 'number') return res
    return res?.data ?? res?.total ?? res ?? 0
  })
}

export function getMessageList(params = {}) {
  const { pageNumber = 1, pageSize = 10, channelType = DEFAULT_CHANNEL, ...rest } = params

  return request({
    url: '/msg-records',
    method: 'get',
    params: {
      pageNumber,
      pageSize,
      channelType,
      ...rest,
    },
  }).then((data) => {
    const list = data?.records ?? data?.list ?? []
    const total = data?.total ?? 0
    return { records: list, total }
  })
}

export function readAll(channelType = DEFAULT_CHANNEL) {
  return request({
    url: `/msg-record/read-all/${channelType}`,
    method: 'put',
  })
}

export function readBatch(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return Promise.resolve({})
  }

  return request({
    url: '/msg-record/read-batch',
    method: 'put',
    data: ids.map((id) => String(id)).filter(Boolean),
  })
}
