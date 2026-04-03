<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { LEARNER_CHROME_INNER_CLASS } from '@/layouts/learnerLayoutTokens'

const route = useRoute()

const navItems = [
  {
    name: 'Home',
    label: '首页',
    icon: 'home'
  },
  {
    name: 'Stats',
    label: '统计',
    icon: 'stats'
  },
  {
    name: 'Profile',
    label: '我的',
    icon: 'profile'
  }
]

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
    <div :class="[LEARNER_CHROME_INNER_CLASS, 'flex justify-around items-center h-16 md:h-[4.25rem] touch-manipulation']">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="flex flex-col items-center justify-center flex-1 py-2 md:py-2.5 min-h-11 transition-colors"
        :class="[
          isActive(item.name) 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <!-- 首页图标 -->
        <svg v-if="item.icon === 'home'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <!-- 统计图标 -->
        <svg v-else-if="item.icon === 'stats'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" x2="18" y1="20" y2="10"/>
          <line x1="12" x2="12" y1="20" y2="4"/>
          <line x1="6" x2="6" y1="20" y2="14"/>
        </svg>
        <!-- 我的图标 -->
        <svg v-else-if="item.icon === 'profile'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="5"/>
          <path d="M20 21a8 8 0 0 0-16 0"/>
        </svg>
        <span class="text-xs mt-1">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
