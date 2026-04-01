<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLearningStore } from '@/stores/learning'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const learningStore = useLearningStore()

const user = computed(() => authStore.user)
const stats = computed(() => learningStore.stats)
const settings = computed(() => authStore.settings)

const menuItems = [
  {
    label: '学习设置',
    description: `每日新词 ${settings.value.dailyNewWords} / 复习 ${settings.value.dailyReviewWords}`,
    route: { name: 'Settings' },
    icon: 'settings'
  },
  {
    label: '打卡记录',
    description: `连续打卡 ${stats.value?.consecutiveDays || 0} 天`,
    route: { name: 'CheckIn' },
    icon: 'calendar'
  },
  {
    label: '生词本',
    description: '查看收藏的单词',
    route: { name: 'Vocabulary' },
    icon: 'book'
  },
  {
    label: '错题本',
    description: '复习错误的长难句',
    route: { name: 'ErrorBook' },
    icon: 'error'
  }
]

const adminMenu = {
  label: '后台管理',
  description: '管理单词和长难句',
  route: { name: 'AdminDashboard' },
  icon: 'admin'
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="px-4 py-4 space-y-6">
    <!-- 用户信息 -->
    <section class="bg-card rounded-xl p-5 border border-border">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span class="text-2xl font-bold text-primary">
            {{ user?.nickname?.[0] || user?.email?.[0]?.toUpperCase() || 'U' }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold text-foreground truncate">
            {{ user?.nickname || user?.email || '用户' }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ user?.examType === 'english1' ? '英语一' : '英语二' }}
          </p>
        </div>
      </div>
      
      <!-- 学习数据概览 -->
      <div class="flex justify-around mt-5 pt-5 border-t border-border">
        <div class="text-center">
          <p class="text-xl font-bold text-foreground">{{ stats?.totalDays || 0 }}</p>
          <p class="text-xs text-muted-foreground mt-1">打卡天数</p>
        </div>
        <div class="text-center">
          <p class="text-xl font-bold text-foreground">{{ stats?.totalWordsLearned || 0 }}</p>
          <p class="text-xs text-muted-foreground mt-1">学习单词</p>
        </div>
        <div class="text-center">
          <p class="text-xl font-bold text-foreground">{{ stats?.totalSentencesCompleted || 0 }}</p>
          <p class="text-xs text-muted-foreground mt-1">完成长难句</p>
        </div>
      </div>
    </section>
    
    <!-- 菜单列表 -->
    <section class="bg-card rounded-xl border border-border overflow-hidden">
      <RouterLink
        v-for="item in menuItems"
        :key="item.label"
        :to="item.route"
        class="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
      >
        <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
          <!-- 设置图标 -->
          <svg v-if="item.icon === 'settings'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <!-- 日历图标 -->
          <svg v-else-if="item.icon === 'calendar'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
            <path d="m9 16 2 2 4-4"/>
          </svg>
          <!-- 书本图标 -->
          <svg v-else-if="item.icon === 'book'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <!-- 错误图标 -->
          <svg v-else-if="item.icon === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground">{{ item.label }}</p>
          <p class="text-xs text-muted-foreground">{{ item.description }}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </RouterLink>
    </section>
    
    <!-- 后台管理入口 -->
    <section class="bg-card rounded-xl border border-border overflow-hidden">
      <RouterLink
        :to="adminMenu.route"
        class="flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors"
      >
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground">{{ adminMenu.label }}</p>
          <p class="text-xs text-muted-foreground">{{ adminMenu.description }}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </RouterLink>
    </section>
    
    <!-- 退出登录 -->
    <section>
      <AppButton 
        @click="handleLogout"
        variant="outline"
        block
      >
        退出登录
      </AppButton>
    </section>
    
    <!-- 版本信息 -->
    <p class="text-center text-xs text-muted-foreground">
      版本 1.0.0
    </p>
  </div>
</template>
