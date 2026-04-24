/**
 * 统一识别后端「HTTP 2xx 但 body 里表示业务失败」的常见形态，避免误提示成功。
 * 见 assertBusinessOk
 */

function pickMessage(body) {
  if (!body || typeof body !== 'object') return ''
  const m = body.message ?? body.msg ?? body.errorMessage
  if (m != null && m !== '') return typeof m === 'string' ? m : String(m)
  if (body.error != null && typeof body.error === 'string' && body.error !== '') return body.error
  return ''
}

/**
 * @param {unknown} body - axios 已解包后的 response.data
 * @returns {unknown} 成功时解包为 data 字段（若有）或原对象
 * @throws {Error} 业务明确失败时，error.response 可配合 getApiErrorMessage
 */
export function assertBusinessOk(body) {
  if (body == null) return body
  // 常见：HTTP 200 + 响应体为 false 表示未成功（如 ResponseEntity.ok(false)）
  if (body === false) {
    const err = new Error('操作未成功，后端返回了 false，请检查接口与权限。')
    err.response = { data: false, status: 200, statusText: 'OK' }
    throw err
  }
  const t = typeof body
  if (t === 'string' || t === 'number' || t === 'boolean') return body
  if (Array.isArray(body)) return body
  if (typeof body !== 'object') return body

  if (body.ok === false) {
    const msg = pickMessage(body) || '操作失败'
    const err = new Error(msg)
    err.response = { data: body, status: 200, statusText: 'OK' }
    throw err
  }

  if (body.success === false) {
    const msg = pickMessage(body) || '操作失败'
    const err = new Error(msg)
    err.response = { data: body, status: 200, statusText: 'OK' }
    throw err
  }

  if (Object.prototype.hasOwnProperty.call(body, 'code')) {
    const c = body.code
    const isOk = c === 0 || c === 200 || c === '0' || c === '200' || c === 10000
    if (!isOk) {
      const msg = pickMessage(body) || `操作失败（code: ${c}）`
      const err = new Error(msg)
      err.response = { data: body, status: 200, statusText: 'OK' }
      throw err
    }
    if (Object.prototype.hasOwnProperty.call(body, 'data') && body.data !== undefined) {
      return body.data
    }
    return body
  }

  return body
}
