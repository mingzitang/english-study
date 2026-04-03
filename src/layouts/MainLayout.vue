<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import BottomNav from '@/components/common/BottomNav.vue'
import { LEARNER_CHROME_INNER_CLASS, LEARNER_MAIN_COLUMN_CLASS } from '@/layouts/learnerLayoutTokens'

const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title as string || '考研英语'
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 顶部标题栏 -->
    <header class="sticky top-0 z-50 bg-card border-b border-border safe-area-top">
      <div :class="[LEARNER_CHROME_INNER_CLASS, 'flex items-center justify-center h-12']">
        <h1 class="text-base font-semibold text-foreground">{{ pageTitle }}</h1>
      </div>
    </header>

    <!-- 主内容区域：md+ 限宽容器；底栏仍 fixed，保留 pb 给导航留高 -->
    <main class="flex-1 overflow-auto pb-20">
      <div :class="LEARNER_MAIN_COLUMN_CLASS">
        <RouterView />
      </div>
    </main>

    <!-- 底部导航栏 -->
    <BottomNav />
  </div>
</template>
