# 设备台账接口说明

前端已预留调用，由后端实现以下接口。

## 1. 责任部门列表

**GET** `/api/equipment/departments`

- 返回：`{ list: [{ id, name }] }` 或 `{ list: string[] }`
- 用于新增/编辑设备时选择责任部门

## 2. 导出模板

**GET** `/api/equipment/template`

- 返回：Excel 文件流
- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="设备台账导入模板.xlsx"`

模板内容建议：
- 工作表「设备台账」：表头 + 1 行示例
- 工作表「填写说明」：列说明、必填项、可选值
- 列：设备编码、设备类型、设备名称、型号、电压等级、安装地点、责任部门、投运日期、运行状态
- 必填：设备编码、设备类型、设备名称
- 设备类型可选：逆变器、汇流箱、箱变、配电柜、其他设备
- 运行状态可选：运行中、检修中、停用

## 3. 导出 Excel

**GET** `/api/equipment/export`

- Query：`keyword`, `type`, `status`（可选，与列表筛选一致）
- 返回：Excel 文件流
- `Content-Disposition`: `attachment; filename="设备台账_YYYY-MM-DD.xlsx"`

## 4. 导入设备

**POST** `/api/equipment/import`

- `Content-Type`: `multipart/form-data`
- Body：`file`（Excel 文件，.xlsx 或 .xls）
- 返回 JSON：
```json
{
  "success": true,
  "count": 10,
  "errors": []
}
```
- 部分失败时：`success` 可为 `true`，`errors` 为失败行说明
- 全部失败：`success: false`，`errors` 为错误列表
