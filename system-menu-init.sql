-- ============================================================
-- 光伏厂区设备巡检数字化系统 - 菜单初始化 SQL
-- 供后端数据库初始化使用
-- 生成依据：pc-admin/src/constants/menu.js、router
-- ============================================================

-- 清空并插入菜单（按需调整，若表已有数据可注释 DROP/TRUNCATE）
-- TRUNCATE TABLE `menu`;

INSERT INTO `menu` (
    `id`, `parent_id`, `level`, `code`, `name`, `icon`, `path`, `sort`, `remark`, `enabled`, `sequence`, `deleted`
) VALUES
-- 一级菜单（parent_id 为空）
(1001, NULL, 1, 'dashboard', '工作台', 'DashboardOutlined', '/dashboard', 1, '工作台首页', 1, '1', 0),
(1002, NULL, 1, 'equipment', '设备台账', 'DatabaseOutlined', '/equipment', 2, '设备台账管理', 1, '2', 0),
(1003, NULL, 1, 'templates', '巡检模板', 'FormOutlined', '/templates', 3, '巡检模板配置', 1, '3', 0),
(1004, NULL, 1, 'tasks', '计划任务', 'ScheduleOutlined', '/tasks', 4, '计划任务管理', 1, '4', 0),
(1005, NULL, 1, 'records', '巡检记录', 'FileSearchOutlined', '/records', 5, '巡检记录查询', 1, '5', 0),
(1006, NULL, 1, 'exceptions', '异常管理', 'AlertOutlined', '/exceptions', 6, '异常工单管理', 1, '6', 0),
(1007, NULL, 1, 'reports', '统计报表', 'BarChartOutlined', '/reports', 7, '统计报表', 1, '7', 0),
(1008, NULL, 1, 'settings', '系统管理', 'SettingOutlined', '/settings', 8, '系统设置', 1, '8', 0);
