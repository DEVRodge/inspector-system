<script setup>
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { exceptionRows, orgRows } from '../../mock/data'

const rows = ref([...exceptionRows])
const detailVisible = ref(false)
const currentRow = ref(null)

const assignVisible = ref(false)
const assignTarget = ref(null)
const assignHandler = ref('')

const assignOptions = computed(() =>
  orgRows.map((r) => ({ value: r.name, label: `${r.name}（${r.dept}）` })),
)

function openDetail(record) {
  currentRow.value = record
  detailVisible.value = true
}

function handleProcess(record) {
  message.success(`异常 ${record.code} 的处理流程入口已打开（前端演示）`)
}

function openAssign(record) {
  assignTarget.value = record
  assignHandler.value = record.handler || ''
  assignVisible.value = true
}

function closeAssign() {
  assignVisible.value = false
  assignTarget.value = null
  assignHandler.value = ''
}

function confirmAssign() {
  if (!assignHandler.value?.trim()) {
    message.warning('请选择执行人')
    return
  }
  const target = assignTarget.value
  if (!target) return
  const index = rows.value.findIndex((r) => r.key === target.key)
  if (index === -1) return
  rows.value[index] = {
    ...rows.value[index],
    handler: assignHandler.value,
    status: '处理中',
  }
  message.success('指派成功')
  closeAssign()
}
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
          <a-input placeholder="异常编号 / 设备编码" allow-clear />
          <a-select placeholder="处理状态" allow-clear style="width: 160px" />
          <a-range-picker style="width: 280px" />
        </div>
      </div>

      <a-table :data-source="rows" row-key="key">
        <a-table-column title="异常编号" data-index="code" key="code" width="140" />
        <a-table-column title="设备编码" data-index="device" key="device" width="120" />
        <a-table-column title="异常描述" data-index="desc" key="desc" />
        <a-table-column title="处理人" data-index="handler" key="handler" width="110" />
        <a-table-column title="截止时间" data-index="deadline" key="deadline" width="160" />
        <a-table-column title="状态" data-index="status" key="status" width="110" />
        <a-table-column title="操作" key="action" width="200">
          <template #default="{ record }">
            <a-space :size="4">
              <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
              <a-button v-if="record.status === '待处理'" type="link" size="small" @click="openAssign(record)">指派</a-button>
              <a-button type="link" size="small" @click="handleProcess(record)">处理</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailVisible" title="异常详情" width="520">
      <a-descriptions v-if="currentRow" :column="1" bordered size="small" class="drawer-section">
        <a-descriptions-item label="异常编号">{{ currentRow.code }}</a-descriptions-item>
        <a-descriptions-item label="设备编码">{{ currentRow.device }}</a-descriptions-item>
        <a-descriptions-item label="异常描述">{{ currentRow.desc }}</a-descriptions-item>
        <a-descriptions-item label="处理人">{{ currentRow.handler }}</a-descriptions-item>
        <a-descriptions-item label="截止时间">{{ currentRow.deadline }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentRow.status }}</a-descriptions-item>
      </a-descriptions>

      <div class="drawer-section">
        <div class="drawer-section__title">处理与附件</div>
        <div class="detail-list">
          <div class="detail-list__item">
            <strong>处理说明</strong>
            支持填写整改结果、上传处理前后照片，并在处理完成后执行闭环确认。
          </div>
          <div class="detail-list__item">
            <strong>附件预览</strong>
            当前静态版预留为详情区域，正式接接口后可替换为图片预览或附件列表组件。
          </div>
        </div>
      </div>
    </a-drawer>

    <a-modal
      v-model:open="assignVisible"
      title="指派异常工单"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmAssign"
      @cancel="closeAssign"
    >
      <template v-if="assignTarget">
        <a-form layout="vertical">
          <a-form-item label="异常编号">
            <a-input :value="assignTarget.code" disabled />
          </a-form-item>
          <a-form-item label="异常描述">
            <a-input :value="assignTarget.desc" disabled />
          </a-form-item>
          <a-form-item label="执行人" required>
            <a-select
              v-model:value="assignHandler"
              placeholder="请选择执行人"
              :options="assignOptions"
              style="width: 100%"
            />
          </a-form-item>
        </a-form>
      </template>
    </a-modal>
  </div>
</template>
