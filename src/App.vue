<template>
  <a-config-provider :locale="locale">
    <a-spin
      :size="32"
      :loading="mainLoading"
      :tip="$t('loading')"
    >
      <a-layout id="app-layout">
        <a-layout-header id="app-header">
          <div>
            <a-menu
              mode="horizontal"
              :default-selected-keys="[currentMenuItem]"
              @menu-item-click="goTo"
            >
              <a-menu-item
                disabled
                id="app-menu-logo"
              >
                <div>
                  OVINC
                </div>
              </a-menu-item>
              <a-menu-item
                v-for="item in menu"
                :key="item.key"
              >
                {{ item.name }}
              </a-menu-item>
            </a-menu>
            <a-space id="app-header-right">
              <a-dropdown @select="changeLangAndReload">
                <icon-public id="app-header-menu-lang" />
                <template #content>
                  <a-doption
                    v-for="item in langOption"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.name }}
                  </a-doption>
                </template>
              </a-dropdown>
              <a-dropdown @select="handlerUserDropDown">
                <a-button
                  type="text"
                  style="padding: 0; color: unset"
                >
                  {{ user.nick_name }}
                </a-button>
                <template #content>
                  <a-doption
                    v-for="item in userDropDown"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.name }}
                  </a-doption>
                </template>
              </a-dropdown>
            </a-space>
          </div>
        </a-layout-header>
        <a-layout-content>
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </a-layout-content>
        <a-layout-footer id="app-footer">
          Copyright&nbsp;&copy;&nbsp;2022 - {{ currentYear }} OVINC-CN
        </a-layout-footer>
      </a-layout>
    </a-spin>
  </a-config-provider>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { locale, langOption, changeLangAndReload } from './locale';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { signOutAPI } from './api/user';
import Aegis from 'aegis-web-sdk';
import { getRUMConfigAPI } from './api/trace';

// locale
const i18n = useI18n();

// title
const title = ref(i18n.t('OVINCCN'));
document.title = title.value;

// menu
const menu = ref([
  {
    key: 'Home',
    name: i18n.t('Home'),
    path_match: '/',
  },
]);
const route = useRoute();
const router = useRouter();
const currentMenuItem = ref(menu.value[0].key);
const goTo = (key) => {
  router.push({ name: key });
};
menu.value.forEach((item, index) => {
  if (index === 0) return;
  if (window.location.pathname.startsWith(item.path_match)) currentMenuItem.value = item.key;
});

// footer
const currentYear = ref(new Date().getFullYear());

// store
const store = useStore();
const mainLoading = computed(() => store.state.mainLoading);
store.dispatch('getUserInfo');

// user
const userDropDown = ref([
  {
    name: i18n.t('Logout'),
    value: 'logout',
  },
]);
const user = computed(() => store.state.user);
const handlerUserDropDown = (key) => {
  if (key === 'logout') {
    signOutAPI().finally(() => window.location.reload());
  }
};

// aegis
const initRUM = () => {
  getRUMConfigAPI()
    .then((res) => {
      if (res.data.id) {
        new Aegis(res.data);
      }
    });
};
onMounted(() => initRUM());
</script>

<style>
@import "App.css";

#app-layout {
  height: 100vh;
  width: 100vw;
}

#app-header {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border-1);
}

#app-header > div {
  display: flex;
  justify-content: space-around;
}

#app-header-right {
  display: flex;
  align-items: center;
  padding: 14px 20px 14px 0;
}

#app-menu-logo {
  padding-left: 0;
  margin-left: 0;
}

#app-header-menu-lang {
  cursor: pointer;
  margin-right: 12px;
}

#app-menu-logo > div {
  width: 100px;
  height: 30px;
  border-radius: var(--border-radius-medium);
  background: var(--color-fill-3);
  padding: 4px;
  cursor: text;
  color: var(--color-text-1);
  text-align: center;
  font-weight: bold;
}

#app-footer {
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  height: 48px;
  border-top: 1px solid var(--color-border-1);
  color: var(--color-text-1);
  margin-top: 20px;
}
</style>
