<template>
  <div class="admin-dashboard">
    <header class="dashboard-header">
      <h1>后台管理中心</h1>
      <div class="admin-info">
        <span>管理员: {{ adminName }}</span>
        <button @click="logout" class="btn-logout">退出</button>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-words">📚</div>
        <div class="stat-content">
          <div class="stat-value">{{ totalWords }}</div>
          <div class="stat-label">单词总数</div>
        </div>
        <router-link to="/admin/words" class="stat-link">管理 →</router-link>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-sentences">📖</div>
        <div class="stat-content">
          <div class="stat-value">{{ totalSentences }}</div>
          <div class="stat-label">长难句总数</div>
        </div>
        <router-link to="/admin/sentences" class="stat-link">管理 →</router-link>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-questions">❓</div>
        <div class="stat-content">
          <div class="stat-value">{{ totalQuestions }}</div>
          <div class="stat-label">题目总数</div>
        </div>
        <router-link to="/admin/questions" class="stat-link">管理 →</router-link>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-users">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ totalUsers }}</div>
          <div class="stat-label">用户总数</div>
        </div>
        <router-link to="/admin/users" class="stat-link">查看 →</router-link>
      </div>
    </div>

    <div class="content-grid">
      <div class="section">
        <h2>快速操作</h2>
        <div class="quick-actions">
          <router-link to="/admin/words" class="quick-btn">
            <span class="icon">📝</span>
            <span>管理单词</span>
          </router-link>
          <router-link to="/admin/sentences" class="quick-btn">
            <span class="icon">✍️</span>
            <span>管理长难句</span>
          </router-link>
          <router-link to="/admin/questions" class="quick-btn">
            <span class="icon">❓</span>
            <span>管理题目</span>
          </router-link>
          <router-link to="/admin/users" class="quick-btn">
            <span class="icon">👤</span>
            <span>用户管理</span>
          </router-link>
        </div>
      </div>

      <div class="section">
        <h2>系统信息</h2>
        <div class="system-info">
          <div class="info-item">
            <span class="label">系统版本</span>
            <span class="value">1.0.0</span>
          </div>
          <div class="info-item">
            <span class="label">数据库状态</span>
            <span class="value status-online">正常</span>
          </div>
          <div class="info-item">
            <span class="label">上次备份</span>
            <span class="value">2024-03-31 10:00</span>
          </div>
          <div class="info-item">
            <span class="label">当前在线用户</span>
            <span class="value">{{ activeUsers }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const adminName = ref('管理员')
const totalWords = ref(450)
const totalSentences = ref(340)
const totalQuestions = ref(1280)
const totalUsers = ref(234)
const activeUsers = ref(12)

const logout = () => {
  // API 调用地点：POST /api/auth/logout
  // 清除登录状态
  localStorage.removeItem('adminToken')
  router.push('/login')
}
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f3f4f6;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: white;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-info span {
  color: #6b7280;
  font-size: 14px;
}

.btn-logout {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  border-radius: 8px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.stat-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-decoration: none;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.quick-btn .icon {
  font-size: 24px;
}

.quick-btn span:last-child {
  font-size: 13px;
  font-weight: 500;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.info-item .label {
  color: #6b7280;
  font-size: 14px;
}

.info-item .value {
  font-weight: 600;
  color: #1f2937;
}

.status-online {
  color: #10b981;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
