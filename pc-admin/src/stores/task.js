import { defineStore } from 'pinia'
import { ref } from 'vue'
import { taskRows } from '@/mock/modules/task'

export const useTaskStore = defineStore('task', () => {
  const list = ref([...taskRows])

  function getById(id) {
    return list.value.find((t) => t.key === id) ?? null
  }

  function create(task) {
    const key = task.key || `${Date.now()}`
    list.value.unshift({ ...task, key })
    return key
  }

  function update(id, task) {
    const index = list.value.findIndex((t) => t.key === id)
    if (index === -1) return false
    list.value[index] = { ...list.value[index], ...task, key: id }
    return true
  }

  function remove(id) {
    const index = list.value.findIndex((t) => t.key === id)
    if (index === -1) return false
    list.value.splice(index, 1)
    return true
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
  }
})
