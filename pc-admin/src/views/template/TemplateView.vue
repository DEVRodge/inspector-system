<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getDictionaryList } from '../../api/modules/dictionary'
import { getApiErrorMessage } from '../../utils/error'
import {
  createTemplateItem,
  deleteTemplateItem,
  getTemplateById,
  getTemplateItems,
  updateTemplateItem,
} from '../../api/modules/inspection'
import { DEVICE_TYPE_DICT_CODE, DEVICE_TYPE_OPTIONS, dictionaryRows as mockDeviceTypes } from '../../mock/modules/settings'
import { INSPECTION_ITEM_TYPES } from '../../mock/modules/template'
import { useTemplateStore } from '../../stores/template'
import InspectionItemTreeModal from '../../components/template/InspectionItemTreeModal.vue'
import { isMockEnabled } from '../../api/http'

const router = useRouter()
const templateStore = useTemplateStore()

const query = reactive({ deviceType: undefined })
const deviceTypeOptions = ref([])

async function loadDeviceTypes() {
  if (isMockEnabled) {
    deviceTypeOptions.value = mockDeviceTypes
      .filter((d) => d.category === DEVICE_TYPE_DICT_CODE && d.status === '启用')
      .map((d) => ({ value: d.code ?? d.label, label: d.label }))
  } else {
    try {
      const list = await getDictionaryList(DEVICE_TYPE_DICT_CODE)
      const arr = Array.isArray(list) ? list : list?.list ?? []
      deviceTypeOptions.value = (arr || [])
        .filter((d) => d.enabled !== false)
        .map((d) => ({ value: d.value ?? d.code ?? d.name, label: d.name ?? d.label ?? d.value }))
      if (deviceTypeOptions.value.length === 0) {
        deviceTypeOptions.value = DEVICE_TYPE_OPTIONS
      }
    } catch {
      deviceTypeOptions.value = DEVICE_TYPE_OPTIONS
    }
  }
}

const loading = ref(false)

async function loadList() {
  if (isMockEnabled) {
    await templateStore.loadList()
    return
  }
  loading.value = true
  try {
    await templateStore.loadList({
      deviceType: query.deviceType,
      pageNumber: 1,
      pageSize: 999,
    })
  } catch {
    message.error('加载模板列表失败')
  } finally {
    loading.value = false
  }
}

async function initPage() {
  await loadDeviceTypes()
  await loadList()
  mergeDeviceTypesFromTemplates()
}

function mergeDeviceTypesFromTemplates() {
  const fromTemplates = [...new Set(templateStore.list.map((r) => r.deviceType).filter(Boolean))]
  const existingValues = new Set(deviceTypeOptions.value.map((o) => o.value))
  for (const dt of fromTemplates) {
    if (!existingValues.has(dt)) {
      const label = getDeviceTypeLabel(dt) || dt
      deviceTypeOptions.value = [...deviceTypeOptions.value, { value: dt, label }]
      existingValues.add(dt)
    }
  }
  deviceTypeOptions.value = dedupeOptionsByLabel(deviceTypeOptions.value, fromTemplates)
}

function dedupeOptionsByLabel(opts, templateValues = []) {
  const byLabel = new Map()
  const templateSet = new Set(templateValues)
  for (const o of opts) {
    const prev = byLabel.get(o.label)
    const preferThis = !prev || (templateSet.has(o.value) && !templateSet.has(prev.value))
    if (!prev || preferThis) byLabel.set(o.label, o)
  }
  return [...byLabel.values()]
}

onMounted(() => {
  initPage()
})
const rows = computed(() => templateStore.list)
const filteredRows = computed(() =>
  rows.value.filter((r) => !query.deviceType || r.deviceType === query.deviceType),
)

const detailVisible = ref(false)
const currentRow = ref(null)
const detailLoading = ref(false)
const itemModalOpen = ref(false)
const configTarget = ref(null)
const itemConfigLoading = ref(false)
const itemConfigLoadingId = ref(null)

function openCreate() {
  router.push({ name: 'templateNew' })
}

async function openDetail(record) {
  const id = record.id ?? record.key
  detailVisible.value = true
  currentRow.value = record
  if (!isMockEnabled) {
    detailLoading.value = true
    try {
      const full = await getTemplateById(id)
      if (full) currentRow.value = full
    } catch {
      message.error('加载模板详情失败')
    } finally {
      detailLoading.value = false
    }
  }
}

function openEdit(record) {
  router.push({ name: 'templateEdit', params: { id: record.key } })
}

async function openItemConfig(record) {
  const id = record.id ?? record.key
  if (!isMockEnabled) {
    itemConfigLoading.value = true
    itemConfigLoadingId.value = id
    try {
      const items = await getTemplateItems(id)
      configTarget.value = { ...record, items: items ?? [] }
      itemModalOpen.value = true
    } catch {
      message.error('加载巡检项失败')
    } finally {
      itemConfigLoading.value = false
      itemConfigLoadingId.value = null
    }
  } else {
    configTarget.value = { ...record, items: record.items ?? [] }
    itemModalOpen.value = true
  }
}

async function onItemsUpdate(newItems) {
  if (!configTarget.value) return
  const templateId = configTarget.value.id ?? configTarget.value.key
  const currentItems = configTarget.value.items ?? []
  const items = newItems ?? []

  if (isMockEnabled) {
    try {
      await templateStore.update(templateId, { ...configTarget.value, items })
      itemModalOpen.value = false
      configTarget.value = null
    } catch {
      message.error('保存巡检项失败')
    }
    return
  }

  try {
    const currentIds = new Set(currentItems.map((it) => String(it.id ?? it.key)).filter(Boolean))
    const newIds = new Set(items.filter((it) => /^\d+$/.test(String(it.id ?? it.key))).map((it) => String(it.id ?? it.key)))

    for (const it of currentItems) {
      const id = it.id ?? it.key
      if (!id) continue
      const sid = String(id)
      if (!items.some((n) => String(n.id ?? n.key) === sid)) {
        await deleteTemplateItem(id)
      }
    }

    for (const it of items) {
      const id = it.id ?? it.key
      const payload = {
        templateId,
        name: it.name ?? it.title,
        type: it.type ?? 'radio',
        required: !!it.required,
        rule: it.rule ?? '',
        defaultValue: it.defaultValue === '正常' ? 'NORMAL' : it.defaultValue === '异常' ? 'ABNORMAL' : (it.defaultValue ?? 'NORMAL'),
        sort: it.sort ?? 0,
      }
      if (id && /^\d+$/.test(String(id))) {
        await updateTemplateItem(id, payload)
      } else {
        await createTemplateItem(payload)
      }
    }

    itemModalOpen.value = false
    configTarget.value = null
    loadList()
  } catch (err) {
    message.error(getApiErrorMessage(err))
  }
}

function getTypeLabel(type) {
  return INSPECTION_ITEM_TYPES.find((t) => t.value === type)?.label ?? type
}

function getDeviceTypeLabel(val) {
  return deviceTypeOptions.value.find((d) => d.value === val)?.label ?? val
}

const statusLabelMap = { DRAFT: '草稿', ENABLED: '启用中' }
function getStatusLabel(val) {
  return statusLabelMap[val] ?? val
}

function flattenItems(arr) {
  if (!Array.isArray(arr)) return []
  return arr.flatMap((it) => {
    const flat = { key: it.key ?? it.id, name: it.name ?? it.title ?? '未命名', type: it.type ?? 'radio', required: it.required, rule: it.rule }
    const children = it.children ?? []
    return [flat, ...flattenItems(children)]
  })
}

function getDisplayItems(record) {
  const items = record?.items ?? []
  return flattenItems(items).map((it, i) => ({ ...it, key: it.key ?? `i${i}` }))
}

function removeRow(record) {
  Modal.confirm({
    title: `确认删除模板「${record.name}」吗？`,
    content: '删除后该设备类型将无关联模板。',
    async onOk() {
      try {
        const id = record.id ?? record.key
        await templateStore.remove(id)
        message.success('模板已删除')
        loadList()
      } catch (err) {
        message.error(getApiErrorMessage(err))
      }
    },
  })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>巡检模板</h2>
        <p>按设备类型配置巡检表单，一种设备类型关联一种模板。巡检项为正常/异常二选一。</p>
      </div>
      <a-button type="primary" @click="openCreate">新增模板</a-button>
    </div>

    <a-card :bordered="false">
      <div class="table-toolbar">
        <a-select
          v-model:value="query.deviceType"
          placeholder="按设备类型筛选"
          allow-clear
          style="width: 180px"
          :options="deviceTypeOptions"
          @change="loadList"
        />
      </div>
      <a-table :data-source="filteredRows" :loading="loading" :pagination="false" row-key="key">
        <a-table-column title="模板名称" data-index="name" key="name" />
        <a-table-column title="设备类型" data-index="deviceType" key="deviceType" width="120">
          <template #default="{ record }">{{ getDeviceTypeLabel(record.deviceType) }}</template>
        </a-table-column>
        <a-table-column title="巡检项数" data-index="itemCount" key="itemCount" width="100" />
        <a-table-column title="必填项数" data-index="requiredCount" key="requiredCount" width="100" />
        <a-table-column title="版本" data-index="version" key="version" width="90" />
        <a-table-column title="状态" data-index="status" key="status" width="100">
          <template #default="{ record }">{{ getStatusLabel(record.status) }}</template>
        </a-table-column>
        <a-table-column title="操作" key="action" width="240">
          <template #default="{ record }">
            <a-space :size="4">
              <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button
                type="link"
                size="small"
                :loading="itemConfigLoading && itemConfigLoadingId === (record.id ?? record.key)"
                @click="openItemConfig(record)"
              >
                配置巡检项
              </a-button>
              <a-button type="link" danger size="small" @click="removeRow(record)">删除</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailVisible" title="模板详情" width="560">
      <a-spin :spinning="detailLoading">
        <div v-if="currentRow">
        <a-descriptions :column="1" bordered size="small" class="drawer-section">
          <a-descriptions-item label="模板名称">{{ currentRow.name }}</a-descriptions-item>
          <a-descriptions-item label="设备类型">{{ getDeviceTypeLabel(currentRow.deviceType) }}</a-descriptions-item>
          <a-descriptions-item label="版本">{{ currentRow.version }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ getStatusLabel(currentRow.status) }}</a-descriptions-item>
        </a-descriptions>
        <div v-if="currentRow.description" class="drawer-section">
          <div class="drawer-section__title">模板说明</div>
          <div class="template-desc">{{ currentRow.description }}</div>
        </div>
        <div class="drawer-section">
          <div class="drawer-section__title">巡检项明细</div>
          <a-table
            :data-source="getDisplayItems(currentRow)"
            :pagination="false"
            row-key="key"
            size="small"
          >
            <a-table-column title="巡检项" data-index="name" key="name" />
            <a-table-column title="录入方式" key="type" width="90">
              <template #default="{ record }">{{ getTypeLabel(record.type) }}</template>
            </a-table-column>
            <a-table-column title="必填" key="required" width="70">
              <template #default="{ record }">{{ record.required ? '是' : '否' }}</template>
            </a-table-column>
            <a-table-column title="判定规则" data-index="rule" key="rule" />
          </a-table>
        </div>
        </div>
      </a-spin>
    </a-drawer>

    <InspectionItemTreeModal
      :open="itemModalOpen"
      :model-value="configTarget?.items ?? []"
      @update:open="(v) => { itemModalOpen = v; if (!v) configTarget = null }"
      @update:model-value="onItemsUpdate"
    />
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

.template-desc {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  color: #4e5969;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
