/** 设备类型与模板一一对应，一种设备类型关联一种模板 */
export const DEVICE_TYPES = ['逆变器', '汇流箱', '箱变', '配电柜', '其他设备']

/** 巡检项仅支持正常/异常二选一 */
export const INSPECTION_ITEM_TYPES = [{ value: 'radio', label: '正常/异常' }]

export const templateRows = [
  {
    key: '1',
    name: '逆变器巡检模板',
    deviceType: 'INVERTER',
    description:
      '逆变器巡检需重点关注运行温度、油位、渗漏及异响。巡检前确认设备处于可操作状态，遇异常立即记录并拍照留存。高温季节需加强温度监测频次。',
    version: 'V1.2',
    status: 'ENABLED',
    items: [
      { key: 'i1', name: '设备外观', type: 'radio', required: true, rule: '异常需填写说明', defaultValue: 'NORMAL' },
      { key: 'i2', name: '油位状态', type: 'radio', required: true, rule: '低于阈值判定异常', defaultValue: 'NORMAL' },
      { key: 'i3', name: '渗漏油情况', type: 'radio', required: true, rule: '发现渗漏需拍照并说明位置', defaultValue: 'NORMAL' },
    ],
  },
  {
    key: '2',
    name: '汇流箱巡检模板',
    deviceType: 'COMBINER',
    description:
      '汇流箱巡检重点检查接线端子、保险状态及箱体密封。雨季前后需加强密封性检查，发现进水痕迹及时上报。',
    version: 'V1.0',
    status: 'ENABLED',
    items: [
      { key: 'i1', name: '接线端子', type: 'radio', required: true, rule: '松动、变色判定异常', defaultValue: 'NORMAL' },
      { key: 'i2', name: '保险状态', type: 'radio', required: true, rule: '熔断、接触不良判定异常', defaultValue: 'NORMAL' },
      { key: 'i3', name: '箱体密封', type: 'radio', required: true, rule: '密封条老化、破损需记录', defaultValue: 'NORMAL' },
    ],
  },
  {
    key: '4',
    name: '配电箱巡检模板',
    deviceType: 'DISTRIBUTION_BOX',
    description: '配电箱标准巡检，检查接线、开关状态及箱体密封。',
    version: 'V1.0',
    status: 'ENABLED',
    items: [
      { key: 'i1', name: '接线端子', type: 'radio', required: true, rule: '松动、变色判定异常', defaultValue: 'NORMAL' },
      { key: 'i2', name: '开关状态', type: 'radio', required: true, rule: '异常需记录', defaultValue: 'NORMAL' },
    ],
  },
  {
    key: '3',
    name: '箱变巡检模板',
    deviceType: 'TRANSFORMER',
    description:
      '箱变巡检涉及高压侧，需持证操作。重点检查油位、温度、声响及接地。油浸式箱变温度超过 75℃ 需重点关注。',
    version: 'V0.9',
    status: 'DRAFT',
    items: [
      { key: 'i1', name: '油位状态', type: 'radio', required: true, rule: '低于油位线判定异常', defaultValue: 'NORMAL' },
      { key: 'i2', name: '异响异味', type: 'radio', required: true, rule: '发现异响需描述位置和特征', defaultValue: 'NORMAL' },
      { key: 'i3', name: '接地情况', type: 'radio', required: true, rule: '接地不良需立即处理', defaultValue: 'NORMAL' },
    ],
  },
]
