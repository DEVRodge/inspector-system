<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { exceptionRows, recordRows } from '../../mock/data'

const route = useRoute()
const router = useRouter()

const exception = computed(() => {
  const id = route.params.id
  return exceptionRows.find((r) => String(r.key) === String(id)) ?? null
})

const record = computed(() => {
  const rid = exception.value?.recordId
  if (!rid) return null
  return recordRows.find((r) => String(r.key) === String(rid)) ?? null
})

function goBack() {
  router.push('/exceptions')
}

onMounted(() => {
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

    <a-card v-if="exception" :bordered="false">
      <a-descriptions :column="1" bordered size="small" class="detail-section">
        <a-descriptions-item label="异常编号">{{ exception.code }}</a-descriptions-item>
        <a-descriptions-item label="设备编码">{{ exception.device }}</a-descriptions-item>
        <a-descriptions-item label="异常描述">{{ exception.desc }}</a-descriptions-item>
        <a-descriptions-item label="处理人">{{ exception.handler }}</a-descriptions-item>
        <a-descriptions-item label="截止时间">{{ exception.deadline }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ exception.status }}</a-descriptions-item>
      </a-descriptions>

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
        <div v-if="record?.photoUrls?.length" class="photo-grid">
          <a-image-preview-group>
            <a-image
              v-for="(url, i) in record.photoUrls"
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
