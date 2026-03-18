/**
 * 从 API 错误对象中提取可读的错误信息
 * @param {Error} err - axios 或 request 抛出的错误
 * @returns {string}
 */
export function getApiErrorMessage(err) {
  if (!err) return '请求失败，请稍后重试'
  const data = err?.response?.data
  if (data && typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const msg = data.message ?? data.msg ?? data.error ?? data.errorMessage
    if (msg) return typeof msg === 'string' ? msg : String(msg)
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e) => (typeof e === 'string' ? e : e?.message ?? e?.msg ?? String(e))).join('；')
    }
  }
  const status = err?.response?.status
  const statusText = err?.response?.statusText
  if (status === 412) {
    return data?.message ?? data?.msg ?? '数据校验未通过，请检查设备编码是否重复或必填项是否完整'
  }
  if (status && statusText) return `${status} ${statusText}`
  return err?.message ?? '请求失败，请稍后重试'
}
