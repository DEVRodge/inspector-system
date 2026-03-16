<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { orgRows } from '../../mock/data'
import {
  dictionaryRows as dictRowsInit,
  permissionRows as permRowsInit,
  menuTreeData,
  deptRows as deptRowsInit,
  postRows as postRowsInit,
  logRows as logRowsInit,
} from '../../mock/modules/settings'
import {
  getDictionaryPage,
  createDictionary,
  updateDictionary,
  deleteDictionary,
} from '../../api/modules/dictionary'
import {
  getOrganizationsList,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '../../api/modules/organization'
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from '../../api/modules/position'
import { isMockEnabled } from '../../api/http'

const orgData = ref([...orgRows])
const dictionaryRows = ref([...dictRowsInit])
const permissionRows = ref([...permRowsInit])
const deptData = ref([...deptRowsInit])
const postData = ref([...postRowsInit])
const logData = ref([...logRowsInit])

const dictKeyword = ref('')
const permKeyword = ref('')
const personKeyword = ref('')
const deptKeyword = ref('')
const postKeyword = ref('')
const logOperator = ref('')
const logModule = ref('')
const logTimeRange = ref(null)

const dictFiltered = computed(() => {
  const k = (dictKeyword.value || '').trim().toLowerCase()
  if (!k) return dictionaryRows.value
  return dictionaryRows.value.filter(
    (r) =>
      (r.category || '').toLowerCase().includes(k) ||
      (r.code || '').toLowerCase().includes(k) ||
      (r.label || '').toLowerCase().includes(k)
  )
})
const permFiltered = computed(() => {
  const k = (permKeyword.value || '').trim().toLowerCase()
  if (!k) return permissionRows.value
  return permissionRows.value.filter((r) => (r.role || '').toLowerCase().includes(k))
})
const personFiltered = computed(() => {
  const k = (personKeyword.value || '').trim().toLowerCase()
  if (!k) return orgData.value
  return orgData.value.filter(
    (r) =>
      (r.username || '').toLowerCase().includes(k) ||
      (r.name || '').toLowerCase().includes(k) ||
      (r.phone || '').includes(k)
  )
})
const deptFiltered = computed(() => {
  const k = (deptKeyword.value || '').trim().toLowerCase()
  if (!k) return deptData.value
  return deptData.value.filter(
    (r) => (r.name || '').toLowerCase().includes(k) || (r.code || '').toLowerCase().includes(k)
  )
})
const postFiltered = computed(() => {
  const k = (postKeyword.value || '').trim().toLowerCase()
  if (!k) return postData.value
  return postData.value.filter(
    (r) =>
      (r.name || '').toLowerCase().includes(k) ||
      (r.code || '').toLowerCase().includes(k) ||
      (r.deptName || '').toLowerCase().includes(k)
  )
})
const logFiltered = computed(() => {
  let list = logData.value
  const op = (logOperator.value || '').trim().toLowerCase()
  const mod = (logModule.value || '').trim().toLowerCase()
  if (op) list = list.filter((r) => (r.operator || '').toLowerCase().includes(op))
  if (mod) list = list.filter((r) => (r.module || '').toLowerCase().includes(mod))
  if (logTimeRange.value && logTimeRange.value[0] && logTimeRange.value[1]) {
    const [s, e] = logTimeRange.value
    list = list.filter((r) => {
      const t = new Date(r.time).getTime()
      return t >= s.valueOf() && t <= e.valueOf()
    })
  }
  return list
})

const menuTree = ref(menuTreeData.map((n) => ({ ...n, selectable: false })))

/** 字典：后端 code=分类, name=标签, value=编码 */
function mapDictFromApi(row) {
  return {
    key: String(row.id),
    category: row.code ?? '',
    code: row.value ?? '',
    label: row.name ?? '',
    status: row.enabled ? '启用' : '停用',
  }
}
function mapDictToApi(form) {
  return {
    code: form.category,
    name: form.label,
    value: form.code,
    enabled: form.status === '启用',
  }
}

async function loadDictFromApi() {
  try {
    const res = await getDictionaryPage({ pageNumber: 1, pageSize: 1000 })
    const rows = res?.records ?? res?.data ?? (Array.isArray(res) ? res : [])
    dictionaryRows.value = rows.map(mapDictFromApi)
  } catch (e) {
    message.error('加载字典失败：' + (e?.message || '未知错误'))
  }
}

async function loadDeptFromApi() {
  try {
    const data = await getOrganizationsList()
    const arr = Array.isArray(data) ? data : data?.list ?? []
    deptData.value = arr.map((o) => ({
      key: String(o.id),
      name: o.name ?? '',
      code: o.code ?? o.name ?? '',
      sort: o.sort ?? o.sequence ?? 0,
      status: o.enabled ? '启用' : '停用',
    }))
  } catch (e) {
    message.error('加载部门失败：' + (e?.message || '未知错误'))
  }
}

async function loadPostFromApi() {
  try {
    const data = await getPositions({})
    const arr = Array.isArray(data) ? data : data?.records ?? data?.list ?? []
    deptData.value // ensure deptData loaded for deptName lookup
    const deptMap = Object.fromEntries(deptData.value.map((d) => [d.key, d.name]))
    postData.value = arr.map((o) => ({
      key: String(o.id),
      name: o.name ?? '',
      code: o.code ?? o.name ?? '',
      deptId: o.organizationId ? String(o.organizationId) : '',
      deptName: o.organizationId ? deptMap[String(o.organizationId)] ?? '' : '',
      sort: o.sort ?? 0,
      status: o.enabled ? '启用' : '停用',
    }))
  } catch (e) {
    message.error('加载岗位失败：' + (e?.message || '未知错误'))
  }
}

onMounted(async () => {
  if (!isMockEnabled) {
    await loadDictFromApi()
    await loadDeptFromApi()
    await loadPostFromApi()
  }
})

const memberVisible = ref(false)
const memberDetailVisible = ref(false)
const currentMember = ref(null)
const memberForm = reactive({
  key: '',
  username: '',
  password: '',
  deptId: undefined,
  postId: undefined,
  name: '',
  phone: '',
  area: '',
  status: '启用',
})

const dictVisible = ref(false)
const dictDetailVisible = ref(false)
const currentDict = ref(null)
const dictForm = reactive({ key: '', category: '', code: '', label: '', status: '启用' })

const permVisible = ref(false)
const permDetailVisible = ref(false)
const currentPerm = ref(null)
const permForm = reactive({ key: '', role: '', scope: '', checkedKeys: [] })

const deptVisible = ref(false)
const deptDetailVisible = ref(false)
const currentDept = ref(null)
const deptForm = reactive({ key: '', name: '', code: '', sort: 1, status: '启用' })

const postVisible = ref(false)
const postDetailVisible = ref(false)
const currentPost = ref(null)
const postForm = reactive({ key: '', name: '', code: '', deptId: '', deptName: '', sort: 1, status: '启用' })

const logDetailVisible = ref(false)
const currentLog = ref(null)

function fillMember(record) {
  if (record) {
    Object.assign(memberForm, {
      key: record.key,
      username: record.username ?? '',
      password: '',
      deptId: record.deptId ?? record.dept ? deptData.value.find((d) => d.name === record.dept)?.key : undefined,
      postId: record.postId ?? record.post ? postData.value.find((p) => p.name === record.post)?.key : undefined,
      name: record.name ?? '',
      phone: record.phone ?? '',
      area: record.area ?? '',
      status: record.status ?? '启用',
    })
  } else {
    Object.assign(memberForm, {
      key: '',
      username: '',
      password: '',
      deptId: undefined,
      postId: undefined,
      name: '',
      phone: '',
      area: '',
      status: '启用',
    })
  }
}
function openMemberCreate() {
  currentMember.value = null
  fillMember(null)
  memberVisible.value = true
}
function openMemberDetail(record) {
  currentMember.value = record
  memberDetailVisible.value = true
}
function openMemberEdit(record) {
  currentMember.value = record
  fillMember(record)
  memberVisible.value = true
}
function saveMember() {
  if (!memberForm.name || memberForm.deptId == null || memberForm.deptId === '' || memberForm.postId == null || memberForm.postId === '') {
    message.warning('请填写姓名并选择部门和岗位')
    return
  }
  if (!currentMember.value && !memberForm.password) {
    message.warning('请填写密码')
    return
  }
  if (!currentMember.value && !memberForm.phone) {
    message.warning('请填写手机号（将作为登录账号）')
    return
  }
  const dept = deptData.value.find((d) => d.key === memberForm.deptId)
  const post = postData.value.find((p) => p.key === memberForm.postId)
  const deptName = dept?.name ?? ''
  const postName = post?.name ?? ''
  const payload = {
    username: memberForm.phone,
    deptId: memberForm.deptId,
    dept: deptName,
    postId: memberForm.postId,
    post: postName,
    name: memberForm.name,
    phone: memberForm.phone,
    area: memberForm.area,
    status: memberForm.status,
  }
  if (currentMember.value) {
    const index = orgData.value.findIndex((item) => item.key === currentMember.value.key)
    orgData.value[index] = { ...currentMember.value, ...payload }
    message.success('账号信息已更新')
  } else {
    orgData.value.unshift({ ...payload, key: `${Date.now()}` })
    message.success('账号已创建')
  }
  memberVisible.value = false
}
function removeMember(record) {
  Modal.confirm({
    title: `确认删除账号 ${record.username || record.name} 吗？`,
    onOk() {
      orgData.value = orgData.value.filter((item) => item.key !== record.key)
      message.success('账号已删除')
    },
  })
}

function fillDict(record) {
  if (record) Object.assign(dictForm, { ...record })
  else Object.assign(dictForm, { key: '', category: '', code: '', label: '', status: '启用' })
}
function openDictCreate() {
  currentDict.value = null
  fillDict(null)
  dictVisible.value = true
}
function openDictDetail(record) {
  currentDict.value = record
  dictDetailVisible.value = true
}
function openDictEdit(record) {
  currentDict.value = record
  fillDict(record)
  dictVisible.value = true
}
async function saveDict() {
  if (!dictForm.category || !dictForm.code || !dictForm.label) {
    message.warning('请填写分类、编码和标签')
    return
  }
  if (isMockEnabled) {
    if (currentDict.value) {
      const index = dictionaryRows.value.findIndex((item) => item.key === currentDict.value.key)
      dictionaryRows.value[index] = { ...dictForm }
      message.success('字典项已更新')
    } else {
      dictionaryRows.value.unshift({ ...dictForm, key: `${Date.now()}` })
      message.success('字典项已新增')
    }
    dictVisible.value = false
    return
  }
  try {
    const payload = mapDictToApi(dictForm)
    if (currentDict.value) {
      await updateDictionary(currentDict.value.key, payload)
      const index = dictionaryRows.value.findIndex((item) => item.key === currentDict.value.key)
      dictionaryRows.value[index] = { ...dictForm }
      message.success('字典项已更新')
    } else {
      const res = await createDictionary(payload)
      dictionaryRows.value.unshift(mapDictFromApi(res ?? { id: Date.now(), ...payload }))
      message.success('字典项已新增')
    }
    dictVisible.value = false
  } catch (e) {
    message.error('保存失败：' + (e?.message || '未知错误'))
    throw e
  }
}
function removeDict(record) {
  Modal.confirm({
    title: `确认删除字典项「${record.label}」吗？`,
    async onOk() {
      if (isMockEnabled) {
        dictionaryRows.value = dictionaryRows.value.filter((item) => item.key !== record.key)
        message.success('已删除')
        return
      }
      try {
        await deleteDictionary(record.key)
        dictionaryRows.value = dictionaryRows.value.filter((item) => item.key !== record.key)
        message.success('已删除')
      } catch (e) {
        message.error('删除失败：' + (e?.message || '未知错误'))
      }
    },
  })
}

function scopeFromCheckedKeys(keys) {
  if (!keys || !keys.length) return '无'
  const titles = menuTreeData.filter((n) => keys.includes(n.key)).map((n) => n.title)
  return titles.join('、') || '无'
}
function fillPerm(record) {
  if (record) {
    permForm.key = record.key
    permForm.role = record.role
    permForm.scope = record.scope
    permForm.checkedKeys = record.checkedKeys ? [...record.checkedKeys] : []
  } else {
    permForm.key = ''
    permForm.role = ''
    permForm.scope = ''
    permForm.checkedKeys = []
  }
}
function onPermTreeCheck(keys) {
  permForm.checkedKeys = keys
  permForm.scope = scopeFromCheckedKeys(keys)
}
function openPermCreate() {
  currentPerm.value = null
  fillPerm(null)
  permVisible.value = true
}
function openPermDetail(record) {
  currentPerm.value = record
  permDetailVisible.value = true
}
function openPermEdit(record) {
  currentPerm.value = record
  fillPerm(record)
  permVisible.value = true
}
function savePerm() {
  if (!permForm.role) {
    message.warning('请填写角色名称')
    return
  }
  permForm.scope = scopeFromCheckedKeys(permForm.checkedKeys)
  if (currentPerm.value) {
    const index = permissionRows.value.findIndex((item) => item.key === currentPerm.value.key)
    permissionRows.value[index] = { ...permissionRows.value[index], ...permForm }
    message.success('角色已更新')
  } else {
    permissionRows.value.unshift({
      key: `${Date.now()}`,
      role: permForm.role,
      scope: permForm.scope,
      users: 0,
      checkedKeys: permForm.checkedKeys,
    })
    message.success('角色已新增')
  }
  permVisible.value = false
}
function removePerm(record) {
  Modal.confirm({
    title: `确认删除角色「${record.role}」吗？`,
    content: record.users > 0 ? `将影响 ${record.users} 个用户。` : undefined,
    onOk() {
      permissionRows.value = permissionRows.value.filter((item) => item.key !== record.key)
      message.success('已删除')
    },
  })
}

function fillDept(record) {
  if (record) Object.assign(deptForm, { ...record })
  else Object.assign(deptForm, { key: '', name: '', code: '', sort: 1, status: '启用' })
}
function openDeptCreate() {
  currentDept.value = null
  fillDept(null)
  deptVisible.value = true
}
function openDeptDetail(record) {
  currentDept.value = record
  deptDetailVisible.value = true
}
function openDeptEdit(record) {
  currentDept.value = record
  fillDept(record)
  deptVisible.value = true
}
async function saveDept() {
  const needCode = isMockEnabled
  if (!deptForm.name || (needCode && !deptForm.code)) {
    message.warning(needCode ? '请填写部门名称和编码' : '请填写部门名称')
    return
  }
  if (isMockEnabled) {
    if (currentDept.value) {
      const index = deptData.value.findIndex((item) => item.key === currentDept.value.key)
      deptData.value[index] = { ...deptForm }
      message.success('部门已更新')
    } else {
      deptData.value.unshift({ ...deptForm, key: `${Date.now()}` })
      message.success('部门已新增')
    }
    deptVisible.value = false
    return
  }
  try {
    const payload = {
      name: deptForm.name,
      sort: deptForm.sort ?? 0,
      enabled: deptForm.status === '启用',
      remark: '',
    }
    if (currentDept.value) {
      await updateOrganization(currentDept.value.key, payload)
      const index = deptData.value.findIndex((item) => item.key === currentDept.value.key)
      deptData.value[index] = { ...deptForm }
      message.success('部门已更新')
    } else {
      const res = await createOrganization(payload)
      const newRow = {
        key: String(res?.id ?? Date.now()),
        name: deptForm.name,
        code: deptForm.code ?? deptForm.name,
        sort: deptForm.sort ?? 0,
        status: deptForm.status,
      }
      deptData.value.unshift(newRow)
      message.success('部门已新增')
    }
    deptVisible.value = false
  } catch (e) {
    message.error('保存失败：' + (e?.message || '未知错误'))
    throw e
  }
}
function removeDept(record) {
  Modal.confirm({
    title: `确认删除部门「${record.name}」吗？`,
    async onOk() {
      if (isMockEnabled) {
        deptData.value = deptData.value.filter((item) => item.key !== record.key)
        message.success('已删除')
        return
      }
      try {
        await deleteOrganization(record.key)
        deptData.value = deptData.value.filter((item) => item.key !== record.key)
        message.success('已删除')
      } catch (e) {
        message.error('删除失败：' + (e?.message || '未知错误'))
      }
    },
  })
}

function fillPost(record) {
  if (record) Object.assign(postForm, { ...record })
  else Object.assign(postForm, { key: '', name: '', code: '', deptId: '', deptName: '', sort: 1, status: '启用' })
}
function openPostCreate() {
  currentPost.value = null
  fillPost(null)
  postVisible.value = true
}
function openPostDetail(record) {
  currentPost.value = record
  postDetailVisible.value = true
}
function openPostEdit(record) {
  currentPost.value = record
  fillPost(record)
  postVisible.value = true
}
async function savePost() {
  const needCode = isMockEnabled
  if (!postForm.name || (needCode && !postForm.code)) {
    message.warning(needCode ? '请填写岗位名称和编码' : '请填写岗位名称')
    return
  }
  const dept = deptData.value.find((d) => d.key === postForm.deptId)
  if (dept) postForm.deptName = dept.name
  if (isMockEnabled) {
    if (currentPost.value) {
      const index = postData.value.findIndex((item) => item.key === currentPost.value.key)
      postData.value[index] = { ...postForm }
      message.success('岗位已更新')
    } else {
      postData.value.unshift({ ...postForm, key: `${Date.now()}` })
      message.success('岗位已新增')
    }
    postVisible.value = false
    return
  }
  try {
    const payload = {
      name: postForm.name,
      sort: postForm.sort ?? 0,
      enabled: postForm.status === '启用',
      remark: '',
    }
    if (currentPost.value) {
      await updatePosition(currentPost.value.key, payload)
      const index = postData.value.findIndex((item) => item.key === currentPost.value.key)
      postData.value[index] = { ...postForm }
      message.success('岗位已更新')
    } else {
      const res = await createPosition(payload)
      const newRow = {
        key: String(res?.id ?? Date.now()),
        name: postForm.name,
        code: postForm.code ?? postForm.name,
        deptId: postForm.deptId ?? '',
        deptName: postForm.deptName ?? '',
        sort: postForm.sort ?? 0,
        status: postForm.status,
      }
      postData.value.unshift(newRow)
      message.success('岗位已新增')
    }
    postVisible.value = false
  } catch (e) {
    message.error('保存失败：' + (e?.message || '未知错误'))
    throw e
  }
}
function removePost(record) {
  Modal.confirm({
    title: `确认删除岗位「${record.name}」吗？`,
    async onOk() {
      if (isMockEnabled) {
        postData.value = postData.value.filter((item) => item.key !== record.key)
        message.success('已删除')
        return
      }
      try {
        await deletePosition(record.key)
        postData.value = postData.value.filter((item) => item.key !== record.key)
        message.success('已删除')
      } catch (e) {
        message.error('删除失败：' + (e?.message || '未知错误'))
      }
    },
  })
}

function openLogDetail(record) {
  currentLog.value = record
  logDetailVisible.value = true
}
function exportLogs() {
  message.info('导出接口对接后生效，将导出当前筛选结果。')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>系统管理</h2>
        <p>数据字典、权限管理、部门岗位人员与日志审计。</p>
      </div>
    </div>

    <a-card :bordered="false">
      <a-tabs>
        <a-tab-pane key="dictionary" tab="数据字典设置">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="dictKeyword" placeholder="搜索分类/编码/标签" allow-clear style="width: 280px" />
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openDictCreate">新增字典项</a-button>
            </div>
          </div>
          <a-table :data-source="dictFiltered" :pagination="false" row-key="key">
            <a-table-column title="分类" data-index="category" key="category" />
            <a-table-column title="编码" data-index="code" key="code" />
            <a-table-column title="标签" data-index="label" key="label" />
            <a-table-column title="状态" data-index="status" key="status" width="100" />
            <a-table-column title="操作" key="action" width="180">
              <template #default="{ record }">
                <a-space :size="4">
                  <a-button type="link" size="small" @click="openDictDetail(record)">查看</a-button>
                  <a-button type="link" size="small" @click="openDictEdit(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="removeDict(record)">删除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="permission" tab="权限管理">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="permKeyword" placeholder="搜索角色名称" allow-clear style="width: 280px" />
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openPermCreate">新增角色</a-button>
            </div>
          </div>
          <a-table :data-source="permFiltered" :pagination="false" row-key="key">
            <a-table-column title="角色名称" data-index="role" key="role" width="180" />
            <a-table-column title="权限范围" data-index="scope" key="scope" />
            <a-table-column title="关联用户数" data-index="users" key="users" width="120" />
            <a-table-column title="操作" key="action" width="180">
              <template #default="{ record }">
                <a-space :size="4">
                  <a-button type="link" size="small" @click="openPermDetail(record)">查看</a-button>
                  <a-button type="link" size="small" @click="openPermEdit(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="removePerm(record)">删除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="dept" tab="部门管理">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="deptKeyword" placeholder="搜索部门名称/编码" allow-clear style="width: 280px" />
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openDeptCreate">新增部门</a-button>
            </div>
          </div>
          <a-table :data-source="deptFiltered" :pagination="false" row-key="key">
            <a-table-column title="部门名称" data-index="name" key="name" width="140" />
            <a-table-column title="部门编码" data-index="code" key="code" width="120" />
            <a-table-column title="排序" data-index="sort" key="sort" width="80" />
            <a-table-column title="状态" data-index="status" key="status" width="100" />
            <a-table-column title="操作" key="action" width="180">
              <template #default="{ record }">
                <a-space :size="4">
                  <a-button type="link" size="small" @click="openDeptDetail(record)">查看</a-button>
                  <a-button type="link" size="small" @click="openDeptEdit(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="removeDept(record)">删除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="post" tab="岗位管理">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="postKeyword" placeholder="搜索岗位/部门" allow-clear style="width: 280px" />
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openPostCreate">新增岗位</a-button>
            </div>
          </div>
          <a-table :data-source="postFiltered" :pagination="false" row-key="key">
            <a-table-column title="岗位名称" data-index="name" key="name" width="120" />
            <a-table-column title="岗位编码" data-index="code" key="code" width="120" />
            <a-table-column title="所属部门" data-index="deptName" key="deptName" width="120" />
            <a-table-column title="排序" data-index="sort" key="sort" width="80" />
            <a-table-column title="状态" data-index="status" key="status" width="100" />
            <a-table-column title="操作" key="action" width="180">
              <template #default="{ record }">
                <a-space :size="4">
                  <a-button type="link" size="small" @click="openPostDetail(record)">查看</a-button>
                  <a-button type="link" size="small" @click="openPostEdit(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="removePost(record)">删除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="person" tab="人员管理">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="personKeyword" placeholder="搜索账号/姓名/手机号" allow-clear style="width: 280px" />
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openMemberCreate">新建账号</a-button>
            </div>
          </div>
          <a-table :data-source="personFiltered" :pagination="false" row-key="key">
            <a-table-column title="账号" data-index="username" key="username" width="110" />
            <a-table-column title="部门" data-index="dept" key="dept" width="120" />
            <a-table-column title="岗位" data-index="post" key="post" width="120" />
            <a-table-column title="姓名" data-index="name" key="name" width="100" />
            <a-table-column title="手机号" data-index="phone" key="phone" width="130" />
            <a-table-column title="责任区域" data-index="area" key="area" />
            <a-table-column title="状态" data-index="status" key="status" width="100" />
            <a-table-column title="操作" key="action" width="180">
              <template #default="{ record }">
                <a-space :size="4">
                  <a-button type="link" size="small" @click="openMemberDetail(record)">查看</a-button>
                  <a-button type="link" size="small" @click="openMemberEdit(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="removeMember(record)">删除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="logs" tab="日志审计">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="logOperator" placeholder="操作人" allow-clear style="width: 140px" />
              <a-input v-model:value="logModule" placeholder="模块" allow-clear style="width: 140px" />
              <a-range-picker v-model:value="logTimeRange" show-time style="width: 320px" />
            </div>
            <div class="table-toolbar__right">
              <a-button @click="exportLogs">导出日志</a-button>
            </div>
          </div>
          <a-table :data-source="logFiltered" :pagination="false" row-key="key">
            <a-table-column title="时间" data-index="time" key="time" width="180" />
            <a-table-column title="操作人" data-index="operator" key="operator" width="100" />
            <a-table-column title="模块" data-index="module" key="module" width="120" />
            <a-table-column title="操作内容" data-index="action" key="action" />
            <a-table-column title="结果" data-index="result" key="result" width="100" />
            <a-table-column title="操作" key="action" width="100">
              <template #default="{ record }">
                <a-button type="link" size="small" @click="openLogDetail(record)">查看</a-button>
              </template>
            </a-table-column>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-drawer v-model:open="memberDetailVisible" title="账号详情" width="420">
      <a-descriptions v-if="currentMember" :column="1" bordered size="small">
        <a-descriptions-item label="账号">{{ currentMember.username }}</a-descriptions-item>
        <a-descriptions-item label="部门">{{ currentMember.dept }}</a-descriptions-item>
        <a-descriptions-item label="岗位">{{ currentMember.post }}</a-descriptions-item>
        <a-descriptions-item label="姓名">{{ currentMember.name }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ currentMember.phone }}</a-descriptions-item>
        <a-descriptions-item label="责任区域">{{ currentMember.area }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentMember.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="memberVisible" :title="currentMember ? '编辑账号' : '新建账号'" @ok="saveMember">
      <a-form layout="vertical">
        <a-form-item v-if="!currentMember" label="密码" required>
          <a-input-password v-model:value="memberForm.password" placeholder="登录密码" autocomplete="new-password" />
        </a-form-item>
        <a-form-item v-if="currentMember" label="密码">
          <a-input-password v-model:value="memberForm.password" placeholder="留空则不修改" autocomplete="new-password" />
        </a-form-item>
        <a-form-item label="部门" required>
          <a-select v-model:value="memberForm.deptId" placeholder="请选择部门" allow-clear style="width: 100%">
            <a-select-option v-for="d in deptData" :key="d.key" :value="d.key">{{ d.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="岗位" required>
          <a-select v-model:value="memberForm.postId" placeholder="请选择岗位" allow-clear style="width: 100%">
            <a-select-option v-for="p in postData" :key="p.key" :value="p.key">{{ p.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="姓名" required><a-input v-model:value="memberForm.name" placeholder="姓名" /></a-form-item>
        <a-form-item :label="currentMember ? '手机号' : '手机号（登录账号）'" :required="!currentMember">
          <a-input v-model:value="memberForm.phone" placeholder="手机号" />
        </a-form-item>
        <a-form-item label="责任区域"><a-input v-model:value="memberForm.area" placeholder="责任区域" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="memberForm.status">
            <a-select-option value="启用">启用</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="dictDetailVisible" title="字典项详情" width="400">
      <a-descriptions v-if="currentDict" :column="1" bordered size="small">
        <a-descriptions-item label="分类">{{ currentDict.category }}</a-descriptions-item>
        <a-descriptions-item label="编码">{{ currentDict.code }}</a-descriptions-item>
        <a-descriptions-item label="标签">{{ currentDict.label }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentDict.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="dictVisible" :title="currentDict ? '编辑字典项' : '新增字典项'" @ok="saveDict">
      <a-form layout="vertical">
        <a-form-item label="分类"><a-input v-model:value="dictForm.category" placeholder="如：巡检结果状态" /></a-form-item>
        <a-form-item label="编码"><a-input v-model:value="dictForm.code" placeholder="如：INSPECT_OK" /></a-form-item>
        <a-form-item label="标签"><a-input v-model:value="dictForm.label" placeholder="展示名称" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="dictForm.status">
            <a-select-option value="启用">启用</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="permDetailVisible" title="角色详情" width="420">
      <a-descriptions v-if="currentPerm" :column="1" bordered size="small">
        <a-descriptions-item label="角色名称">{{ currentPerm.role }}</a-descriptions-item>
        <a-descriptions-item label="权限范围">{{ currentPerm.scope }}</a-descriptions-item>
        <a-descriptions-item label="关联用户数">{{ currentPerm.users }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="permVisible" :title="currentPerm ? '编辑角色' : '新增角色'" width="520" @ok="savePerm">
      <a-form layout="vertical">
        <a-form-item label="角色名称" required>
          <a-input v-model:value="permForm.role" placeholder="角色名称" />
        </a-form-item>
        <a-form-item label="权限范围（勾选菜单）">
          <a-tree
            :tree-data="menuTree"
            :checked-keys="permForm.checkedKeys"
            checkable
            :selectable="false"
            @check="(keys) => onPermTreeCheck(keys)"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="deptDetailVisible" title="部门详情" width="400">
      <a-descriptions v-if="currentDept" :column="1" bordered size="small">
        <a-descriptions-item label="部门名称">{{ currentDept.name }}</a-descriptions-item>
        <a-descriptions-item label="部门编码">{{ currentDept.code }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ currentDept.sort }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentDept.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="deptVisible" :title="currentDept ? '编辑部门' : '新增部门'" @ok="saveDept">
      <a-form layout="vertical">
        <a-form-item label="部门名称" required><a-input v-model:value="deptForm.name" /></a-form-item>
        <a-form-item label="部门编码" required><a-input v-model:value="deptForm.code" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="deptForm.sort" :min="0" style="width: 100%" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="deptForm.status">
            <a-select-option value="启用">启用</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="postDetailVisible" title="岗位详情" width="400">
      <a-descriptions v-if="currentPost" :column="1" bordered size="small">
        <a-descriptions-item label="岗位名称">{{ currentPost.name }}</a-descriptions-item>
        <a-descriptions-item label="岗位编码">{{ currentPost.code }}</a-descriptions-item>
        <a-descriptions-item label="所属部门">{{ currentPost.deptName }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ currentPost.sort }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentPost.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="postVisible" :title="currentPost ? '编辑岗位' : '新增岗位'" @ok="savePost">
      <a-form layout="vertical">
        <a-form-item label="岗位名称" required><a-input v-model:value="postForm.name" /></a-form-item>
        <a-form-item label="岗位编码" required><a-input v-model:value="postForm.code" /></a-form-item>
        <a-form-item label="所属部门">
          <a-select v-model:value="postForm.deptId" placeholder="选择部门" allow-clear style="width: 100%">
            <a-select-option v-for="d in deptData" :key="d.key" :value="d.key">{{ d.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="postForm.sort" :min="0" style="width: 100%" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="postForm.status">
            <a-select-option value="启用">启用</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="logDetailVisible" title="日志详情" width="420">
      <a-descriptions v-if="currentLog" :column="1" bordered size="small">
        <a-descriptions-item label="时间">{{ currentLog.time }}</a-descriptions-item>
        <a-descriptions-item label="操作人">{{ currentLog.operator }}</a-descriptions-item>
        <a-descriptions-item label="模块">{{ currentLog.module }}</a-descriptions-item>
        <a-descriptions-item label="操作内容">{{ currentLog.action }}</a-descriptions-item>
        <a-descriptions-item label="结果">{{ currentLog.result }}</a-descriptions-item>
        <a-descriptions-item v-if="currentLog.ip" label="IP">{{ currentLog.ip }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>
  </div>
</template>
