<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { recordRows } from '../../mock/data'
import { getAssignableUserTree } from '../../api/modules/assign'
import { getFilePreviewUrl } from '../../utils/file'
import { useExceptionStore } from '../../stores/exception'

const route = useRoute()
const router = useRouter()
const exceptionStore = useExceptionStore()

const exception = ref(null)
const loading = ref(false)

const record = computed(() => {
  const rid = exception.value?.recordId
  if (!rid) return null
  return recordRows.find((r) => String(r.key) === String(rid)) ?? null
})

const previewUrls = computed(() => {
  const ex = exception.value
  if (!ex) return []
  const files = [...(ex.files ?? []), ...(ex.recordDeviceFiles ?? [])]
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return files.map((f) => getFilePreviewUrl(f, base)).filter(Boolean)
})

const assignModalOpen = ref(false)
const selectedHandler = ref(undefined)
const assignTreeData = ref([])
const assignTreeLoading = ref(false)

function findNodeTitle(tree, value) {
  for (const node of tree || []) {
    if (node.value === value || String(node.value) === String(value)) return node.title
    if (node.children) {
      const found = findNodeTitle(node.children, value)
      if (found) return found
    }
  }
  return ''
}

function goBack() {
  router.push('/exceptions')
}

async function openAssignModal() {
  selectedHandler.value = undefined
  assignModalOpen.value = true
  assignTreeLoading.value = true
  try {
    assignTreeData.value = await getAssignableUserTree()
  } catch {
    assignTreeData.value = []
  } finally {
    assignTreeLoading.value = false
  }
}

function closeAssignModal() {
  assignModalOpen.value = false
  selectedHandler.value = undefined
}

async function confirmAssign() {
  if (!exception.value || !selectedHandler.value) {
    message.warning('请选择执行人')
    return
  }
  const handlerName = findNodeTitle(assignTreeData.value, selectedHandler.value)
  await exceptionStore.assign(exception.value.key, selectedHandler.value, handlerName)
  exception.value = await exceptionStore.getById(exception.value.key)
  message.success('指派成功')
  closeAssignModal()
}

onMounted(async () => {
  const id = route.params.id
  loading.value = true
  try {
    exception.value = await exceptionStore.getById(id)
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
        <a-descriptions-item label="处理人">
          {{ exception.handler || '未指派' }}
          <a-button
            v-if="exception.status === '待处理'"
            type="link"
            size="small"
            style="margin-left: 8px"
            @click="openAssignModal"
          >
            指派
          </a-button>
        </a-descriptions-item>
        <a-descriptions-item label="状态">{{ exception.status }}</a-descriptions-item>
      </a-descriptions>

      <a-modal
        v-model:open="assignModalOpen"
        title="指派处理人"
        @ok="confirmAssign"
        @cancel="closeAssignModal"
      >
        <a-form-item label="处理人" required>
          <a-tree-select
            v-model:value="selectedHandler"
            placeholder="请选择处理人（部门-岗位-人员）"
            style="width: 100%"
            :tree-data="assignTreeData"
            :loading="assignTreeLoading"
            tree-default-expand-all
            allow-clear
            show-search
            :tree-node-filter-prop="'title'"
          />
        </a-form-item>
      </a-modal>

      <div class="detail-section">
        <div class="detail-section__title">关联巡检结果</div>
        <template v-if="record">
          <a-descriptions :column="1" bordered size="small" class="record-meta">
            <a-descriptions-item label="任务名称">{{ record.plan }}</a-descriptions-item>
            <a-descriptions-item label="巡检人">{{ record.inspector }}</a-descriptions-item>
            <a-descriptions-item label="提交时间">{{ record.submitTime }}</a-descriptions-item>
          </a-descriptions>
          <div v-if="record.items?.length" class="items-list">
            <div v-for="(item, i) in record.items" :key="i" class="items-list__row">
              <span class="items-list__name">{{ item.name }}</span>
              <span class="items-list__value">{{ item.value }}</span>
            </div>
          </div>
        </template>
        <div v-else class="detail-empty">暂无关联巡检记录</div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">现场照片</div>
        <div v-if="previewUrls.length || record?.photoUrls?.length" class="photo-grid">
          <a-image-preview-group>
            <a-image
              v-for="(url, i) in (previewUrls.length ? previewUrls : record.photoUrls)"
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

.record-meta {
  margin-bottom: 12px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.items-list__row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
}

.items-list__name {
  color: #4e5969;
}

.items-list__value {
  font-weight: 500;
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
