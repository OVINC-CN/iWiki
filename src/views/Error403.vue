<template>
  <a-empty
    id="error-403"
    class="show-min-height"
  >
    <span id="error-403-desc">
      {{ $t('AccessDenied') }}
    </span>
    <template #image>
      <icon-tool id="error-403-icon" />
    </template>
  </a-empty>
</template>

<script setup />

<style scoped>
#error-403 {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

#error-403-desc {
  font-size: 24px;
}

#error-403-icon {
  font-size: 48px;
}
</style>
