<script setup lang="ts">
import { computed } from 'vue';
import SponsorBanner from './SponsorBanner.vue';

const props = withDefaults(defineProps<{ count?: number }>(), { count: 1 });
// Keep the sidebar useful for navigation: never render more than three ads.
const slotCount = computed(() => Number.isFinite(props.count)
  ? Math.min(3, Math.max(1, Math.trunc(props.count))) : 1);
</script>

<template>
  <div class="sponsor-slots">
    <SponsorBanner v-for="slot in slotCount" :key="slot" placement="aside" />
  </div>
</template>

<style scoped>
.sponsor-slots {
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 280px;
  margin-top: 20px;
}
</style>
