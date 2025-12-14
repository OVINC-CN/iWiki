<script setup>
import {computed, onMounted, ref, nextTick, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Message} from '@arco-design/web-vue';
import {handleLoading} from '../utils/loading';
import {loadDocDataAPI} from '../api/doc';
import Skeleton from '../components/Skeleton.vue';
import {useStore} from 'vuex';
import Vditor from 'vditor';

// loading
const loading = ref(true);

// route
const route = useRoute();
const router = useRouter();

// store
const store = useStore();
const user = computed(() => store.state.user);

// doc title
const titleMenu = ref({
  collapsed: true,
});
const titles = ref([]);
const preview = ref();
const initTitle = () => {
  if (!preview.value) {
    setTimeout(() => initTitle(), 1000);
    return;
  }
  const anchors = preview.value.querySelectorAll('h1,h2,h3,h4,h5,h6');
  titles.value = Array.from(anchors).filter((title) => !!title.innerText.trim());
  if (!titles.value.length) {
    titles.value = [];
    return;
  }
  const hTags = Array.from(new Set(titles.value.map((title) => title.tagName))).sort();
  titles.value = titles.value.map((el) => ({
    title: el.innerText,
    id: el.id,
    indent: hTags.indexOf(el.tagName),
  }));
};
const handleAnchorClick = (anchor) => {
  const heading = document.getElementById(anchor.id);
  if (heading) {
    heading.scrollIntoView({behavior: 'smooth'});
  }
};

// doc info
const defaultDocData = ref({
  header_img: '/extra-assets/imgs/headimage-1.webp',
});
const docID = ref('');
const docData = ref({
  title: '',
  content: '',
  pv: 0,
  comments: 0,
  tags: [],
  header_img: '',
  is_public: '',
  created_at: '',
  owner: '',
  owner_nick_name: '',
});

const renderPreview = () => {
  if (!docData.value.content) return;
  nextTick(() => {
    const previewElement = document.getElementById('vditor-preview');
    if (previewElement) {
      Vditor.preview(previewElement, docData.value.content, {
        after() {
          initTitle();
          // Add image click listeners
          const images = previewElement.querySelectorAll('img');
          images.forEach((img, index) => {
            img.onclick = () => onImageClick(Array.from(images).map((i) => i.src), index);
            img.style.cursor = 'pointer';
          });
        },
      });
    }
  });
};

watch(loading, (newVal) => {
  if (!newVal) {
    renderPreview();
  }
});

const loadDocData = () => {
  handleLoading(loading, true);
  loadDocDataAPI(docID.value).then(
      (res) => {
        docData.value = res.data;
        setMeta();
      },
      (err) => Message.error(err.response.data.message),
  )
      .finally(() => handleLoading(loading, false));
};
onMounted(() => {
  if (!route.params.id) {
    return;
  }
  docID.value = route.params.id;
  loadDocData();
});

// meta
const setMeta = () => {
  document.title = `${docData.value.title} - iWiki - OVINC CN`;
  document.querySelector('meta[name="description"]').setAttribute(
      'content',
      `${docData.value.title} ${docData.value.owner_nick_name} (${docData.value.tags.join(' ')})`,
  );
};

// image
const previewImageVisible = ref(false);
const previewImageUrl = ref('');
const onImageClick = (images, index) => {
  previewImageUrl.value = images[index];
  previewImageVisible.value = true;
};

// edit
const goToEdit = () => {
  router.push({name: 'EditDoc', params: {id: docID.value}});
};
</script>

<template>
  <a-layout
    id="doc-show"
    class="show-min-height"
  >
    <skeleton v-show="loading" />
    <a-layout-header v-show="!loading">
      <a-space
        direction="vertical"
        style="width: 100%;"
      >
        <a-image
          :src="docData.header_img || defaultDocData.header_img"
          class="header-image"
        />
        <a-space
          style="align-items: center; justify-content: center"
          v-show="docData.title"
        >
          <h2 class="doc-title">
            <a-tag
              v-if="!docData.is_public"
              color="orangered"
            >
              <icon-lock />
            </a-tag>
            &nbsp;{{ docData.title }}
          </h2>
        </a-space>
        <a-space v-show="docData.title">
          <a-space :size="[2, 10]">
            <icon-user />
            {{ docData.owner_nick_name }}
          </a-space>
          <a-space :size="[2, 10]">
            <icon-clock-circle />
            {{ docData.created_at }}
          </a-space>
          <a-space :size="[2, 10]">
            <icon-eye />
            {{ docData.pv }}
          </a-space>
          <a-space
            :size="[2, 10]"
            v-show="false"
          >
            <icon-message />
            {{ docData.comments }}
          </a-space>
        </a-space>
        <a-space
          wrap
          style="margin-top: 10px"
          v-show="docData.tags.length > 0"
        >
          <a-tag
            v-for="item in docData.tags"
            :key="item"
          >
            {{ item }}
          </a-tag>
        </a-space>
      </a-space>
    </a-layout-header>
    <a-divider v-show="!loading && docData.title" />
    <a-layout-content v-if="!loading">
      <div
        id="vditor-preview"
        ref="preview"
      />
    </a-layout-content>
    <a-affix
      class="edit-button"
      v-show="docData.owner === user.username"
    >
      <a-button
        shape="circle"
        @click="goToEdit"
      >
        <icon-edit />
      </a-button>
    </a-affix>
    <a-affix
      class="menu-button"
      v-show="titles.length > 0"
    >
      <div>
        <a-trigger
          :trigger="['click']"
          v-model="titleMenu.collapsed"
          position="left"
        >
          <a-button
            shape="circle"
          >
            <icon-menu />
          </a-button>
          <template #content>
            <a-menu
              class="menu-button-inner-menu"
              mode="pop"
              :show-collapse-button="false"
            >
              <a-menu-item
                v-for="anchor in titles"
                :key="anchor"
              >
                <a-button
                  type="text"
                  style="color: unset; width: 100%; text-align: left"
                  @click="handleAnchorClick(anchor)"
                >
                  <div>
                    {{ anchor.title }}
                  </div>
                </a-button>
              </a-menu-item>
            </a-menu>
          </template>
        </a-trigger>
      </div>
    </a-affix>
  </a-layout>
  <a-image-preview
    :src="previewImageUrl"
    v-model:visible="previewImageVisible"
  />
</template>

<style scoped>
#doc-show {
  padding: 0 20px;
}

#doc-show :deep(.github-markdown-body) {
  padding: 0;
}

.doc-title {
  line-height: 32px;
}

.doc-title > :deep(.arco-tag) {
  margin-bottom: 4px;
}

.header-image {
  width: 100%;
}

.header-image :deep(img) {
  width: 100%;
  object-fit: cover;
  object-position: center;
  height: 320px;
}

@media screen and (min-height: 900px) {
  .header-image :deep(img) {
    height: 360px;
  }
}

@media screen and (max-width: 600px) {
  .header-image :deep(img) {
    height: 240px;
  }
}

.edit-button {
  position: fixed;
  bottom: 68px;
  text-align: right;
  right: 24px;
  z-index: 200;
}

.menu-button {
  position: fixed;
  bottom: 152px;
  text-align: right;
  right: 24px;
  z-index: 200;
}

.menu-button-inner-menu {
  margin-right: 10px;
  margin-bottom: 10px;
}

.menu-button-inner-menu :deep(.arco-menu-inner) {
  max-height: 100vh;
  height: 320px;
  max-width: 100vw;
  width: 240px;
  box-shadow: var(--shadow2-center);
}

.menu-button-inner-menu button div {
  text-align: left;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-button :deep(.arco-menu-inner) {
  padding: unset;
}

#doc-show :deep(.vuepress-markdown-body) {
  padding: 1px;
}

#doc-show :deep(.vuepress-markdown-body) .v-md-pre-wrapper {
  margin: unset;
}
</style>
