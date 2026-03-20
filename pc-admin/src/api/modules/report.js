import { request } from '../http'

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * 高风险设备：正式结构为 highRiskDevices（InspectionReportHighRiskDeviceRowVO[]）。
 * 兼容后端仍返回旧字段 riskDevices（ReportRiskDeviceVO[]）。
 */
function normalizeHighRiskDevicesList(inner) {
  const fromNew = Array.isArray(inner?.highRiskDevices) ? inner.highRiskDevices : []
  if (fromNew.length) {
    return fromNew.map((item, index) => ({
      key: String(item?.deviceId ?? item?.deviceCodeOrName ?? `device-${index}`),
      deviceId: item?.deviceId != null ? String(item.deviceId) : '',
      deviceCodeOrName: item?.deviceCodeOrName ?? '-',
      inspectionOccurrenceCount: toNumber(item?.inspectionOccurrenceCount),
      exceptionOccurrenceCount: toNumber(item?.exceptionOccurrenceCount),
      slotCompletionRatePercent: toNumber(item?.slotCompletionRatePercent),
      latestExceptionIssueSummary: item?.latestExceptionIssueSummary ?? '-',
    }))
  }
  const legacy = Array.isArray(inner?.riskDevices) ? inner.riskDevices : []
  return legacy.map((item, index) => {
    const key = item?.key != null ? String(item.key) : String(item?.device ?? `legacy-device-${index}`)
    return {
      key,
      deviceId: item?.key != null ? String(item.key) : '',
      deviceCodeOrName: item?.device ?? '-',
      inspectionOccurrenceCount: toNumber(item?.inspections),
      exceptionOccurrenceCount: toNumber(item?.exceptions),
      slotCompletionRatePercent: toNumber(item?.completionRate),
      latestExceptionIssueSummary: item?.latestIssue ?? '-',
    }
  })
}

function normalizeReport(data = {}, period = 'month') {
  const inner = data?.data ?? data
  const overview = inner?.overview ?? {}
  const trendSeries = Array.isArray(inner?.trendSeries) ? inner.trendSeries : []
  const staffWorkload = Array.isArray(inner?.staffWorkload) ? inner.staffWorkload : []
  const exceptionStatusDistribution = Array.isArray(inner?.exceptionStatusDistribution)
    ? inner.exceptionStatusDistribution
    : []

  return {
    period: inner?.period ?? period,
    periodTitle: inner?.periodTitle ?? '',
    statisticsRangeDescription: inner?.statisticsRangeDescription ?? '',
    statisticsRangeStart: inner?.statisticsRangeStart ?? '',
    statisticsRangeEndExclusive: inner?.statisticsRangeEndExclusive ?? '',
    overview: {
      inspectionCompletionRatePercent: toNumber(overview?.inspectionCompletionRatePercent),
      inspectionCompletionRateCompareNote: overview?.inspectionCompletionRateCompareNote ?? '',
      newExceptionCount: toNumber(overview?.newExceptionCount),
      newExceptionCountDeltaVsPreviousPeriod: toNumber(overview?.newExceptionCountDeltaVsPreviousPeriod),
      newExceptionCountCompareNote: overview?.newExceptionCountCompareNote ?? '',
    },
    trendSeries: trendSeries.map((item) => ({
      axisLabel: item?.axisLabel ?? '',
      inspectionCompletionRatePercent: toNumber(item?.inspectionCompletionRatePercent),
      newExceptionCount: toNumber(item?.newExceptionCount),
    })),
    staffWorkload: staffWorkload.map((item, index) => ({
      key: String(item?.operatorUserId ?? item?.operatorDisplayName ?? `staff-${index}`),
      operatorUserId: item?.operatorUserId != null ? String(item.operatorUserId) : '',
      operatorDisplayName: item?.operatorDisplayName ?? '-',
      assignedTaskCount: toNumber(item?.assignedTaskCount),
      coveredDeviceSlotCount: toNumber(item?.coveredDeviceSlotCount),
      relatedExceptionCount: toNumber(item?.relatedExceptionCount),
      taskCompletionRatePercent: toNumber(item?.taskCompletionRatePercent),
    })),
    exceptionStatusDistribution: exceptionStatusDistribution.map((item, index) => ({
      key: String(item?.statusCode ?? item?.statusDisplayName ?? `status-${index}`),
      statusCode: item?.statusCode ?? '',
      statusDisplayName: item?.statusDisplayName ?? '-',
      count: toNumber(item?.count),
      chartColorHex: item?.chartColorHex ?? '',
    })),
    highRiskDevices: normalizeHighRiskDevicesList(inner),
  }
}

export function getReportData(params = {}) {
  const period = params?.period ?? 'month'
  return request({
    url: '/inspection/report',
    method: 'get',
    params: { period },
  }).then((data) => normalizeReport(data, period))
}
