<script setup>
import { qrcodeRows } from '../../mock/data'
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header__meta">
        <h2>二维码管理</h2>
        <p>按设备生成唯一二维码，支持预览、下载、打印、失效管理和重生成。</p>
      </div>
      <a-space>
        <a-button>批量下载</a-button>
        <a-button>批量打印</a-button>
        <a-button type="primary">重新生成二维码</a-button>
      </a-space>
    </div>

    <div class="panel-grid page-section">
      <a-card title="二维码预览" :bordered="false">
        <div
          style="
            height: 300px;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, #fafafa, #f5f7fa);
            border-radius: 12px;
          "
        >
          <div style="text-align: center">
            <div
              style="
                width: 180px;
                height: 180px;
                margin: 0 auto 16px;
                background:
                  linear-gradient(90deg, #000 12px, transparent 12px) 0 0/24px 24px,
                  linear-gradient(#000 12px, transparent 12px) 0 0/24px 24px,
                  #fff;
                border: 10px solid #fff;
                box-shadow: 0 12px 24px rgba(31, 35, 41, 0.08);
              "
            />
            <div style="font-weight: 600">INV-A-001</div>
            <div style="color: #86909c; margin-top: 6px">A 区 1 号逆变器</div>
          </div>
        </div>
      </a-card>

      <a-card title="管理规则" :bordered="false">
        <a-list :data-source="[
          '一物一码，不允许重复复用',
          '失效后可保留历史版本追溯',
          '支持批量导出打印张贴',
          '设备停用后二维码同步失效',
        ]">
          <template #renderItem="{ item }">
            <a-list-item>{{ item }}</a-list-item>
          </template>
        </a-list>
      </a-card>
    </div>

    <a-card title="二维码列表" :bordered="false">
      <a-table :data-source="qrcodeRows" :pagination="false">
        <a-table-column title="设备编码" data-index="device" key="device" />
        <a-table-column title="批次" data-index="batch" key="batch" />
        <a-table-column title="版本" data-index="version" key="version" />
        <a-table-column title="状态" data-index="status" key="status" />
        <a-table-column title="操作" data-index="action" key="action" />
      </a-table>
    </a-card>
  </div>
</template>
