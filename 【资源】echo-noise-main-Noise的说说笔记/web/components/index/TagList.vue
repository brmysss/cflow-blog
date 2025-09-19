<template>
  <div class="tags-container mx-auto w-full sm:max-w-2xl">
    <div class="relative">
      <div class="tags-wrapper">
        <div class="tags-scroll">
          <template v-for="tag in filteredTags" :key="tag.name + timestamp">
            <span
              class="tag-item"
              @click="handleTagClick(tag.name)"
            >
              #{{ tag.name }}
              <span class="tag-count">({{ tag.count }})</span>
            </span>
          </template>
        </div>
      </div>
      <div 
        class="absolute -right-1 top-1/2 -translate-y-1/2 p-2 cursor-pointer transition-all duration-200 hover:scale-110 z-10"
        @click="refreshTags"
        title="刷新标签"
      >
        <UIcon 
          name="i-mdi-refresh" 
          class="w-5 h-5 text-gray-400 hover:text-orange-500"
          :class="{ 'animate-spin': isRefreshing }"
        />
      </div>
      <div class="scroll-fade"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits(['tagClick', 'updateTags'])
const isRefreshing = ref(false)
const timestamp = ref(Date.now())

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  }
})

const filteredTags = computed(() => {
  const invalidChars = /[/?=&]/;
  const isMediaLink = /^(song|video|playlist)\?id=\d+$/;
  const cache = new Map();
  
  return props.tags.reduce((acc, tag) => {
    // 使用缓存避免重复计算
    if (cache.has(tag.name)) {
      return acc;
    }
    
    if (!invalidChars.test(tag.name) && !isMediaLink.test(tag.name)) {
      cache.set(tag.name, true);
      acc.push(tag);
    }
    return acc;
  }, []);
}, { immediate: true });

const handleTagClick = (tagName: string) => {
  emit('tagClick', tagName)
}

const refreshTags = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  timestamp.value = Date.now()
  emit('updateTags')
  
  setTimeout(() => {
    isRefreshing.value = false
  }, 1000)
}
</script>

<style scoped>
.tags-container {
  width: 100%;
  margin: 0.5rem auto;
  padding: 0 0.5rem;
  position: relative;
  background: transparent;
}

.tags-wrapper {
  position: relative;
  overflow: hidden;
  background: transparent;
}

.tags-scroll {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: transparent;
}

.tags-scroll::-webkit-scrollbar {
  display: none;
}

.tag-item {
  will-change: transform;
  contain: content;
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  color: #c7cace;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.tag-item:hover {
  color: #fb923c;
  transform: translateY(-1px);
}

.tag-count {
  margin-left: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.8;
}

.scroll-fade {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 32px;
  pointer-events: none;
}
</style>