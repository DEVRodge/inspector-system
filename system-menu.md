# 系统菜单说明

> 光伏厂区设备巡检数字化系统 - 供后端数据库初始化使用

## 菜单列表

| 序号 | code | 名称 | path | icon |
|------|------|------|------|------|
| 1 | dashboard | 工作台 | /dashboard | DashboardOutlined |
| 2 | equipment | 设备台账 | /equipment | DatabaseOutlined |
| 3 | templates | 巡检模板 | /templates | FormOutlined |
| 4 | tasks | 计划任务 | /tasks | ScheduleOutlined |
| 5 | records | 巡检记录 | /records | FileSearchOutlined |
| 6 | exceptions | 异常管理 | /exceptions | AlertOutlined |
| 7 | reports | 统计报表 | /reports | BarChartOutlined |
| 8 | settings | 系统管理 | /settings | SettingOutlined |

## 文件说明

| 文件 | 用途 |
|------|------|
| `system-menu-init.sql` | MySQL INSERT 语句，可直接执行 |
| `system-menu.json` | JSON 格式，便于程序导入 |
| `system-menu.md` | 本文档，便于查阅 |

## 字段映射（menu 表）

| 前端 | 数据库字段 |
|------|------------|
| key/code | code |
| title | name |
| icon | icon |
| key (path) | path |
| 排序 | sort |

## 注意事项

1. **id**：SQL 中 id 使用 1001–1008，可按实际主键策略调整
2. **parent_id**：当前均为一级菜单，parent_id 为 NULL
3. **icon**：Ant Design 图标组件名，前端会映射为对应组件
4. **path**：与前端路由一致，用于侧栏跳转
