import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // 后端基址为 http://1.14.47.50:3000/api：原样转发 /api/**，不再 strip 前缀
      '/api': {
        target: 'http://1.14.47.50:3000',
        changeOrigin: true,
        ws: true,
      },
      // MinIO 静态资源与 /api 平级：http://host:3000/minio/...
      '/minio': {
        target: 'http://1.14.47.50:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  optimizeDeps: {
    include: ['html2canvas', 'jspdf'],
  },
  plugins: [
    vue(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // 使用 CSS-in-JS，无需单独引入样式
        }),
      ],
    }),
  ],
  build: {
    // 产物输出到仓库根目录 /dist，便于部署整仓时直接指向该目录
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/node_modules/vue/') || id.includes('/node_modules/vue-router/') || id.includes('/node_modules/pinia/')) return 'vendor-vue'
          if (id.includes('/node_modules/ant-design-vue/')) return 'vendor-antd'
          if (id.includes('/node_modules/echarts/')) return 'vendor-echarts'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
