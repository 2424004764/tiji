<script setup lang="ts">
const { locale, locales, t, setLocale } = useI18n()

const options = locales.map((l) => ({ code: l.code, label: l.switchLabel, aria: l.switchAria }))
</script>

<template>
  <div class="locale-switch" role="group" :aria-label="t('locale.aria')">
    <button
      v-for="opt in options"
      :key="opt.code"
      type="button"
      class="locale-btn"
      :class="{ active: locale === opt.code }"
      :aria-label="opt.aria"
      :aria-pressed="locale === opt.code"
      @click="setLocale(opt.code)"
    >{{ opt.label }}</button>
  </div>
</template>

<style scoped>
.locale-switch {
  display: inline-flex; align-items: center; gap: 2px; padding: 2px;
  border: 1px solid var(--line); border-radius: 999px; background: var(--surface);
  flex-shrink: 0;
}
.locale-btn {
  height: 26px; padding: 0 11px; border: 0; border-radius: 999px;
  background: transparent; font: inherit; font-size: 12.5px; font-weight: 600;
  color: var(--muted); cursor: pointer; white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}
.locale-btn:hover { color: var(--ink); }
.locale-btn.active { background: var(--accent-soft); color: var(--accent-strong); }
</style>
