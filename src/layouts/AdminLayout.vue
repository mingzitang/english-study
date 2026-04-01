<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => {
  return route.meta.title as string || '后台管理'
})

const navItems = [
  { name: 'AdminDashboard', label: '概览', icon: 'dashboard' },
  { name: 'AdminWords', label: '单词管理', icon: 'words' },
  { name: 'AdminSentences', label: '长难句管理', icon: 'sentences' }
]

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <!-- 侧边栏 (桌面端) -->
    <aside class="hidden md:flex flex-col w-56 bg-card border-r border-border">
      <div class="flex items-center h-14 px-4 border-b border-border">
        <button 
          @click="goBack"
          class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <span class="ml-2 font-semibold text-foreground">后台管理</span>
      </div>
      <nav class="flex-1 p-3">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="[
            route.name === item.name 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          ]"
        >
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部导航栏 (移动端) -->
      <header class="md:hidden sticky top-0 z-50 bg-card border-b border-border safe-area-top">
        <div class="flex items-center h-12 px-4">
          <button 
            @click="goBack"
            class="w-10 h-10 flex items-center justify-center -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">{{ pageTitle }}</h1>
        </div>
      </header>

      <!-- 桌面端标题 -->
      <header class="hidden md:flex items-center h-14 px-6 border-b border-border bg-card">
        <h1 class="text-lg font-semibold text-foreground">{{ pageTitle }}</h1>
      </header>

      <!-- 移动端底部导航 -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
        <div class="flex justify-around h-14">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="flex flex-col items-center justify-center flex-1 text-xs transition-colors"
            :class="[
              route.name === item.name 
                ? 'text-primary' 
                : 'text-muted-foreground'
            ]"
          >
            <span class="text-xs">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <!-- 内容区域 -->
      <main class="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
