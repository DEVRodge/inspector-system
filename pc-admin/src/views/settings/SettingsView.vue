<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { DEVICE_TYPE_DICT_CODE } from '../../mock/modules/settings'
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
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '../../api/modules/user'
import {
  getRoles,
  getRoleMenus,
  getRoleUserIds,
  createRole,
  updateRole,
  deleteRole,
  saveRoleMenuMapping,
  deleteRoleMenuMapping,
} from '../../api/modules/role'
import { getMenusTree } from '../../api/modules/menu'

const orgData = ref([])
const roleData = ref([])
const dictionaryRows = ref([])
const permissionRows = ref([])
const deptData = ref([])
const postData = ref([])
const logData = ref([])

const dictKeyword = ref('')
const permKeyword = ref('')
const personKeyword = ref('')
const deptKeyword = ref('')
const postKeyword = ref('')
const logOperator = ref('')
const logModule = ref('')
const logTimeRange = ref(null)

const dictFiltered = computed(() => dictionaryRows.value)
const permFiltered = computed(() => permissionRows.value)
const personFiltered = computed(() => orgData.value)
const deptFiltered = computed(() => deptData.value)
const postFiltered = computed(() => {
  const k = (postKeyword.value || '').trim().toLowerCase()
  if (!k) return postData.value
  return postData.value.filter((r) => (r.name || '').toLowerCase().includes(k))
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

const menuTree = ref([])
const permPagination = reactive({ current: 1, pageSize: 10, total: 0 })

/** 字典：后端 code=分类, name=标签, value=编码 */
function mapDictFromApi(row) {
  return {
    key: String(row.id),
    category: row.code ?? '',
    code: row.value ?? '',
    label: row.name ?? '',
    sort: row.sort ?? 0,
    status: row.enabled ? '启用' : '停用',
  }
}
function mapDictToApi(form) {
  return {
    code: form.category,
    name: form.label,
    value: form.code || '',
    sort: form.sort ?? 0,
    remark: form.remark ?? '',
    enabled: form.status === '启用',
  }
}

async function loadDictFromApi() {
  try {
    const params = { pageNumber: 1, pageSize: 1000, code: DEVICE_TYPE_DICT_CODE }
    if (dictKeyword.value?.trim()) params.keyword = dictKeyword.value.trim()
    const res = await getDictionaryPage(params)
    const rows = res?.records ?? res?.data ?? (Array.isArray(res) ? res : [])
    dictionaryRows.value = rows.map(mapDictFromApi)
  } catch (e) {
    message.error('加载字典失败：' + (e?.message || '未知错误'))
  }
}

/** 递归扁平化树形部门 */
function flattenOrgs(tree, parentId = null) {
  const result = []
  for (const o of tree || []) {
    result.push({
      key: String(o.id),
      id: o.id,
      parentId: o.parentId ?? parentId,
      name: o.name ?? '',
      sort: o.sort ?? o.sequence ?? 0,
      status: o.enabled ? '启用' : '停用',
    })
    if (o.children?.length) {
      result.push(...flattenOrgs(o.children, o.id))
    }
  }
  return result
}

async function loadDeptFromApi() {
  try {
    const params = {}
    if (deptKeyword.value?.trim()) params.name = deptKeyword.value.trim()
    const data = await getOrganizationsList(params)
    const arr = Array.isArray(data) ? data : data?.list ?? []
    deptData.value = flattenOrgs(arr)
  } catch (e) {
    message.error('加载部门失败：' + (e?.message || '未知错误'))
  }
}

const postPagination = reactive({ current: 1, pageSize: 10, total: 0 })

async function loadPostFromApi() {
  try {
    const params = { pageNumber: postPagination.current, pageSize: postPagination.pageSize }
    if (postKeyword.value?.trim()) params.name = postKeyword.value.trim()
    const data = await getPositions(params)
    const arr = data?.records ?? data?.list ?? (Array.isArray(data) ? data : [])
    postPagination.total = data?.total ?? arr.length
    postData.value = arr.map((o) => ({
      key: String(o.id),
      name: o.name ?? '',
      sort: o.sort ?? 0,
      status: o.enabled ? '启用' : '停用',
    }))
  } catch (e) {
    message.error('加载岗位失败：' + (e?.message || '未知错误'))
  }
}

function onPostPageChange(page, pageSize) {
  postPagination.current = page
  postPagination.pageSize = pageSize
  loadPostFromApi()
}

async function loadPersonFromApi() {
  const baseParams = { pageNumber: personPagination.current, pageSize: personPagination.pageSize }
  if (personKeyword.value?.trim()) baseParams.keyword = personKeyword.value.trim()
  try {
    const data = await getUsers(baseParams)
    const inner = data?.data ?? data
    const arr = inner?.records ?? inner?.list ?? data?.records ?? data?.list ?? []
    personPagination.total = inner?.total ?? data?.total ?? arr.length
    orgData.value = arr.map((u) => {
      const orgs = u.organizations ?? []
      const positions = u.positions ?? []
      const roles = u.roles ?? []
      return {
        key: String(u.id),
        username: u.username ?? '',
        name: u.name ?? '',
        phone: u.mobile ?? u.username ?? '',
        dept: orgs.map((o) => o.name).join('、') || '-',
        post: positions.map((p) => p.name).join('、') || '-',
        roles: roles.map((r) => r.name).join('、') || '-',
        status: u.enabled ? '启用' : '停用',
      }
    })
  } catch (e) {
    orgData.value = []
    personPagination.total = 0
    const status = e?.response?.status
    const msg = status === 500
      ? '加载用户失败（后端 500 错误，请检查 /users 接口或联系后端排查）'
      : '加载用户失败：' + (e?.message || '未知错误')
    message.error(msg)
  }
}

async function loadRoleFromApi() {
  try {
    const data = await getRoles({ pageNumber: 1, pageSize: 500 })
    const inner = data?.data ?? data
    const arr = Array.isArray(inner) ? inner : (inner?.records ?? inner?.list ?? data?.records ?? data?.list ?? [])
    roleData.value = arr.map((r) => ({
      key: String(r.id),
      id: r.id,
      name: r.name ?? r.role ?? r.roleName ?? '',
    }))
  } catch (e) {
    roleData.value = []
    message.error('加载角色失败：' + (e?.message || '未知错误'))
  }
}

function onPersonPageChange(page, pageSize) {
  personPagination.current = page
  personPagination.pageSize = pageSize
  loadPersonFromApi()
}

onMounted(async () => {
  await loadDictFromApi()
  await loadDeptFromApi()
  await loadPostFromApi()
  await loadPersonFromApi()
  await loadRoleFromApi()
  await loadPermFromApi()
  await loadMenuTreeFromApi()
})

const personPagination = reactive({ current: 1, pageSize: 10, total: 0 })
const memberVisible = ref(false)
const memberDetailVisible = ref(false)
const currentMember = ref(null)
const memberForm = reactive({
  key: '',
  username: '',
  password: '',
  organizationIds: [],
  positionIds: [],
  roleIds: [],
  name: '',
  mobile: '',
  status: '启用',
})

const dictVisible = ref(false)
const dictDetailVisible = ref(false)
const currentDict = ref(null)
const dictForm = reactive({ key: '', category: '', code: '', label: '', sort: 0, status: '启用' })

const permVisible = ref(false)
const permDetailVisible = ref(false)
const currentPerm = ref(null)
const permForm = reactive({ key: '', role: '', scope: '', status: '启用', remark: '', checkedKeys: [] })

const deptVisible = ref(false)
const deptDetailVisible = ref(false)
const currentDept = ref(null)
const deptForm = reactive({ key: '', name: '', parentId: undefined, remark: '', sort: 0, status: '启用' })

const postVisible = ref(false)
const postDetailVisible = ref(false)
const currentPost = ref(null)
const postForm = reactive({ key: '', name: '', sort: 0, remark: '', status: '启用' })

const logDetailVisible = ref(false)
const currentLog = ref(null)

function fillMember(record) {
  if (record) {
    const orgIds = record.organizationIds ?? (record.deptId ? [record.deptId] : [])
    const posIds = record.positionIds ?? (record.postId ? [record.postId] : [])
    Object.assign(memberForm, {
      key: record.key,
      username: record.username ?? '',
      password: '',
      organizationIds: Array.isArray(orgIds) ? orgIds : [orgIds].filter(Boolean),
      positionIds: Array.isArray(posIds) ? posIds : [posIds].filter(Boolean),
      roleIds: record.roleIds ?? [],
      name: record.name ?? '',
      mobile: record.mobile ?? record.phone ?? '',
      status: record.status ?? '启用',
    })
  } else {
    Object.assign(memberForm, {
      key: '',
      username: '',
      password: '',
      organizationIds: [],
      positionIds: [],
      roleIds: [],
      name: '',
      mobile: '',
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
async function openMemberEdit(record) {
  currentMember.value = record
  if (record?.key) {
    try {
      const u = await getUserById(record.key)
      fillMember({
        key: String(u.id),
        username: u.username,
        organizationIds: (u.organizations ?? []).map((o) => o.id),
        positionIds: (u.positions ?? []).map((p) => p.id),
        roleIds: (u.roles ?? []).map((r) => r.id),
        name: u.name,
        mobile: u.mobile ?? u.username,
        status: u.enabled ? '启用' : '停用',
      })
    } catch (e) {
      message.error('获取用户详情失败')
      return
    }
  } else {
    fillMember(record)
  }
  memberVisible.value = true
}
async function saveMember() {
  if (!memberForm.name) {
    message.warning('请填写姓名')
    return
  }
  if (!currentMember.value && !memberForm.password) {
    message.warning('请填写密码')
    return
  }
  const username = memberForm.username || memberForm.mobile
  if (!username) {
    message.warning('请填写账号（手机号或用户名）')
    return
  }
  try {
    const payload = {
      name: memberForm.name,
      username,
      mobile: memberForm.mobile || username,
      enabled: memberForm.status === '启用',
      organizationIds: (memberForm.organizationIds || []).map(Number).filter(Boolean),
      positionIds: (memberForm.positionIds || []).map(Number).filter(Boolean),
      roleIds: (memberForm.roleIds || []).map(Number).filter(Boolean),
    }
    if (memberForm.password) payload.password = memberForm.password
    if (currentMember.value) {
      await updateUser(currentMember.value.key, payload)
      message.success('账号信息已更新')
      await loadPersonFromApi()
    } else {
      await createUser(payload)
      message.success('账号已创建')
      personKeyword.value = ''
      personPagination.current = 1
      await loadPersonFromApi()
    }
    memberVisible.value = false
  } catch (e) {
    message.error('保存失败：' + (e?.message || '未知错误'))
    throw e
  }
}
function removeMember(record) {
  Modal.confirm({
    title: `确认删除账号 ${record.username || record.name} 吗？`,
    async onOk() {
      try {
        await deleteUser(record.key)
        message.success('账号已删除')
        await loadPersonFromApi()
      } catch (e) {
        message.error('删除失败：' + (e?.message || '未知错误'))
      }
    },
  })
}

const resetPasswordVisible = ref(false)
const resetPasswordNew = ref('')
function openResetPassword() {
  resetPasswordNew.value = ''
  resetPasswordVisible.value = true
}
async function doResetPassword() {
  if (!resetPasswordNew.value?.trim()) {
    message.warning('请输入新密码')
    return
  }
  if (!currentMember.value?.key) return
  try {
    await resetUserPassword(currentMember.value.key, { newPassword: resetPasswordNew.value.trim() })
    message.success('密码已重置')
    resetPasswordVisible.value = false
  } catch (e) {
    message.error('重置失败：' + (e?.message || '未知错误'))
  }
}

function fillDict(record) {
  if (record) Object.assign(dictForm, { ...record, category: DEVICE_TYPE_DICT_CODE, sort: record.sort ?? 0 })
  else Object.assign(dictForm, { key: '', category: DEVICE_TYPE_DICT_CODE, code: '', label: '', sort: 0, status: '启用' })
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
  if (!dictForm.label) {
    message.warning('请填写设备类型名称')
    return
  }
  try {
    const payload = mapDictToApi({ ...dictForm, category: DEVICE_TYPE_DICT_CODE })
    if (currentDict.value) {
      await updateDictionary(currentDict.value.key, payload)
      const index = dictionaryRows.value.findIndex((item) => item.key === currentDict.value.key)
      dictionaryRows.value[index] = { ...dictForm }
      message.success('设备类型已更新')
    } else {
      const res = await createDictionary(payload)
      dictionaryRows.value.unshift(mapDictFromApi(res ?? { id: Date.now(), ...payload }))
      message.success('设备类型已新增')
    }
    dictVisible.value = false
  } catch (e) {
    message.error('保存失败：' + (e?.message || '未知错误'))
    throw e
  }
}
function removeDict(record) {
  Modal.confirm({
    title: `确认删除设备类型「${record.label}」吗？`,
    async onOk() {
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

function menuVoToTree(nodes) {
  return (nodes || []).map((n) => ({
    key: String(n.id),
    id: n.id,
    title: n.name ?? n.code ?? '',
    selectable: false,
    children: n.children?.length ? menuVoToTree(n.children) : undefined,
  }))
}

function collectMenuIds(nodes) {
  const ids = []
  for (const n of nodes || []) {
    ids.push(n.id)
    if (n.children?.length) ids.push(...collectMenuIds(n.children))
  }
  return ids
}

function scopeFromCheckedKeys(keys) {
  if (!keys || !keys.length) return '无'
  const findTitles = (nodes, checked) => {
    const titles = []
    for (const n of nodes || []) {
      if (checked.includes(String(n.key))) titles.push(n.title)
      if (n.children?.length) titles.push(...findTitles(n.children, checked))
    }
    return titles
  }
  return findTitles(menuTree.value, keys).join('、') || '无'
}

async function loadPermFromApi() {
  try {
    const data = await getRoles({ pageNumber: permPagination.current, pageSize: permPagination.pageSize, keyword: permKeyword.value?.trim() })
    const inner = data?.data ?? data
    const arr = Array.isArray(inner) ? inner : (inner?.records ?? inner?.list ?? data?.records ?? data?.list ?? [])
    permPagination.total = inner?.total ?? data?.total ?? arr.length
    permissionRows.value = await Promise.all(
      arr.map(async (r) => {
        let users = 0
        try {
          const ids = await getRoleUserIds(r.id)
          users = Array.isArray(ids) ? ids.length : 0
        } catch (_) {}
        return {
          key: String(r.id),
          role: r.name ?? r.role ?? r.roleName ?? '',
          scope: '-',
          users,
          checkedKeys: [],
        }
      })
    )
  } catch (e) {
    message.error('加载角色失败：' + (e?.message || '未知错误'))
  }
}

async function loadMenuTreeFromApi() {
  try {
    const data = await getMenusTree({ endType: 'WEB', enabled: true })
    const arr = Array.isArray(data) ? data : data?.list ?? []
    menuTree.value = menuVoToTree(arr).map((n) => ({ ...n, selectable: false }))
  } catch (e) {
    message.error('加载菜单树失败：' + (e?.message || '未知错误'))
  }
}
function fillPerm(record) {
  if (record) {
    permForm.key = record.key
    permForm.role = record.role
    permForm.scope = record.scope
    permForm.status = record.status ?? '启用'
    permForm.remark = record.remark ?? ''
    permForm.checkedKeys = record.checkedKeys ? [...record.checkedKeys] : []
  } else {
    permForm.key = ''
    permForm.role = ''
    permForm.scope = ''
    permForm.status = '启用'
    permForm.remark = ''
    permForm.checkedKeys = []
  }
}
function onPermTreeCheck(keys, evt) {
  const checked = Array.isArray(keys) ? keys : (keys?.checked ?? [])
  permForm.checkedKeys = checked
  permForm.scope = scopeFromCheckedKeys(checked)
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
async function openPermEdit(record) {
  currentPerm.value = record
  if (record?.key) {
    try {
      const menus = await getRoleMenus(record.key, { endType: 'WEB' })
      const ids = collectMenuIds(menus)
      fillPerm({ ...record, checkedKeys: ids.map(String) })
    } catch (e) {
      message.error('获取角色菜单失败')
      fillPerm(record)
    }
  } else {
    fillPerm(record)
  }
  permVisible.value = true
}

async function savePerm() {
  if (!permForm.role) {
    message.warning('请填写角色名称')
    return
  }
  permForm.scope = scopeFromCheckedKeys(permForm.checkedKeys)
  try {
    const payload = { name: permForm.role, enabled: (permForm.status || '启用') === '启用', remark: permForm.remark || '' }
    let roleId
    if (currentPerm.value) {
      await updateRole(currentPerm.value.key, payload)
      roleId = Number(currentPerm.value.key)
      message.success('角色已更新')
    } else {
      const res = await createRole(payload)
      roleId = res?.id ?? res?.data?.id ?? (typeof res === 'number' ? res : null)
      message.success('角色已新增')
    }
    if (roleId && permForm.checkedKeys?.length !== undefined) {
      const currentMenus = await getRoleMenus(roleId, { endType: 'WEB' })
      const currentIds = new Set(collectMenuIds(currentMenus).map(String))
      const targetIds = new Set((permForm.checkedKeys || []).map(String))
      const toAdd = [...targetIds].filter((id) => !currentIds.has(id))
      const toRemove = [...currentIds].filter((id) => !targetIds.has(id))
      for (const id of toRemove) await deleteRoleMenuMapping(roleId, Number(id))
      for (const id of toAdd) await saveRoleMenuMapping(roleId, Number(id))
    }
    permVisible.value = false
    await loadPermFromApi()
  } catch (e) {
    message.error('保存失败：' + (e?.message || '未知错误'))
    throw e
  }
}

function removePerm(record) {
  Modal.confirm({
    title: `确认删除角色「${record.role}」吗？`,
    content: record.users > 0 ? `将影响 ${record.users} 个用户。` : undefined,
    async onOk() {
      try {
        await deleteRole(record.key)
        message.success('已删除')
        await loadPermFromApi()
      } catch (e) {
        message.error('删除失败：' + (e?.message || '未知错误'))
      }
    },
  })
}

function fillDept(record) {
  if (record) Object.assign(deptForm, { key: record.key, name: record.name, parentId: record.parentId != null ? String(record.parentId) : undefined, remark: '', sort: record.sort ?? 0, status: record.status ?? '启用' })
  else Object.assign(deptForm, { key: '', name: '', parentId: undefined, remark: '', sort: 0, status: '启用' })
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
  if (!deptForm.name) {
    message.warning('请填写部门名称')
    return
  }
  try {
    const payload = {
      name: deptForm.name,
      sort: deptForm.sort ?? 0,
      enabled: deptForm.status === '启用',
      remark: deptForm.remark ?? '',
    }
    if (currentDept.value) {
      await updateOrganization(currentDept.value.key, payload)
      const index = deptData.value.findIndex((item) => item.key === currentDept.value.key)
      deptData.value[index] = { ...deptData.value[index], name: deptForm.name, sort: deptForm.sort ?? 0, status: deptForm.status }
      message.success('部门已更新')
    } else {
      if (deptForm.parentId) payload.parentId = Number(deptForm.parentId)
      const res = await createOrganization(payload)
      deptData.value.unshift({
        key: String(res?.id ?? Date.now()),
        name: deptForm.name,
        sort: deptForm.sort ?? 0,
        status: deptForm.status,
      })
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
  if (record) Object.assign(postForm, { key: record.key, name: record.name, sort: record.sort ?? 0, remark: '', status: record.status ?? '启用' })
  else Object.assign(postForm, { key: '', name: '', sort: 0, remark: '', status: '启用' })
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
  if (!postForm.name) {
    message.warning('请填写岗位名称')
    return
  }
  try {
    const payload = {
      name: postForm.name,
      sort: postForm.sort ?? 0,
      enabled: postForm.status === '启用',
      remark: postForm.remark ?? '',
    }
    if (currentPost.value) {
      await updatePosition(currentPost.value.key, payload)
      const index = postData.value.findIndex((item) => item.key === currentPost.value.key)
      postData.value[index] = { ...postData.value[index], name: postForm.name, sort: postForm.sort ?? 0, status: postForm.status }
      message.success('岗位已更新')
    } else {
      const res = await createPosition(payload)
      postData.value.unshift({
        key: String(res?.id ?? Date.now()),
        name: postForm.name,
        sort: postForm.sort ?? 0,
        status: postForm.status,
      })
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
        <a-tab-pane key="dictionary" tab="设备类型">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="dictKeyword" placeholder="搜索设备类型名称/编码" allow-clear style="width: 280px" @press-enter="loadDictFromApi()" />
              <a-button type="primary" ghost @click="loadDictFromApi()">搜索</a-button>
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openDictCreate">新增设备类型</a-button>
            </div>
          </div>
          <a-table :data-source="dictFiltered" :pagination="false" row-key="key">
            <a-table-column title="编码" data-index="code" key="code" width="140" />
            <a-table-column title="设备类型名称" data-index="label" key="label" />
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
              <a-input v-model:value="permKeyword" placeholder="搜索角色名称" allow-clear style="width: 280px" @press-enter="permPagination.current = 1; loadPermFromApi()" />
              <a-button type="primary" ghost @click="permPagination.current = 1; loadPermFromApi()">搜索</a-button>
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openPermCreate">新增角色</a-button>
            </div>
          </div>
          <a-table :data-source="permFiltered" :pagination="{ current: permPagination.current, pageSize: permPagination.pageSize, total: permPagination.total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }" row-key="key" @change="(pag) => pag && (permPagination.current = pag.current) && (permPagination.pageSize = pag.pageSize) && loadPermFromApi()">
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
              <a-input v-model:value="deptKeyword" placeholder="搜索部门名称" allow-clear style="width: 280px" @press-enter="loadDeptFromApi()" />
              <a-button type="primary" ghost @click="loadDeptFromApi()">搜索</a-button>
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openDeptCreate">新增部门</a-button>
            </div>
          </div>
          <a-table :data-source="deptFiltered" :pagination="false" row-key="key">
            <a-table-column title="部门名称" data-index="name" key="name" width="200" />
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
              <a-input v-model:value="postKeyword" placeholder="搜索岗位名称" allow-clear style="width: 280px" @press-enter="postPagination.current = 1; loadPostFromApi()" />
          <a-button type="primary" ghost @click="postPagination.current = 1; loadPostFromApi()">搜索</a-button>
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openPostCreate">新增岗位</a-button>
            </div>
          </div>
          <a-table :data-source="postFiltered" :pagination="{ current: postPagination.current, pageSize: postPagination.pageSize, total: postPagination.total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }" row-key="key" @change="(pag) => pag && onPostPageChange(pag.current, pag.pageSize)">
            <a-table-column title="岗位名称" data-index="name" key="name" width="180" />
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
              <a-input v-model:value="personKeyword" placeholder="搜索账号/姓名/手机号" allow-clear style="width: 280px" @press-enter="personPagination.current = 1; loadPersonFromApi()" />
              <a-button type="primary" ghost @click="personPagination.current = 1; loadPersonFromApi()">搜索</a-button>
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" @click="openMemberCreate">新建账号</a-button>
            </div>
          </div>
          <a-table :data-source="personFiltered" :pagination="{ current: personPagination.current, pageSize: personPagination.pageSize, total: personPagination.total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }" row-key="key" @change="(pag) => pag && onPersonPageChange(pag.current, pag.pageSize)">
            <a-table-column title="账号" data-index="username" key="username" width="110" />
            <a-table-column title="部门" data-index="dept" key="dept" width="120" />
            <a-table-column title="岗位" data-index="post" key="post" width="120" />
            <a-table-column title="姓名" data-index="name" key="name" width="100" />
            <a-table-column title="手机号" data-index="phone" key="phone" width="130" />
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
          <a-alert message="暂无日志数据，接口暂未提供" type="info" show-icon style="margin-bottom: 16px" />
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
          <a-button type="link" size="small" style="padding: 0" @click="openResetPassword">重置密码</a-button>
        </a-form-item>
        <a-form-item label="账号（手机号/用户名）" required>
          <a-input v-model:value="memberForm.username" placeholder="登录账号" />
        </a-form-item>
        <a-form-item label="姓名" required><a-input v-model:value="memberForm.name" placeholder="姓名" /></a-form-item>
        <a-form-item label="手机号"><a-input v-model:value="memberForm.mobile" placeholder="手机号" /></a-form-item>
        <a-form-item label="部门">
          <a-select v-model:value="memberForm.organizationIds" placeholder="请选择部门" mode="multiple" allow-clear style="width: 100%">
            <a-select-option v-for="d in deptData" :key="d.key" :value="d.key">{{ d.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="岗位">
          <a-select v-model:value="memberForm.positionIds" placeholder="请选择岗位" mode="multiple" allow-clear style="width: 100%">
            <a-select-option v-for="p in postData" :key="p.key" :value="p.key">{{ p.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="memberForm.roleIds" placeholder="请选择角色" mode="multiple" allow-clear style="width: 100%">
            <a-select-option v-for="r in roleData" :key="r.key" :value="r.key">{{ r.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="memberForm.status">
            <a-select-option value="启用">启用</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="dictDetailVisible" title="设备类型详情" width="400">
      <a-descriptions v-if="currentDict" :column="1" bordered size="small">
        <a-descriptions-item label="编码">{{ currentDict.code }}</a-descriptions-item>
        <a-descriptions-item label="设备类型名称">{{ currentDict.label }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentDict.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="dictVisible" :title="currentDict ? '编辑设备类型' : '新增设备类型'" @ok="saveDict">
      <a-form layout="vertical">
        <a-form-item label="编码"><a-input v-model:value="dictForm.code" placeholder="如：INVERTER（可选，用于导入导出等）" /></a-form-item>
        <a-form-item label="设备类型名称" required><a-input v-model:value="dictForm.label" placeholder="如：逆变器、汇流箱" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="dictForm.sort" :min="0" style="width: 100%" /></a-form-item>
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
        <a-form-item label="状态">
          <a-select v-model:value="permForm.status">
            <a-select-option value="启用">启用</a-select-option>
            <a-select-option value="停用">停用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="权限范围（勾选菜单）">
          <a-tree
            :tree-data="menuTree"
            :checked-keys="permForm.checkedKeys"
            checkable
            :selectable="false"
            @check="(keys, evt) => onPermTreeCheck(keys, evt)"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="deptDetailVisible" title="部门详情" width="400">
      <a-descriptions v-if="currentDept" :column="1" bordered size="small">
        <a-descriptions-item label="部门名称">{{ currentDept.name }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ currentDept.sort }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentDept.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="deptVisible" :title="currentDept ? '编辑部门' : '新增部门'" @ok="saveDept">
      <a-form layout="vertical">
        <a-form-item label="上级部门">
          <a-select v-model:value="deptForm.parentId" placeholder="不选则为根级" allow-clear style="width: 100%">
            <a-select-option v-for="d in deptData.filter((x) => !currentDept || String(x.key) !== String(currentDept.key))" :key="d.key" :value="d.key">{{ d.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="部门名称" required><a-input v-model:value="deptForm.name" /></a-form-item>
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
        <a-descriptions-item label="排序">{{ currentPost.sort }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentPost.status }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="postVisible" :title="currentPost ? '编辑岗位' : '新增岗位'" @ok="savePost">
      <a-form layout="vertical">
        <a-form-item label="岗位名称" required><a-input v-model:value="postForm.name" /></a-form-item>
        <a-form-item label="排序" required><a-input-number v-model:value="postForm.sort" :min="0" style="width: 100%" /></a-form-item>
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

    <a-modal v-model:open="resetPasswordVisible" title="重置密码" @ok="doResetPassword">
      <a-form layout="vertical">
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="resetPasswordNew" placeholder="请输入新密码" autocomplete="new-password" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
