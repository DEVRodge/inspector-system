/**
 * 文件上传与预览
 * 对接后端 /file/*
 */
import { request } from '../http'
import { getFilePreviewUrl } from '@/utils/file'

export { getFilePreviewUrl }

/**
 * 上传文件
 * @param {File} file
 * @returns {Promise<{id: number, name: string, path: string, accessPrefix?: string}>}
 */
export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: '/file/upload',
    method: 'post',
    data: formData,
  })
}
