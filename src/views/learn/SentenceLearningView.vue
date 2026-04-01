<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import type { CustomWordInput } from '@/types'
import { learningApi } from '@/api/learning'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const learningStore = useLearningStore()

const userTranslation = ref('')
const showAnalysis = ref(false)
const selectedWords = ref<string[]>([])
const addWordMessage = ref('')
const pendingWords = ref<string[]>([])
const showWordModal = ref(false)
const pendingWord = ref('')
const customTranslation = ref('')
const customPhonetic = ref('')
const customPartOfSpeech = ref('')
const customExamples = ref('')
const lookupVisible = ref(false)
const lookupLoading = ref(false)
const lookupWord = ref('')
const lookupPhonetic = ref('')
const lookupSource = ref('')
const lookupMeanings = ref<Array<{ partOfSpeech: string; definition: string }>>([])
const lookupMessage = ref('')

const sentence = computed(() => learningStore.todaySentence)
const feedback = computed(() => learningStore.sentenceAIFeedback)
const isLoading = computed(() => learningStore.loading)

onMounted(() => {
  learningStore.loadTodaySentence()
})

async function submitTranslation() {
  if (!sentence.value || !userTranslation.value.trim()) return
  
  await learningStore.submitTranslation(sentence.value.id, userTranslation.value)
}

function toggleAnalysis() {
  showAnalysis.value = !showAnalysis.value
}

function selectWord(word: string) {
  if (selectedWords.value[0] === word) {
    selectedWords.value = []
    return
  }
  selectedWords.value = [word]
}

async function handleWordClick(word: string) {
  const cleanWord = word.replace(/[.,!?;:]/g, '').trim().toLowerCase()
  if (!cleanWord) return
  selectWord(cleanWord)
  lookupVisible.value = true
  lookupLoading.value = true
  lookupWord.value = cleanWord
  lookupPhonetic.value = ''
  lookupSource.value = ''
  lookupMeanings.value = []
  lookupMessage.value = ''
  try {
    const result = await learningApi.lookupWord(cleanWord)
    lookupWord.value = result.word
    lookupPhonetic.value = result.phonetic || ''
    lookupSource.value = result.source === 'custom' ? '私有词库' : result.source === 'library' ? '公共词库' : ''
    lookupMeanings.value = result.meanings
    lookupMessage.value = result.found ? '' : (result.message || '词库暂无')
  } catch {
    lookupMessage.value = '查询失败，请稍后重试'
  } finally {
    lookupLoading.value = false
  }
}

async function addSelectedWordsToVocabulary() {
  if (!sentence.value) return
  addWordMessage.value = ''
  pendingWords.value = [...selectedWords.value]
  while (pendingWords.value.length > 0) {
    const word = pendingWords.value.shift() as string
    const result = await learningStore.addWordFromSentence(word, sentence.value.id)
    if (result.status === 'need_custom_info') {
      openCustomWordModal(word)
      return
    }
    if (result.status === 'error') {
      addWordMessage.value = result.message || '添加生词失败'
      continue
    }
    addWordMessage.value = result.status === 'exists' ? `「${word}」已在生词本` : `已添加「${word}」`
  }
  selectedWords.value = []
}

function openCustomWordModal(word: string) {
  pendingWord.value = word
  customTranslation.value = ''
  customPhonetic.value = ''
  customPartOfSpeech.value = ''
  customExamples.value = ''
  showWordModal.value = true
}

function closeCustomWordModal() {
  showWordModal.value = false
}

async function submitCustomWord() {
  if (!sentence.value || !pendingWord.value || !customTranslation.value.trim()) return
  const payload: CustomWordInput = {
    translation: customTranslation.value.trim(),
    phonetic: customPhonetic.value.trim() || undefined,
    partOfSpeech: customPartOfSpeech.value.trim() || undefined,
    examples: customExamples.value
      .split('\n')
      .map((x: string) => x.trim())
      .filter(Boolean)
  }
  const result = await learningStore.addWordFromSentence(pendingWord.value, sentence.value.id, payload)
  if (result.status === 'error') {
    addWordMessage.value = result.message || '添加生词失败'
    return
  }
  addWordMessage.value = result.status === 'exists' ? `「${pendingWord.value}」已在生词本` : `已添加「${pendingWord.value}」`
  showWordModal.value = false
  const handledWord = pendingWord.value
  pendingWord.value = ''
  selectedWords.value = selectedWords.value.filter((w: string) => w !== handledWord)

  while (pendingWords.value.length > 0) {
    const word = pendingWords.value.shift() as string
    const nextResult = await learningStore.addWordFromSentence(word, sentence.value.id)
    if (nextResult.status === 'need_custom_info') {
      openCustomWordModal(word)
      return
    }
  }
}

async function addToErrorBook() {
  if (!sentence.value) return
  await learningStore.addToErrorBook(sentence.value.id)
}

function continueToNewWords() {
  router.push({ name: 'WordLearning', query: { type: 'new' } })
}

function goToSummary() {
  router.push({ name: 'DailySummary' })
}

// 将句子拆分为单词，用于点击选择
function splitSentence(text: string) {
  return text.split(/\s+/).filter(word => word.length > 0)
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-background">
    <!-- 主内容 -->
    <div class="flex-1 overflow-auto">
      <!-- 加载状态 -->
      <div v-if="isLoading && !sentence" class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p class="text-muted-foreground">加载中...</p>
        </div>
      </div>
      
      <!-- 句子内容 -->
      <div v-else-if="sentence" class="p-4 space-y-4">
        <!-- 难度和来源 -->
        <div class="flex items-center gap-2 text-xs">
          <span class="px-2 py-1 bg-primary/10 text-primary rounded-full">
            难度 {{ sentence.difficulty }}
          </span>
          <span v-if="sentence.source" class="px-2 py-1 bg-secondary text-muted-foreground rounded-full">
            {{ sentence.source }}
          </span>
        </div>
        
        <!-- 英文句子 -->
        <div class="bg-card rounded-xl p-4 border border-border">
          <p class="text-xs text-muted-foreground mb-2">英文原句</p>
          <p class="text-foreground leading-relaxed text-lg">
            <!-- 可点击选择的单词 -->
            <template v-if="feedback">
              <span
                v-for="(word, index) in splitSentence(sentence.content)"
                :key="index"
                @click="handleWordClick(word)"
                class="cursor-pointer hover:text-primary transition-colors"
                :class="{
                  'bg-sky-100 text-sky-700 px-1 rounded': selectedWords.includes(word.replace(/[.,!?;:]/g, ''))
                }"
              >
                {{ word }}{{ ' ' }}
              </span>
            </template>
            <template v-else>
              {{ sentence.content }}
            </template>
          </p>
          
          <!-- 生词选择提示 -->
          <p v-if="feedback && selectedWords.length > 0" class="text-xs text-muted-foreground mt-3">
            已选择 {{ selectedWords.length }} 个生词
            <button 
              @click="addSelectedWordsToVocabulary"
              class="text-primary font-medium ml-2"
            >
              加入生词本
            </button>
          </p>
          <p v-if="addWordMessage" class="text-xs mt-2 text-primary">
            {{ addWordMessage }}
          </p>

          <div v-if="lookupVisible" class="mt-3 relative">
            <div class="absolute -top-2 left-6 w-3 h-3 bg-card border-l border-t border-border rotate-45" />
            <div class="bg-card border border-border rounded-xl p-3">
              <p class="text-xs text-muted-foreground mb-1">单词释义</p>
              <p class="text-sm font-semibold text-foreground">
                {{ lookupWord }} <span v-if="lookupPhonetic" class="text-xs text-muted-foreground ml-1">{{ lookupPhonetic }}</span>
              </p>
              <p v-if="lookupSource" class="text-[11px] text-primary mt-1">{{ lookupSource }}</p>
              <p v-if="lookupLoading" class="text-xs text-muted-foreground mt-2">查询中...</p>
              <template v-else>
                <p v-if="lookupMessage" class="text-xs text-muted-foreground mt-2">{{ lookupMessage }}</p>
                <ul v-else class="mt-2 space-y-1">
                  <li v-for="(meaning, index) in lookupMeanings" :key="index" class="text-xs text-foreground">
                    <span class="text-primary mr-1">{{ meaning.partOfSpeech }}</span>{{ meaning.definition }}
                  </li>
                </ul>
              </template>
            </div>
          </div>
        </div>
        
        <!-- 翻译输入区 (未提交时显示) -->
        <div v-if="!feedback" class="space-y-3">
          <div class="bg-card rounded-xl border border-border overflow-hidden">
            <textarea
              v-model="userTranslation"
              placeholder="请输入你的翻译..."
              rows="4"
              class="w-full p-4 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
            />
          </div>
          
          <AppButton
            @click="submitTranslation"
            block
            size="lg"
            :loading="isLoading"
            :disabled="!userTranslation.trim()"
          >
            提交翻译
          </AppButton>
        </div>
        
        <!-- AI 反馈区 (提交后显示) -->
        <div v-if="feedback" class="space-y-4">
          <!-- 评分 -->
          <!-- <div class="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 text-center">
            <p class="text-sm text-muted-foreground mb-1">翻译得分</p>
            <p class="text-4xl font-bold" :class="[
              feedback.score >= 80 ? 'text-accent' : 
              feedback.score >= 60 ? 'text-primary' : 
              'text-warning'
            ]">
              {{ feedback.score }}
            </p>
          </div> -->
          
          <!-- 参考译文 -->
          <div class="bg-card rounded-xl p-4 border border-border">
            <p class="text-xs text-muted-foreground mb-2">参考译文</p>
            <p class="text-foreground leading-relaxed">{{ feedback.referenceTranslation }}</p>
          </div>
          
          <!-- 问题点 -->
          <!-- <div v-if="feedback.issues.length > 0" class="bg-card rounded-xl p-4 border border-border">
            <p class="text-xs text-muted-foreground mb-2">问题反馈</p>
            <ul class="space-y-2">
              <li 
                v-for="(issue, index) in feedback.issues" 
                :key="index"
                class="flex items-start gap-2 text-sm text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                {{ issue }}
              </li>
            </ul>
          </div> -->
          
          <!-- 句子拆解 (可折叠) -->
          <div class="bg-card rounded-xl border border-border overflow-hidden">
            <button 
              @click="toggleAnalysis"
              class="w-full flex items-center justify-between p-4 text-left"
            >
              <span class="text-sm font-medium text-foreground">句子结构分析</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                class="text-muted-foreground transition-transform"
                :class="{ 'rotate-180': showAnalysis }"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div v-if="showAnalysis" class="px-4 pb-4 border-t border-border pt-3">
              <p class="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {{ feedback.structureAnalysis }}
              </p>
            </div>
          </div>
          
          <!-- 加入错题本建议 -->
          <div v-if="feedback.shouldAddToErrorBook" class="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
            <div class="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive shrink-0 mt-0.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-foreground">建议加入错题本</p>
                <p class="text-xs text-muted-foreground mt-1">这个句子可能需要再练习一下</p>
              </div>
              <AppButton
                @click="addToErrorBook"
                size="sm"
                variant="outline"
              >
                加入
              </AppButton>
            </div>
          </div>
          
          <!-- 继续按钮 -->
          <div class="pt-2 space-y-3">
            <AppButton
              @click="continueToNewWords"
              block
              size="lg"
            >
              继续学习新词
            </AppButton>
            <AppButton
              @click="goToSummary"
              variant="ghost"
              block
            >
              查看今日总结
            </AppButton>
          </div>
        </div>
      </div>
      
      <!-- 无句子状态 -->
      <div v-else class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-foreground mb-2">今日长难句已完成</h2>
          <p class="text-sm text-muted-foreground mb-6">继续保持学习节奏!</p>
          <AppButton @click="continueToNewWords">
            继续学习
          </AppButton>
        </div>
      </div>
    </div>

    <div
      v-if="showWordModal"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      @click.self="closeCustomWordModal"
    >
      <div class="w-full max-w-sm bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 class="text-base font-semibold text-foreground">补充单词信息</h3>
        <p class="text-xs text-muted-foreground">
          「{{ pendingWord }}」不在公共词库，请先补充翻译（必填）
        </p>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">翻译（必填）</label>
          <input v-model="customTranslation" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="请输入中文释义" />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">音标（可选）</label>
          <input v-model="customPhonetic" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="如 /ˈwɜːd/" />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">词性（可选）</label>
          <input v-model="customPartOfSpeech" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="如 n. / v." />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">例句（可选，一行一个）</label>
          <textarea v-model="customExamples" rows="3" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div class="flex gap-2 pt-1">
          <AppButton variant="ghost" block @click="closeCustomWordModal">取消</AppButton>
          <AppButton block :disabled="!customTranslation.trim()" @click="submitCustomWord">保存并加入</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
