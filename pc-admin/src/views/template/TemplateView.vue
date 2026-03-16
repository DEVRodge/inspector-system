<script setup>
import { computed, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  DeleteOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
import {
  DEVICE_TYPES,
  INSPECTION_ITEM_TYPES,
  templateRows,
} from '../../mock/modules/template'

const query = reactive({ deviceType: undefined })
const rows = ref(
  templateRows.map((r) => ({
    ...r,
    itemCount: r.items?.length ?? 0,
    requiredCount: r.items?.filter((i) => i.required)?.length ?? 0,
  })),
)
const detailVisible = ref(false)
const formVisible = ref(false)
const currentRow = ref(null)
const expandedItemKey = ref(null)

const formState = reactive({
  key: '',
  name: '',
  deviceType: '',
  description: '',
  version: 'V1.0',
  status: '草稿',
  items: [],
})

const filteredRows = computed(() =>
  rows.value.filter((r) => !query.deviceType || r.deviceType === query.deviceType),
)

function createEmptyItem() {
  return {
    key: `item_${Date.now()}`,
    name: '',
    type: 'radio',
    required: true,
    rule: '',
    defaultValue: '',
    options: ['正常', '异常'],
    config: {},
  }
}

function fillForm(record) {
  if (record) {
    Object.assign(formState, {
      key: record.key,
      name: record.name,
      deviceType: record.deviceType,
      description: record.description ?? '',
      version: record.version ?? 'V1.0',
      status: record.status ?? '草稿',
      items: (record.items ?? []).map((it) => ({
        ...it,
        key: it.key || `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'radio',
        options: ['正常', '异常'],
        config: {},
      })),
    })
  } else {
    Object.assign(formState, {
      key: '',
      name: '',
      deviceType: '',
      description: '',
      version: 'V1.0',
      status: '草稿',
      items: [createEmptyItem()],
    })
  }
}

function openCreate() {
  currentRow.value = null
  fillForm()
  formVisible.value = true
}

function openDetail(record) {
  currentRow.value = record
  detailVisible.value = true
}

function openEdit(record) {
  currentRow.value = record
  fillForm(record)
  formVisible.value = true
  expandedItemKey.value = record.items?.[0]?.key ?? null
}

function addItem() {
  formState.items.push(createEmptyItem())
}

function removeItem(index) {
  formState.items.splice(index, 1)
}

function getTypeLabel(type) {
  return INSPECTION_ITEM_TYPES.find((t) => t.value === type)?.label ?? type
}

function saveRow() {
  if (!formState.name || !formState.deviceType) {
    message.warning('请先填写模板名称和适用设备类型')
    return
  }
  const validItems = formState.items.filter((i) => i.name?.trim())
  if (validItems.length === 0) {
    message.warning('请至少添加一个巡检项')
    return
  }
  const hasInvalid = validItems.some((i) => !i.options?.length || i.options.every((o) => !o?.trim()))
  if (hasInvalid) {
    message.warning('巡检项需配置正常/异常选项')
    return
  }

  const payload = {
    ...formState,
    items: validItems,
    itemCount: validItems.length,
    requiredCount: validItems.filter((i) => i.required).length,
  }

  if (currentRow.value) {
    const index = rows.value.findIndex((r) => r.key === currentRow.value.key)
    rows.value[index] = { ...rows.value[index], ...payload }
    message.success('模板已更新')
  } else {
    if (rows.value.some((r) => r.deviceType === formState.deviceType)) {
      message.warning('该设备类型已有关联模板，一种设备类型仅能关联一个模板')
      return
    }
    payload.key = `${Date.now()}`
    rows.value.unshift(payload)
    message.success('模板已新增')
  }
  formVisible.value = false
}

function removeRow(record) {
  Modal.confirm({
    title: `确认删除模板「${record.name}」吗？`,
    content: '删除后该设备类型将无关联模板。',
    onOk() {
      rows.value = rows.value.filter((r) => r.key !== record.key)
      message.success('模板已删除')
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
        >
          <a-select-option v-for="t in DEVICE_TYPES" :key="t" :value="t">{{ t }}</a-select-option>
        </a-select>
      </div>
      <a-table :data-source="filteredRows" :pagination="false" row-key="key">
        <a-table-column title="模板名称" data-index="name" key="name" />
        <a-table-column title="设备类型" data-index="deviceType" key="deviceType" width="120" />
        <a-table-column title="巡检项数" data-index="itemCount" key="itemCount" width="100" />
        <a-table-column title="必填项数" data-index="requiredCount" key="requiredCount" width="100" />
        <a-table-column title="版本" data-index="version" key="version" width="90" />
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
            :data-source="currentRow.items"
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

    <a-modal
      v-model:open="formVisible"
      :title="currentRow ? '编辑模板' : '新增模板'"
      width="440"
      :body-style="{ maxHeight: '70vh', overflowY: 'auto' }"
      @ok="saveRow"
    >
      <a-form layout="vertical">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="formState.name" placeholder="如：逆变器巡检模板" />
        </a-form-item>
        <a-form-item label="适用设备类型" required>
          <a-select
            v-model:value="formState.deviceType"
            placeholder="选择设备类型，一种类型仅能关联一个模板"
            :disabled="!!currentRow"
            :options="DEVICE_TYPES.map((t) => ({ value: t, label: t }))"
          />
        </a-form-item>
        <a-form-item label="模板说明">
          <a-textarea
            v-model:value="formState.description"
            placeholder="说明该类型设备巡检需注意的事项、操作规范及其他说明"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="版本">
          <a-input v-model:value="formState.version" placeholder="如：V1.0" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status">
            <a-select-option value="启用中">启用中</a-select-option>
            <a-select-option value="草稿">草稿</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="巡检项配置" required>
          <div class="items-editor">
            <div
              v-for="(item, index) in formState.items"
              :key="item.key"
              class="item-card"
            >
              <div class="item-card__head" @click="expandedItemKey = expandedItemKey === item.key ? null : item.key">
                <span class="item-card__index">{{ index + 1 }}</span>
                <span class="item-card__name">{{ item.name || '未命名巡检项' }}</span>
                <span class="item-card__type">{{ getTypeLabel(item.type) }}</span>
                <span class="item-card__required">{{ item.required ? '必填' : '选填' }}</span>
                <a-button type="text" size="small" danger @click.stop="removeItem(index)">
                  <DeleteOutlined />
                </a-button>
                <DownOutlined v-if="expandedItemKey !== item.key" class="item-card__expand" />
                <UpOutlined v-else class="item-card__expand" />
              </div>
              <div v-show="expandedItemKey === item.key" class="item-card__body">
                <a-form-item label="巡检项名称">
                  <a-input v-model:value="item.name" placeholder="如：设备外观" />
                </a-form-item>
                <a-form-item label="是否必填">
                  <a-switch v-model:checked="item.required" />
                </a-form-item>
                <a-form-item label="判定规则/异常标准">
                  <a-input v-model:value="item.rule" placeholder="如：发现渗漏需拍照并说明位置" />
                </a-form-item>
                <a-form-item label="默认值">
                  <a-select
                    v-model:value="item.defaultValue"
                    placeholder="选填"
                    allow-clear
                    style="width: 100%"
                  >
                    <a-select-option value="正常">正常</a-select-option>
                    <a-select-option value="异常">异常</a-select-option>
                  </a-select>
                </a-form-item>
              </div>
            </div>
            <a-button type="dashed" block @click="addItem">
              <PlusOutlined /> 添加巡检项
            </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
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

.items-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  overflow: hidden;
}

.item-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fafafa;
  cursor: pointer;
}

.item-card__index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #e6f4ff;
  color: #1677ff;
  font-size: 12px;
  font-weight: 600;
}

.item-card__name {
  flex: 1;
  font-weight: 500;
}

.item-card__type {
  font-size: 12px;
  color: #86909c;
}

.item-card__required {
  font-size: 12px;
  color: #f53f3f;
}

.item-card__expand {
  color: #86909c;
  font-size: 12px;
}

.item-card__body {
  padding: 16px;
  border-top: 1px solid #e5e6eb;
  background: #fff;
}

</style>
