<script setup>
defineProps({
  animation: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <a-skeleton :animation="animation">
    <a-space
      direction="vertical"
      :style="{width:'100%'}"
      size="large"
    >
      <a-skeleton-line :rows="6" />
    </a-space>
  </a-skeleton>
</template>

<style scoped>

</style>
