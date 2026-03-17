<script setup>
import { message } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardData } from '../../api/modules/dashboard'
import brandLogo from '../../assets/logo.png'

const loading = ref(false)
const dashboard = ref({
  overviewCards: [],
  completionSummary: {},
  taskDistribution: [],
  deviceStatusDistribution: [],
  personLoads: [],
  todoList: [],
  exceptionList: [],
  taskList: [],
  notices: [],
})

const taskColumns = [
  { title: '任务名称', dataIndex: 'plan', key: 'plan' },
  { title: '任务类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '责任部门', dataIndex: 'team', key: 'team', width: 120 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '设备数', dataIndex: 'devices', key: 'devices', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
]

const completionPercent = computed(() => {
  const plannedTasks = dashboard.value.completionSummary.plannedTasks || 0
  const completedTasks = dashboard.value.completionSummary.completedTasks || 0

  if (!plannedTasks) {
    return 0
  }

  return Number(((completedTasks / plannedTasks) * 100).toFixed(1))
})

function getTagColor(status) {
  const statusColorMap = {
    已完成: 'success',
    执行中: 'processing',
    待执行: 'warning',
    已逾期: 'error',
    处理中: 'processing',
    待处理: 'warning',
    已处理: 'success',
  }

  return statusColorMap[status] || 'default'
}

const router = useRouter()

function handleCreateTask() {
  router.push({ name: 'taskNew' })
}

async function loadDashboard() {
  loading.value = true

  try {
    dashboard.value = await getDashboardData()
  } catch (error) {
    message.error('首页数据加载失败，请稍后重试。')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div>
    <a-card :bordered="false" class="dashboard-hero page-section">
      <div class="dashboard-hero__content">
        <div class="dashboard-hero__brand">
          <div class="dashboard-hero__logo-wrap">
            <img :src="brandLogo" alt="Gokin Logo" class="dashboard-hero__logo" />
          </div>
          <div class="dashboard-hero__meta">
            <div class="dashboard-hero__eyebrow">GOKIN SOLAR · PC 管理端</div>
            <h2>设备巡检数字化工作台</h2>
            <p>聚焦设备资产、任务执行、异常闭环和待办协同，为企业运维管理提供统一入口。</p>
          </div>
        </div>

        <div class="dashboard-hero__actions">
          <a-button type="primary" @click="handleCreateTask">新建临时任务</a-button>
        </div>
      </div>
    </a-card>

    <a-spin :spinning="loading">
      <div class="stats-grid page-section">
        <a-card v-for="item in dashboard.overviewCards" :key="item.key" class="metric-card" :bordered="false">
          <a-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
          <div class="metric-card__footer">{{ item.trend }}</div>
        </a-card>
      </div>

      <div class="panel-grid page-section">
        <a-card title="今日任务执行" :bordered="false">
          <div class="summary-grid">
            <div class="summary-grid__item">
              <span>已完成任务</span>
              <strong>{{ dashboard.completionSummary.completedTasks || 0 }}</strong>
            </div>
            <div class="summary-grid__item">
              <span>应执行任务</span>
              <strong>{{ dashboard.completionSummary.plannedTasks || 0 }}</strong>
            </div>
            <div class="summary-grid__item">
              <span>待处理异常</span>
              <strong>{{ dashboard.completionSummary.pendingExceptions || 0 }}</strong>
            </div>
            <div class="summary-grid__item">
              <span>整改及时率</span>
              <strong>{{ dashboard.completionSummary.closedLoopRate || 0 }}%</strong>
            </div>
          </div>
          <div style="margin-top: 16px">
            <div class="subtle-label">总体完成进度</div>
            <a-progress :percent="completionPercent" status="active" />
            <div class="subtle-text">
              逾期任务 {{ dashboard.completionSummary.overdueTasks || 0 }} 项，建议优先调度部门复核。
            </div>
          </div>
        </a-card>

        <a-card title="异常设备" :bordered="false">
          <div class="detail-list">
            <div v-for="item in dashboard.exceptionList.slice(0, 3)" :key="item.code" class="detail-list__item">
              <strong>#{{ item.code }} · {{ item.device }}</strong>
              <div>{{ item.desc }}</div>
              <div class="subtle-text">处理人：{{ item.handler || '未指派' }}</div>
              <div style="margin-top: 8px">
                <a-tag :color="getTagColor(item.status)">{{ item.status }}</a-tag>
              </div>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 今日待办 & 今日任务明细区块已按需求移除 -->

    </a-spin>
  </div>
</template>
