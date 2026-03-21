<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getRecordById } from '../../api/modules/inspection'
import { formatDateTime } from '../../utils/dateTime'

const route = useRoute()
const router = useRouter()
const record = ref(null)
const loading = ref(false)

function getDeviceType(deviceCode) {
  const r = record.value
  if (r?.deviceResults?.length) {
    const dr = r.deviceResults.find((d) => (d.deviceCode ?? d.device) === deviceCode)
    if (dr?.deviceType) return dr.deviceType
  }
  return '-'
}

/** 展示用设备名称（保留 deviceCode 供内部匹配） */
function deviceDisplayName(d) {
  if (!d) return '—'
  return d.deviceName || d.device || d.deviceCode || '—'
}

const deviceResults = computed(() => {
  const r = record.value
  if (!r) return []
  if (r.deviceResults?.length) return r.deviceResults
  if (r.device || r.deviceCode || r.deviceName) {
    const code = r.deviceCode ?? r.device
    return [
      {
        device: r.deviceName || r.device || r.deviceCode,
        deviceName: r.deviceName,
        deviceCode: code,
        deviceType: getDeviceType(code),
        result: r.result,
        items: r.items ?? [],
        photoUrls: r.photoUrls ?? [],
      },
    ]
  }
  return []
})

const activeKeys = ref([])

function expandAll() {
  activeKeys.value = deviceResults.value.map((_, i) => String(i))
}

function collapseAll() {
  activeKeys.value = []
}

onMounted(async () => {
  const id = route.params.id
  loading.value = true
  try {
    record.value = await getRecordById(id)
  } catch {
    message.error('加载记录失败')
    record.value = null
  } finally {
    loading.value = false
  }
  if (!record.value) {
    message.warning('记录不存在')
    goBack()
  } else if (deviceResults.value.length <= 3) {
    activeKeys.value = deviceResults.value.map((_, i) => String(i))
  }
})

function goBack() {
  router.push('/records')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <a class="back-link" @click="goBack">返回巡检记录</a>
        <h2>巡检记录详情</h2>
      </div>
    </div>

    <a-spin :spinning="loading">
    <a-card v-if="record" :bordered="false">
      <a-descriptions :column="1" bordered size="small" class="detail-section">
        <a-descriptions-item label="任务名称">{{ record.plan }}</a-descriptions-item>
        <a-descriptions-item v-if="deviceResults.length" label="设备名称">
          {{
            deviceResults.length > 5
              ? `共 ${deviceResults.length} 台`
              : deviceResults.map((d) => deviceDisplayName(d)).join('、')
          }}
        </a-descriptions-item>
        <a-descriptions-item
          v-else-if="record.deviceName || record.device || record.deviceCode"
          label="设备名称"
        >
          {{ record.deviceName || record.device || record.deviceCode || '—' }}
        </a-descriptions-item>
        <a-descriptions-item label="巡检人">{{ record.inspector }}</a-descriptions-item>
        <a-descriptions-item label="任务完成时间">{{ formatDateTime(record.completeTime) }}</a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ formatDateTime(record.submitTime) }}</a-descriptions-item>
        <a-descriptions-item label="巡检结果">{{ record.result }}</a-descriptions-item>
        <a-descriptions-item label="照片数量">{{ record.photos }}</a-descriptions-item>
      </a-descriptions>

      <div class="device-section">
        <div class="device-section__head">
          <span class="detail-section__title">设备巡检结果（{{ deviceResults.length }} 台）</span>
          <a-space v-if="deviceResults.length > 3" class="device-section__actions">
            <a-button size="small" @click="expandAll">展开全部</a-button>
            <a-button size="small" @click="collapseAll">折叠全部</a-button>
          </a-space>
        </div>
        <a-collapse v-model:activeKey="activeKeys" :bordered="false" class="device-collapse">
          <a-collapse-panel
            v-for="(dr, idx) in deviceResults"
            :key="String(idx)"
            class="device-panel"
          >
            <template #header>
              <span class="device-panel__header">
                <a-tag :color="dr.result === '异常' ? 'error' : 'success'">{{ dr.result }}</a-tag>
                <span class="device-panel__title">{{ deviceDisplayName(dr) }}</span>
                <span class="device-panel__type">{{ dr.deviceType }}</span>
                <span v-if="dr.photoUrls?.length" class="device-panel__meta">{{ dr.photoUrls.length }} 张照片</span>
              </span>
            </template>
            <div class="device-panel__body">
              <div class="device-panel__block">
                <div class="detail-section__title">结果明细</div>
                <div v-if="dr.items?.length" class="items-list">
                  <div v-for="(item, i) in dr.items" :key="i" class="items-list__row">
                    <span class="items-list__name">{{ item.name }}</span>
                    <span class="items-list__value">{{ item.value }}</span>
                  </div>
                </div>
                <div v-else class="detail-empty">暂无巡检项结果</div>
              </div>
              <div class="device-panel__block">
                <div class="detail-section__title">现场照片</div>
                <div v-if="dr.photoUrls?.length" class="photo-grid">
                  <a-image-preview-group>
                    <a-image
                      v-for="(url, i) in dr.photoUrls"
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
            </div>
          </a-collapse-panel>
        </a-collapse>
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

.device-section {
  margin-top: 24px;
}

.device-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.device-section__actions {
  flex-shrink: 0;
}

.device-collapse {
  background: transparent;
}

.device-collapse :deep(.ant-collapse-item) {
  border-bottom: 1px solid #f0f0f0;
}

.device-collapse :deep(.ant-collapse-item:last-child) {
  border-bottom: none;
}

.device-collapse :deep(.ant-collapse-header) {
  padding: 12px 0;
  align-items: center;
}

.device-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.device-panel__title {
  font-weight: 600;
  color: #1f2329;
}

.device-panel__type {
  color: #86909c;
  font-size: 13px;
}

.device-panel__meta {
  color: #86909c;
  font-size: 12px;
  margin-left: auto;
}

.device-panel__body {
  padding: 8px 0 16px;
}

.device-panel__block {
  margin-bottom: 16px;
}

.device-panel__block:last-child {
  margin-bottom: 0;
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
  background: #fff;
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
