import { defineStore } from 'pinia'
import { ref } from 'vue'
import { templateRows } from '@/mock/modules/template'
import { isMockEnabled } from '@/api/http'
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
  const list = ref(
    isMockEnabled
      ? templateRows.map(enrich)
      : [],
  )

  async function loadList(params = {}) {
    if (isMockEnabled) {
      list.value = templateRows.map(enrich)
      return { list: list.value, total: list.value.length }
    }
    const res = await getTemplatePage(params)
    list.value = (res?.list ?? []).map(enrich)
    return res
  }

  async function getById(id) {
    const cached = list.value.find((t) => String(t.key) === String(id) || String(t.id) === String(id))
    if (cached) return cached
    if (isMockEnabled) {
      const r = templateRows.find((t) => String(t.key) === String(id))
      return r ? enrich(r) : null
    }
    const t = await getTemplateById(id)
    return t ? enrich(t) : null
  }

  async function create(template) {
    if (isMockEnabled) {
      const key = template.key || `${Date.now()}`
      const itemCount = template.items?.length ?? 0
      const requiredCount = template.items?.filter((i) => i.required)?.length ?? 0
      list.value.unshift(
        enrich({
          ...template,
          key,
          itemCount,
          requiredCount,
        }),
      )
      return key
    }
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
    if (!isMockEnabled) {
      await updateTemplate(id, {
        name: template.name,
        deviceType: template.deviceType,
        description: template.description,
        version: template.version,
        status: template.status,
      })
    }
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
    if (!isMockEnabled) {
      await deleteTemplate(id)
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
