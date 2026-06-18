<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

type Provider = 'vercel' | 'netlify' | 'unknown'

const provider = ref<Provider>('unknown')
const route = useRoute()
const { isDark } = useData()

// 跟随 VitePress 自身深色模式：MutationObserver 监听 <html> 上的 dark class，
// 因为 VitePress 切换外观时主要改 class，未必触发 useData 的响应式更新。
function syncDarkFromHtml() {
    isDark.value = document.documentElement.classList.contains('dark')
}

let observer: MutationObserver | null = null

async function detect() {
    // 支持 ?__provider=vercel|netlify|unknown 强制模拟，方便本地测试
    const override = new URLSearchParams(window.location.search).get('__provider')
    if (override === 'vercel' || override === 'netlify' || override === 'unknown') {
        provider.value = override
        return
    }
    try {
        const res = await fetch(window.location.href, {
            method: 'HEAD',
            cache: 'no-store',
            credentials: 'omit'
        })
        const headers = res.headers
        if (headers.has('x-vercel-id')) {
            provider.value = 'vercel'
        } else if (headers.has('x-nf-request-id')) {
            provider.value = 'netlify'
        } else {
            provider.value = 'unknown'
        }
    } catch {
        provider.value = 'unknown'
    }
}

onMounted(() => {
    syncDarkFromHtml()
    observer = new MutationObserver(syncDarkFromHtml)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    detect()
})

onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
})

// SPA 路由切换时也重新探测
watch(() => route.fullPath, () => {
    provider.value = 'unknown'
    detect()
})
</script>

<template>
    <span style="display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; line-height: 1;">
        <template v-if="provider === 'vercel'">
            <span>此页面由</span>
            <img :src="isDark ? '/assets/vercel-dark.svg' : '/assets/vercel-light.svg'" alt="Vercel" style="height: 14px; width: auto; vertical-align: middle;" />
            <span>提供</span>
        </template>
        <template v-else-if="provider === 'netlify'">
            <span>此页面由</span>
            <img src="/assets/Netlify_Logo.svg" alt="Netlify" style="height: 14px; width: auto; vertical-align: middle;" />
            <span>提供</span>
        </template>
        <template v-else>
            <span>komari.wiki · Powered by</span>
            <img src="/assets/favicon.png" alt="Komari" style="height: 14px; width: auto; vertical-align: middle;" /> Komari
        </template>
    </span>
</template>
