<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>后台管理</h1>
      <p>管理考研英语学习资源</p>
    </div>

    <div class="dashboard-grid">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalWords }}</div>
          <div class="stat-label">单词数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalSentences }}</div>
          <div class="stat-label">长难句</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.activeUsers }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.todayCheckIns }}</div>
          <div class="stat-label">今日打卡</div>
        </div>
      </div>

      <!-- 导航卡片 -->
      <div class="nav-grid">
        <router-link to="/admin/words" class="nav-card">
          <div class="card-icon">📚</div>
          <div class="card-title">单词管理</div>
          <div class="card-desc">管理单词库</div>
        </router-link>
        <router-link to="/admin/sentences" class="nav-card">
          <div class="card-icon">📖</div>
          <div class="card-title">长难句管理</div>
          <div class="card-desc">管理长难句库</div>
        </router-link>
      </div>

      <!-- 最近活动 -->
      <div class="recent-activity">
        <h2>最近活动</h2>
        <div v-if="recentActivities.length" class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
            <div class="activity-desc">{{ activity.description }}</div>
          </div>
        </div>
        <div v-else class="empty-state">
          暂无活动记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'

interface Stats {
  totalWords: number
  totalSentences: number
  activeUsers: number
  todayCheckIns: number
}

interface Activity {
  id: string
  description: string
  timestamp: Date
}

const stats = reactive<Stats>({
  totalWords: 0,
  totalSentences: 0,
  activeUsers: 0,
  todayCheckIns: 0
})

const recentActivities = reactive<Activity[]>([])

const formatTime = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(async () => {
  // TODO: 调用 API 获取统计数据
  // API 调用地点：GET /api/admin/stats
  // 需要字段：无
  stats.totalWords = 5000
  stats.totalSentences = 1200
  stats.activeUsers = 3450
  stats.todayCheckIns = 1200

  // TODO: 调用 API 获取最近活动
  // API 调用地点：GET /api/admin/activities
  // 需要字段：limit=10
  recentActivities.push(
    {
      id: '1',
      description: '用户 Alice 完成了 20 个单词的学习',
      timestamp: new Date(Date.now() - 10 * 60000)
    },
    {
      id: '2',
      description: '新增了 5 个长难句',
      timestamp: new Date(Date.now() - 30 * 60000)
    },
    {
      id: '3',
      description: '用户 Bob 订正了错题本中的 3 道题',
      timestamp: new Date(Date.now() - 60 * 60000)
    }
  )
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  margin-bottom: 30px;
}

.admin-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 8px;
}

.admin-header p {
  font-size: 14px;
  color: var(--muted-foreground);
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--muted-foreground);
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.nav-card {
  background: var(--card);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 25px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.nav-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: var(--muted-foreground);
}

.recent-activity {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
}

.recent-activity h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 15px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--background);
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}

.activity-time {
  font-size: 12px;
  color: var(--muted-foreground);
  min-width: 120px;
}

.activity-desc {
  font-size: 14px;
  color: var(--foreground);
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--muted-foreground);
  font-size: 14px;
}
</style>
