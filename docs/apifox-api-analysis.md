# Apifox 接口文档分析（项目 358158）

> 基于 Apifox MCP 拉取的 OpenAPI 3.1 文档整理，与 schema-inspector.mysql.sql、pc-admin 前端对照。

**文档拉取时间：** 2026-03-16

---

## 1. 当前接口概览

Apifox 项目「默认模块」包含以下接口分组，**未包含**巡检业务（设备、模板、任务、记录、异常、二维码）相关接口。

### 1.1 认证与登录

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/oauth2/token` | 登录获取 token（grant_type, username, password, client_id, client_secret） |
| GET | `/public/auth/login/code/generate` | 获取 Kaptcha 验证码 |
| POST | `/login-out` | 账号退出登录（注销 token） |
| GET | `/oauth2/jwt.key` | JWT key |

### 1.2 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users` | 分页查询用户（pageNumber, pageSize, keyword, organizationId, positionId, roleId, enabled 等） |
| GET | `/user/{id}` | 根据主键获取用户详情（含部门、岗位、角色） |
| POST | `/user` | 新增用户（UserModifyParam） |
| PUT | `/user/{id}` | 修改用户 |
| DELETE | `/user/{id}` | 删除用户（软删除） |
| PUT | `/user/{id}/reset-password` | 重置用户密码 |

### 1.3 组织机构

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/organizations` | 查询组织机构（name, enabled, ids） |
| GET | `/organizations/list` | 查询组织机构列表 |
| GET | `/organizations/ids/list` | 通过机构 ID 集合查询 |
| GET | `/organizations/{id}` | 通过 ID 获取组织机构 |
| GET | `/organizations/postAndPosition/{id}` | 根据部门 id 查询部门岗位和职位信息 |
| POST | `/organization` | 新增组织机构 |
| PUT | `/organization/{id}` | 修改组织机构 |
| DELETE | `/organization/{id}` | 删除组织机构 |

### 1.4 岗位

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/positions` | 查询岗位 |
| GET | `/position/ids` | 根据 id 列表获取岗位 |
| GET | `/position/{id}` | 通过 ID 查询岗位 |
| POST | `/position` | 新增岗位 |
| PUT | `/position/{id}` | 修改岗位 |
| DELETE | `/position/{id}` | 删除岗位 |

### 1.5 角色与菜单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/roles` | 查询角色 |
| GET | `/authenticated/role/list/by-ids` | 根据 ids 获取角色信息 |
| GET | `/role/{id}/userid/list` | 获取角色下的用户 id |
| GET | `/role/{id}/menus` | 获取角色菜单（可按端类型筛选） |
| POST | `/role/{id}/menu-mapping` | 保存角色与菜单关系 |
| DELETE | `/role/{id}/menu-mapping` | 移除角色与菜单关系 |
| POST | `/role` | 新增角色 |
| PUT | `/role/{id}` | 修改角色 |
| DELETE | `/role/{id}` | 删除角色 |
| GET | `/menus` | 菜单列表（树形，按端类型筛选） |
| GET | `/menus/current-tree` | 当前登录用户树形菜单（已排序） |
| GET | `/menu-under-tenant` | listMenus |
| GET | `/menu/path/{path}` | 通过路径查询菜单详情 |
| GET | `/menu/{id}` | 菜单详情 |
| POST | `/menu` | 菜单新增 |
| PUT | `/menu/{id}` | 菜单修改 |
| DELETE | `/menu/{id}` | 菜单删除 |

### 1.6 数据字典

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/dictionary/list` | 按字典类型编码查询列表（启用项，用于下拉等），query: code |
| GET | `/dictionary/page` | 分页查询 |
| GET | `/dictionary/{id}` | 根据主键查询 |
| POST | `/dictionary` | 新增字典项 |
| PUT | `/dictionary/{id}` | 修改字典项 |
| DELETE | `/dictionary/{id}` | 删除字典项 |

### 1.7 消息

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/msg-records` | 消息列表 |
| GET | `/msg-record/{id}` | 消息详情 |
| DELETE | `/msg-record/{id}` | 消息删除 |
| GET | `/msg-record/type/{channelType}/statistics` | 消息类型统计未读数量 |
| GET | `/msg-record/un-read/total/{channelType}` | 消息数量(未读) |
| PUT | `/msg-record/read-all/{channelType}` | 消息一键已读 |
| PUT | `/msg-record/read-all-msg-type/{channelType}/{msgType}` | 消息类型一键已读 |
| PUT | `/msg-record/read-batch` | 消息批量已读 |
| DELETE | `/msg-record/batch` | 消息批量删除 |
| DELETE | `/msg-record/business/batch` | 根据业务主键批量删除消息 |

---

## 2. 与 Schema 的对应关系

| 接口分组 | 对应 schema 表 |
|----------|----------------|
| 用户 | user, user_role, user_organization |
| 组织机构 | organization |
| 岗位 | position |
| 角色/菜单 | role, menu, role_menu |
| 数据字典 | 需新增 dictionary 表或使用 extension |
| 消息 | msg_record, msg_record_target, msg_scene, msg_tmp, msg_channel 等 |
| 认证 | user（username/password）, password_setting 等 |

当前 Apifox 文档与 schema-inspector.mysql.sql 中的**基础表**（user、role、menu、organization、position、msg_*）一致，属于平台级能力。

---

## 3. 与前端 pc-admin 的对应关系

| 前端模块 | Apifox 接口 | 说明 |
|----------|-------------|------|
| 登录 / auth store | POST /oauth2/token, GET /public/auth/login/code/generate | 需对接真实登录与验证码 |
| 组织与人员 (OrgUsersView) | GET /organizations, GET /users, GET /positions, GET /organizations/postAndPosition/{id} | 部门树、人员列表、岗位可对接 |
| 系统设置 (SettingsView) | GET/POST/PUT/DELETE /dictionary/* | 数据字典可对接 |
| 侧栏菜单 | GET /menus/current-tree 或 GET /menus | 菜单树可对接 |
| 设备台账 (EquipmentView) | **无** | 需后端提供 equipment 相关接口 |
| 巡检模板 (TemplateView) | **无** | 需后端提供 inspection_template 相关接口 |
| 计划任务 (TaskView) | **无** | 需后端提供 inspection_task 相关接口 |
| 巡检记录 (RecordView) | **无** | 需后端提供 inspection_record 相关接口 |
| 异常管理 (ExceptionView) | **无** | 需后端提供 inspection_exception 相关接口 |
| 二维码 (QrcodeView) | **无** | 需后端提供 equipment_qrcode 或 设备二维码 相关接口 |
| 统计报表 (ReportView) | **无** | 需后端提供统计/报表接口 |

---

## 4. 数据结构对照（已有接口）

### 4.1 组织机构 OrganizationVO

| 接口字段 | 类型 | 前端 orgRows | schema organization |
|----------|------|--------------|---------------------|
| id | int64 | deptId | id |
| parentId | int64 | - | parent_id |
| level | int | - | level |
| name | string | dept | name |
| remark | string | - | remark |
| members | int | - | 无（可统计） |
| enabled | boolean | - | enabled |
| sequence | string | - | sequence |
| children | OrganizationVO[] | - | 树形组装 |

**缺口：** 前端有 `area`（责任区域），OrganizationVO 与 schema 表均无 `area` 字段，需新增或存 extension。

### 4.2 用户 UserModifyParam / UserVO

| 接口字段 | 类型 | 前端 orgRows/auth | schema user |
|----------|------|-------------------|-------------|
| id | int64 | key | id |
| name | string | name | name |
| mobile | string | phone | mobile |
| username | string | username | username |
| password | string | - | password |
| enabled | boolean | status 启用/停用 | enabled |
| organizationIds | int[] | deptId | user_organization |
| positionIds | int[] | postId | user_organization.position_id |
| roleIds | int[] | - | user_role |
| email, gender, remark | - | - | 有对应字段 |

UserVO 含 organizations、positions、roles 等嵌套，可满足前端「部门、岗位、角色」展示。

### 4.3 字典 DictionaryVO（/dictionary/list）

| 接口字段 | 类型 | 前端 SettingsView |
|----------|------|-------------------|
| id | number | key |
| code | string | 字典类型/编码 |
| name | string | 展示名 |
| value | string | 值 |
| sort | number | 排序 |
| enabled | boolean | 状态 |

可用于设备类型、任务状态、异常等级、模板状态等下拉数据。

---

## 5. 缺失的巡检业务接口（需后端补充）

以下为前端与 [schema-frontend-analysis.md](../schema-frontend-analysis.md) 所需，**当前 Apifox 文档中不存在**，需在 Apifox 中补充定义并在后端实现。

| 业务 | 建议路径前缀 | 建议方法 | 说明 |
|------|--------------|----------|------|
| 设备台账 | /equipment | GET/POST/PUT/DELETE | 列表、分页、详情、新增、修改、删除；导入导出见下 |
| 设备导入导出 | /equipment/import, /equipment/export, /equipment/template | POST, GET | 与前端 api/modules/equipment.js 一致 |
| 巡检模板 | /inspection-template | GET/POST/PUT/DELETE | 模板 CRUD，含 deviceType、items |
| 巡检项 | 含在模板内或 /inspection-template/{id}/items | GET/POST/PUT/DELETE | template.items 增删改查 |
| 计划任务 | /inspection-task | GET/POST/PUT/DELETE | 任务 CRUD，含 cycle、time、executeAt、cron、deviceIds |
| 任务-设备 | 含在任务内或 /inspection-task/{id}/devices | GET/POST/PUT | 任务关联设备 |
| 巡检记录 | /inspection-record | GET（分页/筛选） | 记录列表；提交可由端上直接调 |
| 巡检记录明细 | 含在记录内或 /inspection-record/{id}/items | GET | 逐项结果 |
| 异常 | /inspection-exception | GET/POST/PUT/DELETE | 异常列表、详情、指派、闭环 |
| 设备二维码 | /equipment/{id}/qrcode 或 /equipment-qrcode | GET/POST | 生成、预览、下载、失效 |

---

## 6. 汇总

| 项目 | 说明 |
|------|------|
| **已覆盖** | 认证、用户、组织机构、岗位、角色、菜单、数据字典、消息；与 schema 基础表及前端「组织与人员」「系统设置」「菜单」可对接 |
| **前端缺接口** | 设备、巡检模板、计划任务、巡检记录、异常、二维码、报表统计 |
| **Schema 缺表** | 见 schema-frontend-analysis.md：equipment、inspection_template、inspection_template_item、inspection_task、inspection_task_device、inspection_record、inspection_record_item、inspection_exception、equipment_qrcode |
| **字段缺口** | organization 无 `area`（责任区域），前端 orgRows 需要；可在表或 OrganizationVO 中增加 |

建议在后端实现巡检业务表与接口后，在 Apifox 项目 358158 中**新增上述巡检相关接口文档**，并与前端 pc-admin 的 mock 字段对齐，便于联调与维护。
