# 前端对接巡检与设备接口 - 对接结果报告

**对接时间**：2026-03-17

---

## 一、已对接模块

| 模块 | 接口前缀 | 对接状态 | 说明 |
|------|----------|----------|------|
| 设备台账 | `/device/*` | 已对接 | 列表分页、CRUD、导入、导出 |
| 巡检模板 | `/inspection/template/*` | 已对接 | 分页、详情、新增、更新、删除、巡检项 |
| 计划任务 | `/inspection/task/*` | 已对接 | 分页、详情、新增、更新、删除 |
| 巡检记录 | `/inspection/record/*` | 已对接 | 分页、详情、设备维度 |
| 消息中心 | `/msg-record/*` | 已对接 | 未读数、列表、一键已读、批量已读 |
| 异常管理 | `/inspection/exception/*` | 已对接 | 分页、详情、指派、处理 |
| 文件上传与预览 | `/file/*` | 已对接 | 上传、预览 URL 构建 |
| 异常指派 | `/users/assignable-tree` | 待对接 | 可指派人员树（部门-岗位-人员），Mock 已实现 |

---

## 二、接口与字段映射

### 2.1 设备 (Device)

**Apifox DeviceVO / DeviceModifyParam 对齐**：type 为字典 value（枚举），status 为 RUNNING | MAINTENANCE | STOPPED。

| 前端展示/表单 | 后端字段 | 说明 |
|---------------|----------|------|
| key | id | 主键，前端 row-key 使用 key |
| code | code | 设备编码 |
| typeName / getDeviceTypeLabel(type) | type, typeName | 设备类型，提交枚举值，展示用 typeName |
| name | name | 设备名称 |
| model | model | 型号 |
| voltage | voltage | 电压等级 |
| location | location | 安装地点 |
| organizationName / team | organizationId, organizationName | 责任部门，提交 organizationId |
| commissionDate / date | commissionDate | 投运日期 |
| statusDesc / getDeviceStatusLabel(status) | status, statusDesc | 运行状态，枚举 RUNNING/MAINTENANCE/STOPPED |

**接口**：
- `GET /device/page` - 分页参数：pageNumber, pageSize, keyword, type, status
- `GET /device/{id}` - 详情
- `POST /device` - 新增（DeviceModifyParam：code, type, name, status 必填；organizationId, commissionDate 可选）
- `PUT /device/{id}` - 修改
- `DELETE /device/{id}` - 删除
- `GET /device/import/template` - 导出导入模板
- `GET /device/export` - 导出 Excel
- `POST /device/import` - 导入设备，返回 successCount（兼容 count）、errors

### 2.2 巡检模板 (Template)

| 前端字段 | 后端字段 | 说明 |
|----------|----------|------|
| key | id | 主键 |
| name | name | 模板名称 |
| deviceType | deviceType | 设备类型，枚举值如 INVERTER/COMBINER/TRANSFORMER/DISTRIBUTION/OTHER |
| description | description | 模板说明 |
| version | version | 版本 |
| status | status | 状态，枚举值如 DRAFT/ENABLED |
| items | items | 巡检项列表，通过 item 接口单独增删改 |

**接口**：
- `GET /inspection/template/page` - 分页参数：pageNumber, pageSize, deviceType, keyword
- `GET /inspection/template/{id}` - 详情（含 items）
- `POST /inspection/template` - 新增
- `PUT /inspection/template/{id}` - 修改（已对接）
- `DELETE /inspection/template/{id}` - 删除（已对接）
- `GET /inspection/template/item/list?templateId=xxx` - 巡检项列表
- `POST /inspection/template/item` - 新增巡检项（响应为 integer，新增 id）
- `PUT /inspection/template/item/{id}` - 更新巡检项
- `DELETE /inspection/template/item/{id}` - 删除巡检项

**巡检项 (InspectionTemplateItemParam)**：与 Apifox 对齐，请求体必填 templateId、name、required、defaultValue；可选 parentId、type、rule、sort。**defaultValue 枚举**：`NORMAL` | `ABNORMAL`（非「正常」「异常」）。**无 options 字段**。

### 2.3 计划任务 (Task)

| 前端字段 | 后端字段 | 说明 |
|----------|----------|------|
| key | id | 主键 |
| plan | plan | 任务名称 |
| cycle | cycle | 执行周期，枚举 DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY/ONCE |
| cron | cron | Cron 表达式，前端根据 cycle/time/executeAt 生成 |
| team | team | 责任班组（组织机构 id，integer） |
| owner | owner | 负责人（用户 id，integer） |
| enabled | enabled | 是否启用（boolean） |
| deviceIds | deviceIds | 设备 ID 列表（integer[]） |

**接口**：
- `GET /inspection/task/page` - 分页参数：pageNumber, pageSize, enabled, keyword
- `GET /inspection/task/{id}` - 详情
- `POST /inspection/task` - 新增
- `PUT /inspection/task/{id}` - 修改
- `DELETE /inspection/task/{id}` - 删除

**响应归一化**：`normalizeTaskRecord` 将后端可能返回的字段统一为前端格式：`taskName`→`plan`、`deviceIdList`/`deviceList`→`deviceIds`、`organizationId`→`team`、`userId`→`owner`。响应在 `data` 内时自动解包。

**编辑与详情**：编辑页使用 `getById(id, { forceFetch: true })` 强制拉取详情，确保表单完整回填。详情抽屉在列表行无 `deviceIds` 时自动拉取详情以展示设备列表。`fillForm` 兼容 `deviceIdList`、`deviceList`、`organizationId`、`userId` 等后端字段名。列表页加载组织/用户列表，将 `team`/`owner` ID 映射为名称展示。

### 2.4 巡检记录 (Record)

| 前端字段 | 后端字段 | 说明 |
|----------|----------|------|
| key | id | 主键 |
| plan | plan | 任务名称 |
| device | device | 单设备编码 |
| deviceResults | deviceResults | 多设备结果 |
| inspector | inspector | 巡检人 |
| submitTime | submitTime | 提交时间 |
| result | result | 巡检结果 |
| photos | photos | 照片数量 |
| items | items | 巡检项结果 |
| photoUrls | photoUrls | 照片 URL 列表 |

**接口**：
- `GET /inspection/record/page` - 分页参数：pageNumber, pageSize, plan, device, inspector, result, startTime, endTime
- `GET /inspection/record/{id}` - 详情
- `GET /inspection/record/device?recordId=xxx&deviceCode=xxx` - 单设备巡检结果

### 2.5 消息 (Message)

| 前端字段 | 后端字段 | 说明 |
|----------|----------|------|
| id | id | 主键 |
| msgSceneName | msgSceneName | 消息场景名称 |
| msgContent | msgContent | 消息内容 |
| businessType | businessType | 业务类型 |
| msgType | msgType | 消息类型 |
| hasRead | hasRead | 是否已读 |
| sendTime | sendTime | 发送时间 |

**接口**（已与后端 OpenAPI 对齐）：
- `GET /msg-record/un-read/total/{channelType}` - 未读数量，响应为纯整数
- `GET /msg-records` - 消息列表，params: pageNumber, pageSize, channelType（必填），keyword, businessType, msgType, hasRead, period.begin, period.end 等可选
- `PUT /msg-record/read-all/{channelType}` - 一键已读，无请求体
- `PUT /msg-record/read-batch` - 批量已读，body: 整数数组 `[1,2,3]`（消息主键 ID，前端已做 Number 转换）

### 2.6 可指派人员树（异常指派）

**接口**：`GET /users/assignable-tree`（待后端提供）

**响应格式**：树状结构，支持 部门-岗位-人员 层级，示例：

```json
[
  { "id": "1", "name": "运维部", "children": [
    { "id": "p1", "name": "巡检员", "children": [
      { "id": "u1", "name": "张三" },
      { "id": "u2", "name": "李四" }
    ]}
  ]}
]
```

前端统一转换为 `{ value, title, selectable, children }`，叶子节点（人员）的 `value` 为用户 id（handlerId）。

### 2.7 异常管理 (Exception)

| 前端字段 | 后端字段 | 说明 |
|----------|----------|------|
| key | id | 主键 |
| code | exceptionNo | 异常编号 |
| device | deviceCode | 设备编码 |
| deviceName | deviceName | 设备名称 |
| desc | description | 描述 |
| handler | handlerName | 处理人姓名 |
| status | status | PENDING/PROCESSING/CLOSED |
| photoUrls | files + recordDeviceFiles | 通过 getFilePreviewUrl 转换 |

**接口**：
- `GET /inspection/exception/page` - 分页，params: pageNumber, pageSize, keyword, status, period.begin, period.end, onlyMine
- `GET /inspection/exception/{id}` - 详情（含 files、recordDeviceFiles）
- `POST /inspection/exception/assign` - 指派，body: `{ exceptionId, handlerId }`
- `POST /inspection/exception/process` - 处理，body: `{ exceptionId, processResult?, fileIds? }`

### 2.8 文件 (File)

| 接口 | 说明 |
|------|------|
| `POST /file/upload` | multipart/form-data，字段名 `file`，返回 FileVO |
| `GET /file/{id}` | 文件元信息 |
| `GET /public/file/{id}` | 公开获取（无需鉴权） |

**FileVO**：id, name, path, accessPrefix。预览 URL：path 若已是 http(s) 则直接用；否则 `accessPrefix + path`；兜底 `/api/public/file/{id}`。

---

## 三、未对接说明

| 模块 | 原因 |
|------|------|
| 工作台 | 后端暂无 `/dashboard/overview` 接口，保持 Mock |

---

## 四、Mock 切换

- **环境变量**：`VITE_ENABLE_MOCK`
- **默认值**：`true`（使用 Mock 数据）
- **联调时**：在 `.env.development` 中设置 `VITE_ENABLE_MOCK=false` 走真实接口

---

## 五、联调建议

1. **Base URL**：确保 `VITE_API_BASE_URL` 指向后端服务（如 `http://localhost:8080/api`）
2. **WebSocket 消息推送**：`VITE_WS_URL` 配置 WebSocket 地址（如 `ws://127.0.0.1:4009/websocket/msg`），部署到云服务器时改为 `wss://域名/websocket/msg`
3. **登录态**：需先登录获取 token，设备/模板/任务/记录接口均需 Bearer token
4. **分页参数**：若后端使用 `page`/`size` 等不同命名，需在 API 层做参数映射
5. **响应格式**：当前适配 `{ records, total }` 或 `{ list, total }`，若后端格式不同需调整 `inspection.js`、`equipment.js` 中的解析逻辑

---

## 六、文件变更清单

| 文件 | 变更 |
|------|------|
| pc-admin/src/api/modules/equipment.js | 新增 getDevicePage、getDeviceById、createDevice、updateDevice、deleteDevice；路径改为 /device/* |
| pc-admin/src/api/modules/inspection.js | 新建，模板/任务/记录接口；计划任务 normalizeTaskRecord 响应归一化 |
| pc-admin/src/stores/template.js | 支持 API 模式，loadList、getById、create、update、remove |
| pc-admin/src/stores/task.js | 支持 API 模式，loadList、getById(id, { forceFetch })、create、update、remove |
| pc-admin/src/views/equipment/EquipmentView.vue | 对接 getDevicePage、CRUD、分页、筛选 |
| pc-admin/src/views/template/TemplateView.vue | 对接 loadList、remove |
| pc-admin/src/views/template/TemplateFormPage.vue | 对接 getById、create、update |
| pc-admin/src/views/task/TaskView.vue | 对接 loadList、remove、设备列表；详情无 deviceIds 时拉取详情；team/owner ID 转名称 |
| pc-admin/src/views/task/TaskFormPage.vue | 对接 getById(forceFetch)、create、update、设备选择；fillForm 兼容多种后端字段 |
| pc-admin/src/views/record/RecordView.vue | 对接 getRecordPage、分页、筛选 |
| pc-admin/src/views/record/RecordDetailPage.vue | 对接 getRecordById |
| pc-admin/src/api/modules/message.js | 消息接口：getUnreadTotal、getMessageList、readAll、readBatch |
| pc-admin/src/layouts/AdminLayout.vue | 消息中心弹窗使用 message API |
| pc-admin/src/api/modules/assign.js | 可指派人员树：getAssignableUserTree，叶子 value 为用户 id |
| pc-admin/src/api/modules/exception.js | 异常管理：getExceptionPage、getExceptionById、assignException、processException |
| pc-admin/src/api/modules/file.js | 文件上传：uploadFile、getFilePreviewUrl |
| pc-admin/src/utils/file.js | 图片预览 URL：getFilePreviewUrl |
| pc-admin/src/stores/exception.js | 异常 store：loadList、getById、assign，支持 API 模式 |
| pc-admin/src/views/exception/ExceptionView.vue | 对接 getExceptionPage、分页、指派 |
| pc-admin/src/views/exception/ExceptionDetailPage.vue | 对接 getExceptionById、files 预览、指派 |
| pc-admin/src/api/modules/inspection.js | getRecordById、getRecordDevice 返回 files 转 photoUrls |
