<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getDictionaryList } from '../../api/modules/dictionary'
import { DEVICE_TYPE_DICT_CODE, dictionaryRows as mockDeviceTypes } from '../../mock/modules/settings'
import { useTemplateStore } from '../../stores/template'
import { isMockEnabled } from '../../api/http'

const route = useRoute()
const router = useRouter()
const templateStore = useTemplateStore()

const isEdit = computed(() => Boolean(route.params.id))
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

const formState = reactive({
  name: '',
  deviceType: '',
  description: '',
  version: 'V1.0',
  status: '草稿',
})

function fillForm(record) {
  if (record) {
    Object.assign(formState, {
      name: record.name,
      deviceType: record.deviceType,
      description: record.description ?? '',
      version: record.version ?? 'V1.0',
      status: record.status ?? '草稿',
    })
  } else {
    Object.assign(formState, {
      name: '',
      deviceType: '',
      description: '',
      version: 'V1.0',
      status: '草稿',
    })
  }
}

onMounted(async () => {
  await loadDeviceTypes()
  if (isEdit.value && route.params.id) {
    const record = templateStore.getById(route.params.id)
    if (record) fillForm(record)
    else message.warning('模板不存在')
  } else {
    fillForm(null)
  }
})

function goBack() {
  router.push('/templates')
}

function submit() {
  if (!formState.name?.trim()) {
    message.warning('请填写模板名称')
    return
  }
  if (!formState.deviceType) {
    message.warning('请选择适用设备类型')
    return
  }

  const basicPayload = {
    name: formState.name.trim(),
    deviceType: formState.deviceType,
    description: formState.description?.trim() ?? '',
    version: formState.version ?? 'V1.0',
    status: formState.status ?? '草稿',
  }

  if (isEdit.value && route.params.id) {
    const record = templateStore.getById(route.params.id)
    if (!record) {
      message.warning('模板不存在')
      return
    }
    const other = templateStore.list.find(
      (t) => t.key !== route.params.id && t.deviceType === formState.deviceType,
    )
    if (other) {
      message.warning('该设备类型已有关联模板，一种设备类型仅能关联一个模板')
      return
    }
    templateStore.update(route.params.id, {
      ...basicPayload,
      items: record.items ?? [],
    })
    message.success('模板已更新')
  } else {
    if (templateStore.list.some((t) => t.deviceType === formState.deviceType)) {
      message.warning('该设备类型已有关联模板，一种设备类型仅能关联一个模板')
      return
    }
    templateStore.create({
      ...basicPayload,
      items: [],
    })
    message.success('模板已新增')
  }
  router.push('/templates')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <a class="back-link" @click="goBack">返回巡检模板</a>
        <h2>{{ isEdit ? '编辑模板' : '新增模板' }}</h2>
      </div>
    </div>

    <a-card :bordered="false">
      <a-form layout="vertical">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="formState.name" placeholder="如：逆变器巡检模板" />
        </a-form-item>
        <a-form-item label="适用设备类型" required>
          <a-select
            v-model:value="formState.deviceType"
            placeholder="选择设备类型，一种类型仅能关联一个模板"
            :disabled="isEdit"
            style="width: 100%"
            :options="deviceTypeOptions"
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
          <a-select v-model:value="formState.status" style="width: 100%">
            <a-select-option value="启用中">启用中</a-select-option>
            <a-select-option value="草稿">草稿</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>

      <div class="form-actions">
        <a-space>
          <a-button @click="goBack">取消</a-button>
          <a-button type="primary" @click="submit">保存</a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 8px;
  color: #86909c;
  font-size: 14px;
  cursor: pointer;
}
.back-link:hover {
  color: #1677ff;
}

.form-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e6eb;
}
</style>
