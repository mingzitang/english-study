<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { VocabularyBookItem } from '@/types'
import { learningApi } from '@/api/learning'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const item = ref<VocabularyBookItem | null>(null)

function goBack() {
  router.back()
}

onMounted(async () => {
  const id = String(route.params.id || '')
  if (!id) {
    loading.value = false
    return
  }
  try {
    item.value = await learningApi.getVocabularyItemById(id)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-50 bg-card border-b border-border safe-area-top">
      <div class="flex items-center h-12 px-4">
        <button
          @click="goBack"
          class="w-10 h-10 flex items-center justify-center -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">单词详情</h1>
      </div>
    </header>

    <div v-if="loading" class="p-6 text-sm text-muted-foreground text-center">加载中...</div>
    <div v-else-if="!item" class="p-6 text-sm text-muted-foreground text-center">未找到该单词</div>
    <div v-else class="p-4 space-y-4">
      <section class="bg-card rounded-xl border border-border p-4">
        <h2 class="text-2xl font-bold text-foreground">{{ item.word.word }}</h2>
        <p v-if="item.word.phonetic" class="text-sm text-muted-foreground mt-1">{{ item.word.phonetic }}</p>
        <p class="text-xs text-muted-foreground mt-2">
          来源：{{ item.source === 'sentence' ? '长难句' : '手动/私有词' }}
        </p>
      </section>

      <section class="bg-card rounded-xl border border-border p-4">
        <h3 class="text-sm font-semibold text-foreground mb-2">释义</h3>
        <p v-if="item.word.meanings.length === 0" class="text-sm text-muted-foreground">暂无释义</p>
        <div v-else class="space-y-2">
          <p v-for="(meaning, index) in item.word.meanings" :key="index" class="text-sm text-foreground">
            <span class="text-primary mr-1">{{ meaning.partOfSpeech }}</span>{{ meaning.definition }}
          </p>
        </div>
      </section>

      <section class="bg-card rounded-xl border border-border p-4">
        <h3 class="text-sm font-semibold text-foreground mb-2">例句</h3>
        <p v-if="item.word.examples.length === 0" class="text-sm text-muted-foreground">暂无例句</p>
        <ul v-else class="space-y-2">
          <li v-for="(example, index) in item.word.examples" :key="index" class="text-sm text-foreground leading-relaxed">
            {{ index + 1 }}. {{ example }}
          </li>
        </ul>
      </section>

      <AppButton block @click="goBack">返回生词本</AppButton>
    </div>
  </div>
</template>
