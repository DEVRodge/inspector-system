<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'

const FIXED_OPTIONS = ['正常', '异常']
/** Apifox: 后端 defaultValue 枚举 NORMAL | ABNORMAL，UI 展示用「正常」「异常」 */
const DEFAULT_VALUE_ENUM = { 正常: 'NORMAL', 异常: 'ABNORMAL' }
const DEFAULT_VALUE_LABEL = { NORMAL: '正常', ABNORMAL: '异常' }

const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'update:modelValue'])

const items = ref([])

watch(
  () => props.open,
  (open) => {
    if (open) {
      items.value = cloneItems(props.modelValue)
    }
  },
  { immediate: true },
)

function cloneItems(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map((it) => {
    const rawDefault = it.defaultValue ?? '正常'
    const displayDefault = DEFAULT_VALUE_LABEL[rawDefault] ?? rawDefault
    return {
      key: it.key || it.id || `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      id: it.id,
      title: it.title ?? it.name ?? '未命名巡检项',
      required: !!it.required,
      rule: it.rule ?? '',
      defaultValue: displayDefault,
      sort: it.sort ?? 0,
    }
  })
}

const selectedKey = ref(null)
const editingNode = reactive({
  key: '',
  title: '',
  required: true,
  rule: '',
  defaultValue: '正常',
  sort: 1,
})

const selectedItem = computed(() => {
  if (!selectedKey.value) return null
  return items.value.find((it) => it.key === selectedKey.value)
})

function handleSelect(item) {
  selectedKey.value = item?.key ?? null
  if (item) {
    Object.assign(editingNode, {
      key: item.key,
      title: item.title,
      required: !!item.required,
      rule: item.rule ?? '',
      defaultValue: item.defaultValue ?? '正常',
      sort: item.sort ?? 1,
    })
  }
}

function addItem() {
  const key = `item_${Date.now()}`
  const newItem = {
    key,
    title: '新建巡检项',
    required: true,
    rule: '',
    defaultValue: '正常',
    sort: items.value.length + 1,
  }
  items.value.push(newItem)
  selectedKey.value = key
  handleSelect(newItem)
}

function saveItem() {
  const item = selectedItem.value
  if (!item) return
  if (!editingNode.title?.trim()) return
  item.title = editingNode.title.trim()
  item.required = editingNode.required
  item.rule = editingNode.rule?.trim() ?? ''
  item.defaultValue = editingNode.defaultValue
  item.sort = editingNode.sort ?? 1
}

function removeItem() {
  const key = selectedKey.value
  if (!key) return
  const idx = items.value.findIndex((it) => it.key === key)
  if (idx !== -1) items.value.splice(idx, 1)
  selectedKey.value = items.value[0]?.key ?? null
  if (selectedKey.value) {
    const next = items.value.find((it) => it.key === selectedKey.value)
    handleSelect(next)
  }
}

function handleCancel() {
  emit('update:open', false)
}

function handleOk() {
  const out = items.value.map((it) => ({
    key: it.key,
    id: it.id,
    title: it.title,
    name: it.title,
    required: it.required,
    rule: it.rule,
    defaultValue: DEFAULT_VALUE_ENUM[it.defaultValue] ?? it.defaultValue ?? 'NORMAL',
    sort: it.sort,
    type: 'radio',
  }))
  emit('update:modelValue', out)
  emit('update:open', false)
}
</script>

<template>
  <a-modal
    :open="open"
    title="配置巡检项"
    width="800px"
    :body-style="{ maxHeight: '70vh', overflowY: 'auto' }"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-row :gutter="16">
      <a-col :span="8">
        <div style="margin-bottom: 8px">
          <a-button type="primary" size="small" @click="addItem">
            <PlusOutlined />
            新增巡检项
          </a-button>
        </div>
        <a-list
          :data-source="items"
          size="small"
          :locale="{ emptyText: '暂无巡检项，请点击上方按钮新增' }"
        >
          <template #renderItem="{ item }">
            <a-list-item
              class="item-list-row"
              :class="{ active: selectedKey === item.key }"
              @click="handleSelect(item)"
            >
              <span class="item-list-title">{{ item.title || '未命名巡检项' }}</span>
            </a-list-item>
          </template>
        </a-list>
      </a-col>
      <a-col :span="16">
        <template v-if="selectedItem">
          <a-form layout="vertical" style="max-width: 480px">
            <a-form-item label="巡检项名称" required>
              <a-input v-model:value="editingNode.title" placeholder="如：设备外观是否完好" />
            </a-form-item>
            <a-form-item label="是否必填">
              <a-switch
                v-model:checked="editingNode.required"
                checked-children="是"
                un-checked-children="否"
              />
            </a-form-item>
            <a-form-item label="默认结果">
              <a-radio-group v-model:value="editingNode.defaultValue">
                <a-radio v-for="opt in FIXED_OPTIONS" :key="opt" :value="opt">{{ opt }}</a-radio>
              </a-radio-group>
              <div class="field-tip">可选结果固定为：正常 / 异常</div>
            </a-form-item>
            <a-form-item label="判定规则">
              <a-textarea
                v-model:value="editingNode.rule"
                :rows="3"
                placeholder="如：异常需填写说明并拍照留存"
              />
            </a-form-item>
            <a-form-item label="排序">
              <a-input-number v-model:value="editingNode.sort" :min="1" style="width: 120px" />
            </a-form-item>
            <a-space>
              <a-button type="primary" @click="saveItem">保存</a-button>
              <a-popconfirm
                title="确认删除当前巡检项？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="removeItem"
              >
                <a-button danger>
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </a-form>
        </template>
        <template v-else>
          <div style="padding: 24px 0; color: #999">
            请选择左侧的巡检项以进行编辑，或点击「新增巡检项」添加。
          </div>
        </template>
      </a-col>
    </a-row>
  </a-modal>
</template>

<style scoped>
.item-list-row {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
}
.item-list-row:hover {
  background: #f5f5f5;
}
.item-list-row.active {
  background: #e6f4ff;
  color: #1677ff;
}
.item-list-title {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #86909c;
}
</style>
