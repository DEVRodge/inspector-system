import { defineStore } from 'pinia'
import { ref } from 'vue'
import { taskRows } from '@/mock/modules/task'
import { isMockEnabled } from '@/api/http'
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskPage,
  updateTask,
} from '@/api/modules/inspection'

export const useTaskStore = defineStore('task', () => {
  const list = ref(isMockEnabled ? [...taskRows] : [])

  async function loadList(params = {}) {
    if (isMockEnabled) {
      list.value = [...taskRows]
      return { list: list.value, total: list.value.length }
    }
    const res = await getTaskPage(params)
    list.value = res?.list ?? []
    return res
  }

  async function getById(id) {
    const cached = list.value.find((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (cached) return cached
    if (isMockEnabled) {
      return taskRows.find((t) => String(t.key) === String(id)) ?? null
    }
    return getTaskById(id)
  }

  async function create(task) {
    if (isMockEnabled) {
      const key = task.key || `${Date.now()}`
      list.value.unshift({ ...task, key })
      return key
    }
    const res = await createTask(task)
    const id = res?.id ?? res?.key
    if (id) list.value.unshift({ ...task, key: id, id })
    return id
  }

  async function update(id, task) {
    const index = list.value.findIndex((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (index === -1) return false
    if (!isMockEnabled) {
      await updateTask(id, task)
    }
    list.value[index] = { ...list.value[index], ...task, key: id, id }
    return true
  }

  async function remove(id) {
    const index = list.value.findIndex((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (index === -1) return false
    if (!isMockEnabled) {
      await deleteTask(id)
    }
    list.value.splice(index, 1)
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
