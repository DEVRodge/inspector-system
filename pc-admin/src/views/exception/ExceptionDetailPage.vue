<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getUsers } from '../../api/modules/user'
import { uploadFile } from '../../api/modules/file'
import { getFilePreviewUrl } from '../../utils/file'
import { formatDateTime } from '../../utils/dateTime'
import { useExceptionStore } from '../../stores/exception'

const route = useRoute()
const router = useRouter()
const exceptionStore = useExceptionStore()

const exception = ref(null)
const loading = ref(false)

const assignModalOpen = ref(false)
const selectedHandler = ref(undefined)
const handlerOptions = ref([])
const assignLoading = ref(false)

const processModalOpen = ref(false)
const processResult = ref('')
const processFileIds = ref([])
const processUploadList = ref([])
const processSubmitting = ref(false)

const allPhotoUrls = computed(() => {
  const ex = exception.value
  if (!ex) return []
  const files = [...(ex.files ?? []), ...(ex.recordDeviceFiles ?? [])]
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return files.map((f) => getFilePreviewUrl(f, base)).filter(Boolean)
})

function goBack() {
  router.push('/exceptions')
}

async function refreshException(forceFetch = true) {
  if (!route.params.id) return
  exception.value = await exceptionStore.getById(route.params.id, { forceFetch })
}

async function loadAssignableUsers() {
  assignLoading.value = true
  try {
    const res = await getUsers({ pageNumber: 1, pageSize: 500, enabled: true })
    const arr = res?.records ?? res?.list ?? (Array.isArray(res) ? res : [])
    handlerOptions.value = arr.map((u) => ({
      value: String(u.id ?? ''),
      label: u.name ?? u.username ?? String(u.id ?? ''),
    }))
  } catch {
    handlerOptions.value = []
    message.error('加载可指派用户失败')
  } finally {
    assignLoading.value = false
  }
}

async function openAssignModal() {
  selectedHandler.value = undefined
  assignModalOpen.value = true
  await loadAssignableUsers()
}

function closeAssignModal() {
  assignModalOpen.value = false
  selectedHandler.value = undefined
}

async function confirmAssign() {
  if (!exception.value || !selectedHandler.value) {
    message.warning('请选择处理人')
    return
  }
  try {
    await exceptionStore.assign(exception.value.key, selectedHandler.value)
    await refreshException(true)
    message.success('指派成功')
    closeAssignModal()
  } catch {
    message.error('指派失败，请稍后重试')
  }
}

function openProcessModal() {
  processResult.value = ''
  processFileIds.value = []
  processUploadList.value = []
  processModalOpen.value = true
}

function closeProcessModal() {
  processModalOpen.value = false
}

async function handleUpload({ file, onSuccess, onError }) {
  try {
    const rawFile = file?.originFileObj ?? file
    const saved = await uploadFile(rawFile)
    const base = import.meta.env.VITE_API_BASE_URL || ''
    processFileIds.value = [...processFileIds.value, String(saved.id)]
    processUploadList.value = [
      ...processUploadList.value,
      {
        uid: String(saved.id),
        name: saved.name ?? rawFile?.name ?? file?.name,
        status: 'done',
        url: getFilePreviewUrl(saved, base),
        fileId: String(saved.id),
      },
    ]
    onSuccess?.(saved)
  } catch (err) {
    onError?.(err)
    message.error('上传失败，请重试')
  }
}

function removeUpload(file) {
  const fileId = String(file.fileId ?? file.uid ?? '')
  processFileIds.value = processFileIds.value.filter((id) => String(id) !== fileId)
  processUploadList.value = processUploadList.value.filter((f) => String(f.uid) !== String(file.uid))
  return true
}

async function confirmProcess() {
  if (!exception.value) return
  processSubmitting.value = true
  try {
    await exceptionStore.process(exception.value.key, {
      processResult: processResult.value?.trim() || undefined,
      fileIds: processFileIds.value,
    })
    await refreshException(true)
    message.success('处理结果已提交')
    closeProcessModal()
  } catch {
    message.error('提交失败，请稍后重试')
  } finally {
    processSubmitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await refreshException(true)
  } finally {
    loading.value = false
  }
  if (!exception.value) {
    message.warning('异常不存在')
    goBack()
  }
})
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <a class="back-link" @click="goBack">返回异常管理</a>
        <h2>异常详情</h2>
      </div>
    </div>

    <a-spin :spinning="loading">
    <a-card v-if="exception" :bordered="false">
      <a-descriptions :column="1" bordered size="small" class="detail-section">
        <a-descriptions-item label="异常编号">{{ exception.code }}</a-descriptions-item>
        <a-descriptions-item label="设备编码">{{ exception.device }}</a-descriptions-item>
        <a-descriptions-item label="设备名称">{{ exception.deviceName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="异常描述">{{ exception.desc }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDateTime(exception.createTime) }}</a-descriptions-item>
        <a-descriptions-item label="处理人">
          {{ exception.handler || '未指派' }}
          <a-button
            v-if="exception.statusApi === 'PENDING'"
            type="link"
            size="small"
            style="margin-left: 8px"
            @click="openAssignModal"
          >
            指派
          </a-button>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          {{ exception.statusDesc || exception.status || '-' }}
          <a-button
            v-if="exception.statusApi === 'PROCESSING'"
            type="link"
            size="small"
            style="margin-left: 8px"
            @click="openProcessModal"
          >
            提交处理结果
          </a-button>
        </a-descriptions-item>
        <a-descriptions-item label="处理结果">{{ exception.processResult || '-' }}</a-descriptions-item>
        <a-descriptions-item label="处理时间">{{ formatDateTime(exception.processTime) }}</a-descriptions-item>
      </a-descriptions>

      <a-modal
        v-model:open="assignModalOpen"
        title="指派处理人"
        @ok="confirmAssign"
        @cancel="closeAssignModal"
      >
        <a-form-item label="处理人" required>
          <a-select
            v-model:value="selectedHandler"
            placeholder="请选择处理人"
            style="width: 100%"
            :options="handlerOptions"
            :loading="assignLoading"
            allow-clear
          />
        </a-form-item>
      </a-modal>

      <a-modal
        v-model:open="processModalOpen"
        title="提交处理结果"
        :confirm-loading="processSubmitting"
        @ok="confirmProcess"
        @cancel="closeProcessModal"
      >
        <a-form layout="vertical">
          <a-form-item label="处理结果说明">
            <a-textarea
              v-model:value="processResult"
              :rows="4"
              placeholder="请输入处理结果（可选）"
            />
          </a-form-item>
          <a-form-item label="处理结果照片">
            <a-upload
              :custom-request="handleUpload"
              :file-list="processUploadList"
              list-type="picture-card"
              @remove="removeUpload"
            >
              <div>上传</div>
            </a-upload>
          </a-form-item>
        </a-form>
      </a-modal>

      <div class="detail-section">
        <div class="detail-section__title">异常相关照片</div>
        <div v-if="allPhotoUrls.length" class="photo-grid">
          <a-image-preview-group>
            <a-image
              v-for="(url, i) in allPhotoUrls"
              :key="i"
              :src="url"
              :width="120"
              :height="90"
              class="photo-thumb"
              fit="cover"
            />
          </a-image-preview-group>
        </div>
        <div v-else class="detail-empty">暂无照片</div>
      </div>
    </a-card>
    </a-spin>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 8px;
  color: #1677ff;
  cursor: pointer;
  font-size: 14px;
}

.back-link:hover {
  color: #4096ff;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section__title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2329;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.photo-thumb {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.detail-empty {
  padding: 24px;
  text-align: center;
  color: #86909c;
  background: #f7f8fa;
  border-radius: 8px;
}
</style>
