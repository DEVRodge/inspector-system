import { defineStore } from 'pinia'
import { ref } from 'vue'
import { templateRows } from '@/mock/modules/template'

export const useTemplateStore = defineStore('template', () => {
  const list = ref(
    templateRows.map((r) => ({
      ...r,
      itemCount: r.items?.length ?? 0,
      requiredCount: r.items?.filter((i) => i.required)?.length ?? 0,
    })),
  )

  function getById(id) {
    return list.value.find((t) => t.key === id) ?? null
  }

  function create(template) {
    const key = template.key || `${Date.now()}`
    const itemCount = template.items?.length ?? 0
    const requiredCount = template.items?.filter((i) => i.required)?.length ?? 0
    list.value.unshift({
      ...template,
      key,
      itemCount,
      requiredCount,
    })
    return key
  }

  function update(id, template) {
    const index = list.value.findIndex((t) => t.key === id)
    if (index === -1) return false
    const itemCount = template.items?.length ?? 0
    const requiredCount = template.items?.filter((i) => i.required)?.length ?? 0
    list.value[index] = {
      ...list.value[index],
      ...template,
      key: id,
      itemCount,
      requiredCount,
    }
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
