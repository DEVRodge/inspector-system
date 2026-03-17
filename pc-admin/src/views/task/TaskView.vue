<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  TASK_CYCLES,
  TASK_STATUSES,
  WEEKDAYS,
  getDevicesByKeys,
} from '@/mock/modules/task'
import { useTaskStore } from '@/stores/task'
import { isMockEnabled } from '@/api/http'

const router = useRouter()
const taskStore = useTaskStore()

const loading = ref(false)
const query = reactive({
  cycle: undefined,
  status: undefined,
})

async function loadList() {
  if (isMockEnabled) {
    await taskStore.loadList()
    return
  }
  loading.value = true
  try {
    await taskStore.loadList({
      cycle: query.cycle,
      status: query.status,
      pageNumber: 1,
      pageSize: 999,
    })
  } catch {
    message.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

function onQuerySearch() {
  loadList()
}

function formatPeriodTime(r) {
  if (r.cycle === 'once') return r.executeAt ?? '-'
  if (r.cycle === 'weekly' && r.cycleExtra?.weekday != null) {
    const w = WEEKDAYS.find((d) => d.value === r.cycleExtra.weekday)
    return `${w?.label ?? ''} ${r.time ?? ''}`
  }
  if (r.cycle === 'monthly' && r.cycleExtra?.day != null) {
    return `每月${r.cycleExtra.day}日 ${r.time ?? ''}`
  }
  if (r.cycle === 'quarterly') return `每季度第 1 天 ${r.time ?? ''}`
  if (r.cycle === 'yearly' && r.cycleExtra?.month != null && r.cycleExtra?.day != null) {
    return `每年${r.cycleExtra.month}月${r.cycleExtra.day}日 ${r.time ?? ''}`
  }
  if (r.cycle === 'yearly') return `每年 ${r.time ?? ''}`
  return r.time ?? '-'
}

const deviceListForDrawer = ref([])

const getDevicesForCurrentRow = computed(() => {
  const row = currentRow.value
  if (!row) return []
  const keys = row.deviceKeys ?? row.deviceIds ?? []
  if (isMockEnabled) return getDevicesByKeys(keys)
  return deviceListForDrawer.value.filter((e) => keys.includes(String(e.key ?? e.id)))
})

const rows = computed(() =>
  taskStore.list.map((r) => ({
    ...r,
    devices: r.deviceKeys?.length ?? 0,
    cycleLabel: r.cycleLabel ?? TASK_CYCLES.find((c) => c.value === r.cycle)?.label ?? r.cycle,
    timeDisplay: r.cycle === 'once' ? r.executeAt : (r.timeDisplay ?? formatPeriodTime(r)),
  })),
)

const filteredRows = computed(() =>
  rows.value.filter((r) => {
    const cycleMatch = !query.cycle || r.cycle === query.cycle
    const statusMatch = !query.status || r.status === query.status
    return cycleMatch && statusMatch
  }),
)

const detailVisible = ref(false)
const currentRow = ref(null)

onMounted(() => loadList())

function openCreate() {
  router.push('/tasks/new')
}

async function openDetail(record) {
  currentRow.value = record
  detailVisible.value = true
  if (!isMockEnabled) {
    try {
      const res = await import('@/api/modules/equipment').then((m) => m.getDevicePage({ pageNumber: 1, pageSize: 999 }))
      deviceListForDrawer.value = res?.list ?? []
    } catch {
      deviceListForDrawer.value = []
    }
  }
}

function openEdit(record) {
  router.push({ name: 'taskEdit', params: { id: record.key } })
}

function removeRow(record) {
  Modal.confirm({
    title: `确认删除任务「${record.plan}」吗？`,
    async onOk() {
      try {
        const id = record.id ?? record.key
        await taskStore.remove(id)
        message.success('任务已删除')
      } catch {
        message.error('删除失败，请稍后重试')
      }
    },
  })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>计划任务</h2>
        <p>新建任务时选择设备、设置执行周期与执行时间。支持每日、每周、每月、季度、年度及临时任务。</p>
      </div>
      <a-button type="primary" @click="openCreate">新建任务</a-button>
    </div>

    <a-card :bordered="false">
      <div class="table-toolbar">
        <a-select
          v-model:value="query.cycle"
          placeholder="执行周期"
          allow-clear
          style="width: 140px"
        >
          <a-select-option v-for="c in TASK_CYCLES" :key="c.value" :value="c.value">
            {{ c.label }}
          </a-select-option>
        </a-select>
        <a-select
          v-model:value="query.status"
          placeholder="任务状态"
          allow-clear
          style="width: 140px"
        >
          <a-select-option v-for="s in TASK_STATUSES" :key="s.value" :value="s.value">
            {{ s.label }}
          </a-select-option>
        </a-select>
        <a-button v-if="!isMockEnabled" type="primary" @click="onQuerySearch">查询</a-button>
      </div>

      <a-table :data-source="filteredRows" :loading="loading" :pagination="false" row-key="key">
        <a-table-column title="任务名称" data-index="plan" key="plan" />
        <a-table-column title="执行周期" data-index="cycleLabel" key="cycleLabel" width="100" />
        <a-table-column title="责任部门" data-index="team" key="team" width="110" />
        <a-table-column title="巡检人" data-index="inspector" key="inspector" width="100" />
        <a-table-column title="执行时间" data-index="timeDisplay" key="timeDisplay" width="180" />
        <a-table-column title="设备数" data-index="devices" key="devices" width="90" />
        <a-table-column title="状态" data-index="status" key="status" width="100" />
        <a-table-column title="操作" key="action" width="180">
          <template #default="{ record }">
            <a-space :size="4">
              <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button type="link" danger size="small" @click="removeRow(record)">删除</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailVisible" title="任务详情" width="480">
      <template v-if="currentRow">
        <a-descriptions :column="1" bordered size="small" class="drawer-section">
          <a-descriptions-item label="任务名称">{{ currentRow.plan }}</a-descriptions-item>
          <a-descriptions-item label="执行周期">{{ currentRow.cycleLabel }}</a-descriptions-item>
          <a-descriptions-item label="执行时间">{{ currentRow.timeDisplay }}</a-descriptions-item>
          <a-descriptions-item v-if="currentRow.cron" label="Cron">{{ currentRow.cron }}</a-descriptions-item>
          <a-descriptions-item label="责任部门">{{ currentRow.team }}</a-descriptions-item>
          <a-descriptions-item label="巡检人">{{ currentRow.inspector }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ currentRow.status }}</a-descriptions-item>
        </a-descriptions>
        <div class="drawer-section">
          <div class="drawer-section__title">包含设备（{{ (currentRow.deviceKeys ?? currentRow.deviceIds)?.length ?? 0 }} 台）</div>
          <a-table
            :data-source="getDevicesForCurrentRow"
            :pagination="false"
            row-key="key"
            size="small"
          >
            <a-table-column title="设备编码" data-index="code" key="code" width="120" />
            <a-table-column title="设备名称" data-index="name" key="name" />
            <a-table-column title="设备类型" data-index="type" key="type" width="90" />
          </a-table>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped>
.drawer-section {
  margin-bottom: 20px;
}

.drawer-section__title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2329;
}
</style>
