<script setup>
import { computed, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import QRCode from 'qrcode'
import {
  exportExcel,
  exportTemplate,
  getDepartments,
  importEquipment,
} from '../../api/modules/equipment'
import { equipmentRows } from '../../mock/data'

const query = reactive({
  keyword: '',
  type: undefined,
  status: undefined,
})

const rows = ref([...equipmentRows])
const detailVisible = ref(false)
const formVisible = ref(false)
const qrcodeVisible = ref(false)
const currentRow = ref(null)
const qrcodeRecord = ref(null)
const formState = reactive({
  key: '',
  code: '',
  name: '',
  type: '',
  model: '',
  voltage: '',
  location: '',
  team: '',
  date: '',
  status: '运行中',
})

const filteredRows = computed(() =>
  rows.value.filter((item) => {
    const keywordMatch =
      !query.keyword ||
      item.code.toLowerCase().includes(query.keyword.toLowerCase()) ||
      item.name.toLowerCase().includes(query.keyword.toLowerCase())
    const typeMatch = !query.type || item.type === query.type
    const statusMatch = !query.status || item.status === query.status
    return keywordMatch && typeMatch && statusMatch
  }),
)

function fillForm(record) {
  Object.assign(formState, record || {
    key: '',
    code: '',
    name: '',
    type: '',
    model: '',
    voltage: '',
    location: '',
    team: '',
    date: '',
    status: '运行中',
  })
}

const teamOptions = ref([])

async function openCreate() {
  currentRow.value = null
  fillForm()
  formVisible.value = true
  await loadDepartments()
}

async function loadDepartments() {
  try {
    const res = await getDepartments()
    const list = res?.list ?? []
    teamOptions.value = list.map((item) =>
      typeof item === 'string' ? { value: item, label: item } : { value: item.name ?? item.id, label: item.name ?? item.id },
    )
  } catch {
    teamOptions.value = []
  }
}

function openDetail(record) {
  currentRow.value = record
  detailVisible.value = true
}

async function openEdit(record) {
  currentRow.value = record
  fillForm(record)
  formVisible.value = true
  await loadDepartments()
}

function saveRow() {
  if (!formState.code || !formState.name || !formState.type) {
    message.warning('请先填写设备编码、设备类型和设备名称')
    return
  }

  if (currentRow.value) {
    const index = rows.value.findIndex((item) => item.key === currentRow.value.key)
    rows.value[index] = { ...formState }
    message.success('设备信息已更新')
  } else {
    rows.value.unshift({ ...formState, key: `${Date.now()}` })
    message.success('设备已新增')
  }

  formVisible.value = false
}

function removeRow(record) {
  Modal.confirm({
    title: `确认删除设备 ${record.code} 吗？`,
    content: '当前为静态演示，删除只影响前端页面展示。',
    onOk() {
      rows.value = rows.value.filter((item) => item.key !== record.key)
      message.success('设备已删除')
    },
  })
}

const qrcodeDataUrl = ref('')

const PREVIEW_WIDTH = 600
const PREVIEW_HEIGHT = 900
const PREVIEW_QR_SIZE = 160

async function generateCode(record) {
  qrcodeRecord.value = record
  qrcodeVisible.value = true
  qrcodeDataUrl.value = ''
  try {
    qrcodeDataUrl.value = await QRCode.toDataURL(record.code, {
      width: PREVIEW_QR_SIZE,
      margin: 2,
    })
  } catch {
    qrcodeDataUrl.value = ''
  }
}

function closeQrcode() {
  qrcodeVisible.value = false
  qrcodeRecord.value = null
  qrcodeDataUrl.value = ''
}

const downloadLoading = ref(false)

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

async function handleDownloadQrcode() {
  if (!qrcodeRecord.value) return

  downloadLoading.value = true
  try {
    const record = qrcodeRecord.value
    const canvasWidth = PREVIEW_WIDTH
    const canvasHeight = PREVIEW_HEIGHT

    const qrSize = 400
    const pad = 60
    const qrDataUrl = await QRCode.toDataURL(record.code, { width: qrSize, margin: 2 })

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

    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `二维码_${record.code}.png`
    a.click()
    message.success('二维码已下载')
  } catch (err) {
    message.error('下载失败，请稍后重试')
  } finally {
    downloadLoading.value = false
  }
}

// ---------- 导入/导出（由后端接口实现） ----------
const importFileRef = ref(null)
const importLoading = ref(false)
const exportTemplateLoading = ref(false)
const exportExcelLoading = ref(false)

function triggerImport() {
  importFileRef.value?.click()
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function handleExportTemplate() {
  exportTemplateLoading.value = true
  try {
    const res = await exportTemplate()
    downloadBlob(res.data, '设备台账导入模板.xlsx')
    message.success('模板已下载')
  } catch (err) {
    message.error(err?.response?.data?.message || '导出模板失败，请确认后端接口已就绪')
  } finally {
    exportTemplateLoading.value = false
  }
}

async function handleExportExcel() {
  exportExcelLoading.value = true
  try {
    const res = await exportExcel({
      keyword: query.keyword || undefined,
      type: query.type,
      status: query.status,
    })
    const filename = `设备台账_${new Date().toISOString().slice(0, 10)}.xlsx`
    downloadBlob(res.data, filename)
    message.success('导出成功')
  } catch (err) {
    message.error(err?.response?.data?.message || '导出失败，请确认后端接口已就绪')
  } finally {
    exportExcelLoading.value = false
  }
}

async function handleImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls'].includes(ext)) {
    message.error('请上传 Excel 文件（.xlsx 或 .xls）')
    return
  }

  importLoading.value = true
  try {
    const res = await importEquipment(file)
    const data = res?.data ?? res
    if (data?.success && data?.count > 0) {
      message.success(`成功导入 ${data.count} 条设备`)
      // 导入成功后需由后端列表接口刷新数据，此处仅提示
    } else if (data?.errors?.length) {
      Modal.warning({
        title: '部分行导入失败',
        content: data.errors.slice(0, 5).join('\n') + (data.errors.length > 5 ? `\n... 共 ${data.errors.length} 条` : ''),
      })
    } else {
      message.warning(data?.message || '未解析到有效数据')
    }
  } catch (err) {
    message.error(err?.response?.data?.message || '导入失败，请确认后端接口已就绪')
  } finally {
    importLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>设备台账</h2>
        <p>按通用设备资产列表管理，支持不同设备类型的新增、查看、编辑、删除和二维码生成。</p>
      </div>
      <a-space>
        <a-button :loading="importLoading" @click="triggerImport">导入设备</a-button>
        <input
          ref="importFileRef"
          type="file"
          accept=".xlsx,.xls"
          style="display: none"
          @change="handleImportFile"
        />
        <a-button :loading="exportTemplateLoading" @click="handleExportTemplate">导出模板</a-button>
        <a-button :loading="exportExcelLoading" @click="handleExportExcel">导出 Excel</a-button>
        <a-button type="primary" @click="openCreate">新增设备</a-button>
      </a-space>
    </div>

    <a-card :bordered="false">
      <div class="table-toolbar">
        <div class="table-toolbar__left" style="flex: 1">
          <a-input v-model:value="query.keyword" placeholder="搜索设备编码/名称" allow-clear />
          <a-select v-model:value="query.type" placeholder="设备类型" allow-clear style="width: 180px">
            <a-select-option value="逆变器">逆变器</a-select-option>
            <a-select-option value="汇流箱">汇流箱</a-select-option>
            <a-select-option value="箱变">箱变</a-select-option>
            <a-select-option value="配电柜">配电柜</a-select-option>
          </a-select>
          <a-select v-model:value="query.status" placeholder="运行状态" allow-clear style="width: 180px">
            <a-select-option value="运行中">运行中</a-select-option>
            <a-select-option value="检修中">检修中</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </div>
      </div>

      <a-table :data-source="filteredRows" row-key="key">
        <a-table-column title="设备编码" data-index="code" key="code" width="130" />
        <a-table-column title="设备类型" data-index="type" key="type" width="110" />
        <a-table-column title="设备名称" data-index="name" key="name" />
        <a-table-column title="型号" data-index="model" key="model" width="120" />
        <a-table-column title="电压等级" data-index="voltage" key="voltage" width="110" />
        <a-table-column title="安装地点" data-index="location" key="location" />
        <a-table-column title="责任部门" data-index="team" key="team" width="110" />
        <a-table-column title="投运日期" data-index="date" key="date" width="120" />
        <a-table-column title="运行状态" data-index="status" key="status" width="110" />
        <a-table-column title="操作" key="action" width="240" fixed="right">
          <template #default="{ record }">
            <a-space :size="4">
              <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="generateCode(record)">生成二维码</a-button>
              <a-button danger type="link" size="small" @click="removeRow(record)">删除</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailVisible" title="设备详情" width="420">
      <a-descriptions v-if="currentRow" :column="1" bordered size="small">
        <a-descriptions-item label="设备编码">{{ currentRow.code }}</a-descriptions-item>
        <a-descriptions-item label="设备类型">{{ currentRow.type }}</a-descriptions-item>
        <a-descriptions-item label="设备名称">{{ currentRow.name }}</a-descriptions-item>
        <a-descriptions-item label="型号">{{ currentRow.model }}</a-descriptions-item>
        <a-descriptions-item label="电压等级">{{ currentRow.voltage }}</a-descriptions-item>
        <a-descriptions-item label="安装地点">{{ currentRow.location }}</a-descriptions-item>
        <a-descriptions-item label="责任部门">{{ currentRow.team }}</a-descriptions-item>
        <a-descriptions-item label="投运日期">{{ currentRow.date }}</a-descriptions-item>
        <a-descriptions-item label="运行状态">{{ currentRow.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal
      v-model:open="qrcodeVisible"
      title="二维码预览"
      :footer="null"
      width="400"
      :body-style="{ padding: '16px 20px' }"
      @cancel="closeQrcode"
    >
      <div v-if="qrcodeRecord" class="qrcode-preview">
        <div class="qrcode-preview__body">
          <div class="qrcode-preview__image">
            <img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" :alt="qrcodeRecord.code" />
            <div v-else class="qrcode-preview__loading">生成中</div>
          </div>
          <div class="qrcode-preview__info">
            <div class="qrcode-preview__row">
              <span class="qrcode-preview__label">设备名称</span>
              <span class="qrcode-preview__value">{{ qrcodeRecord.name }}</span>
            </div>
            <div class="qrcode-preview__row">
              <span class="qrcode-preview__label">设备编码</span>
              <span class="qrcode-preview__value">{{ qrcodeRecord.code }}</span>
            </div>
            <div class="qrcode-preview__row">
              <span class="qrcode-preview__label">型号</span>
              <span class="qrcode-preview__value">{{ qrcodeRecord.model || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="qrcode-preview__actions">
          <a-button :loading="downloadLoading" :disabled="!qrcodeDataUrl" size="small" @click="handleDownloadQrcode">下载</a-button>
          <a-button type="primary" size="small" @click="closeQrcode">关闭</a-button>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="formVisible"
      :title="currentRow ? '编辑设备' : '新增设备'"
      @ok="saveRow"
    >
      <a-form layout="vertical">
        <a-form-item label="设备编码"><a-input v-model:value="formState.code" /></a-form-item>
        <a-form-item label="设备类型">
          <a-select v-model:value="formState.type" placeholder="请选择设备类型">
            <a-select-option value="逆变器">逆变器</a-select-option>
            <a-select-option value="汇流箱">汇流箱</a-select-option>
            <a-select-option value="箱变">箱变</a-select-option>
            <a-select-option value="配电柜">配电柜</a-select-option>
            <a-select-option value="其他设备">其他设备</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="设备名称"><a-input v-model:value="formState.name" /></a-form-item>
        <a-form-item label="型号"><a-input v-model:value="formState.model" /></a-form-item>
        <a-form-item label="电压等级"><a-input v-model:value="formState.voltage" /></a-form-item>
        <a-form-item label="安装地点"><a-input v-model:value="formState.location" /></a-form-item>
        <a-form-item label="责任部门">
          <a-select v-model:value="formState.team" placeholder="请选择责任部门" allow-clear :options="teamOptions" />
        </a-form-item>
        <a-form-item label="投运日期">
          <a-date-picker
            v-model:value="formState.date"
            value-format="YYYY-MM-DD"
            placeholder="请选择投运日期"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="运行状态">
          <a-select v-model:value="formState.status">
            <a-select-option value="运行中">运行中</a-select-option>
            <a-select-option value="检修中">检修中</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.qrcode-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qrcode-preview__body {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.qrcode-preview__image {
  flex-shrink: 0;
  padding: 8px;
  background: #fafafa;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}

.qrcode-preview__image img {
  display: block;
  width: 160px;
  height: 160px;
}

.qrcode-preview__loading {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
  font-size: 13px;
}

.qrcode-preview__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qrcode-preview__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: #fafafa;
  border-radius: 6px;
}

.qrcode-preview__label {
  color: #86909c;
  font-size: 11px;
}

.qrcode-preview__value {
  color: #1f2329;
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
}

.qrcode-preview__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
}
</style>
