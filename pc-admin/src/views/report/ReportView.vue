<script setup>
import { message } from 'ant-design-vue'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import dayjs from 'dayjs'
import { getReportData } from '../../api/modules/report'

const BaseChart = defineAsyncComponent(() => import('../../components/charts/BaseChart.vue'))

const loading = ref(false)
const activePeriod = ref('month')
const reportContentRef = ref(null)
const periods = [
  { label: '近 7 天', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年', value: 'year' },
]

const report = ref({
  period: 'month',
  periodTitle: '',
  statisticsRangeDescription: '',
  statisticsRangeStart: '',
  statisticsRangeEndExclusive: '',
  overview: {
    inspectionCompletionRatePercent: 0,
    inspectionCompletionRateCompareNote: '',
    newExceptionCount: 0,
    newExceptionCountDeltaVsPreviousPeriod: 0,
    newExceptionCountCompareNote: '',
  },
  trendSeries: [],
  staffWorkload: [],
  exceptionStatusDistribution: [],
  highRiskDevices: [],
})

const riskDeviceColumns = [
  { title: '设备', dataIndex: 'deviceCodeOrName', key: 'deviceCodeOrName' },
  { title: '巡检次数', dataIndex: 'inspectionOccurrenceCount', key: 'inspectionOccurrenceCount', width: 120 },
  { title: '异常次数', dataIndex: 'exceptionOccurrenceCount', key: 'exceptionOccurrenceCount', width: 120 },
  { title: '完成率', dataIndex: 'slotCompletionRatePercent', key: 'slotCompletionRatePercent', width: 110 },
  { title: '最近问题', dataIndex: 'latestExceptionIssueSummary', key: 'latestExceptionIssueSummary' },
]

function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0%'
  return `${n.toFixed(1)}%`
}

const statCards = computed(() => [
  {
    key: 'inspectionCompletionRatePercent',
    title: '巡检完成率',
    value: Number(report.value.overview.inspectionCompletionRatePercent ?? 0).toFixed(1),
    suffix: '%',
    compareNote: report.value.overview.inspectionCompletionRateCompareNote || '-',
  },
  {
    key: 'newExceptionCount',
    title: '新建异常数量',
    value: report.value.overview.newExceptionCount ?? 0,
    suffix: '条',
    compareNote: report.value.overview.newExceptionCountCompareNote || '-',
  },
])

const trendChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0 },
  grid: { left: 48, right: 24, top: 48, bottom: 32 },
  xAxis: { type: 'category', data: report.value.trendSeries.map((item) => item.axisLabel) },
  yAxis: [
    { type: 'value', name: '百分比', min: 0, max: 100 },
    { type: 'value', name: '异常数' },
  ],
  series: [
    {
      name: '巡检完成率',
      type: 'line',
      smooth: true,
      data: report.value.trendSeries.map((item) => item.inspectionCompletionRatePercent),
      itemStyle: { color: '#1677ff' },
      areaStyle: { color: 'rgba(22, 119, 255, 0.12)' },
    },
    {
      name: '异常数量',
      type: 'bar',
      yAxisIndex: 1,
      barMaxWidth: 36,
      data: report.value.trendSeries.map((item) => item.newExceptionCount),
      itemStyle: { color: '#faad14' },
    },
  ],
}))

const personWorkloadChartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 72, right: 24, top: 24, bottom: 16 },
  xAxis: { type: 'value' },
  yAxis: {
    type: 'category',
    data: report.value.staffWorkload.map((item) => item.operatorDisplayName),
  },
  series: [
    {
      name: '任务量',
      type: 'bar',
      data: report.value.staffWorkload.map((item) => item.assignedTaskCount),
      itemStyle: { color: '#1677ff', borderRadius: [0, 8, 8, 0] },
      label: { show: true, position: 'right' },
    },
  ],
}))

const exceptionDistributionOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle' },
  series: [
    {
      type: 'pie',
      radius: ['48%', '74%'],
      label: { formatter: '{b}\n{c}条' },
      data: report.value.exceptionStatusDistribution.map((item) => ({
        value: item.count,
        name: item.statusDisplayName,
        itemStyle: { color: item.chartColorHex || undefined },
      })),
    },
  ],
}))

const periodTitleMap = {
  week: '周度统计报表',
  month: '月度统计报表',
  quarter: '季度统计报表',
  year: '年度统计报表',
}

/** 用 Canvas 绘制中文标题，避免 jsPDF 默认字体不支持中文乱码 */
function drawTitleImage(reportTitle, exportTime, widthMm = 210) {
  const dpr = 2
  const widthPx = Math.round((widthMm * 96) / 25.4) * dpr
  const heightPx = 80 * dpr
  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, widthPx, heightPx)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${24 * dpr}px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif`
  ctx.fillText(reportTitle, widthPx / 2, 28 * dpr)
  ctx.fillStyle = '#666'
  ctx.font = `${14 * dpr}px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif`
  ctx.fillText(`导出时间：${exportTime}`, widthPx / 2, 52 * dpr)
  return canvas.toDataURL('image/png')
}

async function handleExport() {
  if (!reportContentRef.value) {
    message.warning('报表内容未就绪')
    return
  }
  try {
    message.loading({ content: '正在生成 PDF...', key: 'pdf', duration: 0 })
    const canvas = await html2canvas(reportContentRef.value, {
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    const topMargin = 10
    const titleHeightMm = 30
    const gap = 8
    const bottomMargin = 10
    const contentHeightMm = pageH - topMargin - titleHeightMm - gap - bottomMargin
    const contentWidthMm = pageW

    const reportTitle = periodTitleMap[activePeriod.value] || '统计报表'
    const exportTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const titleDataUrl = drawTitleImage(reportTitle, exportTime, pageW)
    pdf.addImage(titleDataUrl, 'PNG', 0, topMargin, pageW, titleHeightMm)

    const contentScaledHeight = (canvas.height / canvas.width) * contentWidthMm
    const scale = contentScaledHeight > contentHeightMm ? contentHeightMm / contentScaledHeight : 1
    const drawW = contentWidthMm * scale
    const drawH = contentScaledHeight * scale
    const contentY = topMargin + titleHeightMm + gap
    pdf.addImage(imgData, 'JPEG', 0, contentY, drawW, drawH)

    const name = `统计报表_${dayjs().format('YYYY-MM-DD')}.pdf`
    pdf.save(name)
    message.success({ content: '报表已导出', key: 'pdf' })
  } catch (e) {
    message.error({ content: '导出失败，请重试', key: 'pdf' })
  }
}

async function loadReport() {
  loading.value = true
  try {
    report.value = await getReportData({ period: activePeriod.value })
  } catch (error) {
    message.error('报表数据加载失败，请稍后重试。')
  } finally {
    loading.value = false
  }
}

watch(activePeriod, () => {
  loadReport()
})

onMounted(() => {
  loadReport()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>统计报表</h2>
        <p>聚焦 P0 指标，展示完成率、异常数量及人员工作量趋势。</p>
      </div>
      <a-space>
        <a-radio-group v-model:value="activePeriod" button-style="solid">
          <a-radio-button v-for="item in periods" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-radio-button>
        </a-radio-group>
        <a-button type="primary" @click="handleExport">导出报表</a-button>
      </a-space>
    </div>

    <a-spin :spinning="loading">
      <div ref="reportContentRef" class="report-content">
        <div class="report-stats-grid page-section">
          <a-card v-for="item in statCards" :key="item.key" :bordered="false" class="metric-card">
            <a-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
            <div class="metric-card__footer">{{ item.compareNote }}</div>
          </a-card>
        </div>

        <div class="report-charts-grid page-section">
          <a-card title="完成率与异常数量趋势" :bordered="false">
            <BaseChart :option="trendChartOption" height="280px" />
          </a-card>
          <a-card title="异常状态统计" :bordered="false">
            <BaseChart :option="exceptionDistributionOption" height="280px" />
          </a-card>
          <a-card title="人员工作量对比" :bordered="false">
            <BaseChart :option="personWorkloadChartOption" height="280px" />
          </a-card>
          <a-card title="统计摘要" :bordered="false">
            <div class="detail-list">
              <div v-for="item in report.staffWorkload" :key="item.key" class="detail-list__item">
                <strong>{{ item.operatorDisplayName }}</strong>
                <div>任务量 {{ item.assignedTaskCount }} 项，覆盖设备 {{ item.coveredDeviceSlotCount }} 台。</div>
                <div class="subtle-text">
                  异常 {{ item.relatedExceptionCount }} 条，完成率 {{ formatPercent(item.taskCompletionRatePercent) }}
                </div>
              </div>
            </div>
          </a-card>
        </div>

        <a-card title="高风险设备趋势" :bordered="false" class="page-section">
          <a-table
            :data-source="report.highRiskDevices"
            :columns="riskDeviceColumns"
            :pagination="false"
            row-key="key"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'slotCompletionRatePercent'">
                {{ formatPercent(record.slotCompletionRatePercent) }}
              </template>
            </template>
          </a-table>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.report-content {
  background: #fff;
  padding: 4px 0;
  max-width: 1200px;
  margin: 0 auto;
}

.report-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.report-charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.metric-card__footer {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.subtle-text {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
