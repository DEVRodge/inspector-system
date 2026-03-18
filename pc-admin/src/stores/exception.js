import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  assignException as assignExceptionApi,
  getExceptionById,
  getExceptionPage,
  processException as processExceptionApi,
} from '@/api/modules/exception'

export const useExceptionStore = defineStore('exception', () => {
  const list = ref([])

  async function loadList(params = {}) {
    const res = await getExceptionPage(params)
    list.value = res?.list ?? []
    return res
  }

  async function getById(id, options = {}) {
    const { forceFetch = false } = options
    const cached = list.value.find((e) => String(e.key) === String(id))
    if (cached && !forceFetch) return cached
    return getExceptionById(id)
  }

  async function refreshOne(id) {
    const updated = await getExceptionById(id)
    if (!updated) return null
    const idx = list.value.findIndex((e) => String(e.key) === String(id))
    if (idx >= 0) list.value[idx] = updated
    else list.value.unshift(updated)
    return updated
  }

  async function assign(id, handlerId) {
    await assignExceptionApi(id, handlerId)
    await refreshOne(id)
    return true
  }

  async function process(id, payload) {
    await processExceptionApi(id, payload)
    await refreshOne(id)
    return true
  }

  return { list, loadList, getById, assign, process, refreshOne }
})
