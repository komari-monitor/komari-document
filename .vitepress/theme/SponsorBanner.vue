<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';

defineProps<{ placement?: 'top' | 'aside' }>();

const { lang, frontmatter } = useData();
const copy = computed(() => lang.value.startsWith('en') ? {
  label: 'Advertisement', title: 'Advertise here',
  description: 'Support Komari. Reach developers.', email: 'Email',
} : {
  label: '广告', title: '广告位招租',
  description: '支持开源，让更多VPS玩家、开发者看见你的产品。', email: '邮件联系',
});

// Sponsor contacts published in the Komari server README.
const email = 'mailto:komari@akz.moe';
const telegram = 'https://t.me/mamomoe';
</script>

<template>
  <aside v-if="!frontmatter.sponsorBannerHidden" class="sponsor-banner" :class="{ 'sponsor-banner--aside': placement === 'aside' }" :aria-label="copy.label">
    <div class="sponsor-banner__surface">
      <span class="sponsor-banner__badge">AD</span>
      <span class="sponsor-banner__title">{{ copy.title }}</span>
      <span class="sponsor-banner__description">{{ copy.description }}</span>
      <div class="sponsor-banner__contacts">
        <a :href="email" class="sponsor-banner__email">{{ copy.email }}</a>
        <a :href="telegram" class="sponsor-banner__button" target="_blank" rel="noopener noreferrer" aria-label="Telegram @mamomoe">
          Telegram
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </a>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sponsor-banner {
  --sponsor-bg: #fff;
  --sponsor-fg: #18181b;
  --sponsor-muted: #71717a;
  --sponsor-border: #e4e4e7;
  --sponsor-hover: #f4f4f5;
  margin: 0 0 24px;
}
:global(.dark) .sponsor-banner {
  --sponsor-bg: #18181b;
  --sponsor-fg: #fafafa;
  --sponsor-muted: #a1a1aa;
  --sponsor-border: #3f3f46;
  --sponsor-hover: #27272a;
}
.sponsor-banner__surface {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid var(--sponsor-border);
  border-radius: 6px;
  background: var(--sponsor-bg);
  color: var(--sponsor-fg);
  font-size: 12px;
  line-height: 20px;
}
.sponsor-banner__badge {
  flex-shrink: 0;
  padding: 0 5px;
  border: 1px solid var(--sponsor-border);
  border-radius: 4px;
  color: var(--sponsor-muted);
  font-size: 10px;
  font-weight: 500;
  line-height: 18px;
}
.sponsor-banner__title { flex-shrink: 0; font-weight: 500; }
.sponsor-banner__description {
  min-width: 0;
  overflow: hidden;
  color: var(--sponsor-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sponsor-banner__contacts {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.sponsor-banner__email {
  color: var(--sponsor-muted);
  text-decoration: none;
  text-underline-offset: 3px;
}
.sponsor-banner__email:hover { color: var(--sponsor-fg); text-decoration: underline; }
.sponsor-banner__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 9px;
  border: 1px solid var(--sponsor-border);
  border-radius: 4px;
  color: var(--sponsor-fg);
  font-weight: 500;
  text-decoration: none;
  transition: background-color .15s;
}
.sponsor-banner__button:hover { background: var(--sponsor-hover); }
.sponsor-banner a:focus-visible {
  outline: 2px solid var(--sponsor-muted);
  outline-offset: 3px;
}
:global(.VPHome) .sponsor-banner { max-width: 1280px; margin: 16px auto 0; padding: 0 24px; }
@media (min-width: 640px) { :global(.VPHome) .sponsor-banner { padding: 0 48px; } }
@media (min-width: 960px) { :global(.VPHome) .sponsor-banner { padding: 0 64px; } }
@media (max-width: 767px) { .sponsor-banner__description { display: none; } }
@media (max-width: 359px) {
  .sponsor-banner__surface { flex-wrap: wrap; }
  .sponsor-banner__contacts { flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) { .sponsor-banner__button { transition: none; } }
/* The aside uses the same understated visual language in a vertical layout. */
.sponsor-banner--aside { min-width: 0; margin: 0; }
.sponsor-banner--aside .sponsor-banner__surface {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: auto 1fr;
  align-content: space-between;
  height: 120px;
  min-height: 120px;
  max-height: 120px;
  gap: 6px 8px;
  padding: 12px;
}
.sponsor-banner--aside .sponsor-banner__title { font-size: 14px; }
.sponsor-banner--aside .sponsor-banner__description {
  grid-column: 1 / -1;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  white-space: normal;
  line-height: 18px;
}
.sponsor-banner--aside .sponsor-banner__contacts {
  grid-column: 1 / -1;
  width: 100%;
  margin: 0;
  justify-content: space-between;
  flex-wrap: wrap;
}
</style>
