<script setup>
import { ref } from 'vue'
import { recordRows } from '../../mock/data'

const rows = ref([...recordRows])
const detailVisible = ref(false)
const currentRow = ref(null)

function openDetail(record) {
  currentRow.value = record
  detailVisible.value = true
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
          <a-input placeholder="设备编码" allow-clear />
          <a-input placeholder="巡检人员" allow-clear />
          <a-select placeholder="结果状态" allow-clear style="width: 160px" />
          <a-range-picker style="width: 280px" />
        </div>
      </div>

      <a-table :data-source="rows" row-key="key">
        <a-table-column title="设备编码" data-index="device" key="device" />
        <a-table-column title="巡检人员" data-index="inspector" key="inspector" width="100" />
        <a-table-column title="扫码时间" data-index="scanTime" key="scanTime" width="170" />
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

    <a-drawer v-model:open="detailVisible" title="巡检记录详情" width="520">
      <a-descriptions v-if="currentRow" :column="1" bordered size="small" class="drawer-section">
        <a-descriptions-item label="设备编码">{{ currentRow.device }}</a-descriptions-item>
        <a-descriptions-item label="巡检人员">{{ currentRow.inspector }}</a-descriptions-item>
        <a-descriptions-item label="扫码时间">{{ currentRow.scanTime }}</a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ currentRow.submitTime }}</a-descriptions-item>
        <a-descriptions-item label="巡检结果">{{ currentRow.result }}</a-descriptions-item>
        <a-descriptions-item label="照片数量">{{ currentRow.photos }}</a-descriptions-item>
      </a-descriptions>

      <div class="drawer-section">
        <div class="drawer-section__title">结果明细</div>
        <div class="detail-list">
          <div class="detail-list__item">
            <strong>巡检结论</strong>
            设备外观正常，油位状态正常，温度采集正常；若结果为异常，则关联异常单自动生成。
          </div>
          <div class="detail-list__item">
            <strong>现场照片</strong>
            已上传 {{ currentRow?.photos || 0 }} 张照片，正式接接口后可在此处切换图片预览组件。
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>
