/**
 * 解析 JWT payload（不校验签名，仅用于读取常见业务声明）
 * @param {string} accessToken
 * @returns {Record<string, unknown>|null}
 */
export function parseJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') return null
  const parts = accessToken.split('.')
  if (parts.length < 2) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    const padded = pad ? b64 + '='.repeat(4 - pad) : b64
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    const json = new TextDecoder('utf-8').decode(bytes)
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * 从 JWT claims 中尽量取出数字型用户主键（与 GET /user/{id} 对齐）
 */
export function pickUserIdFromClaims(claims) {
  if (!claims || typeof claims !== 'object') return null
  const candidates = [claims.userId, claims.user_id, claims.uid, claims.id, claims.userIdStr]
  for (const v of candidates) {
    if (v == null || v === '') continue
    const s = String(v).trim()
    if (/^\d+$/.test(s)) return s
  }
  const sub = claims.sub
  if (sub != null && /^\d+$/.test(String(sub).trim())) return String(sub).trim()
  return null
}

function normalizeAuthorityEntry(a) {
  if (a == null) return ''
  if (typeof a === 'string') return a
  if (typeof a === 'object' && a.authority != null) return String(a.authority)
  return String(a)
}

/**
 * 将 JWT 中的权限/角色类声明格式化为展示用字符串
 */
export function formatAuthoritiesFromClaims(claims) {
  if (!claims || typeof claims !== 'object') return ''
  const auth = claims.authorities ?? claims.authority ?? claims.scope
  if (Array.isArray(auth)) {
    return auth.map(normalizeAuthorityEntry).filter(Boolean).join('、')
  }
  if (typeof auth === 'string') {
    return auth
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join('、')
  }
  return ''
}
