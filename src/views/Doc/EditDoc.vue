<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { uploadFileAPI } from '../../api/cos';
import { Message } from '@arco-design/web-vue';
import { handleLoading } from '../../utils/loading';
import globalContext from '../../context';
import { createDocAPI } from '../../api/doc';

const i18n = useI18n();

const loading = ref(false);

const isSmallScreen = ref(false);
onMounted(() => window.addEventListener('resize', () => {
  isSmallScreen.value = window.innerWidth < 1200;
}));
onMounted(() => isSmallScreen.value = window.innerWidth < 1200);

const leftToolBar = ref('undo redo clear | upload');
const rightToolBar = computed(() => (isSmallScreen.value ? 'preview toc sync-scroll fullscreen' : ''));
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
      input.onchange = function () {
        handleFileUpload(editor, input.files);
      };
      input.click();
    },
  },
});

const formData = ref({
  title: '',
  content: '',
  header_img: '',
  tags: [],
  is_public: false,
});

const doNext = ({ errors }) => {
  if (errors) {
    return;
  }
  showNext.value = true;
};
const showNext = ref(false);

const headerImgList = ref([]);
const uploadUrl = computed(() => `${globalContext.backendUrl}/cos/upload/`);
const handleFileUpload = (editor, files) => {
  handleLoading(loading, true);
  const form = new FormData();
  form.append('file', files[0]);
  uploadFileAPI(form).then(
    (res) => {
      editor.insert(() => ({
        text: `![${res.data.name}](${res.data.url})`,
      }
      ));
    },
    (err) => {
      Message.error(err.response.data.message);
    },
  )
    .finally(() => handleLoading(loading, false));
};
const onUploadHeaderImgSuccess = (fileItem) => {
  headerImgList.value.push(fileItem.response.data);
  formData.value.header_img = fileItem.response.data.url;
};

const saveDoc = () => {
  handleLoading(loading, true);
  createDocAPI(formData.value).then(
    () => {
      Message.info(i18n.t('SaveDocSuccess'));
      showNext.value = false;
    },
    (err) => {
      Message.error(i18n.t(err.response.data.message));
    },
  )
    .finally(() => handleLoading(loading, false));
};

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
          />
          <a-button
            type="primary"
            html-type="submit"
            :disabled="!formData.title || !formData.content"
            :loading="loading"
          >
            {{ $t('Next') }}
          </a-button>
        </a-space>
      </a-form-item>
      <a-form-item
        hide-label
        field="content"
        :rules="[{required:true,message:$t('ContentRequired')}]"
        style="margin-bottom: 0"
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
        />
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
              :action="uploadUrl"
              image-preview
              :default-file-list="headerImgList"
              with-credentials
              :limit="1"
              @success="onUploadHeaderImgSuccess"
            />
          </a-form-item>
          <a-form-item
            field="tags"
            :label="$t('Tags')"
          >
            <a-input-tag
              v-model="formData.tags"
              allow-clear
              unique-value
              :placeholder="$t('InputAndPressEnter')"
            />
          </a-form-item>
          <a-form-item
            field="is_public"
            :label="$t('IsPublic')"
          >
            <a-switch
              type="round"
              v-model="formData.is_public"
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
            </a-space>
          </a-form-item>
        </a-form>
      </div>
    </a-drawer>
  </a-layout>
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
