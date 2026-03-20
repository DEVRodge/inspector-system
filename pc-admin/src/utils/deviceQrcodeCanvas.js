/**
 * 设备二维码：画布排版 + PNG（纯前端，不依赖后端）
 */
import QRCode from 'qrcode'

function wrapText(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (const char of text) {
    const test = line + char
    const { width } = ctx.measureText(test)
    if (width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

const DEFAULT_WIDTH = 600
const DEFAULT_HEIGHT = 900

/**
 * 生成带设备信息的二维码 PNG Data URL（内容为设备编码 record.code）
 * @param {object} record - 含 code, name, model
 * @param {{ canvasWidth?: number, canvasHeight?: number, qrSize?: number, pad?: number, extraLines?: string[] }} [options]
 */
export async function generateLabeledQrcodeDataUrl(record, options = {}) {
  const canvasWidth = options.canvasWidth ?? DEFAULT_WIDTH
  const canvasHeight = options.canvasHeight ?? DEFAULT_HEIGHT
  const qrSize = options.qrSize ?? 400
  const pad = options.pad ?? 60

  const code = record?.code ?? ''
  if (!code) throw new Error('缺少设备编码')

  const qrDataUrl = await QRCode.toDataURL(code, { width: qrSize, margin: 2 })

  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = qrDataUrl
  })

  const lineHeight = 32
  const texts = [
    `设备名称：${record.name || '-'}`,
    `设备编码：${record.code || '-'}`,
    `型号：${record.model || '-'}`,
    ...(options.extraLines?.length ? options.extraLines : []),
  ]

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.drawImage(img, (canvasWidth - qrSize) / 2, pad, qrSize, qrSize)

  ctx.fillStyle = '#1f2329'
  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'

  const maxTextWidth = canvasWidth - pad * 2
  const allWrapped = []
  for (const text of texts) {
    allWrapped.push(wrapText(ctx, text, maxTextWidth))
  }

  let y = pad + qrSize + 48
  for (const wrapped of allWrapped) {
    for (const w of wrapped) {
      ctx.fillText(w, canvasWidth / 2, y)
      y += lineHeight
    }
  }

  return canvas.toDataURL('image/png')
}

export function triggerPngDownload(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
