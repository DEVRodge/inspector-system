<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { recordRows } from '../../mock/data'
import { getRecordPage } from '../../api/modules/inspection'
import { isMockEnabled } from '../../api/http'

const router = useRouter()
const rows = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
})

const query = reactive({
  plan: '',
  device: '',
  inspector: '',
  result: undefined,
  timeRange: null,
})

async function loadList() {
  if (isMockEnabled) {
    rows.value = [...recordRows]
    pagination.total = rows.value.length
    return
  }
  loading.value = true
  try {
    const [start, end] = query.timeRange || []
    const res = await getRecordPage({
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
      plan: query.plan || undefined,
      device: query.device || undefined,
      inspector: query.inspector || undefined,
      result: query.result,
      startTime: start?.format?.('YYYY-MM-DD') ?? start,
      endTime: end?.format?.('YYYY-MM-DD') ?? end,
    })
    rows.value = res?.list ?? []
    pagination.total = res?.total ?? 0
  } catch {
    rows.value = []
    message.error('加载巡检记录失败')
  } finally {
    loading.value = false
  }
}

function onTableChange(pag) {
  if (pag && typeof pag.current === 'number') {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize ?? pagination.pageSize
    loadList()
  }
}

function openDetail(record) {
  router.push({ name: 'recordDetail', params: { id: record.key ?? record.id } })
}

onMounted(() => loadList())
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
          <a-input v-model:value="query.plan" placeholder="任务名称" allow-clear />
          <a-input v-model:value="query.device" placeholder="设备编码" allow-clear />
          <a-input v-model:value="query.inspector" placeholder="巡检人" allow-clear />
          <a-select v-model:value="query.result" placeholder="结果状态" allow-clear style="width: 160px">
            <a-select-option value="正常">正常</a-select-option>
            <a-select-option value="异常">异常</a-select-option>
          </a-select>
          <a-range-picker v-model:value="query.timeRange" style="width: 280px" />
          <a-button v-if="!isMockEnabled" type="primary" @click="() => { pagination.current = 1; loadList() }">查询</a-button>
        </div>
      </div>

      <a-table
        :data-source="rows"
        :loading="loading"
        :pagination="isMockEnabled ? false : { ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }"
        row-key="key"
        @change="onTableChange"
      >
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
