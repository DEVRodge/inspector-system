<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getOrganizations } from '../../api/modules/organization'
import { getUsers } from '../../api/modules/user'

const columns = [
  { title: '部门', dataIndex: 'dept' },
  { title: '岗位', dataIndex: 'post' },
  { title: '姓名', dataIndex: 'name' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '责任区域', dataIndex: 'area' },
  { title: '状态', dataIndex: 'status' },
]

const query = reactive({
  keyword: '',
  organizationId: undefined,
  enabled: undefined,
})

const orgTree = ref([])
const userList = ref([])
const loading = ref(false)

function mapOrgToTree(nodes) {
  if (!nodes?.length) return []
  return nodes.map((n) => ({
    key: String(n.id),
    title: n.name,
    children: mapOrgToTree(n.children),
  }))
}

function mapUserToRow(u) {
  return {
    key: String(u.id),
    dept: u.organizations?.[0]?.name ?? u.organization?.name ?? '-',
    post: u.positions?.[0]?.name ?? '-',
    name: u.name ?? '-',
    phone: u.mobile ?? '-',
    area: u.extension?.area ?? '-',
    status: u.enabled ? '启用' : '停用',
  }
}

async function loadOrganizations() {
  try {
    const data = await getOrganizations()
    orgTree.value = mapOrgToTree(Array.isArray(data) ? data : data?.list ?? [])
  } catch {
    orgTree.value = []
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await getUsers({
      pageNumber: 1,
      pageSize: 100,
      keyword: query.keyword || undefined,
      organizationId: query.organizationId,
      enabled: query.enabled,
    })
    const records = res?.records ?? res?.list ?? []
    userList.value = records.map(mapUserToRow)
  } catch {
    userList.value = []
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => userList.value)

function onSearch() {
  loadUsers()
}

onMounted(() => {
  loadOrganizations()
  loadUsers()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>组织与人员管理</h2>
        <p>维护部门、岗位及人员与责任区域的关联关系。</p>
      </div>
      <a-space>
        <a-button>导入人员</a-button>
        <a-button type="primary">新增人员</a-button>
      </a-space>
    </div>

    <a-card class="page-section">
      <div class="filter-grid">
        <a-input
          v-model:value="query.keyword"
          placeholder="搜索姓名/手机号"
          allow-clear
          style="width: 200px"
          @press-enter="onSearch"
        />
        <a-select
          v-model:value="query.organizationId"
          placeholder="选择部门"
          allow-clear
          style="width: 160px"
          :options="orgTree.map((n) => ({ value: n.key, label: n.title }))"
        />
        <a-select
          v-model:value="query.enabled"
          placeholder="选择状态"
          allow-clear
          style="width: 120px"
        >
          <a-select-option :value="true">启用</a-select-option>
          <a-select-option :value="false">停用</a-select-option>
        </a-select>
        <a-button type="primary" @click="onSearch">查询</a-button>
      </div>
    </a-card>

    <div class="panel-grid page-section">
      <a-card title="组织结构" :bordered="false">
        <a-tree
          :tree-data="orgTree"
          default-expand-all
        />
      </a-card>

      <a-card title="岗位配置概览" :bordered="false">
        <a-list :data-source="[
          '巡检员：负责扫码巡检和现场记录',
          '班组长：负责任务监督、催办和闭环确认',
          '设备工程师：负责设备台账、模板和异常处理',
          '系统管理员：负责权限、参数、日志审计',
        ]">
          <template #renderItem="{ item }">
            <a-list-item>{{ item }}</a-list-item>
          </template>
        </a-list>
      </a-card>
    </div>

    <a-card title="人员列表" :bordered="false">
      <a-table :data-source="filteredUsers" :columns="columns" :loading="loading" row-key="key" />
    </a-card>
  </div>
</template>
