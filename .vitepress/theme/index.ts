import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import SponsorBanner from "./SponsorBanner.vue";
import SponsorSlots from "./SponsorSlots.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    "home-hero-before": () => h(SponsorBanner),
    "doc-before": () => h(SponsorBanner),
    "aside-outline-after": () => h(SponsorSlots, { count: 1 }),
  }),
};
