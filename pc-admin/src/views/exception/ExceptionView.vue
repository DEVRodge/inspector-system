<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { EXCEPTION_STATUS_OPTIONS } from '../../api/modules/exception'
import { formatDateTime } from '../../utils/dateTime'
import { getUsers } from '../../api/modules/user'
import { useExceptionStore } from '../../stores/exception'

const router = useRouter()
const exceptionStore = useExceptionStore()

const query = ref({
  keyword: '',
  status: undefined,
  period: null,
  onlyMine: false,
})

const pagination = ref({ current: 1, pageSize: 20, total: 0 })
const loading = ref(false)

const assignModalOpen = ref(false)
const assignTarget = ref(null)
const selectedHandler = ref(undefined)
const handlerOptions = ref([])
const assignLoading = ref(false)

const tablePagination = computed(() => ({
  current: pagination.value.current,
  pageSize: pagination.value.pageSize,
  total: pagination.value.total,
  showSizeChanger: true,
  showTotal: (t) => `共 ${t} 条`,
  onChange: (page, pageSize) => {
    pagination.value.current = page
    pagination.value.pageSize = pageSize
    loadList()
  },
}))

const rows = computed(() => exceptionStore.list)

function formatPeriodBegin() {
  const begin = query.value.period?.[0]
  return begin ? dayjs(begin).format('YYYY-MM-DD HH:mm:ss') : undefined
}

function formatPeriodEnd() {
  const end = query.value.period?.[1]
  return end ? dayjs(end).format('YYYY-MM-DD HH:mm:ss') : undefined
}

async function loadList() {
  loading.value = true
  try {
    const res = await exceptionStore.loadList({
      keyword: query.value.keyword || undefined,
      status: query.value.status,
      onlyMine: query.value.onlyMine || undefined,
      periodBegin: formatPeriodBegin(),
      periodEnd: formatPeriodEnd(),
      pageNumber: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })
    pagination.value.total = res?.total ?? 0
  } catch {
    message.error('加载异常列表失败')
  } finally {
    loading.value = false
  }
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

function onSearch() {
  pagination.value.current = 1
  loadList()
}

function onReset() {
  query.value.keyword = ''
  query.value.status = undefined
  query.value.period = null
  query.value.onlyMine = false
  pagination.value.current = 1
  loadList()
}

function viewDetail(record) {
  router.push({ name: 'exceptionDetail', params: { id: record.key } })
}

async function openAssignModal(record) {
  assignTarget.value = record
  selectedHandler.value = undefined
  assignModalOpen.value = true
  await loadAssignableUsers()
}

function closeAssignModal() {
  assignModalOpen.value = false
  assignTarget.value = null
  selectedHandler.value = undefined
}

async function confirmAssign() {
  if (!assignTarget.value || !selectedHandler.value) {
    message.warning('请选择处理人')
    return
  }
  try {
    await exceptionStore.assign(assignTarget.value.key, selectedHandler.value)
    message.success('指派成功')
    closeAssignModal()
    await loadList()
  } catch {
    message.error('指派失败，请稍后重试')
  }
}

onMounted(() => {
  loadList()
})
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
            placeholder="异常编号 / 设备编码 / 设备名称"
            allow-clear
            style="width: 220px"
              @press-enter="onSearch"
          />
          <a-select
            v-model:value="query.status"
            placeholder="处理状态"
            allow-clear
            style="width: 160px"
              :options="EXCEPTION_STATUS_OPTIONS"
          />
            <a-range-picker
              v-model:value="query.period"
              show-time
              style="width: 320px"
            />
            <a-switch
              v-model:checked="query.onlyMine"
              checked-children="我的任务"
              un-checked-children="全部任务"
            />
            <a-button type="primary" :loading="loading" @click="onSearch">查询</a-button>
            <a-button @click="onReset">重置</a-button>
        </div>
      </div>

      <a-table
        :data-source="rows"
        :loading="loading"
        :pagination="tablePagination"
        row-key="key"
      >
        <a-table-column title="异常编号" data-index="code" key="code" width="140" />
        <a-table-column title="设备编码" data-index="device" key="device" width="120" />
        <a-table-column title="设备名称" data-index="deviceName" key="deviceName" width="140" />
        <a-table-column title="异常描述" data-index="desc" key="desc" />
        <a-table-column title="截止时间" key="deadline" width="170">
          <template #default="{ record }">{{ formatDateTime(record.deadline) }}</template>
        </a-table-column>
        <a-table-column title="处理人" key="handler" width="110">
          <template #default="{ record }">
            {{ record.handler || '未指派' }}
          </template>
        </a-table-column>
        <a-table-column title="状态" data-index="statusDesc" key="statusDesc" width="110" />
        <a-table-column title="创建时间" key="createTime" width="170">
          <template #default="{ record }">{{ formatDateTime(record.createTime) }}</template>
        </a-table-column>
        <a-table-column title="操作" key="action" width="160">
          <template #default="{ record }">
            <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
            <a-button v-if="record.statusApi === 'PENDING'" type="link" size="small" @click="openAssignModal(record)">
              指派
            </a-button>
          </template>
        </a-table-column>
      </a-table>

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
    </a-card>
  </div>
</template>
