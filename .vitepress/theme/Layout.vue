<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import HostingBadge from './components/HostingBadge.vue'

const { Layout } = DefaultTheme
</script>

<template>
    <Layout>
        <template #layout-bottom>
            <div class="vp-footer-hosting">
                <HostingBadge />
            </div>
        </template>
    </Layout>
</template>

<style>
.vp-footer-hosting {
    display: flex;
    justify-content: center;
    padding: 12px 24px 24px;
    color: var(--vp-c-text-2);
    font-size: 13px;
}
</style>
