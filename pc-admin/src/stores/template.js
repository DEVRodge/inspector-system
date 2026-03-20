import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  getTemplatePage,
  updateTemplate,
} from '@/api/modules/inspection'

function enrich(t) {
  return {
    ...t,
    itemCount: t.items?.length ?? 0,
    requiredCount: t.items?.filter((i) => i.required)?.length ?? 0,
  }
}

export const useTemplateStore = defineStore('template', () => {
  const list = ref([])

  async function loadList(params = {}) {
    const res = await getTemplatePage(params)
    list.value = (res?.list ?? []).map(enrich)
    return res
  }

  async function getById(id) {
    const cached = list.value.find((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (cached) return cached
    const t = await getTemplateById(id)
    return t ? enrich(t) : null
  }

  async function create(template) {
    const res = await createTemplate({
      name: template.name,
      deviceType: template.deviceType,
      description: template.description,
      version: template.version,
      status: template.status,
    })
    const id = res?.id ?? res?.key
    if (id) list.value.unshift(enrich({ ...template, key: id, id }))
    return id
  }

  async function update(id, template) {
    const index = list.value.findIndex((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (index === -1) return false
    await updateTemplate(id, {
      name: template.name,
      deviceType: template.deviceType,
      description: template.description,
      version: template.version,
      status: template.status,
    })
    const itemCount = template.items?.length ?? 0
    const requiredCount = template.items?.filter((i) => i.required)?.length ?? 0
    list.value[index] = {
      ...list.value[index],
      ...template,
      key: id,
      id,
      itemCount,
      requiredCount,
    }
    return true
  }

  async function remove(id) {
    const index = list.value.findIndex((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (index === -1) return false
    await deleteTemplate(id)
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
