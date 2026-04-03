<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { LEARNER_CHROME_INNER_CLASS, LEARNER_MAIN_COLUMN_CLASS } from '@/layouts/learnerLayoutTokens'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => {
  return route.meta.title as string || '学习'
})

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 bg-card border-b border-border safe-area-top">
      <div :class="[LEARNER_CHROME_INNER_CLASS, 'flex items-center h-12']">
        <button 
          @click="goBack"
          class="w-10 h-10 flex items-center justify-center -ml-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation md:min-h-11 md:min-w-11"
          aria-label="返回"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">{{ pageTitle }}</h1>
      </div>
    </header>

    <!-- 主内容区域：与 MainLayout 同宽 -->
    <main class="flex-1 overflow-auto">
      <div :class="LEARNER_MAIN_COLUMN_CLASS">
        <RouterView />
      </div>
    </main>
  </div>
</template>
