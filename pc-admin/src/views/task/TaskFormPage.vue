<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDepartments, getDevicePage } from '@/api/modules/equipment'
import { orgRows } from '@/mock/data'
import { isMockEnabled } from '@/api/http'
import { useTaskStore } from '@/stores/task'
import { formToCron, cronToForm } from '@/utils/cron'
import {
  TASK_CYCLES,
  WEEKDAYS,
  equipmentRows,
  getDevicesByKeys,
} from '@/mock/modules/task'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const isEdit = computed(() => Boolean(route.params.id))

const formState = reactive({
  key: '',
  plan: '',
  cycle: 'daily',
  time: null,
  cycleExtra: {},
  executeAt: null,
  team: '',
  inspector: '',
  status: '待执行',
  deviceKeys: [],
})

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

const allDevices = ref([])

const equipmentTypes = computed(() => {
  const set = new Set(allDevices.value.map((e) => e.type))
  return Array.from(set)
})

const selectedType = ref(null)
const devicesOfType = computed(() => {
  if (!selectedType.value) return []
  return allDevices.value.filter((e) => e.type === selectedType.value)
})

const selectedRowKeys = computed(() => {
  if (!selectedType.value) return []
  const typeKeys = new Set(devicesOfType.value.map((e) => e.key))
  return formState.deviceKeys.filter((k) => typeKeys.has(k))
})

function onDeviceSelectionChange(keys) {
  const currentTypeKeySet = new Set(devicesOfType.value.map((e) => e.key))
  const otherKeys = formState.deviceKeys.filter((k) => !currentTypeKeySet.has(k))
  formState.deviceKeys = [...otherKeys, ...keys]
}

const selectedDevices = computed(() => {
  const keys = formState.deviceKeys
  if (isMockEnabled) return getDevicesByKeys(keys)
  return allDevices.value.filter((e) => keys.includes(String(e.key ?? e.id)))
})

const departmentOptions = ref([])
const inspectorOptions = computed(() => {
  const dept = formState.team
  const list = dept ? orgRows.filter((r) => r.dept === dept) : orgRows
  return list.map((r) => ({ value: r.name, label: `${r.name}（${r.dept}）` }))
})

async function loadDepartments() {
  try {
    const res = await getDepartments()
    const list = res?.list ?? []
    departmentOptions.value = list.map((item) =>
      typeof item === 'string' ? { value: item, label: item } : { value: item.name ?? item.id, label: item.name ?? item.id },
    )
  } catch {
    departmentOptions.value = []
  }
}

watch(
  () => formState.cycle,
  (cycle) => {
    formState.time = cycle === 'once' ? null : '08:00'
    formState.executeAt = cycle === 'once' ? dayjs().format('YYYY-MM-DD HH:mm') : null
    formState.cycleExtra = {}
    if (cycle === 'weekly') formState.cycleExtra = { weekday: 1 }
    if (cycle === 'monthly') formState.cycleExtra = { day: 1 }
    if (cycle === 'yearly') formState.cycleExtra = { month: 1, day: 1 }
  },
)

function fillForm(record) {
  if (record) {
    let cycle = record.cycle ?? 'daily'
    let time = record.time ?? '08:00'
    let cycleExtra = record.cycleExtra ?? {}
    if (record.cron && record.cycle !== 'once') {
      const parsed = cronToForm(record.cron)
      if (parsed) {
        cycle = parsed.cycle
        time = parsed.time
        cycleExtra = parsed.cycleExtra ?? {}
      }
    }
    Object.assign(formState, {
      key: record.key,
      plan: record.plan,
      cycle,
      time,
      cycleExtra,
      executeAt: record.executeAt ? dayjs(record.executeAt) : null,
      team: record.team ?? '',
      inspector: record.inspector ?? record.owner ?? '',
      status: record.status ?? '待执行',
      deviceKeys: [...(record.deviceKeys ?? record.deviceIds ?? [])],
    })
  } else {
    Object.assign(formState, {
      key: '',
      plan: '',
      cycle: 'daily',
      time: '08:00',
      cycleExtra: {},
      executeAt: null,
      team: '',
      inspector: '',
      status: '待执行',
      deviceKeys: [],
    })
  }
}

async function loadDevices() {
  if (isMockEnabled) {
    allDevices.value = equipmentRows
    return
  }
  try {
    const res = await getDevicePage({ pageNumber: 1, pageSize: 999 })
    allDevices.value = res?.list ?? []
  } catch {
    allDevices.value = []
  }
}

onMounted(async () => {
  await Promise.all([loadDepartments(), loadDevices()])
  if (isEdit.value && route.params.id) {
    const record = await taskStore.getById(route.params.id)
    if (record) fillForm(record)
    else message.warning('任务不存在')
  } else {
    fillForm(null)
  }
})

function goBack() {
  router.push('/tasks')
}

function submit() {
  if (!formState.plan?.trim()) {
    message.warning('请填写任务名称')
    return
  }
  if (!formState.deviceKeys?.length) {
    message.warning('请至少选择一台设备')
    return
  }
  if (!formState.team) {
    message.warning('请选择责任部门')
    return
  }
  if (!formState.inspector) {
    message.warning('请选择巡检人')
    return
  }
  if (formState.cycle !== 'once') {
    if (!formState.time) {
      message.warning('请设置执行时间')
      return
    }
    if (formState.cycle === 'yearly') {
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

  const cron = formState.cycle === 'once' ? null : formToCron(formState)
  const deviceKeys = [...formState.deviceKeys]
  const payload = {
    plan: formState.plan,
    cycle: formState.cycle,
    time: formState.time,
    cycleExtra: { ...formState.cycleExtra },
    executeAt: formState.executeAt ? dayjs(formState.executeAt).format('YYYY-MM-DD HH:mm') : null,
    cron,
    team: formState.team,
    inspector: formState.inspector,
    status: formState.status,
    deviceKeys,
    devices: deviceKeys.length,
    cycleLabel: TASK_CYCLES.find((c) => c.value === formState.cycle)?.label ?? formState.cycle,
    timeDisplay: formState.cycle === 'once'
      ? dayjs(formState.executeAt).format('YYYY-MM-DD HH:mm')
      : formatPeriodTime(formState),
  }

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
                :data-source="equipmentTypes"
                size="small"
                :locale="{ emptyText: '暂无类型' }"
              >
                <template #renderItem="{ item }">
                  <a-list-item
                    class="device-type-item"
                    :class="{ active: selectedType === item }"
                    @click="selectedType = item"
                  >
                    {{ item }}
                  </a-list-item>
                </template>
              </a-list>
            </div>
            <div class="device-list-col">
              <div class="device-list-title">{{ selectedType ? `${selectedType} - 设备列表` : '请先选择左侧设备类型' }}</div>
              <a-table
                v-if="selectedType"
                :data-source="devicesOfType"
                :row-selection="{
                  selectedRowKeys,
                  onChange: onDeviceSelectionChange,
                }"
                :pagination="false"
                row-key="key"
                size="small"
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

        <template v-if="formState.cycle === 'once'">
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
          <a-form-item v-if="formState.cycle === 'weekly'" label="星期">
            <a-select v-model:value="formState.cycleExtra.weekday" style="width: 100%">
              <a-select-option v-for="w in WEEKDAYS" :key="w.value" :value="w.value">
                {{ w.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="formState.cycle === 'monthly'" label="每月几日">
            <a-input-number
              v-model:value="formState.cycleExtra.day"
              :min="1"
              :max="31"
              style="width: 100%"
            />
          </a-form-item>
          <template v-if="formState.cycle === 'yearly'">
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
          <a-form-item v-if="formState.cycle === 'quarterly'" label="说明">
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

        <a-form-item label="责任部门" required>
          <a-select
            v-model:value="formState.team"
            placeholder="请选择责任部门"
            :options="departmentOptions"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="巡检人" required>
          <a-select
            v-model:value="formState.inspector"
            placeholder="请选择巡检人"
            :options="inspectorOptions"
            style="width: 100%"
          />
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
