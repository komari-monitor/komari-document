<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

type Provider = 'vercel' | 'netlify' | 'unknown'

const provider = ref<Provider>('unknown')
const route = useRoute()

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
    detect()
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
            <picture>
                <source srcset="/assets/vercel-dark.svg" media="(prefers-color-scheme: dark)" />
                <img src="/assets/vercel-light.svg" alt="Vercel" style="height: 14px; width: auto; vertical-align: middle;" />
            </picture>
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
