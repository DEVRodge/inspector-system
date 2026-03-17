<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { isMockEnabled } from '../../api/http'
import { getAssignableUserTree } from '../../api/modules/assign'
import { useExceptionStore } from '../../stores/exception'

const router = useRouter()
const exceptionStore = useExceptionStore()

const query = ref({
  keyword: '',
  status: undefined,
})
const pagination = ref({ current: 1, pageSize: 20, total: 0 })
const loading = ref(false)

const assignModalOpen = ref(false)
const assignTarget = ref(null)
const selectedHandler = ref(undefined)
const assignTreeData = ref([])
const assignTreeLoading = ref(false)

const tablePagination = computed(() => {
  if (isMockEnabled) return false
  return {
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
  }
})

const filteredRows = computed(() => {
  if (!isMockEnabled) return exceptionStore.list
  let list = exceptionStore.list
  const kw = query.value.keyword?.trim()
  if (kw) {
    const lower = kw.toLowerCase()
    list = list.filter(
      (r) =>
        (r.code && r.code.toLowerCase().includes(lower)) ||
        (r.device && r.device.toLowerCase().includes(lower)) ||
        (r.deviceName && r.deviceName.toLowerCase().includes(lower)),
    )
  }
  if (query.value.status) {
    list = list.filter((r) => r.status === query.value.status)
  }
  return list
})

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

async function loadList() {
  if (isMockEnabled) return
  loading.value = true
  try {
    const res = await exceptionStore.loadList({
      keyword: query.value.keyword || undefined,
      status: query.value.status,
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

function viewDetail(record) {
  router.push({ name: 'exceptionDetail', params: { id: record.key } })
}

async function openAssignModal(record) {
  assignTarget.value = record
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
  assignTarget.value = null
  selectedHandler.value = undefined
}

async function confirmAssign() {
  if (!assignTarget.value || !selectedHandler.value) {
    message.warning('请选择执行人')
    return
  }
  const handlerName = findNodeTitle(assignTreeData.value, selectedHandler.value)
  await exceptionStore.assign(assignTarget.value.key, selectedHandler.value, handlerName)
  message.success('指派成功')
  closeAssignModal()
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
          <a-button type="primary" :loading="loading" @click="loadList">查询</a-button>
        </div>
      </div>

      <a-table
        :data-source="filteredRows"
        :loading="loading"
        :pagination="tablePagination"
        row-key="key"
      >
        <a-table-column title="异常编号" data-index="code" key="code" width="140" />
        <a-table-column title="设备编码" data-index="device" key="device" width="120" />
        <a-table-column title="设备名称" data-index="deviceName" key="deviceName" width="140" />
        <a-table-column title="异常描述" data-index="desc" key="desc" />
        <a-table-column title="处理人" key="handler" width="110">
          <template #default="{ record }">
            {{ record.handler || '未指派' }}
          </template>
        </a-table-column>
        <a-table-column title="状态" data-index="status" key="status" width="110" />
        <a-table-column title="操作" key="action" width="160">
          <template #default="{ record }">
            <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
            <a-button v-if="record.status === '待处理'" type="link" size="small" @click="openAssignModal(record)">
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
    </a-card>
  </div>
</template>
