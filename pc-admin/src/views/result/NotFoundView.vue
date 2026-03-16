<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div style="min-height: 100vh; display: grid; place-items: center; background: #f5f7fa">
    <a-result status="404" title="404" sub-title="页面不存在或路由尚未配置。">
      <template #extra>
        <a-button type="primary" @click="router.push('/dashboard')">返回工作台</a-button>
      </template>
    </a-result>
  </div>
</template>
