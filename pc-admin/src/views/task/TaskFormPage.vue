<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getOrganizationsList, getOrganizationById } from '@/api/modules/organization'
import { getUserById, getUsers } from '@/api/modules/user'
import { getDeviceById, getDevicePage } from '@/api/modules/equipment'
import { getDictionaryList } from '@/api/modules/dictionary'
import { useTaskStore } from '@/stores/task'
import { buildTaskPayload } from '@/api/modules/inspection'
import { cronToForm } from '@/utils/cron'
import { TASK_CYCLES, WEEKDAYS } from '@/constants/task'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const DEVICE_TYPE_DICT_CODE = 'device_type'

const isEdit = computed(() => Boolean(route.params.id))

const formState = reactive({
  key: '',
  plan: '',
  cycle: 'DAILY',
  time: null,
  cycleExtra: {},
  executeAt: null,
  team: undefined,
  owner: undefined,
  enabled: true,
  deviceKeys: [],
})

const isHydrating = ref(false)
const deviceTypeOptions = ref([])
const deviceRows = ref([])
const selectedDeviceRecords = ref([])
const deviceTableLoading = ref(false)

const selectedType = ref(null)
const deviceListPagination = reactive({ current: 1, pageSize: 10, total: 0 })
watch(selectedType, () => {
  deviceListPagination.current = 1
  loadDevicePage()
})
function onDeviceTableChange(pag) {
  if (pag && typeof pag.current === 'number') {
    deviceListPagination.current = pag.current
    deviceListPagination.pageSize = pag.pageSize ?? deviceListPagination.pageSize
  }
  loadDevicePage()
}

const selectedRowKeys = computed(() => {
  if (!selectedType.value) return []
  const typeKeys = new Set(deviceRows.value.map((e) => String(e.key ?? e.id)))
  return formState.deviceKeys.filter((k) => typeKeys.has(String(k)))
})

function mergeSelectedDeviceRecords(records = []) {
  const map = new Map(selectedDeviceRecords.value.map((item) => [String(item.id ?? item.key), item]))
  for (const record of records) {
    if (!record) continue
    map.set(String(record.id ?? record.key), record)
  }
  selectedDeviceRecords.value = Array.from(map.values())
  mergeDeviceTypeOptionsFromDevices(selectedDeviceRecords.value)
}

function mergeDeviceTypeOptionsFromDevices(records = []) {
  const exists = new Set(deviceTypeOptions.value.map((item) => item.value))
  for (const record of records) {
    const value = record?.type
    if (!value || exists.has(value)) continue
    deviceTypeOptions.value.push({ value, label: value })
    exists.add(value)
  }
}

const selectedDeviceMap = computed(() => {
  const map = new Map()
  for (const item of selectedDeviceRecords.value) {
    map.set(String(item.id ?? item.key), item)
  }
  return map
})

const selectedDevices = computed(() =>
  formState.deviceKeys.map((key) =>
    selectedDeviceMap.value.get(String(key)) ?? {
      key: String(key),
      id: key,
      code: `#${key}`,
      name: '设备信息加载中',
      type: '',
    },
  ),
)

function onDeviceSelectionChange(keys, selectedRows) {
  const currentPageKeySet = new Set(deviceRows.value.map((e) => String(e.key ?? e.id)))
  const otherKeys = formState.deviceKeys.filter((k) => !currentPageKeySet.has(String(k)))
  formState.deviceKeys = [...otherKeys, ...keys.map(String)]
  mergeSelectedDeviceRecords(selectedRows)
}

const teamOptions = ref([])
const ownerOptions = ref([])
const ownerLoading = ref(false)

async function loadOrganizations() {
  try {
    const data = await getOrganizationsList()
    const inner = data?.data ?? data
    const arr = Array.isArray(inner) ? inner : inner?.list ?? Array.isArray(data) ? data : data?.list ?? []
    const flat = flattenOrgTree(arr)
    teamOptions.value = (flat || []).map((o) => ({
      value: String(o.id ?? ''),
      label: o.name ?? String(o.id ?? ''),
    }))
  } catch (e) {
    teamOptions.value = []
    message.warning('加载责任部门列表失败，请检查组织接口或稍后重试')
  }
}

function flattenOrgTree(nodes, result = []) {
  for (const n of nodes || []) {
    result.push({ id: n.id, name: n.name })
    if (n.children?.length) flattenOrgTree(n.children, result)
  }
  return result
}

async function ensureOwnerOptionIncluded(ownerId) {
  if (!ownerId) return
  const sid = String(ownerId)
  if (ownerOptions.value.some((o) => String(o.value) === sid)) return
  try {
    const user = await getUserById(ownerId)
    const data = user?.data ?? user
    const label = data?.name ?? data?.username ?? sid
    ownerOptions.value = [...ownerOptions.value, { value: sid, label }]
  } catch {
    ownerOptions.value = [...ownerOptions.value, { value: sid, label: `用户 ${ownerId}` }]
  }
}

function normalizeUserList(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  const inner = res?.data ?? res
  const list = inner?.records ?? inner?.list ?? res?.records ?? res?.list
  return Array.isArray(list) ? list : []
}

async function loadUsers(organizationId = formState.team, options = {}) {
  const { includeUserId } = options
  // 雪花号可能超过 JS Number 精度；这里必须保持字符串透传给后端
  const orgId = organizationId != null && organizationId !== '' ? String(organizationId) : undefined
  if (!orgId && !includeUserId) {
    ownerOptions.value = []
    return
  }
  ownerLoading.value = true
  try {
    const params = {
      pageNumber: 1,
      pageSize: 200,
      ...(orgId ? { organizationId: orgId } : {}),
    }
    const res = await getUsers(params)
    const arr = normalizeUserList(res)
    ownerOptions.value = arr.map((u) => ({
      value: String(u.id ?? ''),
      label: u.name ?? u.username ?? String(u.id ?? ''),
    }))
    if (includeUserId) await ensureOwnerOptionIncluded(includeUserId)
  } catch (e) {
    ownerOptions.value = []
    message.warning('加载负责人列表失败，请检查用户接口或稍后重试')
  } finally {
    ownerLoading.value = false
  }
}

async function loadDeviceTypes() {
  try {
    const data = await getDictionaryList(DEVICE_TYPE_DICT_CODE)
    const arr = Array.isArray(data) ? data : data?.data ?? data?.list ?? []
    deviceTypeOptions.value = (arr || [])
      .map((item) => ({
        value: item.value ?? item.code,
        label: item.name ?? item.label ?? item.value ?? item.code,
      }))
      .filter((item) => item.value)
  } catch {
    deviceTypeOptions.value = []
  }
  mergeDeviceTypeOptionsFromDevices(selectedDeviceRecords.value)
}

async function hydrateSelectedDevices(keys = formState.deviceKeys) {
  const missingIds = keys
    .map(String)
    .filter((id) => !selectedDeviceMap.value.has(id))
  if (!missingIds.length) return
  const records = await Promise.all(missingIds.map((id) => getDeviceById(id).catch(() => null)))
  mergeSelectedDeviceRecords(records.filter(Boolean))
}

function ensureSelectedTypeForDeviceKeys() {
  const firstSelected = selectedDevices.value.find((item) => item?.type)
  if (firstSelected?.type) {
    selectedType.value = firstSelected.type
    return
  }
  if (!selectedType.value && deviceTypeOptions.value.length > 0) {
    selectedType.value = deviceTypeOptions.value[0].value
  }
}

async function loadDevicePage() {
  if (!selectedType.value) {
    deviceRows.value = []
    deviceListPagination.total = 0
    return
  }
  deviceTableLoading.value = true
  try {
    const res = await getDevicePage({
      pageNumber: deviceListPagination.current,
      pageSize: deviceListPagination.pageSize,
      type: selectedType.value,
    })
    deviceRows.value = res?.list ?? []
    deviceListPagination.total = res?.total ?? 0
    mergeSelectedDeviceRecords(deviceRows.value.filter((item) => formState.deviceKeys.includes(String(item.id ?? item.key))))
  } catch {
    deviceRows.value = []
    deviceListPagination.total = 0
    message.warning('加载设备列表失败，请稍后重试')
  } finally {
    deviceTableLoading.value = false
  }
}

watch(
  () => formState.cycle,
  (cycle) => {
    if (isHydrating.value) return
    const c = (cycle ?? '').toLowerCase()
    formState.time = c === 'once' ? null : '08:00'
    formState.executeAt = c === 'once' ? dayjs().format('YYYY-MM-DD HH:mm') : null
    formState.cycleExtra = {}
    if (c === 'weekly') formState.cycleExtra = { weekday: 1 }
    if (c === 'monthly') formState.cycleExtra = { day: 1 }
    if (c === 'yearly') formState.cycleExtra = { month: 1, day: 1 }
  },
)

watch(
  () => formState.team,
  () => {
    if (isHydrating.value) return
    formState.owner = undefined
    loadUsers(formState.team)
  },
)

function fillForm(record) {
  selectedDeviceRecords.value = []
  selectedType.value = null
  if (record) {
    let cycle = record.cycle ?? 'DAILY'
    let time = record.time ?? '08:00'
    let cycleExtra = record.cycleExtra ?? {}
    let executeAt = record.executeAt ? dayjs(record.executeAt) : null
    const c = (record.cycle ?? '').toLowerCase()
    if (record.cron && c !== 'once') {
      const parsed = cronToForm(record.cron)
      if (parsed) {
        cycle = (parsed.cycle ?? '').toUpperCase()
        time = parsed.time
        cycleExtra = parsed.cycleExtra ?? {}
      }
    } else if (record.cron && c === 'once') {
      const parsed = cronToForm(record.cron)
      if (parsed?.executeAt) {
        cycle = 'ONCE'
        time = null
        executeAt = dayjs(parsed.executeAt)
      }
    }
    const deviceIds = record.deviceIds ?? record.deviceKeys ?? (() => {
      const list = record.deviceIdList ?? record.deviceList ?? []
      return Array.isArray(list)
        ? list.map((x) => String(typeof x === 'object' && x != null ? x.id ?? x.deviceId ?? x.key : x))
        : []
    })()
    const teamVal = record.team ?? record.organizationId
    const ownerVal = record.owner ?? record.userId
    Object.assign(formState, {
      key: record.key,
      plan: record.plan ?? record.taskName ?? record.name,
      cycle,
      time,
      cycleExtra,
      executeAt,
      team: teamVal != null && teamVal !== '' ? String(teamVal) : undefined,
      owner: ownerVal != null && ownerVal !== '' ? String(ownerVal) : undefined,
      enabled: record.enabled !== false,
      deviceKeys: [...deviceIds.map(String)],
    })
  } else {
    Object.assign(formState, {
      key: '',
      plan: '',
      cycle: 'DAILY',
      time: '08:00',
      cycleExtra: {},
      executeAt: null,
      team: undefined,
      owner: undefined,
      enabled: true,
      deviceKeys: [],
    })
  }
}

async function ensureTeamOptionIncluded(teamId) {
  if (!teamId) return
  const sid = String(teamId)
  const exists = teamOptions.value.some((o) => String(o.value) === sid)
  if (exists) return
  try {
    const org = await getOrganizationById(teamId)
    const data = org?.data ?? org
    const name = data?.name ?? sid
    teamOptions.value = [...teamOptions.value, { value: sid, label: name }]
  } catch {
    teamOptions.value = [...teamOptions.value, { value: sid, label: `部门 ${teamId}` }]
  }
}

onMounted(async () => {
  await Promise.all([loadOrganizations(), loadDeviceTypes()])
  if (isEdit.value && route.params.id) {
    const record = await taskStore.getById(route.params.id, { forceFetch: true })
    if (record) {
      isHydrating.value = true
      fillForm(record)
      await ensureTeamOptionIncluded(formState.team)
      await loadUsers(formState.team, { includeUserId: formState.owner })
      await hydrateSelectedDevices()
      ensureSelectedTypeForDeviceKeys()
      isHydrating.value = false
      await loadDevicePage()
    } else {
      message.warning('任务不存在')
    }
  } else {
    isHydrating.value = true
    fillForm(null)
    ensureSelectedTypeForDeviceKeys()
    isHydrating.value = false
    await loadDevicePage()
  }
})

function goBack() {
  router.push('/tasks')
}

async function submit() {
  if (!formState.plan?.trim()) {
    message.warning('请填写任务名称')
    return
  }
  if (!formState.deviceKeys?.length) {
    message.warning('请至少选择一台设备')
    return
  }
  const c = (formState.cycle ?? '').toLowerCase()
  if (c !== 'once') {
    if (!formState.time) {
      message.warning('请设置执行时间')
      return
    }
    if (c === 'yearly') {
      if (formState.cycleExtra?.month == null || formState.cycleExtra?.day == null) {
        message.warning('请选择年度任务的月份和日')
        return
      }
    }
  } else {
    if (!formState.executeAt) {
      message.warning('请设置临时任务的执行时间')
      return
    }
  }

  // 同样避免雪花号 Number 精度损失：提交时保持字符串
  const deviceIds = (formState.deviceKeys ?? []).map((id) => String(id)).filter(Boolean)
  const formData = {
    ...formState,
    executeAt: formState.executeAt ? dayjs(formState.executeAt).format('YYYY-MM-DD HH:mm') : null,
    deviceIds,
  }
  const payload = buildTaskPayload(formData)

  try {
    if (isEdit.value && route.params.id) {
      await taskStore.update(route.params.id, payload)
      message.success('任务已更新')
    } else {
      await taskStore.create(payload)
      message.success('任务已创建')
    }
    router.push('/tasks')
  } catch {
    message.error('保存失败，请稍后重试')
  }
}
</script>

<template>
  <div class="task-form-page">
    <div class="page-header">
      <div class="page-header__meta">
        <a class="back-link" @click="goBack">返回计划任务</a>
        <h2>{{ isEdit ? '编辑任务' : '新建任务' }}</h2>
      </div>
    </div>

    <a-card :bordered="false">
      <a-form layout="vertical">
        <a-form-item label="任务名称" required>
          <a-input v-model:value="formState.plan" placeholder="如：A 区逆变器日检" />
        </a-form-item>

        <a-form-item label="包含设备" required>
          <div class="device-selector-row">
            <div class="device-types-col">
              <div class="device-types-title">设备类型</div>
              <a-list
                :data-source="deviceTypeOptions"
                size="small"
                :locale="{ emptyText: '暂无类型' }"
              >
                <template #renderItem="{ item }">
                  <a-list-item
                    class="device-type-item"
                    :class="{ active: selectedType === item.value }"
                    @click="selectedType = item.value"
                  >
                    {{ item.label }}
                  </a-list-item>
                </template>
              </a-list>
            </div>
            <div class="device-list-col">
              <div class="device-list-title">
                {{ selectedType ? `${deviceTypeOptions.find((item) => item.value === selectedType)?.label ?? selectedType} - 设备列表` : '请先选择左侧设备类型' }}
              </div>
              <a-table
                v-if="selectedType"
                :data-source="deviceRows"
                :loading="deviceTableLoading"
                :row-selection="{
                  selectedRowKeys,
                  onChange: onDeviceSelectionChange,
                }"
                :pagination="{
                  current: deviceListPagination.current,
                  pageSize: deviceListPagination.pageSize,
                  total: deviceListPagination.total,
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 条`,
                }"
                row-key="key"
                size="small"
                @change="onDeviceTableChange"
              >
                <a-table-column title="设备编码" data-index="code" key="code" width="120" />
                <a-table-column title="设备名称" data-index="name" key="name" />
                <a-table-column title="型号" data-index="model" key="model" width="100" />
              </a-table>
            </div>
          </div>
          <div v-if="selectedDevices.length" class="device-tags">
            已选 {{ selectedDevices.length }} 台：
            <a-tag v-for="d in selectedDevices" :key="d.key">
              {{ d.code }} {{ d.name }}
            </a-tag>
          </div>
        </a-form-item>

        <a-form-item label="执行周期" required>
          <a-select v-model:value="formState.cycle" style="width: 100%">
            <a-select-option v-for="c in TASK_CYCLES" :key="c.value" :value="c.value">
              {{ c.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <template v-if="(formState.cycle || '').toLowerCase() === 'once'">
          <a-form-item label="执行时间（年月日时分）" required>
            <a-date-picker
              v-model:value="formState.executeAt"
              show-time
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              placeholder="选择具体执行时间"
              style="width: 100%"
            />
          </a-form-item>
        </template>
        <template v-else>
          <a-form-item v-if="(formState.cycle || '').toLowerCase() === 'weekly'" label="星期">
            <a-select v-model:value="formState.cycleExtra.weekday" style="width: 100%">
              <a-select-option v-for="w in WEEKDAYS" :key="w.value" :value="w.value">
                {{ w.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="(formState.cycle || '').toLowerCase() === 'monthly'" label="每月几日">
            <a-input-number
              v-model:value="formState.cycleExtra.day"
              :min="1"
              :max="31"
              style="width: 100%"
            />
          </a-form-item>
          <template v-if="(formState.cycle || '').toLowerCase() === 'yearly'">
            <a-form-item label="月份" required>
              <a-select v-model:value="formState.cycleExtra.month" placeholder="选择月份" style="width: 100%">
                <a-select-option v-for="m in 12" :key="m" :value="m">{{ m }} 月</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="日" required>
              <a-input-number
                v-model:value="formState.cycleExtra.day"
                :min="1"
                :max="31"
                style="width: 100%"
              />
            </a-form-item>
          </template>
          <a-form-item v-if="(formState.cycle || '').toLowerCase() === 'quarterly'" label="说明">
            <span class="form-hint">每季度第 1 天执行，请设置执行时间（时分）。</span>
          </a-form-item>
          <a-form-item label="执行时间（时分）" required>
            <a-time-picker
              v-model:value="formState.time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="如：08:00"
              style="width: 100%"
            />
          </a-form-item>
        </template>

        <a-form-item label="责任部门">
          <a-select
            v-model:value="formState.team"
            placeholder="请选择责任部门（组织机构）"
            :options="teamOptions"
            allow-clear
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="负责人">
          <a-select
            v-model:value="formState.owner"
            placeholder="请先选择责任部门，再选择负责人"
            :options="ownerOptions"
            :loading="ownerLoading"
            allow-clear
            style="width: 100%"
            :disabled="!formState.team"
            @dropdown-visible-change="(open) => { if (open && formState.team) loadUsers(formState.team) }"
          />
        </a-form-item>
        <a-form-item label="是否启用">
          <a-switch v-model:checked="formState.enabled" checked-children="启用" un-checked-children="禁用" />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="submit">保存</a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.task-form-page {
  padding: 0;
}

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

.device-selector-row {
  display: flex;
  gap: 16px;
  min-height: 280px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
}

.device-types-col {
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  padding-right: 12px;
}

.device-types-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2329;
}

.device-type-item {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
}

.device-type-item:hover {
  background: #f5f5f5;
}

.device-type-item.active {
  background: #e6f4ff;
  color: #1677ff;
}

.device-list-col {
  flex: 1;
  min-width: 0;
}

.device-list-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2329;
}

.device-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.form-hint {
  color: #8c8c8c;
  font-size: 12px;
}
</style>
