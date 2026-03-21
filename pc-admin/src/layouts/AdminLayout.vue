<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FormOutlined,
  ScheduleOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useAppMenuStore } from '../stores/appMenu'
import { getMessageList, getUnreadTotal, readAll, readBatch } from '../api/modules/message'
import { useWebSocket } from '../composables/useWebSocket'
import { formatDateTime } from '../utils/dateTime'
import { collectMenuPathsFromTree } from '../utils/menuPaths'

import brandLogo from '../assets/logo.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appMenuStore = useAppMenuStore()
const collapsed = ref(false)

const noticePopoverOpen = ref(false)
const noticeLoading = ref(false)
const noticeUnreadTotal = ref(0)
const noticeItems = ref([])
const noticePageNumber = ref(1)
/** 消息中心弹层内每页条数：默认最新 3 条 */
const noticePageSize = ref(3)
const noticeTotal = ref(0)

const iconMap = {
  AlertOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FormOutlined,
  ScheduleOutlined,
  SettingOutlined,
}

/** 后端 icon 字符串映射到前端组件，未匹配则用 SettingOutlined */
function resolveIcon(iconStr) {
  const key = (iconStr || '').replace(/^.*[\\/]/, '') || 'SettingOutlined'
  return iconMap[key] ?? SettingOutlined
}

/** 将后端菜单树转为 a-menu items */
function mapApiMenuToItems(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null
  return nodes
    .filter((n) => n?.path || n?.key)
    .map((n) => {
      const path = n.path || n.key || ''
      const key = path.startsWith('/') ? path : `/${path}`
      const item = {
        key,
        icon: () => h(resolveIcon(n.icon)),
        label: n.name || n.title || n.label || '',
      }
      if (n.children && n.children.length > 0) {
        item.children = mapApiMenuToItems(n.children)
      }
      return item
    })
}

const selectedKeys = computed(() => [route.path])

/** 已登录且菜单尚未就绪（含 idle 首帧）：不展示全量静态兜底 */
const menuSidebarPending = computed(() => {
  if (!authStore.isLoggedIn) return false
  const tree = appMenuStore.rawTree
  const emptyTree = !tree || tree.length === 0
  if (appMenuStore.status === 'loading' && emptyTree) return true
  if (appMenuStore.status === 'idle' && emptyTree) return true
  return false
})

const menuNodes = computed(() => {
  if (!authStore.isLoggedIn) return []
  const mapped = mapApiMenuToItems(appMenuStore.rawTree)
  if (mapped && mapped.length > 0) return mapped
  if (menuSidebarPending.value) return []
  return [
    {
      key: '/dashboard',
      icon: () => h(DashboardOutlined),
      label: '工作台',
    },
  ]
})

const showMenuLoadError = computed(
  () =>
    authStore.isLoggedIn &&
    appMenuStore.status === 'error' &&
    (!menuNodes.value || menuNodes.value.length <= 1),
)

/** 与侧栏菜单树一致：仅当接口返回树中含 /settings 时显示头部入口 */
const showSettingsInHeader = computed(() => {
  if (!authStore.isLoggedIn) return false
  if (appMenuStore.status !== 'ready' || !appMenuStore.rawTree?.length) return false
  return collectMenuPathsFromTree(appMenuStore.rawTree).has('/settings')
})

useWebSocket(() => {
  refreshUnreadTotal()
})

onMounted(async () => {
  if (authStore.isLoggedIn) {
    await Promise.all([
      authStore.hydrateUserProfile().catch(() => {
        /* 展示沿用本地缓存或占位 */
      }),
      appMenuStore.fetchMenus().catch(() => {
        /* 错误态由 store 与侧边栏提示承担 */
      }),
    ])
  }

  await Promise.all([refreshUnreadTotal(), loadNotices()])
})

async function refreshUnreadTotal() {
  try {
    const total = await getUnreadTotal()
    noticeUnreadTotal.value = Number(total || 0)
  } catch {
    noticeUnreadTotal.value = 0
  }
}

async function loadNotices(page = 1) {
  noticeLoading.value = true
  noticePageNumber.value = page
  try {
    const res = await getMessageList({
      pageNumber: noticePageNumber.value,
      pageSize: noticePageSize.value,
    })
    noticeTotal.value = res.total ?? 0
    noticeItems.value =
      Array.isArray(res.records) && res.records.length > 0
        ? res.records
        : []
  } finally {
    noticeLoading.value = false
  }
}

async function handleNoticeOpenChange(open) {
  noticePopoverOpen.value = open
  if (open) {
    noticePageNumber.value = 1
    await Promise.all([refreshUnreadTotal(), loadNotices(1)])
  }
}

function onNoticePageChange(page) {
  loadNotices(page)
}

async function handleNoticeReadAll() {
  await readAll()
  await Promise.all([refreshUnreadTotal(), loadNotices(noticePageNumber.value)])
}

async function handleNoticeItemClick(item) {
  if (!item?.id || item.hasRead) return
  await readBatch([item.id])
  item.hasRead = true
  if (noticeUnreadTotal.value > 0) {
    noticeUnreadTotal.value -= 1
  }
}

function jump({ key }) {
  router.push(key)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :width="240"
      theme="light"
      style="border-right: 1px solid #f0f0f0"
    >
      <div
        style="
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 20px;
          border-bottom: 1px solid #f0f0f0;
          font-weight: 700;
          color: #1677ff;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
        "
      >
        <img
          :src="brandLogo"
          alt="Gokin Logo"
          style="width: 28px; height: 28px; object-fit: contain; flex-shrink: 0"
        />
        <span
          v-if="!collapsed"
          style="
            margin-left: 10px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          光伏厂区设备巡检数字化系统
        </span>
      </div>
      <a-spin :spinning="menuSidebarPending" tip="加载菜单中…">
        <div style="min-height: 120px">
          <a-alert
            v-if="showMenuLoadError"
            type="warning"
            show-icon
            :message="appMenuStore.lastError || '菜单加载失败'"
            style="margin: 12px 12px 0"
          />
          <a-menu
            v-if="menuNodes.length"
            :items="menuNodes"
            :selected-keys="selectedKeys"
            mode="inline"
            @click="jump"
          />
        </div>
      </a-spin>
    </a-layout-sider>

    <a-layout>
      <a-layout-header
        style="
          height: 64px;
          padding: 0 20px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0f0f0;
        "
      >
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0">
          <a-button type="text" @click="collapsed = !collapsed">
            <component :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" />
          </a-button>
          <div style="min-width: 0">
            <div
              style="
                font-size: 18px;
                font-weight: 600;
                color: #1f2329;
                line-height: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              "
            >
              {{ route.meta?.title || '工作台' }}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0">
          <a-space size="small">
            <a-popover
              placement="bottomRight"
              trigger="click"
              :open="noticePopoverOpen"
              @openChange="handleNoticeOpenChange"
            >
              <template #content>
                <a-card
                  :bordered="false"
                  style="width: 360px; box-shadow: none; padding: 0"
                  body-style="padding: 0"
                >
                  <div
                    style="
                      padding: 8px 16px;
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      border-bottom: 1px solid #f0f0f0;
                    "
                  >
                    <span style="font-weight: 600">消息中心</span>
                    <a-typography-link @click="handleNoticeReadAll">全部已读</a-typography-link>
                  </div>
                  <a-spin :spinning="noticeLoading">
                    <div style="max-height: 360px; overflow-y: auto; padding: 8px 0">
                      <template v-if="noticeItems.length">
                        <a-list :data-source="noticeItems" item-layout="horizontal">
                          <template #renderItem="{ item }">
                            <a-list-item
                              style="cursor: pointer; padding: 8px 16px"
                              @click="handleNoticeItemClick(item)"
                            >
                              <a-list-item-meta>
                                <template #title>
                                  <div style="display: flex; justify-content: space-between; gap: 8px">
                                    <span style="font-weight: 600">
                                      {{ item.msgSceneName || item.msgType || '系统通知' }}
                                    </span>
                                    <span style="font-size: 12px; color: #86909c">
                                      {{ formatDateTime(item.sendTime) }}
                                    </span>
                                  </div>
                                </template>
                                <template #description>
                                  <div
                                    :style="{
                                      fontSize: '13px',
                                      color: item.hasRead ? '#86909c' : '#1f2329',
                                      fontWeight: item.hasRead ? 400 : 500,
                                    }"
                                  >
                                    {{ item.msgContent }}
                                  </div>
                                </template>
                              </a-list-item-meta>
                            </a-list-item>
                          </template>
                        </a-list>
                      </template>
                      <template v-else>
                        <div
                          style="
                            padding: 24px 16px;
                            text-align: center;
                            color: #c0c4cc;
                            font-size: 13px;
                          "
                        >
                          暂无消息
                        </div>
                      </template>
                    </div>
                  </a-spin>
                  <div
                    v-if="noticeTotal > noticePageSize"
                    style="
                      padding: 8px 12px 12px;
                      border-top: 1px solid #f0f0f0;
                      display: flex;
                      justify-content: center;
                    "
                  >
                    <a-pagination
                      :current="noticePageNumber"
                      :page-size="noticePageSize"
                      :total="noticeTotal"
                      size="small"
                      :show-size-changer="false"
                      @change="onNoticePageChange"
                    />
                  </div>
                </a-card>
              </template>

              <a-badge :count="noticeUnreadTotal" :offset="[2, 2]">
                <a-button type="text">
                  <BellOutlined />
                </a-button>
              </a-badge>
            </a-popover>
          </a-space>
          <a-dropdown>
            <a-space style="cursor: pointer">
              <a-avatar style="background: #1677ff">管</a-avatar>
              <div style="line-height: 1.2">
                <div style="font-weight: 600">{{ authStore.user.name || '用户' }}</div>
                <div style="font-size: 12px; color: #86909c">{{ authStore.user.role || '—' }}</div>
              </div>
            </a-space>
            <template #overlay>
              <a-menu>
                <a-menu-item v-if="showSettingsInHeader" @click="router.push('/settings')">
                  系统设置
                </a-menu-item>
                <a-menu-item danger @click="logout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content style="padding: 20px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
