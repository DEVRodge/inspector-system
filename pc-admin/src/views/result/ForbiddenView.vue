<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div style="min-height: 100vh; display: grid; place-items: center; background: #f5f7fa">
    <a-result
      status="403"
      title="403"
      sub-title="当前演示环境未启用真实权限，后续可在此接入菜单与按钮级权限控制。"
    >
      <template #extra>
        <a-button type="primary" @click="router.push('/dashboard')">返回工作台</a-button>
      </template>
    </a-result>
  </div>
</template>
