<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getDictionaryList } from '../../api/modules/dictionary'
import { DEVICE_TYPE_DICT_CODE, dictionaryRows as mockDeviceTypes } from '../../mock/modules/settings'
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
      .map((d) => ({ value: d.label, label: d.label }))
  } else {
    try {
      const list = await getDictionaryList(DEVICE_TYPE_DICT_CODE)
      const arr = Array.isArray(list) ? list : list?.list ?? []
      deviceTypeOptions.value = (arr || [])
        .filter((d) => d.enabled !== false)
        .map((d) => ({ value: d.name ?? d.value, label: d.name ?? d.value }))
    } catch {
      deviceTypeOptions.value = []
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

onMounted(() => {
  loadDeviceTypes()
  loadList()
})
const rows = computed(() => templateStore.list)
const filteredRows = computed(() =>
  rows.value.filter((r) => !query.deviceType || r.deviceType === query.deviceType),
)

const detailVisible = ref(false)
const currentRow = ref(null)
const itemModalOpen = ref(false)
const configTarget = ref(null)

function openCreate() {
  router.push({ name: 'templateNew' })
}

function openDetail(record) {
  currentRow.value = record
  detailVisible.value = true
}

function openEdit(record) {
  router.push({ name: 'templateEdit', params: { id: record.key } })
}

function openItemConfig(record) {
  configTarget.value = record
  itemModalOpen.value = true
}

async function onItemsUpdate(newItems) {
  if (!configTarget.value) return
  const id = configTarget.value.id ?? configTarget.value.key
  try {
    await templateStore.update(id, {
      ...configTarget.value,
      items: newItems ?? [],
    })
    itemModalOpen.value = false
    configTarget.value = null
  } catch {
    message.error('保存巡检项失败')
  }
}

function getTypeLabel(type) {
  return INSPECTION_ITEM_TYPES.find((t) => t.value === type)?.label ?? type
}

function getDisplayItems(record) {
  const items = record?.items ?? []
  return items.map((it) => ({
    key: it.key,
    name: it.name ?? it.title ?? '未命名',
    type: it.type ?? 'radio',
    required: it.required,
    rule: it.rule,
  }))
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
        />
      </div>
      <a-table :data-source="filteredRows" :loading="loading" :pagination="false" row-key="key">
        <a-table-column title="模板名称" data-index="name" key="name" />
        <a-table-column title="设备类型" data-index="deviceType" key="deviceType" width="120" />
        <a-table-column title="巡检项数" data-index="itemCount" key="itemCount" width="100" />
        <a-table-column title="必填项数" data-index="requiredCount" key="requiredCount" width="100" />
        <a-table-column title="版本" data-index="version" key="version" width="90" />
        <a-table-column title="状态" data-index="status" key="status" width="100" />
        <a-table-column title="操作" key="action" width="240">
          <template #default="{ record }">
            <a-space :size="4">
              <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="openItemConfig(record)">配置巡检项</a-button>
              <a-button type="link" danger size="small" @click="removeRow(record)">删除</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailVisible" title="模板详情" width="560">
      <template v-if="currentRow">
        <a-descriptions :column="1" bordered size="small" class="drawer-section">
          <a-descriptions-item label="模板名称">{{ currentRow.name }}</a-descriptions-item>
          <a-descriptions-item label="设备类型">{{ currentRow.deviceType }}</a-descriptions-item>
          <a-descriptions-item label="版本">{{ currentRow.version }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ currentRow.status }}</a-descriptions-item>
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
      </template>
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
