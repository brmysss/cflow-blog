<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '~/store/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.getUser()
})
</script>