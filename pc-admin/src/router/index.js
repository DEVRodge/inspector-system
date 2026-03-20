import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppMenuStore } from '../stores/appMenu'
import { collectMenuPathsFromTree } from '../utils/menuPaths'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/dashboard/DashboardView.vue'), meta: { title: '工作台' } },
      { path: 'equipment', name: 'equipment', component: () => import('../views/equipment/EquipmentView.vue'), meta: { title: '设备台账' } },
      { path: 'templates', name: 'templates', component: () => import('../views/template/TemplateView.vue'), meta: { title: '巡检模板' } },
      { path: 'templates/new', name: 'templateNew', component: () => import('../views/template/TemplateFormPage.vue'), meta: { title: '新增模板' } },
      { path: 'templates/edit/:id', name: 'templateEdit', component: () => import('../views/template/TemplateFormPage.vue'), meta: { title: '编辑模板' } },
      { path: 'tasks', name: 'tasks', component: () => import('../views/task/TaskView.vue'), meta: { title: '计划任务' } },
      { path: 'tasks/new', name: 'taskNew', component: () => import('../views/task/TaskFormPage.vue'), meta: { title: '新建任务' } },
      { path: 'tasks/edit/:id', name: 'taskEdit', component: () => import('../views/task/TaskFormPage.vue'), meta: { title: '编辑任务' } },
      { path: 'records', name: 'records', component: () => import('../views/record/RecordView.vue'), meta: { title: '巡检记录' } },
      { path: 'records/:id', name: 'recordDetail', component: () => import('../views/record/RecordDetailPage.vue'), meta: { title: '巡检记录详情' } },
      { path: 'exceptions', name: 'exceptions', component: () => import('../views/exception/ExceptionView.vue'), meta: { title: '异常管理' } },
      { path: 'exceptions/:id', name: 'exceptionDetail', component: () => import('../views/exception/ExceptionDetailPage.vue'), meta: { title: '异常详情' } },
      { path: 'reports', name: 'reports', component: () => import('../views/report/ReportView.vue'), meta: { title: '统计报表' } },
      { path: 'settings', name: 'settings', component: () => import('../views/settings/SettingsView.vue'), meta: { title: '系统管理' } },
    ],
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('../views/result/ForbiddenView.vue'),
    meta: { title: '无权限' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/result/NotFoundView.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta?.title) {
    document.title = `${to.meta.title} - 光伏厂区设备巡检数字化系统`
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return '/login'
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    return '/dashboard'
  }

  if (authStore.isLoggedIn && to.name === 'settings') {
    const menuStore = useAppMenuStore()
    if (menuStore.status !== 'ready' || !menuStore.rawTree?.length) {
      await menuStore.fetchMenus().catch(() => {})
    }
    const paths = collectMenuPathsFromTree(menuStore.rawTree)
    if (!paths.has('/settings')) {
      return { name: 'forbidden' }
    }
  }

  return true
})

export default router
