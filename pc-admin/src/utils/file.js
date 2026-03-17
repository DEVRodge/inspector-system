/**
 * 根据 FileVO 构建图片/文件预览 URL
 * @param {object} file - FileVO: { id, path, accessPrefix }
 * @param {string} baseUrl - API 基础 URL，如 import.meta.env.VITE_API_BASE_URL
 */
export function getFilePreviewUrl(file, baseUrl = '') {
  if (!file?.id) return ''
  if (file.path?.startsWith('http://') || file.path?.startsWith('https://')) {
    return file.path
  }
  if (file.accessPrefix && file.path) {
    const sep = file.path.startsWith('/') ? '' : '/'
    return `${file.accessPrefix}${sep}${file.path}`
  }
  const base = baseUrl || import.meta.env.VITE_API_BASE_URL || ''
  return `${base}${base.endsWith('/') ? '' : '/'}public/file/${file.id}`
}
