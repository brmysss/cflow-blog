import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }

  return {
    provide: {
      fetch: async (url: string, options = {}) => {
        const finalOptions = {
          ...defaultOptions,
          ...options,
          headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
          },
        }
        
        try {
          return await $fetch(url, finalOptions)
        } catch (error) {
          console.error('请求错误:', error)
          throw error
        }
      }
    }
  }
})