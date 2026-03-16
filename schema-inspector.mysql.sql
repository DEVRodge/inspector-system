-- Inspector System 表结构
-- 字符集: utf8mb4, 排序: utf8mb4_general_ci, deleted 字段: BIGINT(20)
-- 根据实体类反向生成

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- user 用户表
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id`                   BIGINT(20)   NOT NULL COMMENT '主键',
    `name`                 VARCHAR(100) DEFAULT NULL COMMENT '用户姓名',
    `email`                VARCHAR(255) DEFAULT NULL COMMENT '电子邮箱',
    `phone`                VARCHAR(50)  DEFAULT NULL COMMENT '固定电话',
    `mobile`               VARCHAR(20)  DEFAULT NULL COMMENT '移动电话',
    `avatar`               VARCHAR(500) DEFAULT NULL COMMENT '用户头像',
    `gender`               VARCHAR(20)  DEFAULT NULL COMMENT '用户性别',
    `remark`               VARCHAR(500) DEFAULT NULL COMMENT '用户备注',
    `username`             VARCHAR(64)  DEFAULT NULL COMMENT '登录账号',
    `password`             VARCHAR(255) DEFAULT NULL COMMENT '登录密码',
    `admin`                TINYINT(1)   DEFAULT NULL COMMENT '是否是管理员',
    `enabled`              TINYINT(1)   DEFAULT NULL COMMENT '是否启用',
    `photograph_key`       BIGINT(20)   DEFAULT NULL COMMENT '人员照片业务主键',
    `last_login_time`     DATETIME     DEFAULT NULL COMMENT '最后登录时间',
    `last_login_address`   VARCHAR(255) DEFAULT NULL COMMENT '最后登录地址',
    `last_update_password_time` DATETIME DEFAULT NULL COMMENT '最后更改密码时间',
    `extension`            TEXT         DEFAULT NULL COMMENT '扩展字段（JSON）',
    `id_card`              VARCHAR(32)  DEFAULT NULL COMMENT '身份证号',
    `deleted`              BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除 0未删除 非0为删除时间戳',
    `create_by`            VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`          DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`            VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`          DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`           VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type`         VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`           VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type`         VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_mobile` (`mobile`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- ----------------------------
-- role 角色表
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
    `id`           BIGINT(20)   NOT NULL COMMENT '主键',
    `product_id`   BIGINT(20)   DEFAULT NULL COMMENT '产品主键(废弃)',
    `name`         VARCHAR(100) DEFAULT NULL COMMENT '角色名称',
    `icon`         VARCHAR(255) DEFAULT NULL COMMENT '角色图标',
    `sort`         FLOAT        DEFAULT NULL COMMENT '排序数字',
    `remark`       VARCHAR(500) DEFAULT NULL COMMENT '角色备注',
    `enabled`      TINYINT(1)   DEFAULT NULL COMMENT '是否启用',
    `deleted`      BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`    VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`  DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`    VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`  DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`   VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type` VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`   VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type` VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色表';

-- ----------------------------
-- menu 菜单表
-- ----------------------------
DROP TABLE IF EXISTS `menu`;
CREATE TABLE `menu` (
    `id`              BIGINT(20)   NOT NULL COMMENT '主键',
    `terminal_id`     BIGINT(20)   DEFAULT NULL COMMENT '访问端主键',
    `application_id`  BIGINT(20)   DEFAULT NULL COMMENT '应用主键',
    `category_id`     BIGINT(20)   DEFAULT NULL COMMENT '分类字典主键',
    `code`            VARCHAR(64)  DEFAULT NULL COMMENT '菜单编号',
    `name`            VARCHAR(100) DEFAULT NULL COMMENT '菜单名称',
    `icon`            VARCHAR(255) DEFAULT NULL COMMENT '菜单图标',
    `path`            VARCHAR(500) DEFAULT NULL COMMENT '菜单路径',
    `sort`            FLOAT        DEFAULT NULL COMMENT '排序数字',
    `remark`          VARCHAR(500) DEFAULT NULL COMMENT '菜单备注',
    `enabled`         TINYINT(1)   DEFAULT NULL COMMENT '是否启用',
    `parent_id`       BIGINT(20)   DEFAULT NULL COMMENT '上级主键',
    `level`           INT          DEFAULT NULL COMMENT '树层级',
    `sequence`        VARCHAR(500) DEFAULT NULL COMMENT '序列号',
    `deleted`         BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`       VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`     DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`       VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`     DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`      VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type`    VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`      VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type`    VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='菜单表';

-- ----------------------------
-- organization 组织机构表
-- ----------------------------
DROP TABLE IF EXISTS `organization`;
CREATE TABLE `organization` (
    `id`              BIGINT(20)   NOT NULL COMMENT '主键',
    `name`            VARCHAR(100) DEFAULT NULL COMMENT '组织机构名称',
    `icon`            VARCHAR(255) DEFAULT NULL COMMENT '组织机构图标',
    `sort`            FLOAT        DEFAULT NULL COMMENT '排序数字',
    `remark`          VARCHAR(500) DEFAULT NULL COMMENT '组织机构备注',
    `enabled`         TINYINT(1)   DEFAULT NULL COMMENT '是否启用',
    `extension`       TEXT         DEFAULT NULL COMMENT '扩展字段（JSON）',
    `parent_id`       BIGINT(20)   DEFAULT NULL COMMENT '上级主键',
    `level`           INT          DEFAULT NULL COMMENT '树层级',
    `sequence`        VARCHAR(500) DEFAULT NULL COMMENT '序列号',
    `deleted`         BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`       VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`     DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`       VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`     DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`      VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type`    VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`      VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type`    VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='组织机构表';

-- ----------------------------
-- position 岗位表
-- ----------------------------
DROP TABLE IF EXISTS `position`;
CREATE TABLE `position` (
    `id`              BIGINT(20)   NOT NULL COMMENT '主键',
    `name`            VARCHAR(100) DEFAULT NULL COMMENT '岗位名称',
    `sort`            FLOAT        DEFAULT NULL COMMENT '排序数字',
    `remark`          VARCHAR(500) DEFAULT NULL COMMENT '岗位备注',
    `enabled`         TINYINT(1)   DEFAULT NULL COMMENT '是否启用',
    `extension`       TEXT         DEFAULT NULL COMMENT '扩展字段（JSON）',
    `deleted`         BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`       VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`     DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`       VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`     DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`      VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type`    VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`      VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type`    VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='岗位表';

-- ----------------------------
-- password_setting 密码策略表
-- ----------------------------
DROP TABLE IF EXISTS `password_setting`;
CREATE TABLE `password_setting` (
    `id`                                BIGINT(20) NOT NULL COMMENT '主键',
    `useful_life`                       INT        DEFAULT NULL COMMENT '密码有效天数',
    `due_to_prompt_day`                 INT        DEFAULT NULL COMMENT '到期提前提醒天数',
    `forced`                            TINYINT(1) DEFAULT NULL COMMENT '是否强制修改',
    `many_login_failures_calibrated`    TINYINT(1) DEFAULT NULL COMMENT '登录失败次数过多校验是否开启',
    `account_login_locking_duration`   INT        DEFAULT NULL COMMENT '账号登录失败锁定时长(分钟)',
    `account_login_allowed_fail_num`    INT        DEFAULT NULL COMMENT '允许重试的登录失败次数',
    `account_login_allowed_fail_duration` INT     DEFAULT NULL COMMENT '允许重试的时间范围(分钟)',
    `deleted`                           BIGINT(20) NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`                         VARCHAR(64) DEFAULT NULL COMMENT '创建用户',
    `create_time`                       DATETIME   DEFAULT NULL COMMENT '创建时间',
    `update_by`                         VARCHAR(64) DEFAULT NULL COMMENT '更新用户',
    `update_time`                       DATETIME   DEFAULT NULL COMMENT '更新时间',
    `creator_id`                        VARCHAR(64) DEFAULT NULL COMMENT '创建人id',
    `creator_type`                      VARCHAR(20) DEFAULT NULL COMMENT '创建人类型',
    `updater_id`                        VARCHAR(64) DEFAULT NULL COMMENT '更新人id',
    `updater_type`                      VARCHAR(20) DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='密码策略表';

-- ----------------------------
-- role_menu 角色菜单关联表
-- ----------------------------
DROP TABLE IF EXISTS `role_menu`;
CREATE TABLE `role_menu` (
    `id`        BIGINT(20) NOT NULL COMMENT '主键',
    `role_id`   BIGINT(20) DEFAULT NULL COMMENT '角色主键',
    `menu_id`   BIGINT(20) DEFAULT NULL COMMENT '菜单主键',
    PRIMARY KEY (`id`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色菜单关联表';

-- ----------------------------
-- user_role 用户角色关联表
-- ----------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
    `id`      BIGINT(20) NOT NULL COMMENT '主键',
    `user_id` BIGINT(20) DEFAULT NULL COMMENT '用户主键',
    `role_id` BIGINT(20) DEFAULT NULL COMMENT '角色主键',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户角色关联表';

-- ----------------------------
-- user_organization 用户组织机构关联表
-- ----------------------------
DROP TABLE IF EXISTS `user_organization`;
CREATE TABLE `user_organization` (
    `id`               BIGINT(20) NOT NULL COMMENT '主键',
    `user_id`          BIGINT(20) DEFAULT NULL COMMENT '用户主键',
    `position_id`      BIGINT(20) DEFAULT NULL COMMENT '岗位主键',
    `organization_id`  BIGINT(20) DEFAULT NULL COMMENT '组织机构主键',
    `appointment_id`   BIGINT(20) DEFAULT NULL COMMENT '职位主键',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_organization_id` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户组织机构关联表';

-- ----------------------------
-- role_application 角色应用关联表
-- ----------------------------
DROP TABLE IF EXISTS `role_application`;
CREATE TABLE `role_application` (
    `id`              BIGINT(20) NOT NULL COMMENT '主键',
    `role_id`         BIGINT(20) DEFAULT NULL COMMENT '角色主键',
    `terminal_id`     BIGINT(20) DEFAULT NULL COMMENT '访问端主键',
    `application_id`  BIGINT(20) DEFAULT NULL COMMENT '应用主键',
    PRIMARY KEY (`id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色应用关联表';

-- ----------------------------
-- msg_scene 消息场景表
-- ----------------------------
DROP TABLE IF EXISTS `msg_scene`;
CREATE TABLE `msg_scene` (
    `id`           BIGINT(20)   NOT NULL COMMENT '主键',
    `code`         VARCHAR(64)  DEFAULT NULL COMMENT '场景编号',
    `name`         VARCHAR(100) DEFAULT NULL COMMENT '场景名称',
    `msg_type`     VARCHAR(32)  DEFAULT NULL COMMENT '消息类型',
    `deleted`      BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`    VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`  DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`    VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`  DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`   VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type` VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`   VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type` VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code_deleted` (`code`, `deleted`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='消息场景表';

-- ----------------------------
-- msg_tmp 消息模板表
-- ----------------------------
DROP TABLE IF EXISTS `msg_tmp`;
CREATE TABLE `msg_tmp` (
    `id`              BIGINT(20)   NOT NULL COMMENT '主键',
    `name`            VARCHAR(100) DEFAULT NULL COMMENT '模板名称',
    `content`         TEXT         DEFAULT NULL COMMENT '模板内容',
    `channel_code`    VARCHAR(32)  DEFAULT NULL COMMENT '通道编号',
    `msg_type`        VARCHAR(32)  DEFAULT NULL COMMENT '消息类型',
    `enabled`         TINYINT(1)   DEFAULT NULL COMMENT '是否启用',
    `msg_scene_code`  VARCHAR(64)  DEFAULT NULL COMMENT '消息场景编号',
    `deleted`         BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`       VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`     DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`       VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`     DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`      VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type`    VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`      VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type`    VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='消息模板表';

-- ----------------------------
-- msg_record 消息记录表
-- ----------------------------
DROP TABLE IF EXISTS `msg_record`;
CREATE TABLE `msg_record` (
    `id`                  BIGINT(20)   NOT NULL COMMENT '主键',
    `msg_scene_code`       VARCHAR(64)  DEFAULT NULL COMMENT '消息场景编号',
    `msg_scene_name`       VARCHAR(100) DEFAULT NULL COMMENT '消息场景名称',
    `msg_content`         TEXT         DEFAULT NULL COMMENT '消息内容',
    `msg_tmp_id`          BIGINT(20)   DEFAULT NULL COMMENT '消息模板主键',
    `msg_tmp_version`     VARCHAR(32)  DEFAULT NULL COMMENT '消息模板版本',
    `msg_params`          TEXT         DEFAULT NULL COMMENT '消息参数',
    `msg_type`            VARCHAR(32)  DEFAULT NULL COMMENT '消息类型',
    `business_type`       VARCHAR(64)  DEFAULT NULL COMMENT '业务类型',
    `business_id`         VARCHAR(64)  DEFAULT NULL COMMENT '业务主键',
    `business_principal`  VARCHAR(500) DEFAULT NULL COMMENT '业务主体信息',
    `channel_code`        VARCHAR(32)  DEFAULT NULL COMMENT '消息通道编号',
    `manufacturer_code`    VARCHAR(32)  DEFAULT NULL COMMENT '消息厂家编号',
    `send_status`         VARCHAR(32)  DEFAULT NULL COMMENT '发送状态',
    `send_time`           DATETIME     DEFAULT NULL COMMENT '发送时间',
    `effective_days`      INT          DEFAULT NULL COMMENT '有效天数',
    `expiration_time`     DATETIME     DEFAULT NULL COMMENT '过期时间',
    `url`                 VARCHAR(500) DEFAULT NULL COMMENT '跳转地址',
    `deleted`             BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`           VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`         DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`         DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`          VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type`        VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`          VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type`        VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    KEY `idx_business` (`business_type`, `business_id`),
    KEY `idx_send_time` (`send_time`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='消息记录表';

-- ----------------------------
-- msg_record_target 消息记录对象表
-- ----------------------------
DROP TABLE IF EXISTS `msg_record_target`;
CREATE TABLE `msg_record_target` (
    `id`              BIGINT(20)   NOT NULL COMMENT '主键',
    `channel_code`    VARCHAR(32)  DEFAULT NULL COMMENT '通道编号',
    `msg_record_id`   BIGINT(20)   DEFAULT NULL COMMENT '消息主键',
    `user_id`         BIGINT(20)   DEFAULT NULL COMMENT '用户主键',
    `user_name`       VARCHAR(100) DEFAULT NULL COMMENT '用户名称',
    `user_phone`      VARCHAR(32)  DEFAULT NULL COMMENT '用户手机号',
    `user_email`      VARCHAR(255) DEFAULT NULL COMMENT '用户邮箱',
    `receiver`        VARCHAR(128) DEFAULT NULL COMMENT '接收者标识',
    `send_status`     TINYINT(1)   DEFAULT NULL COMMENT '是否发送成功',
    `send_status_desc` VARCHAR(255) DEFAULT NULL COMMENT '发送状态描述',
    `error_describe`  VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    `has_read`        TINYINT(1)   DEFAULT NULL COMMENT '是否已读',
    `send_time`       DATETIME     DEFAULT NULL COMMENT '发送时间',
    `send_times`      INT          DEFAULT 1 COMMENT '发送次数',
    `deleted`         BIGINT(20)   NOT NULL DEFAULT 0 COMMENT '是否已删除',
    `create_by`       VARCHAR(64)  DEFAULT NULL COMMENT '创建用户',
    `create_time`     DATETIME     DEFAULT NULL COMMENT '创建时间',
    `update_by`       VARCHAR(64)  DEFAULT NULL COMMENT '更新用户',
    `update_time`     DATETIME     DEFAULT NULL COMMENT '更新时间',
    `creator_id`      VARCHAR(64)  DEFAULT NULL COMMENT '创建人id',
    `creator_type`    VARCHAR(20)  DEFAULT NULL COMMENT '创建人类型',
    `updater_id`      VARCHAR(64)  DEFAULT NULL COMMENT '更新人id',
    `updater_type`    VARCHAR(20)  DEFAULT NULL COMMENT '更新人类型',
    PRIMARY KEY (`id`),
    KEY `idx_msg_record_id` (`msg_record_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='消息记录对象表';

-- ----------------------------
-- msg_channel 消息通道表
-- ----------------------------
DROP TABLE IF EXISTS `msg_channel`;
CREATE TABLE `msg_channel` (
    `id`     BIGINT(20)   NOT NULL COMMENT '主键',
    `name`   VARCHAR(100) DEFAULT NULL COMMENT '通道名称',
    `code`   VARCHAR(64)  DEFAULT NULL COMMENT '通道编号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='消息通道表';

-- ----------------------------
-- msg_manufacturer 消息厂家表
-- ----------------------------
DROP TABLE IF EXISTS `msg_manufacturer`;
CREATE TABLE `msg_manufacturer` (
    `id`   BIGINT(20)   NOT NULL COMMENT '主键',
    `name` VARCHAR(100) DEFAULT NULL COMMENT '厂家名称',
    `code` VARCHAR(64)  DEFAULT NULL COMMENT '厂家编号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='消息厂家表';

-- ----------------------------
-- msg_channel_manufacturer 通道接入厂家表
-- ----------------------------
DROP TABLE IF EXISTS `msg_channel_manufacturer`;
CREATE TABLE `msg_channel_manufacturer` (
    `id`                  BIGINT(20)   NOT NULL COMMENT '主键',
    `channel_code`        VARCHAR(32)  DEFAULT NULL COMMENT '通道编码',
    `manufacturer_code`   VARCHAR(32)  DEFAULT NULL COMMENT '厂家编码',
    `account_rule`        VARCHAR(500) DEFAULT NULL COMMENT '账号规则',
    `account_rule_remark` VARCHAR(500) DEFAULT NULL COMMENT '账号规则描述',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_channel_manufacturer` (`channel_code`, `manufacturer_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='通道接入厂家表';

SET FOREIGN_KEY_CHECKS = 1;
