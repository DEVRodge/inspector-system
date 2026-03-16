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
import { menuItems as staticMenuItems } from '../constants/menu'
import { menuBadges } from '../mock/data'
import { useAuthStore } from '../stores/auth'
import { getMenusCurrentTree } from '../api/modules/menu'
import { isMockEnabled } from '../api/http'
import { getMessageList, getUnreadTotal, readAll, readBatch } from '../api/modules/message'

import brandLogo from '../assets/logo.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(false)

const noticePopoverOpen = ref(false)
const noticeLoading = ref(false)
const noticeUnreadTotal = ref(0)
const noticeItems = ref([])
const noticePageNumber = ref(1)
const noticePageSize = ref(10)
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

const menuItemsFromApi = ref(null)

const selectedKeys = computed(() => [route.path])

const menuNodes = computed(() => {
  const items = menuItemsFromApi.value
  if (items && items.length > 0) return items
  return staticMenuItems.map((item) => ({
    key: item.key,
    icon: () => h(iconMap[item.icon]),
    label: item.title,
  }))
})

onMounted(async () => {
  if (!isMockEnabled && authStore.isLoggedIn) {
    try {
      const data = await getMenusCurrentTree()
      const tree = Array.isArray(data) ? data : data?.children ?? data?.list ?? []
      const mapped = mapApiMenuToItems(tree)
      menuItemsFromApi.value = mapped && mapped.length > 0 ? mapped : null
    } catch {
      menuItemsFromApi.value = null
    }
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
    await Promise.all([refreshUnreadTotal(), loadNotices(noticePageNumber.value)])
  }
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
      <a-menu :items="menuNodes" :selected-keys="selectedKeys" mode="inline" @click="jump" />
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
                                      {{ item.sendTime }}
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
                <div style="font-weight: 600">{{ authStore.user.name }}</div>
                <div style="font-size: 12px; color: #86909c">{{ authStore.user.role }}</div>
              </div>
            </a-space>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="router.push('/settings')">系统设置</a-menu-item>
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
