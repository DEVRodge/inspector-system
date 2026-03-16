<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const formState = reactive({
  username: 'admin',
  password: '123456',
  remember: true,
})

async function submit() {
  if (!formState.username?.trim() || !formState.password) {
    message.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await authStore.login(formState.username.trim(), formState.password)
    message.success('登录成功，已进入管理后台')
    router.push('/dashboard')
  } catch (err) {
    message.error(err?.message ?? '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    style="
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      background: linear-gradient(135deg, #0f1b2d 0%, #123a7a 45%, #eaf3ff 45%, #f5f7fa 100%);
    "
  >
    <section
      style="
        padding: 72px;
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      "
    >
      <div>
        <div style="font-size: 14px; opacity: 0.85; letter-spacing: 2px">GOKIN SOLAR</div>
        <h1 style="font-size: 42px; margin: 16px 0 12px; color: #fff">
          光伏厂区设备巡检数字化系统
        </h1>
        <p style="max-width: 520px; font-size: 16px; color: rgba(255, 255, 255, 0.78)">
          面向运维管理、设备台账、任务执行、异常闭环与统计分析的一体化后台管理平台。
        </p>
      </div>

      <div class="info-grid">
        <a-card :bordered="false">
          <a-statistic title="接入设备" :value="286" suffix="台" />
        </a-card>
        <a-card :bordered="false">
          <a-statistic title="今日任务" :value="18" suffix="项" />
        </a-card>
        <a-card :bordered="false">
          <a-statistic title="闭环及时率" :value="91.4" suffix="%" />
        </a-card>
      </div>
    </section>

    <section style="display: flex; align-items: center; justify-content: center; padding: 32px">
      <a-card :bordered="false" style="width: 420px; border-radius: 24px; box-shadow: 0 18px 48px rgba(15, 27, 45, 0.16)">
        <div style="margin-bottom: 28px">
          <div style="font-size: 28px; font-weight: 700; color: #1f2329">后台登录</div>
          <div style="margin-top: 8px; color: #86909c">
            使用账号密码进入 PC 管理端
          </div>
        </div>

        <a-form layout="vertical" :model="formState" @finish="submit">
          <a-form-item label="账号">
            <a-input v-model:value="formState.username" size="large" placeholder="请输入账号">
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item label="密码">
            <a-input-password v-model:value="formState.password" size="large" placeholder="请输入密码">
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
            <a-checkbox v-model:checked="formState.remember">记住账号</a-checkbox>
            <a-typography-link>忘记密码</a-typography-link>
          </div>

          <a-button type="primary" html-type="submit" size="large" block :loading="loading">登录系统</a-button>
        </a-form>

        <a-alert
          style="margin-top: 20px"
          type="info"
          show-icon
          message="说明"
          description="VITE_ENABLE_MOCK=true 时使用模拟登录；设为 false 并配置后端地址后对接真实接口。"
        />
      </a-card>
    </section>
  </div>
</template>
