<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { message, Modal } from 'ant-design-vue'
import {
  getDictionaryPage,
  createDictionary,
  updateDictionary,
  deleteDictionary,
} from '../../api/modules/dictionary'
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '../../api/modules/organization'
import {
  getPositions,
  getPositionsByIds,
  getPositionById,
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
import { getBizLogPage } from '../../api/modules/biz-log'

const DEVICE_TYPE_DICT_CODE = 'device_type'

const orgData = ref([])
const roleData = ref([])
const dictionaryRows = ref([])
const permissionRows = ref([])
const deptData = ref([])
const postData = ref([])
const postOptions = ref([])
const logData = ref([])

const dictKeyword = ref('')
const permKeyword = ref('')
const personKeyword = ref('')
const deptKeyword = ref('')
const postKeyword = ref('')
const logKeyword = ref('')
const logBizType = ref(undefined)
const logBizId = ref('')
const logOperation = ref(undefined)
const logSuccess = ref(undefined)
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

const menuTree = ref([])
const permPagination = reactive({ current: 1, pageSize: 10, total: 0 })

const selectedRoleIdForMenu = ref(undefined)
const roleMenuCheckedKeys = ref([])
const roleMenusLoading = ref(false)
const menuSaveLoading = ref(false)
const roleOptionsForMenu = ref([])
const logLoading = ref(false)
const logPagination = reactive({ current: 1, pageSize: 10, total: 0 })

const LOG_BIZ_TYPE_OPTIONS = [
  { value: 'INSPECTION_RECORD', label: '巡检记录' },
  { value: 'INSPECTION_EXCEPTION', label: '异常任务' },
]

const LOG_OPERATION_OPTIONS = [
  { value: 'SUBMIT', label: '提交' },
  { value: 'ASSIGN', label: '指派' },
  { value: 'PROCESS', label: '处理' },
]

const LOG_SUCCESS_OPTIONS = [
  { value: true, label: '成功' },
  { value: false, label: '失败' },
]

function toStatusLabel(enabled) {
  return enabled ? '启用' : '停用'
}

function toEnabled(status) {
  return status === '启用'
}

function getBizTypeLabel(value) {
  return LOG_BIZ_TYPE_OPTIONS.find((it) => it.value === value)?.label ?? value ?? '-'
}

function getOperationLabel(value) {
  return LOG_OPERATION_OPTIONS.find((it) => it.value === value)?.label ?? value ?? '-'
}

function formatDateTime(value) {
  if (value == null || value === '') return '-'
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return dayjs(n).format('YYYY-MM-DD HH:mm:ss')
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : String(value)
}

function normalizeIdList(value) {
  const list = Array.isArray(value) ? value : [value]
  return list
    .filter((item) => item !== undefined && item !== null && item !== '')
    .map((item) => String(item))
}

function dedupeById(list = []) {
  const map = new Map()
  for (const item of list) {
    if (item?.id == null) continue
    map.set(String(item.id), item)
  }
  return [...map.values()]
}

function mapDeptNode(row, parent = null) {
  const rawSort = row.sort ?? row.sequence ?? 0
  const sort = Number.isFinite(Number(rawSort)) ? Number(rawSort) : 0
  return {
    key: String(row.id),
    id: row.id,
    parentId: row.parentId ?? parent?.id ?? null,
    parentName: parent?.name ?? '-',
    name: row.name ?? '',
    remark: row.remark ?? '',
    members: row.members ?? 0,
    level: row.level ?? 0,
    sort,
    status: toStatusLabel(row.enabled),
    enabled: !!row.enabled,
  }
}

function mapPostFromApi(row) {
  return {
    key: String(row.id),
    id: row.id,
    name: row.name ?? '',
    remark: row.remark ?? '',
    sort: row.sort ?? 0,
    status: toStatusLabel(row.enabled),
    enabled: !!row.enabled,
  }
}

function mapRoleFromApi(row) {
  const name = row.name ?? row.role ?? row.roleName ?? ''
  return {
    key: String(row.id),
    id: row.id,
    role: name,
    name,
    remark: row.remark ?? '',
    status: toStatusLabel(row.enabled),
    enabled: !!row.enabled,
    users: 0,
    checkedKeys: [],
    scope: '无',
  }
}

function mapUserFromApi(row) {
  const organizations = row.organizations ?? (row.organization ? [row.organization] : [])
  const positions = row.positions ?? []
  const roles = row.roles ?? []
  const photographIdList = row.photographIdList ?? (row.photographList ?? []).map((item) => item.id)
  return {
    key: String(row.id),
    id: row.id,
    username: row.username ?? '',
    name: row.name ?? '',
    phone: row.mobile ?? row.username ?? '',
    mobile: row.mobile ?? '',
    email: row.email ?? '',
    gender: row.gender ?? 'NONE',
    remark: row.remark ?? '',
    dept: organizations.map((item) => item.name).join('、') || '-',
    post: positions.map((item) => item.name).join('、') || '-',
    roles: roles.map((item) => item.name).join('、') || '-',
    status: toStatusLabel(row.enabled),
    enabled: !!row.enabled,
    organizationIds: organizations.map((item) => String(item.id)),
    positionIds: positions.map((item) => String(item.id)),
    roleIds: roles.map((item) => String(item.id)),
    photographIdList: normalizeIdList(photographIdList),
    createTime: row.createTime ?? '',
    lastLoginTime: row.lastLoginTime ?? '',
  }
}

function mapBizLogFromApi(row) {
  return {
    ...row,
    key: String(row.id ?? ''),
    time: formatDateTime(row.createTime),
    operator: row.operatorName || row.operatorAccount || (row.operatorId != null ? `用户${row.operatorId}` : '-'),
    module: getBizTypeLabel(row.bizType),
    operationLabel: getOperationLabel(row.operation),
    result: row.success ? '成功' : '失败',
    action: row.action || '-',
    ip: row.clientIp || '-',
  }
}

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
function flattenOrgs(tree, parent = null) {
  const result = []
  for (const o of tree || []) {
    result.push(mapDeptNode(o, parent))
    if (o.children?.length) {
      result.push(...flattenOrgs(o.children, { id: o.id, name: o.name ?? '' }))
    }
  }
  return result
}

async function loadDeptFromApi() {
  try {
    const params = {}
    if (deptKeyword.value?.trim()) params.name = deptKeyword.value.trim()
    const data = await getOrganizations(params)
    const arr = Array.isArray(data) ? data : data?.data ?? []
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
    const arr = data?.records ?? (Array.isArray(data) ? data : [])
    postPagination.total = data?.total ?? arr.length
    postData.value = arr.map(mapPostFromApi)
  } catch (e) {
    message.error('加载岗位失败：' + (e?.message || '未知错误'))
  }
}

async function loadPostOptionsFromApi(selectedIds = []) {
  try {
    const data = await getPositions({ pageNumber: 1, pageSize: 1000 })
    const baseRows = data?.records ?? (Array.isArray(data) ? data : [])
    let rows = [...baseRows]
    const normalizedSelectedIds = normalizeIdList(selectedIds).map(Number).filter(Boolean)
    if (normalizedSelectedIds.length) {
      const selectedRows = await getPositionsByIds(normalizedSelectedIds)
      rows = dedupeById([...rows, ...(Array.isArray(selectedRows) ? selectedRows : [])])
    }
    postOptions.value = rows.map(mapPostFromApi)
  } catch (e) {
    postOptions.value = []
    message.error('加载岗位选项失败：' + (e?.message || '未知错误'))
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
    const arr = data?.records ?? (Array.isArray(data) ? data : [])
    personPagination.total = data?.total ?? arr.length
    orgData.value = arr.map(mapUserFromApi)
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
    const data = await getRoles({ pageNumber: 1, pageSize: 1000 })
    const arr = data?.records ?? (Array.isArray(data) ? data : [])
    roleData.value = arr.map((r) => {
      const mapped = mapRoleFromApi(r)
      return {
        key: mapped.key,
        id: mapped.id,
        name: mapped.name,
      }
    })
  } catch (e) {
    roleData.value = []
    message.error('加载角色失败：' + (e?.message || '未知错误'))
  }
}

async function loadBizLogs() {
  logLoading.value = true
  try {
    const periodBegin = logTimeRange.value?.[0]
      ? dayjs(logTimeRange.value[0]).format('YYYY-MM-DD HH:mm:ss')
      : undefined
    const periodEnd = logTimeRange.value?.[1]
      ? dayjs(logTimeRange.value[1]).format('YYYY-MM-DD HH:mm:ss')
      : undefined
    const res = await getBizLogPage({
      pageNumber: logPagination.current,
      pageSize: logPagination.pageSize,
      bizType: logBizType.value,
      bizId: logBizId.value || undefined,
      operation: logOperation.value,
      success: logSuccess.value,
      periodBegin,
      periodEnd,
      keyword: logKeyword.value || undefined,
    })
    logData.value = (res?.list ?? []).map(mapBizLogFromApi)
    logPagination.total = res?.total ?? 0
    logPagination.current = res?.current ?? logPagination.current
    logPagination.pageSize = res?.size ?? logPagination.pageSize
  } catch (e) {
    logData.value = []
    logPagination.total = 0
    message.error('加载业务日志失败：' + (e?.message || '未知错误'))
  } finally {
    logLoading.value = false
  }
}

function onPersonPageChange(page, pageSize) {
  personPagination.current = page
  personPagination.pageSize = pageSize
  loadPersonFromApi()
}

watch(selectedRoleIdForMenu, () => {
  loadRoleMenusForSelectedRole()
})

function onTabChange(key) {
  if (key === 'roleMenu') loadRolesForMenuSelect()
  if (key === 'logs') {
    logPagination.current = 1
    loadBizLogs()
  }
}

onMounted(async () => {
  await loadDictFromApi()
  await loadDeptFromApi()
  await loadPostFromApi()
  await loadPostOptionsFromApi()
  await loadPersonFromApi()
  await loadRoleFromApi()
  await loadPermFromApi()
  await loadMenuTreeFromApi()
  await loadRolesForMenuSelect()
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
  email: '',
  gender: 'NONE',
  remark: '',
  photographIdList: [],
  status: '启用',
})

const dictVisible = ref(false)
const dictDetailVisible = ref(false)
const currentDict = ref(null)
const dictForm = reactive({ key: '', category: '', code: '', label: '', sort: 0, status: '启用' })

const permVisible = ref(false)
const permDetailVisible = ref(false)
const currentPerm = ref(null)
const permForm = reactive({ key: '', role: '', status: '启用', remark: '' })

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
      organizationIds: normalizeIdList(orgIds),
      positionIds: normalizeIdList(posIds),
      roleIds: normalizeIdList(record.roleIds ?? []),
      name: record.name ?? '',
      mobile: record.mobile ?? record.phone ?? '',
      email: record.email ?? '',
      gender: record.gender ?? 'NONE',
      remark: record.remark ?? '',
      photographIdList: normalizeIdList(record.photographIdList ?? []),
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
      email: '',
      gender: 'NONE',
      remark: '',
      photographIdList: [],
      status: '启用',
    })
  }
}
async function openMemberCreate() {
  currentMember.value = null
  fillMember(null)
  await loadPostOptionsFromApi()
  memberVisible.value = true
}
async function openMemberDetail(record) {
  currentMember.value = record
  if (record?.key) {
    try {
      const detail = await getUserById(record.key)
      currentMember.value = mapUserFromApi(detail)
    } catch (e) {
      message.error('获取用户详情失败：' + (e?.message || '未知错误'))
    }
  }
  memberDetailVisible.value = true
}
async function openMemberEdit(record) {
  currentMember.value = record
  if (record?.key) {
    try {
      const u = await getUserById(record.key)
      const mapped = mapUserFromApi(u)
      fillMember(mapped)
      await loadPostOptionsFromApi(mapped.positionIds)
    } catch (e) {
      message.error('获取用户详情失败：' + (e?.message || '未知错误'))
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
      email: memberForm.email || '',
      gender: memberForm.gender || 'NONE',
      remark: memberForm.remark || '',
      enabled: toEnabled(memberForm.status),
      organizationIds: (memberForm.organizationIds || []).map(Number).filter(Boolean),
      positionIds: (memberForm.positionIds || []).map(Number).filter(Boolean),
      roleIds: (memberForm.roleIds || []).map(Number).filter(Boolean),
      photographIdList: (memberForm.photographIdList || []).map(Number).filter(Boolean),
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

function normalizeMenuList(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  const list = res?.data ?? res?.records ?? res?.list
  return Array.isArray(list) ? list : []
}

function collectMenuIds(nodes) {
  const ids = []
  const arr = Array.isArray(nodes) ? nodes : []
  for (const n of arr) {
    if (n?.id != null) ids.push(n.id)
    if (n?.children?.length) ids.push(...collectMenuIds(n.children))
  }
  return ids
}

async function loadPermFromApi() {
  try {
    const data = await getRoles({ pageNumber: permPagination.current, pageSize: permPagination.pageSize, keyword: permKeyword.value?.trim() })
    const arr = data?.records ?? (Array.isArray(data) ? data : [])
    permPagination.total = data?.total ?? arr.length
    permissionRows.value = await Promise.all(
      arr.map(async (r) => {
        const base = mapRoleFromApi(r)
        let users = 0
        try {
          const ids = await getRoleUserIds(r.id).catch(() => [])
          users = Array.isArray(ids) ? ids.length : 0
        } catch (_) {}
        return { ...base, users }
      })
    )
  } catch (e) {
    message.error('加载角色失败：' + (e?.message || '未知错误'))
  }
}

async function loadMenuTreeFromApi() {
  try {
    const data = await getMenusTree({ endType: 'WEB', enabled: true })
    const arr = Array.isArray(data) ? data : data?.data ?? []
    menuTree.value = menuVoToTree(arr).map((n) => ({ ...n, selectable: false }))
  } catch (e) {
    message.error('加载菜单树失败：' + (e?.message || '未知错误'))
  }
}
function fillPerm(record) {
  if (record) {
    permForm.key = record.key
    permForm.role = record.role
    permForm.status = record.status ?? '启用'
    permForm.remark = record.remark ?? ''
  } else {
    permForm.key = ''
    permForm.role = ''
    permForm.status = '启用'
    permForm.remark = ''
  }
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

async function savePerm() {
  if (!permForm.role) {
    message.warning('请填写角色名称')
    return
  }
  try {
    const payload = { name: permForm.role, enabled: toEnabled(permForm.status || '启用'), remark: permForm.remark || '' }
    if (currentPerm.value) {
      await updateRole(currentPerm.value.key, payload)
      message.success('角色已更新')
    } else {
      await createRole(payload)
      message.success('角色已新增')
    }
    permVisible.value = false
    await Promise.all([loadPermFromApi(), loadRoleFromApi(), loadPersonFromApi(), loadRolesForMenuSelect()])
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
        await Promise.all([loadPermFromApi(), loadRoleFromApi(), loadPersonFromApi(), loadRolesForMenuSelect()])
      } catch (e) {
        message.error('删除失败：' + (e?.message || '未知错误'))
      }
    },
  })
}

async function loadRolesForMenuSelect() {
  try {
    const data = await getRoles({ pageNumber: 1, pageSize: 500 })
    const arr = data?.records ?? (Array.isArray(data) ? data : [])
    roleOptionsForMenu.value = arr.map((r) => ({
      value: String(r.id),
      label: r.name ?? r.role ?? r.roleName ?? String(r.id),
    }))
  } catch {
    roleOptionsForMenu.value = []
  }
}

async function loadRoleMenusForSelectedRole() {
  const roleId = selectedRoleIdForMenu.value
  if (!roleId) {
    roleMenuCheckedKeys.value = []
    return
  }
  roleMenusLoading.value = true
  try {
    const res = await getRoleMenus(roleId, { endType: 'WEB' })
    const list = normalizeMenuList(res)
    const ids = collectMenuIds(list).map(String).filter((id) => id && id !== 'undefined')
    roleMenuCheckedKeys.value = ids
  } catch (e) {
    roleMenuCheckedKeys.value = []
    message.error('加载角色菜单失败：' + (e?.message || '未知错误'))
  } finally {
    roleMenusLoading.value = false
  }
}

function onRoleMenuTreeCheck(keys, evt) {
  const checked = Array.isArray(keys) ? keys : (keys?.checked ?? [])
  roleMenuCheckedKeys.value = checked
}

async function saveRoleMenuPermission() {
  const roleId = selectedRoleIdForMenu.value
  if (!roleId) {
    message.warning('请先选择角色')
    return
  }
  menuSaveLoading.value = true
  try {
    const res = await getRoleMenus(roleId, { endType: 'WEB' })
    const list = normalizeMenuList(res)
    const currentIds = new Set(collectMenuIds(list).map(String).filter((id) => id && id !== 'undefined'))
    const targetIds = new Set((roleMenuCheckedKeys.value || []).map(String).filter((id) => id && id !== 'undefined'))
    const toAdd = [...targetIds].filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !targetIds.has(id))
    for (const id of toRemove) await deleteRoleMenuMapping(roleId, String(id))
    for (const id of toAdd) await saveRoleMenuMapping(roleId, String(id))
    message.success('菜单权限已保存')
    await loadRoleMenusForSelectedRole()
  } catch (e) {
    message.error('保存失败：' + (e?.message || '未知错误'))
  } finally {
    menuSaveLoading.value = false
  }
}

function fillDept(record) {
  if (record) {
    Object.assign(deptForm, {
      key: record.key,
      name: record.name,
      parentId: record.parentId != null && Number(record.parentId) !== 0 ? String(record.parentId) : undefined,
      remark: record.remark ?? '',
      sort: record.sort ?? 0,
      status: record.status ?? '启用',
    })
  } else {
    Object.assign(deptForm, { key: '', name: '', parentId: undefined, remark: '', sort: 0, status: '启用' })
  }
}
function openDeptCreate() {
  currentDept.value = null
  fillDept(null)
  deptVisible.value = true
}
async function openDeptDetail(record) {
  currentDept.value = record
  if (record?.key) {
    try {
      const detail = await getOrganizationById(record.key)
      currentDept.value = mapDeptNode(detail, detail?.parentId ? { id: detail.parentId, name: deptData.value.find((item) => String(item.id) === String(detail.parentId))?.name ?? '' } : null)
    } catch (e) {
      message.error('获取部门详情失败：' + (e?.message || '未知错误'))
    }
  }
  deptDetailVisible.value = true
}
async function openDeptEdit(record) {
  currentDept.value = record
  if (record?.key) {
    try {
      const detail = await getOrganizationById(record.key)
      fillDept(mapDeptNode(detail, detail?.parentId ? { id: detail.parentId, name: deptData.value.find((item) => String(item.id) === String(detail.parentId))?.name ?? '' } : null))
    } catch (e) {
      message.error('获取部门详情失败：' + (e?.message || '未知错误'))
      fillDept(record)
    }
  } else {
    fillDept(record)
  }
  deptVisible.value = true
}
async function saveDept() {
  if (!deptForm.name) {
    message.warning('请填写部门名称')
    return
  }
  try {
    const payload = {
      parentId: deptForm.parentId ? Number(deptForm.parentId) : 0,
      name: deptForm.name,
      sort: deptForm.sort ?? 0,
      enabled: toEnabled(deptForm.status),
      remark: deptForm.remark ?? '',
    }
    if (currentDept.value) {
      await updateOrganization(currentDept.value.key, payload)
      message.success('部门已更新')
    } else {
      await createOrganization(payload)
      message.success('部门已新增')
    }
    await Promise.all([loadDeptFromApi(), loadPersonFromApi()])
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
        message.success('已删除')
        await Promise.all([loadDeptFromApi(), loadPersonFromApi()])
      } catch (e) {
        message.error('删除失败：' + (e?.message || '未知错误'))
      }
    },
  })
}

function fillPost(record) {
  if (record) Object.assign(postForm, { key: record.key, name: record.name, sort: record.sort ?? 0, remark: record.remark ?? '', status: record.status ?? '启用' })
  else Object.assign(postForm, { key: '', name: '', sort: 0, remark: '', status: '启用' })
}
function openPostCreate() {
  currentPost.value = null
  fillPost(null)
  postVisible.value = true
}
async function openPostDetail(record) {
  currentPost.value = record
  if (record?.key) {
    try {
      const detail = await getPositionById(record.key)
      currentPost.value = mapPostFromApi(detail)
    } catch (e) {
      message.error('获取岗位详情失败：' + (e?.message || '未知错误'))
    }
  }
  postDetailVisible.value = true
}
async function openPostEdit(record) {
  currentPost.value = record
  if (record?.key) {
    try {
      const detail = await getPositionById(record.key)
      fillPost(mapPostFromApi(detail))
    } catch (e) {
      message.error('获取岗位详情失败：' + (e?.message || '未知错误'))
      fillPost(record)
    }
  } else {
    fillPost(record)
  }
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
      enabled: toEnabled(postForm.status),
      remark: postForm.remark ?? '',
    }
    if (currentPost.value) {
      await updatePosition(currentPost.value.key, payload)
      message.success('岗位已更新')
    } else {
      await createPosition(payload)
      message.success('岗位已新增')
    }
    await Promise.all([loadPostFromApi(), loadPostOptionsFromApi(memberForm.positionIds), loadPersonFromApi()])
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
        message.success('已删除')
        await Promise.all([loadPostFromApi(), loadPostOptionsFromApi(memberForm.positionIds), loadPersonFromApi()])
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

function onLogSearch() {
  logPagination.current = 1
  loadBizLogs()
}

function onLogReset() {
  logKeyword.value = ''
  logBizType.value = undefined
  logBizId.value = ''
  logOperation.value = undefined
  logSuccess.value = undefined
  logTimeRange.value = null
  logPagination.current = 1
  loadBizLogs()
}

function onLogTableChange(pag) {
  if (!pag) return
  logPagination.current = pag.current ?? logPagination.current
  logPagination.pageSize = pag.pageSize ?? logPagination.pageSize
  loadBizLogs()
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
      <a-tabs @change="onTabChange">
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

        <a-tab-pane key="role" tab="角色管理">
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
            <a-table-column title="备注" data-index="remark" key="remark" ellipsis />
            <a-table-column title="状态" data-index="status" key="status" width="100" />
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

        <a-tab-pane key="roleMenu" tab="菜单权限">
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-select
                v-model:value="selectedRoleIdForMenu"
                placeholder="请选择角色"
                allow-clear
                style="width: 280px"
                :options="roleOptionsForMenu"
                :loading="roleMenusLoading"
              />
              <a-button type="primary" :loading="menuSaveLoading" :disabled="!selectedRoleIdForMenu" @click="saveRoleMenuPermission">
                保存菜单权限
              </a-button>
            </div>
          </div>
          <a-alert v-if="!selectedRoleIdForMenu" message="请先选择角色，再配置该角色可访问的菜单（Web 端）。" type="info" show-icon style="margin-bottom: 16px" />
          <div v-else class="role-menu-tree-wrap">
            <a-spin :spinning="roleMenusLoading">
              <a-tree
                v-if="menuTree.length"
                :tree-data="menuTree"
                :checked-keys="roleMenuCheckedKeys"
                checkable
                :selectable="false"
                block-node
                @check="onRoleMenuTreeCheck"
              />
              <a-empty v-else description="暂无菜单数据，请检查菜单接口" />
            </a-spin>
          </div>
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
            <a-table-column title="上级部门" data-index="parentName" key="parentName" width="160" />
            <a-table-column title="成员数" data-index="members" key="members" width="90" />
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
            <a-table-column title="角色" data-index="roles" key="roles" width="150" />
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
          <div class="table-toolbar">
            <div class="table-toolbar__left">
              <a-input v-model:value="logKeyword" placeholder="关键字（操作描述/操作人）" allow-clear style="width: 220px" @press-enter="onLogSearch" />
              <a-select v-model:value="logBizType" :options="LOG_BIZ_TYPE_OPTIONS" placeholder="业务类型" allow-clear style="width: 150px" />
              <a-input v-model:value="logBizId" placeholder="业务主键 bizId" allow-clear style="width: 160px" @press-enter="onLogSearch" />
              <a-select v-model:value="logOperation" :options="LOG_OPERATION_OPTIONS" placeholder="操作类型" allow-clear style="width: 130px" />
              <a-select v-model:value="logSuccess" :options="LOG_SUCCESS_OPTIONS" placeholder="结果" allow-clear style="width: 100px" />
              <a-range-picker v-model:value="logTimeRange" show-time style="width: 320px" />
            </div>
            <div class="table-toolbar__right">
              <a-button type="primary" :loading="logLoading" @click="onLogSearch">查询</a-button>
              <a-button @click="onLogReset">重置</a-button>
            </div>
          </div>
          <a-table
            :data-source="logData"
            :loading="logLoading"
            :pagination="{ current: logPagination.current, pageSize: logPagination.pageSize, total: logPagination.total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }"
            row-key="key"
            @change="onLogTableChange"
          >
            <a-table-column title="时间" data-index="time" key="time" width="180" />
            <a-table-column title="操作人" data-index="operator" key="operator" width="100" />
            <a-table-column title="模块" data-index="module" key="module" width="120" />
            <a-table-column title="操作类型" data-index="operationLabel" key="operationLabel" width="100" />
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
        <a-descriptions-item label="姓名">{{ currentMember.name }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ currentMember.phone }}</a-descriptions-item>
        <a-descriptions-item label="邮箱">{{ currentMember.email || '-' }}</a-descriptions-item>
        <a-descriptions-item label="部门">{{ currentMember.dept }}</a-descriptions-item>
        <a-descriptions-item label="岗位">{{ currentMember.post }}</a-descriptions-item>
        <a-descriptions-item label="角色">{{ currentMember.roles || '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentMember.status }}</a-descriptions-item>
        <a-descriptions-item label="备注">{{ currentMember.remark || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentMember.createTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="最近登录">{{ currentMember.lastLoginTime || '-' }}</a-descriptions-item>
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
        <a-form-item label="邮箱"><a-input v-model:value="memberForm.email" placeholder="邮箱" /></a-form-item>
        <a-form-item label="部门">
          <a-select v-model:value="memberForm.organizationIds" placeholder="请选择部门" mode="multiple" allow-clear style="width: 100%">
            <a-select-option v-for="d in deptData" :key="d.key" :value="d.key">{{ d.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="岗位">
          <a-select v-model:value="memberForm.positionIds" placeholder="请选择岗位" mode="multiple" allow-clear style="width: 100%">
            <a-select-option v-for="p in postOptions" :key="p.key" :value="p.key">{{ p.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="memberForm.roleIds" placeholder="请选择角色" mode="multiple" allow-clear style="width: 100%">
            <a-select-option v-for="r in roleData" :key="r.key" :value="r.key">{{ r.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="memberForm.remark" :rows="3" placeholder="备注" />
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
        <a-descriptions-item label="状态">{{ currentPerm.status }}</a-descriptions-item>
        <a-descriptions-item label="关联用户数">{{ currentPerm.users }}</a-descriptions-item>
        <a-descriptions-item label="备注">{{ currentPerm.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="permVisible" :title="currentPerm ? '编辑角色' : '新增角色'" width="440" @ok="savePerm">
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
        <a-form-item label="备注">
          <a-textarea v-model:value="permForm.remark" :rows="3" placeholder="角色备注" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="deptDetailVisible" title="部门详情" width="400">
      <a-descriptions v-if="currentDept" :column="1" bordered size="small">
        <a-descriptions-item label="部门名称">{{ currentDept.name }}</a-descriptions-item>
        <a-descriptions-item label="上级部门">{{ currentDept.parentName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="成员数">{{ currentDept.members ?? 0 }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ currentDept.sort }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ currentDept.status }}</a-descriptions-item>
        <a-descriptions-item label="备注">{{ currentDept.remark || '-' }}</a-descriptions-item>
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
        <a-form-item label="备注">
          <a-textarea v-model:value="deptForm.remark" :rows="3" placeholder="部门备注" />
        </a-form-item>
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
        <a-descriptions-item label="备注">{{ currentPost.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="postVisible" :title="currentPost ? '编辑岗位' : '新增岗位'" @ok="savePost">
      <a-form layout="vertical">
        <a-form-item label="岗位名称" required><a-input v-model:value="postForm.name" /></a-form-item>
        <a-form-item label="排序" required><a-input-number v-model:value="postForm.sort" :min="0" style="width: 100%" /></a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="postForm.remark" :rows="3" placeholder="岗位备注" />
        </a-form-item>
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
        <a-descriptions-item label="业务主键">{{ currentLog.bizId ?? '-' }}</a-descriptions-item>
        <a-descriptions-item label="操作类型">{{ currentLog.operationLabel }}</a-descriptions-item>
        <a-descriptions-item label="操作内容">{{ currentLog.action }}</a-descriptions-item>
        <a-descriptions-item label="结果">{{ currentLog.result }}</a-descriptions-item>
        <a-descriptions-item label="请求方法">{{ currentLog.httpMethod || '-' }}</a-descriptions-item>
        <a-descriptions-item label="请求地址">{{ currentLog.requestUri || '-' }}</a-descriptions-item>
        <a-descriptions-item label="IP">{{ currentLog.ip }}</a-descriptions-item>
        <a-descriptions-item label="错误信息">{{ currentLog.errorMsg || '-' }}</a-descriptions-item>
        <a-descriptions-item label="扩展信息">{{ currentLog.extra || '-' }}</a-descriptions-item>
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
