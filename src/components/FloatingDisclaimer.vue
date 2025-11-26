<template>
  <div class="floating-disclaimer">
    <div class="floating-disclaimer__bubble glass-bubble">
      ТНЭ чат может допускать ошибки. Проверяйте важную информацию.
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.floating-disclaimer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom) + var(--disclaimer-offset, 96px));
  display: flex;
  justify-content: center;
  padding: 0 16px;
  z-index: 10;
  pointer-events: none;
}

.floating-disclaimer__bubble {
  max-width: 720px;
  width: fit-content;
  padding: 8px 14px;
  font-size: 0.9rem;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface-variant));
  pointer-events: auto;
}

@media (max-width: 960px) {
  .floating-disclaimer {
    bottom: calc(env(safe-area-inset-bottom) + var(--disclaimer-offset-mobile, 118px));
  }

  .floating-disclaimer__bubble {
    max-width: 100%;
    font-size: 0.85rem;
    text-align: center;
  }
}
</style>
