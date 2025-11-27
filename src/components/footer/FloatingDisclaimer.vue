<template>
  <div class="floating-disclaimer" style="font-size: 12px;">
    ТНЭ чат может допускать ошибки. Проверяйте важную информацию.
  </div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
.floating-disclaimer {
  position: fixed;
  /* с учётом нижнего app-footer’а */
  bottom: 4px;

  /* центр рабочей области v-main, а не всего окна */
  left: calc(
      var(--v-layout-left, 0px) +
      (100vw - var(--v-layout-left, 0px) - var(--v-layout-right, 0px)) / 2
  );
  transform: translateX(-50%);

  font-size: 10px;
  z-index: 999; // если нужно поверх футера/чата
}
</style>