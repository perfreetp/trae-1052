<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#409eff"><Van /></el-icon>
        <span class="logo-text">港口闸口系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#b8c7ce"
        active-text-color="#fff"
        class="menu"
      >
        <el-menu-item v-for="route in menuRoutes" :key="route.path" :index="route.path">
          <el-icon>
            <component :is="route.meta.icon" />
          </el-icon>
          <template #title>{{ route.meta.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="current-page">{{ currentPageTitle }}</span>
        </div>
        <div class="header-right">
          <el-tag size="small" type="success">
            <span class="congestion-light" :class="congestionClass"></span>
            {{ congestionText }}
          </el-tag>
          <el-divider direction="vertical" />
          <el-dropdown>
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ currentUser.name }}
              <el-tag size="small" type="info">{{ currentUser.shift }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人信息</el-dropdown-item>
                <el-dropdown-item>修改密码</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-divider direction="vertical" />
          <span class="time">{{ currentTime }}</span>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import router from '@/router'

const route = useRoute()
const store = useAppStore()

const activeMenu = computed(() => route.path)
const currentTime = ref('')
let timer: number | null = null

const menuRoutes = computed(() =>
  router.options.routes.filter(r => r.meta && r.meta.title)
)

const currentPageTitle = computed(() => route.meta?.title || '')

const currentUser = computed(() => store.currentUser)

const congestionClass = computed(() => {
  const level = store.congestionLevel
  return level === 'heavy' ? 'congestion-heavy' : level === 'medium' ? 'congestion-medium' : 'congestion-light'
})

const congestionText = computed(() => {
  const level = store.congestionLevel
  return level === 'heavy' ? '拥堵' : level === 'medium' ? '缓行' : '畅通'
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.sidebar {
  background: #001529;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid #1f2d3d;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.menu {
  flex: 1;
  border-right: none;
}

.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header-left .current-page {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}

.time {
  font-size: 14px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.main-content {
  padding: 0;
  background: #f0f2f5;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
