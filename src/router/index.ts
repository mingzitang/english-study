import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // 认证相关页面
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false, title: '注册' }
  },

  // 主应用页面（带底部导航）
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/HomeView.vue'),
        meta: { requiresAuth: true, title: '首页' }
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('@/views/stats/StatsView.vue'),
        meta: { requiresAuth: true, title: '学习统计' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: { requiresAuth: true, title: '我的' }
      }
    ]
  },

  // 学习相关页面（全屏，无底部导航）
  {
    path: '/learn',
    component: () => import('@/layouts/LearnLayout.vue'),
    children: [
      {
        path: 'words',
        name: 'WordLearning',
        component: () => import('@/views/learn/WordLearningView.vue'),
        meta: { requiresAuth: true, title: '单词学习' }
      },
      {
        path: 'sentence',
        name: 'SentenceLearning',
        component: () => import('@/views/learn/SentenceLearningView.vue'),
        meta: { requiresAuth: true, title: '长难句训练' }
      },
      {
        path: 'summary',
        name: 'DailySummary',
        component: () => import('@/views/learn/DailySummaryView.vue'),
        meta: { requiresAuth: true, title: '今日总结' }
      }
    ]
  },

  // 词汇和错题相关页面
  {
    path: '/vocabulary',
    name: 'Vocabulary',
    component: () => import('@/views/vocabulary/VocabularyView.vue'),
    meta: { requiresAuth: true, title: '生词本' }
  },
  {
    path: '/errors',
    name: 'ErrorBook',
    component: () => import('@/views/errors/ErrorBookView.vue'),
    meta: { requiresAuth: true, title: '错题本' }
  },
  {
    path: '/checkin',
    name: 'CheckIn',
    component: () => import('@/views/checkin/CheckInView.vue'),
    meta: { requiresAuth: true, title: '打卡记录' }
  },

  // 设置页面
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { requiresAuth: true, title: '学习设置' }
  },

  // 后台管理页面
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: '后台管理' }
      },
      {
        path: 'words',
        name: 'AdminWords',
        component: () => import('@/views/admin/WordsManageView.vue'),
        meta: { title: '单词管理' }
      },
      {
        path: 'sentences',
        name: 'AdminSentences',
        component: () => import('@/views/admin/SentencesManageView.vue'),
        meta: { title: '长难句管理' }
      }
    ]
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '考研英语学习助手'} - 考研英语`

  // 检查认证状态
  const token = localStorage.getItem('auth_token')
  const isAuthenticated = !!token

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
