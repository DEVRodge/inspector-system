<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { recordRows } from '../../mock/data'

const router = useRouter()
const rows = ref([...recordRows])

function openDetail(record) {
  router.push({ name: 'recordDetail', params: { id: record.key } })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>巡检记录</h2>
        <p>以记录列表为主展示，详情、结果明细和照片统一放到记录详情中查看。</p>
      </div>
      <a-space>
        <a-button type="primary">导出 Excel</a-button>
      </a-space>
    </div>

    <a-card :bordered="false">
      <div class="table-toolbar">
        <div class="table-toolbar__left" style="flex: 1">
          <a-input placeholder="任务名称" allow-clear />
          <a-input placeholder="设备编码" allow-clear />
          <a-input placeholder="巡检人" allow-clear />
          <a-select placeholder="结果状态" allow-clear style="width: 160px" />
          <a-range-picker style="width: 280px" />
        </div>
      </div>

      <a-table :data-source="rows" row-key="key">
        <a-table-column title="任务名称" data-index="plan" key="plan" width="140" />
        <a-table-column title="设备编码" key="device" width="160">
          <template #default="{ record }">
            <template v-if="record.deviceResults?.length">
              {{ record.deviceResults[0].device }} 等 {{ record.deviceResults.length }} 台
            </template>
            <template v-else>
              {{ record.device }}
            </template>
          </template>
        </a-table-column>
        <a-table-column title="巡检人" data-index="inspector" key="inspector" width="100" />
        <a-table-column title="提交时间" data-index="submitTime" key="submitTime" width="170" />
        <a-table-column title="结果" data-index="result" key="result" width="100" />
        <a-table-column title="照片数" data-index="photos" key="photos" width="90" />
        <a-table-column title="操作" key="action" width="100">
          <template #default="{ record }">
            <a-button type="link" size="small" @click="openDetail(record)">查看详情</a-button>
          </template>
        </a-table-column>
      </a-table>
    </a-card>
  </div>
</template>
