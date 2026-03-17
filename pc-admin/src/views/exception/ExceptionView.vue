<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { exceptionRows } from '../../mock/data'

const router = useRouter()
const rows = ref([...exceptionRows])

const query = ref({
  keyword: '',
  status: undefined,
  timeRange: null,
})

const filteredRows = computed(() => {
  let list = rows.value
  const kw = query.value.keyword?.trim()
  if (kw) {
    const lower = kw.toLowerCase()
    list = list.filter(
      (r) =>
        (r.code && r.code.toLowerCase().includes(lower)) ||
        (r.device && r.device.toLowerCase().includes(lower)),
    )
  }
  if (query.value.status) {
    list = list.filter((r) => r.status === query.value.status)
  }
  const [start, end] = query.value.timeRange || []
  if (start && end) {
    const s = start.format('YYYY-MM-DD')
    const e = end.format('YYYY-MM-DD')
    list = list.filter((r) => {
      const d = r.deadline?.slice(0, 10)
      return d && d >= s && d <= e
    })
  }
  return list
})

function viewDetail(record) {
  router.push({ name: 'exceptionDetail', params: { id: record.key } })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>异常管理</h2>
        <p>同样以异常列表为主展示，详情、处理信息和附件在异常详情中查看。</p>
      </div>
    </div>

    <a-card :bordered="false">
      <div class="table-toolbar">
        <div class="table-toolbar__left" style="flex: 1">
          <a-input
            v-model:value="query.keyword"
            placeholder="异常编号 / 设备编码"
            allow-clear
          />
          <a-select
            v-model:value="query.status"
            placeholder="处理状态"
            allow-clear
            style="width: 160px"
            :options="[
              { value: '待处理', label: '待处理' },
              { value: '处理中', label: '处理中' },
              { value: '已处理', label: '已处理' },
            ]"
          />
          <a-range-picker v-model:value="query.timeRange" style="width: 280px" />
        </div>
      </div>

      <a-table :data-source="filteredRows" row-key="key">
        <a-table-column title="异常编号" data-index="code" key="code" width="140" />
        <a-table-column title="设备编码" data-index="device" key="device" width="120" />
        <a-table-column title="异常描述" data-index="desc" key="desc" />
        <a-table-column title="处理人" data-index="handler" key="handler" width="110" />
        <a-table-column title="截止时间" data-index="deadline" key="deadline" width="160" />
        <a-table-column title="状态" data-index="status" key="status" width="110" />
        <a-table-column title="操作" key="action" width="120">
          <template #default="{ record }">
            <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
          </template>
        </a-table-column>
      </a-table>
    </a-card>
  </div>
</template>
