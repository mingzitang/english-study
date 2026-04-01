<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import BottomNav from '@/components/common/BottomNav.vue'

const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title as string || '考研英语'
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 顶部标题栏 -->
    <header class="sticky top-0 z-50 bg-card border-b border-border safe-area-top">
      <div class="flex items-center justify-center h-12 px-4">
        <h1 class="text-base font-semibold text-foreground">{{ pageTitle }}</h1>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="flex-1 pb-20 overflow-auto">
      <RouterView />
    </main>

    <!-- 底部导航栏 -->
    <BottomNav />
  </div>
</template>
