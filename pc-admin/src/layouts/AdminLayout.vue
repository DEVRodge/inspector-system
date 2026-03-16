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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(false)
const brandLogo = 'https://www.gokinsolar.com/upload/20250625/3b8a42a036acdeee463952c58936b374.png'

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
})

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
            <a-badge :count="menuBadges['/tasks']" :offset="[2, 2]">
              <a-button type="text">待办</a-button>
            </a-badge>
            <a-badge :count="menuBadges['/exceptions']" :offset="[2, 2]">
              <a-button type="text">
                <BellOutlined />
              </a-button>
            </a-badge>
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
