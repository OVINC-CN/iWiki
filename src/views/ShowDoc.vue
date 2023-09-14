<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Message} from '@arco-design/web-vue';
import {handleLoading} from '../utils/loading';
import {loadDocDataAPI} from '../api/doc';
import Skeleton from '../components/Skeleton.vue';
import {useStore} from 'vuex';

// loading
const loading = ref(true);

// route
const route = useRoute();
const router = useRouter();

// store
const store = useStore();
const user = computed(() => store.state.user);

// doc info
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
const loadDocData = () => {
  handleLoading(loading, true);
  loadDocDataAPI(docID.value).then(
      (res) => docData.value = res.data,
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
          :src="docData.header_img"
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
          <a-space>
            {{ docData.owner_nick_name }}
          </a-space>
          <a-space>
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
          v-show="docData.title"
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
      <v-md-editor
        v-model="docData.content"
        :mode="'preview'"
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
  </a-layout>
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
</style>
