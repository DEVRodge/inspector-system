<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { TASK_CYCLES, TASK_ENABLED_OPTIONS, WEEKDAYS } from '@/constants/task'
import { cronToForm } from '@/utils/cron'
import { useTaskStore } from '@/stores/task'
import { getOrganizationById, getOrganizationsList } from '@/api/modules/organization'
import { getUserById } from '@/api/modules/user'
import { getDeviceById } from '@/api/modules/equipment'

const router = useRouter()
const taskStore = useTaskStore()

const loading = ref(false)
const query = reactive({
  enabled: undefined,
  keyword: '',
})
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
})

const teamNameMap = ref({})
const ownerNameMap = ref({})
const deviceListForDrawer = ref([])
const detailVisible = ref(false)
const currentRow = ref(null)

function flattenOrgTree(nodes, result = []) {
  for (const n of nodes || []) {
    result.push({ id: n.id, name: n.name })
    if (n.children?.length) flattenOrgTree(n.children, result)
  }
  return result
}

async function loadOrganizationMap() {
  try {
    const orgRes = await getOrganizationsList()
    const orgInner = orgRes?.data ?? orgRes
    const orgArr = Array.isArray(orgInner) ? orgInner : orgInner?.list ?? orgRes?.list ?? []
    const orgFlat = flattenOrgTree(orgArr)
    const map = {}
    for (const item of orgFlat) {
      if (item.id != null) map[String(item.id)] = item.name ?? String(item.id)
    }
    teamNameMap.value = map
  } catch {
    teamNameMap.value = {}
  }
}

async function ensureTeamName(teamId) {
  if (teamId == null || teamNameMap.value[String(teamId)]) return
  try {
    const org = await getOrganizationById(teamId)
    const data = org?.data ?? org
    if (data?.id != null) {
      teamNameMap.value = {
        ...teamNameMap.value,
        [String(data.id)]: data.name ?? String(data.id),
      }
    }
  } catch {
    // ignore
  }
}

async function ensureOwnerName(ownerId) {
  if (ownerId == null || ownerNameMap.value[String(ownerId)]) return
  try {
    const user = await getUserById(ownerId)
    const data = user?.data ?? user
    if (data?.id != null) {
      ownerNameMap.value = {
        ...ownerNameMap.value,
        [String(data.id)]: data.name ?? data.username ?? String(data.id),
      }
    }
  } catch {
    // ignore
  }
}

async function ensureNameMapsForRows(rows = []) {
  const teams = [...new Set(rows.map((item) => item?.team).filter((item) => item != null))]
  const owners = [...new Set(rows.map((item) => item?.owner).filter((item) => item != null))]
  await Promise.all([
    ...teams.map((teamId) => ensureTeamName(teamId)),
    ...owners.map((ownerId) => ensureOwnerName(ownerId)),
  ])
}

function formatPeriodTime(record) {
  let rec = record
  const cycle = (record.cycle ?? '').toLowerCase()
  const shouldParseFromCron =
    !!record.cron && ((cycle === 'once' && !record.executeAt) || !record.time)
  if (shouldParseFromCron) {
    const parsed = cronToForm(record.cron)
    if (parsed) rec = { ...record, ...parsed }
  }
  const recCycle = (rec.cycle ?? '').toLowerCase()
  if (recCycle === 'once') return rec.executeAt ?? '-'
  if (recCycle === 'weekly' && rec.cycleExtra?.weekday != null) {
    const weekday = WEEKDAYS.find((item) => item.value === rec.cycleExtra.weekday)
    return `${weekday?.label ?? ''} ${rec.time ?? ''}`.trim()
  }
  if (recCycle === 'monthly' && rec.cycleExtra?.day != null) {
    return `每月${rec.cycleExtra.day}日 ${rec.time ?? ''}`.trim()
  }
  if (recCycle === 'quarterly') return `每季度第 1 天 ${rec.time ?? ''}`.trim()
  if (recCycle === 'yearly' && rec.cycleExtra?.month != null && rec.cycleExtra?.day != null) {
    return `每年${rec.cycleExtra.month}月${rec.cycleExtra.day}日 ${rec.time ?? ''}`.trim()
  }
  if (recCycle === 'yearly') return `每年 ${rec.time ?? ''}`.trim()
  return rec.time ?? '-'
}

const rows = computed(() =>
  taskStore.list.map((record) => {
    const cycle = (record.cycle ?? '').toLowerCase()
    return {
      ...record,
      devices: (record.deviceIds ?? record.deviceKeys)?.length ?? 0,
      cycleLabel: record.cycleLabel ?? TASK_CYCLES.find((item) => String(item.value).toLowerCase() === cycle)?.label ?? record.cycle,
      timeDisplay: formatPeriodTime(record),
      teamName: record.teamName ?? (record.team != null ? teamNameMap.value[String(record.team)] : undefined),
      ownerName: record.ownerName ?? (record.owner != null ? ownerNameMap.value[String(record.owner)] : undefined),
    }
  }),
)

const getDevicesForCurrentRow = computed(() => deviceListForDrawer.value)

async function loadList(resetPage = false) {
  if (resetPage) pagination.current = 1
  loading.value = true
  try {
    const res = await taskStore.loadList({
      enabled: query.enabled,
      keyword: query.keyword || undefined,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    })
    pagination.total = res?.total ?? 0
    pagination.current = res?.current ?? pagination.current
    pagination.pageSize = res?.size ?? pagination.pageSize
    await ensureNameMapsForRows(res?.list ?? [])
  } catch {
    message.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

function onQuerySearch() {
  loadList(true)
}

function onTableChange(pag) {
  pagination.current = pag?.current ?? pagination.current
  pagination.pageSize = pag?.pageSize ?? pagination.pageSize
  loadList()
}

async function loadDevicesForIds(ids = []) {
  if (!ids.length) {
    deviceListForDrawer.value = []
    return
  }
  const records = await Promise.all(ids.map((id) => getDeviceById(id).catch(() => null)))
  deviceListForDrawer.value = records.filter(Boolean)
}

function openCreate() {
  router.push('/tasks/new')
}

async function openDetail(record) {
  try {
    const full = await taskStore.getById(record.key ?? record.id, { forceFetch: true })
    if (!full) {
      message.warning('任务不存在')
      return
    }
    await ensureNameMapsForRows([full])
    await loadDevicesForIds(full.deviceIds ?? [])
    const cycle = (full.cycle ?? '').toLowerCase()
    currentRow.value = {
      ...full,
      devices: (full.deviceIds ?? full.deviceKeys)?.length ?? 0,
      cycleLabel: full.cycleLabel ?? TASK_CYCLES.find((item) => String(item.value).toLowerCase() === cycle)?.label ?? full.cycle,
      timeDisplay: formatPeriodTime(full),
      teamName: full.teamName ?? (full.team != null ? teamNameMap.value[String(full.team)] : undefined),
      ownerName: full.ownerName ?? (full.owner != null ? ownerNameMap.value[String(full.owner)] : undefined),
    }
    detailVisible.value = true
  } catch {
    message.error('加载任务详情失败')
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
        if (rows.value.length === 1 && pagination.current > 1) {
          pagination.current -= 1
        }
        await loadList()
      } catch {
        message.error('删除失败，请稍后重试')
      }
    },
  })
}

onMounted(async () => {
  await loadOrganizationMap()
  await loadList()
})
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
        <a-input-search
          v-model:value="query.keyword"
          placeholder="任务名称"
          allow-clear
          style="width: 200px"
          @search="onQuerySearch"
        />
        <a-select
          v-model:value="query.enabled"
          placeholder="是否启用"
          allow-clear
          style="width: 140px"
          @change="onQuerySearch"
        >
          <a-select-option v-for="o in TASK_ENABLED_OPTIONS" :key="String(o.value)" :value="o.value">
            {{ o.label }}
          </a-select-option>
        </a-select>
        <a-button type="primary" @click="onQuerySearch">查询</a-button>
      </div>

      <a-table
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }"
        row-key="key"
        @change="onTableChange"
      >
        <a-table-column title="任务名称" data-index="plan" key="plan" />
        <a-table-column title="执行周期" data-index="cycleLabel" key="cycleLabel" width="100" />
        <a-table-column title="责任部门" data-index="team" key="team" width="110">
          <template #default="{ record }">{{ record.teamName ?? record.team ?? '-' }}</template>
        </a-table-column>
        <a-table-column title="负责人" data-index="owner" key="owner" width="100">
          <template #default="{ record }">{{ record.ownerName ?? record.owner ?? '-' }}</template>
        </a-table-column>
        <a-table-column title="执行时间" data-index="timeDisplay" key="timeDisplay" width="180" />
        <a-table-column title="设备数" data-index="devices" key="devices" width="90" />
        <a-table-column title="状态" data-index="enabled" key="enabled" width="90">
          <template #default="{ record }">{{ record.enabled ? '启用' : '禁用' }}</template>
        </a-table-column>
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
          <a-descriptions-item label="责任部门">{{ currentRow.teamName ?? currentRow.team ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="负责人">{{ currentRow.ownerName ?? currentRow.owner ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ currentRow.enabled ? '启用' : '禁用' }}</a-descriptions-item>
        </a-descriptions>
        <div class="drawer-section">
          <div class="drawer-section__title">包含设备（{{ (currentRow.deviceIds ?? currentRow.deviceKeys)?.length ?? 0 }} 台）</div>
          <a-table
            :data-source="getDevicesForCurrentRow"
            :pagination="false"
            row-key="id"
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
