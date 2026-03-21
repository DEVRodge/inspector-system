## Inspector System

一个以前端为主的「光伏厂区设备巡检」系统仓库；**pc-admin** 为 Vue 3 管理端，通过环境变量对接后端 API。

### 功能概览

- **PC 管理端（pc-admin）**：设备台账（含设备二维码预览/下载）、巡检模板、计划任务、记录与异常、统计报表、系统管理等。
- **接口层**：`src/api` 统一封装，联调时配置 `VITE_API_BASE_URL` 等。

### 本地开发（pc-admin）

```bash
cd pc-admin
npm install
npm run dev
```

默认开发地址以终端输出为准（一般为 `http://localhost:5173`）。在 `pc-admin/.env.development` 中配置后端代理与 OAuth、WebSocket 等变量。

### 项目结构（仓库根目录）

```text
.
├── pc-admin/          # Vue 3 + Vite 管理端（主应用）
├── *.md               # 业务与接口说明文档
└── README.md
```

### 开发约定

- **前端**：页面与交互在 pc-admin 内完成；接口由后端提供，按文档对接。
- **设备二维码**：在设备台账中生成，图为前端绘制与下载，无单独二维码后端接口。
- **数据字典**：下拉选项优先使用字典接口返回数据。例外：**设备运行状态**为固定枚举 `RUNNING` / `MAINTENANCE` / `STOPPED`（`pc-admin/src/constants/equipment.js`）；**巡检模板状态**为接口枚举 `DRAFT` / `ENABLED`（`pc-admin/src/constants/templateForm.js`），不走字典。

### 可补充内容

- 部署与 CI/CD 说明
- 各环境 `.env` 字段表
