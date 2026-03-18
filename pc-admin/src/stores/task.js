import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskPage,
  updateTask,
} from '@/api/modules/inspection'

export const useTaskStore = defineStore('task', () => {
  const list = ref([])

  async function loadList(params = {}) {
    const res = await getTaskPage(params)
    list.value = res?.list ?? []
    return res
  }

  async function getById(id, options = {}) {
    const { forceFetch = false } = options
    if (!forceFetch) {
      const cached = list.value.find((t) => String(t.key) === String(id) || String(t.id) === String(id))
      if (cached) return cached
    }
    return getTaskById(id)
  }

  async function create(task) {
    const res = await createTask(task)
    const id = res?.id ?? res?.key
    if (res && id) {
      list.value = [{ ...res, key: String(id), id }, ...list.value]
    }
    return res ?? id
  }

  async function update(id, task) {
    const res = await updateTask(id, task)
    const index = list.value.findIndex((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (index >= 0) {
      list.value[index] = { ...list.value[index], ...(res ?? task), key: String(id), id }
    }
    return res ?? true
  }

  async function remove(id) {
    await deleteTask(id)
    const index = list.value.findIndex((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (index >= 0) list.value.splice(index, 1)
    return true
  }

  return {
    list,
    loadList,
    getById,
    create,
    update,
    remove,
  }
})
