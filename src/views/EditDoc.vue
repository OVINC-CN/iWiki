<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {getCOSTempSecretAPI} from '../api/cos';
import {Message} from '@arco-design/web-vue';
import {handleLoading} from '../utils/loading';
import {createDocAPI, deleteDocAPI, loadDocDataAPI, updateDocAPI} from '../api/doc';
import {useRoute, useRouter} from 'vue-router';
import {getUserInfoAPI} from '../api/user';
import {listTagsAPI} from '../api/tag';

// i18n
const i18n = useI18n();

// router
const route = useRoute();
const router = useRouter();

// loading
const loading = ref(false);

// screen
const smallScreenSize = ref(1000);
const isSmallScreen = ref(false);
onMounted(() => window.addEventListener('resize', () => {
  isSmallScreen.value = window.innerWidth < smallScreenSize.value;
}));
onMounted(() => isSmallScreen.value = window.innerWidth < smallScreenSize.value);
onUnmounted(() => window.removeEventListener('resize', () => {}));

// editor config
const leftToolBar = ref('undo redo clear | upload');
const rightToolBar = computed(() => 'preview toc sync-scroll fullscreen');
const codemirrorConfig = ref({
  lineNumbers: false,
});
const toolbar = ref({
  upload: {
    title: i18n.t('Upload'),
    icon: 'v-md-icon-img',
    action(editor) {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = function() {
        handleFileUpload(editor, input.files);
      };
      input.click();
    },
  },
});

// tags
const allTags = ref([]);
const loadTags = () => {
  listTagsAPI().then((res) => allTags.value = res.data);
};
onMounted(() => loadTags());

// doc info
const docID = ref('');
const formData = ref({
  title: '',
  content: '',
  header_img: '',
  tags: [],
  is_public: false,
});
const loadDocData = () => {
  loadDocDataAPI(docID.value).then((res) => {
    formData.value.title = res.data.title;
    formData.value.content = res.data.content;
    formData.value.header_img = res.data.header_img;
    formData.value.title = res.data.title;
    formData.value.tags = res.data.tags;
    formData.value.is_public = res.data.is_public;
    headerImgList.value.push({url: formData.value.header_img});
  });
};
onMounted(() => {
  if (!route.params.id) {
    return;
  }
  docID.value = route.params.id;
  loadDocData();
});

// submit doc
const doNext = ({errors}) => {
  if (errors) {
    return;
  }
  showNext.value = true;
};
const showNext = ref(false);
const saveDoc = () => {
  handleLoading(loading, true);
  let req = null;
  if (docID.value) {
    req = updateDocAPI(docID.value, formData.value);
  } else {
    req = createDocAPI(formData.value);
  }
  req.then(
      (res) => {
        Message.success(i18n.t('SaveDocSuccess'));
        showNext.value = false;
        router.push({name: 'ShowDoc', params: {id: res.data.id}});
      },
      (err) => {
        Message.error(i18n.t(err.response.data.message));
      },
  )
      .finally(() => handleLoading(loading, false));
};

// delete
const doDelete = () => {
  handleLoading(loading, true);
  deleteDocAPI(docID.value).then(
      () => router.push({name: 'Home'}),
      (err) => Message.error(err.response.data.message),
  )
      .finally(() => handleLoading(loading, false));
};

// upload file
const loadCos = (credentials) => {
  return new COS({
    getAuthorization: (options, callback) => {
      callback(
          {
            TmpSecretId: credentials.secret_id,
            TmpSecretKey: credentials.secret_key,
            SecurityToken: credentials.token,
            StartTime: credentials.start_time,
            ExpiredTime: credentials.expired_time,
          },
      );
    },
  });
};

// header img upload
const headerImgList = ref([]);
const uploadHeaderImg = (option) => {
  const {onProgress, onError, onSuccess, fileItem} = option;
  console.log(onProgress, onError, onSuccess);
  getCOSTempSecretAPI(fileItem.name).then(
      (res) => {
        const credentials = res.data;
        const cos = loadCos(credentials);
        cos.putObject({
          Bucket: credentials.cos_bucket,
          Region: credentials.cos_region,
          Key: credentials.key,
          Body: fileItem.file,
          onProgress: (event) => {
            onProgress(event.percent, event);
          },
        }, (err) => {
          if (err) {
            Message.error(err.message);
            onError(err);
          } else {
            const url = `${credentials.cos_url}/${encodeURIComponent(credentials.key)}`;
            onSuccess({data: {name: fileItem.name, url: url}});
            formData.value.header_img = url;
          }
        });
      },
      (err) => {
        Message.error(err.response.data.message);
        onError(err.response);
      },
  );
};

// upload file
const handleFileUpload = (editor, files) => {
  const file = files[0];
  handleLoading(loading, true);
  getCOSTempSecretAPI(file.name).then(
      (res) => {
        const credentials = res.data;
        const cos = loadCos(credentials);
        cos.putObject({
          Bucket: credentials.cos_bucket,
          Region: credentials.cos_region,
          Key: credentials.key,
          Body: file,
        }, (err) => {
          if (err) {
            Message.error(err.message);
          } else {
            const url = `${credentials.cos_url}/${encodeURIComponent(credentials.key)}`;
            editor.insert(() => ({
              text: file.type.indexOf('image/') !== -1 ? `![${file.name}](${url}){{{width="auto" height="auto"}}}` : `[${file.name}](${url})`,
            }
            ));
          }
          handleLoading(loading, false);
        });
      },
      (err) => {
        Message.error(err.response.data.message);
        handleLoading(loading, false);
      },
  );
};

const onUploadHeaderImgSuccess = (fileItem) => {
  headerImgList.value.push(fileItem.response.data);
  formData.value.header_img = fileItem.response.data.url;
};

// image
const previewImageVisible = ref(false);
const previewImageUrl = ref('');
const onImageClick = (images, index) => {
  previewImageUrl.value = images[index];
  previewImageVisible.value = true;
};

// go back
const goBack = () => {
  if (docID.value) {
    router.push({name: 'ShowDoc', params: {id: docID.value}});
    return;
  }
  router.push({name: 'Home'});
};

// check login
onMounted(() => getUserInfoAPI());

// title
onMounted(() => {
  document.title = `${i18n.t('NewDoc')} | ${i18n.t('iWiki')}`;
});
</script>

<template>
  <a-layout id="doc-create">
    <a-form
      :model="formData"
      @submit="doNext"
    >
      <a-form-item
        hide-label
        :rules="[{required:true,message:$t('TitleRequired')}]"
        field="title"
      >
        <a-space class="title-editor">
          <a-input
            v-model="formData.title"
            :placeholder="$t('Title')"
            :max-length="32"
            show-word-limit
            style="width: 100%;"
            :disabled="loading"
          />
          <a-button
            type="primary"
            html-type="submit"
            :disabled="!formData.title || !formData.content"
            :loading="loading"
          >
            {{ $t('Next') }}
          </a-button>
          <a-button
            :loading="loading"
            @click="goBack"
          >
            {{ $t('GoBack') }}
          </a-button>
        </a-space>
      </a-form-item>
      <a-form-item
        hide-label
        field="content"
        :rules="[{required:true,message:$t('ContentRequired')}]"
        style="margin-bottom: 0"
        class="edit-doc-v-md-editor"
      >
        <a-spin
          :loading="loading"
          style="width: 100%; height: 100%"
        >
          <v-md-editor
            height="calc(100vh - 210px)"
            :tab-size="4"
            autofocus
            :left-toolbar="leftToolBar"
            :right-toolbar="rightToolBar"
            :codemirror-config="codemirrorConfig"
            :toolbar="toolbar"
            v-model="formData.content"
            :mode="!isSmallScreen ? 'editable' : 'edit'"
            @image-click="onImageClick"
          />
        </a-spin>
      </a-form-item>
    </a-form>
    <a-drawer
      :width="600"
      :drawer-style="{maxWidth: '100%'}"
      :visible="showNext"
      @cancel="showNext = false"
      unmount-on-close
      :footer="false"
      :closable="false"
    >
      <template #title>
        {{ $t('SaveDoc') }}
      </template>
      <div>
        <a-form
          :model="formData"
          auto-label-width
        >
          <a-form-item
            field="header_img"
            :label="$t('HeaderImg')"
            :rules="[{required: true, message: $t('HeaderImgRequired')}]"
          >
            <a-upload
              list-type="picture-card"
              :custom-request="uploadHeaderImg"
              image-preview
              :default-file-list="headerImgList"
              :limit="1"
              @success="onUploadHeaderImgSuccess"
              :disabled="loading"
            />
          </a-form-item>
          <a-form-item
            field="tags"
            :label="$t('Tags')"
          >
            <a-select
              v-model="formData.tags"
              :placeholder="$t('InputAndPressEnter')"
              multiple
              allow-create
              scrollbar
              allow-clear
              :disabled="loading"
            >
              <a-option
                v-for="tag in allTags"
                :key="tag"
                :value="tag.name"
              >
                {{ tag.name }}
              </a-option>
            </a-select>
          </a-form-item>
          <a-form-item
            field="is_public"
            :label="$t('IsPublic')"
          >
            <a-switch
              type="round"
              v-model="formData.is_public"
              :disabled="loading"
            />
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button
                @click="saveDoc"
                :disabled="!formData.title || !formData.content || !formData.header_img"
                :loading="loading"
                type="primary"
              >
                {{ $t('Save') }}
              </a-button>
              <a-button
                @click="showNext = false"
                :loading="loading"
              >
                {{ $t('Cancel') }}
              </a-button>
              <a-popconfirm
                :content="$t('DeleteDocConfirm')"
                :ok-text="$t('Delete')"
                :cancel-text="$t('Cancel')"
                @ok="doDelete"
              >
                <a-button
                  v-show="docID"
                  type="primary"
                  status="danger"
                  :loading="loading"
                >
                  {{ $t('Delete') }}
                </a-button>
              </a-popconfirm>
            </a-space>
          </a-form-item>
        </a-form>
      </div>
    </a-drawer>
  </a-layout>
  <a-image-preview
    :src="previewImageUrl"
    v-model:visible="previewImageVisible"
  />
</template>

<style scoped>
#doc-create {
  width: 100%;
  height: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.title-editor {
  width: 100%;
}

.title-editor > :deep(.arco-space-item:nth-of-type(1)) {
  width: 100%;
}

.doc-submit-drawer :deep(.arco-drawer) {
  max-width: 100%;
}
</style>
