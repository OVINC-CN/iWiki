<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {listBoundTagsAPI} from '../api/tag';
import {handleLoading} from '../utils/loading';
import {listDocsAPI} from '../api/doc';
import {Message} from '@arco-design/web-vue';
import Skeleton from '../components/Skeleton.vue';
import DocItem from '../components/DocItem.vue';
import {useStore} from 'vuex';

// store
const store = useStore();

// i18n
const i18n = useI18n();

// title
onMounted(() => {
  document.title = `${i18n.t('AllDoc')} | ${i18n.t('iWiki')}`;
});

// tags
const tagsLoading = ref(true);
const tags = ref([]);
const loadTags = () => {
  handleLoading(tagsLoading, true);
  listBoundTagsAPI().then((res) => tags.value = res.data)
      .finally(() => handleLoading(tagsLoading, true));
};
onMounted(() => loadTags());

// searchType
const enabledFuzzySearch = computed(() => store.state.features.doc_fuzzy_search);
const searchType = ref('tag');
const changeSearchType = () => {
  searchData.value.keywords = [];
  searchData.value.tags = [];
  if (searchType.value === 'tag') {
    searchType.value = 'fuzzy';
  } else {
    searchType.value = 'tag';
  }
};

// search
const docLoading = ref(true);
const docAppendLoading = ref(false);
const docs = ref([]);
const searchData = ref({
  tags: [],
  keywords: [],
  current: 1,
  size: 20,
  total: 0,
});
const loadDocs = (isAppend) => {
  if (isAppend) {
    handleLoading(docAppendLoading, true);
  } else {
    handleLoading(docLoading, true);
  }
  const params = {
    page: searchData.value.current,
    size: searchData.value.size,
    tags: searchData.value.tags.join(','),
    keywords: searchData.value.keywords.join(','),
  };
  listDocsAPI(params)
      .then((res) => {
        if (isAppend) {
          docs.value = docs.value.concat(res.data.results);
        } else {
          docs.value = res.data.results;
        }
        searchData.value.current = res.data.current;
        searchData.value.total = res.data.total;
      }, (err) => {
        Message.error(err.response.data.message);
      })
      .finally(() => {
        if (isAppend) {
          handleLoading(docAppendLoading, false);
        } else {
          handleLoading(docLoading, false);
        }
      });
};
const doSearch = () => {
  docs.value = [];
  searchData.value.current = 1;
  searchData.value.total = 0;
  loadDocs(false);
};
onMounted(() => loadDocs(false));

// card
const cardSpan = ref(6);
const handleResize = () => {
  const width = window.innerWidth;
  if (width >= 1400) {
    cardSpan.value = 6;
  } else if (width >= 1200) {
    cardSpan.value = 8;
  } else if (width >= 640) {
    cardSpan.value = 12;
  } else {
    cardSpan.value = 24;
  }
};
onMounted(() => handleResize());
onMounted(() => window.addEventListener('resize', () => handleResize()));
onUnmounted(() => window.removeEventListener('resize', () => {}));

// load more
const loadMore = () => {
  searchData.value.current += 1;
  loadDocs(true);
};
</script>

<template>
  <a-layout
    :fill="true"
    id="home"
    class="show-min-height"
  >
    <a-layout-header id="home-header">
      <div>
        <a-space>
          <a-select
            v-if="searchType === 'tag'"
            v-model="searchData.tags"
            :placeholder="$t('ChooseTags')"
            multiple
            scrollbar
            allow-clear
            style="width: 100%"
            :disabled="docLoading"
          >
            <a-option
              v-for="tag in tags"
              :key="tag.id"
              :value="tag.name"
            >
              {{ tag.name }}
            </a-option>
          </a-select>
          <a-input-tag
            v-if="searchType === 'fuzzy'"
            v-model="searchData.keywords"
            :placeholder="$t('InputKeywords')"
            allow-clear
            style="width: 100%"
            :disabled="docLoading"
          />
          <a-button
            @click="changeSearchType"
            v-if="enabledFuzzySearch"
            :loading="docLoading"
          >
            <icon-swap />
          </a-button>
          <a-button
            @click="doSearch"
            :loading="docLoading"
          >
            <icon-search />
          </a-button>
        </a-space>
      </div>
    </a-layout-header>
    <a-layout-content id="home-content">
      <skeleton v-show="docLoading && !docs.length" />
      <a-spin
        v-show="docs.length"
        style="width: 100%"
      >
        <a-row
          class="grid-demo"
          :gutter="[20, 20]"
        >
          <a-col
            :span="cardSpan"
            v-for="(doc, index) in docs"
            :key="doc"
          >
            <doc-item
              :doc-data="doc"
              :index="index"
            />
          </a-col>
        </a-row>
      </a-spin>
      <div
        style="width: 100%; display: flex; justify-content: center; margin-top: 20px;"
        v-if="!docLoading && (searchData.total > searchData.current * searchData.size)"
      >
        <a-link @click="loadMore">
          <div style="display: flex; flex-direction: column; align-items: center">
            <div>{{ $t('LoadMore') }}</div>
            <icon-down style="font-size: 14px" />
          </div>
        </a-link>
      </div>
      <skeleton
        v-show="(docAppendLoading && docs.length) || (!docLoading && !docs.length)"
        :animation="docAppendLoading"
        :style="{marginTop: docs.length ? '20px': '0' }"
      />
    </a-layout-content>
  </a-layout>
</template>

<style scoped>
#home {
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

#home-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  box-sizing: border-box;
}

#home-header > div {
  min-height: 320px;
  background: url("/extra-assets/imgs/bg-1.webp");
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
}

#home-header > div > :deep(.arco-space) {
  max-width: 360px;
}

#home-header > div,
#home-header > div > :deep(.arco-space),
#home-header > div > :deep(.arco-space) .arco-space-item:nth-of-type(1) {
  width: 100%;
}

#home-content {
  box-sizing: border-box;
  padding: 20px;
  width: 100%;
  height: 100%;
}

@media screen and (max-width: 640px) {
  #home-header > div {
    min-height: unset;
    background: unset;
    width: 100%;
    padding: 0;
  }
  #home-header > div > :deep(.arco-space) {
    max-width: 100%
  }
}
</style>
