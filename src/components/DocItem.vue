<script setup>
import globalContext from '../context';

const props = defineProps({
  docData: {
    type: Object,
    default: () => ({
      id: '',
      owner_nick_name: '',
      comments: 0,
      tags: [],
      title: '',
      header_img: '',
      is_public: true,
      pv: 0,
      updated_at: '',
      created_at: '',
      owner: '',
    }),
  },
  index: {
    type: Number,
    default: 0,
  },
});

// doc
const showDoc = () => {
  const url = `${globalContext.siteUrl}/doc/${props.docData.id}`;
  window.open(url);
};
</script>

<template>
  <a-card
    hoverable
    class="doc-item"
    @click="showDoc"
  >
    <template #cover>
      <img
        :alt="docData.title"
        :src="docData.header_img"
      >
    </template>
    <a-card-meta>
      <template #title>
        <a-tag
          v-if="!docData.is_public"
          color="orangered"
        >
          <icon-lock />
        </a-tag>
        {{ docData.title }}
      </template>
      <template #description>
        <a-space
          direction="vertical"
          class="doc-item-doc-info"
        >
          <a-space direction="vertical">
            <a-space>
              {{ docData.owner_nick_name }}
            </a-space>
            <a-space>
              <a-space>
                {{ docData.created_at }}
              </a-space>
            </a-space>
          </a-space>
          <a-overflow-list>
            <a-tag
              v-for="item in docData.tags"
              :key="item"
            >
              {{ item }}
            </a-tag>
          </a-overflow-list>
        </a-space>
      </template>
    </a-card-meta>
  </a-card>
</template>

<style scoped>
.doc-item {
  border-radius: var(--border-radius-medium);
  border: none;
  box-shadow: 0 0 10px var(--color-neutral-2);
  overflow: hidden;
  width: 100%;
  margin: 0;
  cursor: pointer;
}

.doc-item:hover {
  box-shadow: var(--shadow3-center);
}

.doc-item img {
  height: 240px;
  width: 100%;
  object-position: center;
  object-fit: cover;
}

.doc-item .doc-item-doc-info {
  margin-top: 10px;
  width: 100%;
  min-height: 100px;
}
</style>
