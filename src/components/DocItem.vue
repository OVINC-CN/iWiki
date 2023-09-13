<script setup>
import { ref } from 'vue';
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

// tags
const minTags = ref(3);

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
          <a-space
            wrap
            style="margin-top: 10px"
          >
            <a-overflow-list :min="minTags">
              <a-tag
                v-for="item in docData.tags"
                :key="item"
              >
                {{ item }}
              </a-tag>
              <template #overflow>
                <a-popover v-if="docData.tags.length > minTags">
                  <a-tag>+{{ docData.tags.length - minTags }}</a-tag>
                  <template #content>
                    <a-space
                      wrap
                    >
                      <a-tag
                        v-for="item in docData.tags.slice(minTags)"
                        :key="item"
                      >
                        {{ item }}
                      </a-tag>
                    </a-space>
                  </template>
                </a-popover>
              </template>
            </a-overflow-list>
          </a-space>
        </a-space>
      </template>
    </a-card-meta>
  </a-card>
</template>

<style scoped>
.doc-item {
  border-radius: var(--border-radius-medium);
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
