<script setup>
import { message } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardData } from '../../api/modules/dashboard'
import brandLogo from '../../assets/logo.png'

const loading = ref(false)
const stats = ref({
  totalDevices: 0,
  devicesAddedThisMonth: 0,
  todayTaskTotal: 0,
  todayTaskCompleted: 0,
  todayCompletionRate: 0,
  monthTaskTotal: 0,
  monthTaskCompleted: 0,
  monthCompletionRate: 0,
  pendingExceptionCount: 0,
  unassignedExceptionCount: 0,
})

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeRate(value) {
  const n = toNumber(value)
  // 文档定义为 0-100；兼容后端偶发返回 0-1 的场景
  if (n > 0 && n <= 1) return n * 100
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

function normalizeDashboardStats(res) {
  const raw = res?.data ?? res ?? {}
  return {
    totalDevices: toNumber(raw.totalDevices),
    devicesAddedThisMonth: toNumber(raw.devicesAddedThisMonth),
    todayTaskTotal: toNumber(raw.todayTaskTotal),
    todayTaskCompleted: toNumber(raw.todayTaskCompleted),
    todayCompletionRate: normalizeRate(raw.todayCompletionRate),
    monthTaskTotal: toNumber(raw.monthTaskTotal),
    monthTaskCompleted: toNumber(raw.monthTaskCompleted),
    monthCompletionRate: normalizeRate(raw.monthCompletionRate),
    pendingExceptionCount: toNumber(raw.pendingExceptionCount),
    unassignedExceptionCount: toNumber(raw.unassignedExceptionCount),
  }
}

const overviewCards = computed(() => [
  {
    key: 'totalDevices',
    title: '设备总数',
    value: stats.value.totalDevices,
    suffix: '台',
    trend: `本月新增 ${stats.value.devicesAddedThisMonth} 台`,
  },
  {
    key: 'todayTaskTotal',
    title: '今日应执行任务',
    value: stats.value.todayTaskTotal,
    suffix: '项',
    trend: `已完成 ${stats.value.todayTaskCompleted} 项`,
  },
  {
    key: 'pendingExceptionCount',
    title: '待处理异常',
    value: stats.value.pendingExceptionCount,
    suffix: '条',
    trend: `待指派 ${stats.value.unassignedExceptionCount} 条`,
  },
  {
    key: 'monthCompletionRate',
    title: '本月完成率',
    value: Number(stats.value.monthCompletionRate.toFixed(1)),
    suffix: '%',
    trend: `本月已完成 ${stats.value.monthTaskCompleted} / ${stats.value.monthTaskTotal}`,
  },
])

const todayCompletionPercent = computed(() =>
  Number(stats.value.todayCompletionRate.toFixed(1)),
)

const monthCompletionPercent = computed(() =>
  Number(stats.value.monthCompletionRate.toFixed(1)),
)

const router = useRouter()

function handleCreateTask() {
  router.push({ name: 'taskNew' })
}

async function loadDashboard() {
  loading.value = true
  try {
    const data = await getDashboardData()
    stats.value = normalizeDashboardStats(data)
  } catch (error) {
    message.error('工作台数据加载失败，请稍后重试。')
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
            <p>工作台数据严格对齐接口：设备、任务完成率与异常统计均来自真实接口。</p>
          </div>
        </div>

        <div class="dashboard-hero__actions">
          <a-button type="primary" @click="handleCreateTask">新建临时任务</a-button>
        </div>
      </div>
    </a-card>

    <a-spin :spinning="loading">
      <div class="stats-grid page-section">
        <a-card v-for="item in overviewCards" :key="item.key" class="metric-card" :bordered="false">
          <a-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
        </a-card>
      </div>

      <div class="panel-grid page-section">
        <a-card title="今日任务执行" :bordered="false">
          <div class="summary-grid">
            <div class="summary-grid__item">
              <span>今日应执行任务</span>
              <strong>{{ stats.todayTaskTotal }}</strong>
            </div>
            <div class="summary-grid__item">
              <span>今日已完成任务</span>
              <strong>{{ stats.todayTaskCompleted }}</strong>
            </div>
            <div class="summary-grid__item">
              <span>今日完成率</span>
              <strong>{{ todayCompletionPercent }}%</strong>
            </div>
          </div>
          <div style="margin-top: 16px">
            <a-progress :percent="todayCompletionPercent" status="active" />
          </div>
        </a-card>

        <a-card title="本月任务与异常" :bordered="false">
          <div class="summary-grid">
            <div class="summary-grid__item">
              <span>本月应执行任务</span>
              <strong>{{ stats.monthTaskTotal }}</strong>
            </div>
            <div class="summary-grid__item">
              <span>本月已完成任务</span>
              <strong>{{ stats.monthTaskCompleted }}</strong>
            </div>
            <div class="summary-grid__item">
              <span>待处理异常 / 待指派</span>
              <strong>{{ stats.pendingExceptionCount }} / {{ stats.unassignedExceptionCount }}</strong>
            </div>
          </div>
          <div style="margin-top: 16px">
            <a-progress :percent="monthCompletionPercent" status="active" />
          </div>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>
