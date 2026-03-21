/**
 * 根据 FileVO 构建图片/文件预览 URL
 *
 * **优先使用 `path`**（如 `/minio/inspector-file/...`）。`endpointPath` 多为内网 MinIO 直链，
 * 浏览器常不可达，仅在没有可用 `path` 时再兜底。
 *
 * MinIO 经业务网关：`http://host:3000/minio/...` 与 `/api` 平级，不要拼到 `/api` 下。
 * 开发环境：Vite 代理 `/minio` → 后端；可选 `VITE_FILE_PUBLIC_ORIGIN` 指定绝对源站。
 *
 * @param {object} file - FileVO: { id?, path?, accessPrefix?, endpointPath? }
 * @param {string} baseUrl - 业务 API 前缀，如 /api
 */
export function getFilePreviewUrl(file, baseUrl = '') {
  if (!file) return ''

  if (file.path?.startsWith('http://') || file.path?.startsWith('https://')) {
    return file.path
  }

  const base = String(baseUrl || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

  // 优先 path：MinIO 网关路径（与 /api 并列）
  if (file.path && file.path.startsWith('/minio')) {
    const origin = String(import.meta.env.VITE_FILE_PUBLIC_ORIGIN || '').replace(/\/$/, '')
    if (origin) {
      return `${origin}${file.path}`
    }
    return file.path
  }

  // 其它以 / 开头的 path
  if (file.path && file.path.startsWith('/')) {
    const p = file.path
    if (base && (p === base || p.startsWith(`${base}/`))) {
      return p
    }
    return base ? `${base}${p}` : p
  }

  // path 为相对片段：与 accessPrefix 组合
  if (file.accessPrefix && file.path) {
    const ap = String(file.accessPrefix).replace(/\/$/, '')
    const p = String(file.path).replace(/^\//, '')
    const joined = `${ap}/${p}`
    if (joined.startsWith('/minio')) {
      const origin = String(import.meta.env.VITE_FILE_PUBLIC_ORIGIN || '').replace(/\/$/, '')
      return origin ? `${origin}${joined}` : joined
    }
    return base && joined.startsWith('/') ? `${base}${joined}` : joined
  }

  if (file.id != null && file.id !== '') {
    const idSeg = encodeURIComponent(String(file.id))
    if (base) return `${base}/public/file/${idSeg}`
    return `/public/file/${idSeg}`
  }

  // 无 path / 无 id 时最后才用内网 endpointPath（可能浏览器无法访问）
  const ep = file.endpointPath
  if (typeof ep === 'string' && (ep.startsWith('http://') || ep.startsWith('https://'))) {
    return ep
  }

  return ''
}
