import { defineStore } from 'pinia'
import { ref } from 'vue'
import { exceptionRows } from '@/mock/data'
import { isMockEnabled } from '@/api/http'
import {
  assignException as assignExceptionApi,
  getExceptionById,
  getExceptionPage,
} from '@/api/modules/exception'

export const useExceptionStore = defineStore('exception', () => {
  const list = ref(isMockEnabled ? [...exceptionRows] : [])

  async function loadList(params = {}) {
    const res = await getExceptionPage(params)
    list.value = res?.list ?? []
    return res
  }

  async function getById(id) {
    const cached = list.value.find((e) => String(e.key) === String(id))
    if (cached) return cached
    if (isMockEnabled) {
      return exceptionRows.find((e) => String(e.key) === String(id)) ?? null
    }
    return getExceptionById(id)
  }

  async function assign(id, handlerId, handlerName) {
    if (isMockEnabled) {
      const item = list.value.find((e) => String(e.key) === String(id))
      if (!item) return false
      item.handler = handlerName ?? '已指派'
      item.status = '处理中'
      return true
    }
    await assignExceptionApi(id, handlerId)
    const updated = await getExceptionById(id)
    if (updated) {
      const idx = list.value.findIndex((e) => String(e.key) === String(id))
      if (idx >= 0) list.value[idx] = updated
    }
    return true
  }

  return { list, loadList, getById, assign }
})
