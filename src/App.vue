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
                <div @click="goTo('Home')">
                  iWiki
                </div>
              </a-menu-item>
              <a-menu-item
                v-for="item in menu"
                :key="item.key"
                v-show="item.display"
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
              <a-dropdown
                @select="handlerUserDropDown"
              >
                <a-button
                  type="text"
                  style="padding: 0; color: unset"
                >
                  <a-badge
                    status="success"
                    dot
                    :count="1"
                    v-if="user.username"
                  >
                    <icon-user />
                  </a-badge>
                  <icon-user v-else />
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
        <div id="app-content-scroll">
          <a-layout-content id="app-content">
            <div>
              <router-view v-slot="{ Component }">
                <component :is="Component" />
              </router-view>
            </div>
          </a-layout-content>
          <a-layout-footer id="app-footer">
            Copyright&nbsp;&copy;&nbsp;2022 - {{ currentYear }} OVINC-CN
          </a-layout-footer>
        </div>
        <a-back-top
          target-container="#app-content-scroll"
          :style="{bottom:'110px'}"
        >
          <a-button shape="circle">
            <icon-caret-up />
          </a-button>
        </a-back-top>
      </a-layout>
    </a-spin>
  </a-config-provider>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import {useStore} from 'vuex';
import {locale, langOption, changeLangAndReload} from './locale';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {signOutAPI} from './api/user';
import Aegis from 'aegis-web-sdk';
import {getRUMConfigAPI} from './api/trace';
import {redirectToLogin} from './utils/login';
import {PermissionItem} from './constants';

// locale
const i18n = useI18n();

// title
const title = ref(i18n.t('iWiki'));
document.title = title.value;

// store
const store = useStore();
const mainLoading = computed(() => store.state.mainLoading);
const user = computed(() => store.state.user);
store.dispatch('getUserInfo');

// permissions
const permissions = computed(() => store.state.permissions);
const hasCreateDocPermission = computed(() => {
  for (const item of permissions.value) {
    if (item.permission_item === PermissionItem.createDoc) {
      return true;
    }
  }
  return false;
});
onMounted(() => store.dispatch('loadPermissions'));

// menu
const defaultMenu = ref([
  {
    key: 'Home',
    name: i18n.t('AllDoc'),
    path_match: '/',
    display: true,
  },
  {
    key: 'NewDoc',
    name: i18n.t('NewDoc'),
    path_match: '/new/',
    display: computed(() => hasCreateDocPermission.value),
  },
]);
const menu = computed(() => {
  return user.value.username ? defaultMenu.value : [];
});
const currentMenuItem = computed(() => menu.value.length ? menu.value[0].key : '');

// router
const router = useRouter();
const goTo = (key) => {
  router.push({name: key});
};
menu.value.forEach((item, index) => {
  if (index === 0) return;
  if (window.location.pathname.startsWith(item.path_match)) currentMenuItem.value = item.key;
});

// footer
const currentYear = ref(new Date().getFullYear());

// user
const userDropDown = computed(() => {
  if (user.value.username) {
    return [
      {
        name: `${i18n.t('Logout')} (${user.value.nick_name})`,
        value: 'logout',
      },
    ];
  }
  return [
    {
      name: i18n.t('Login'),
      value: 'login',
    },
  ];
});
const handlerUserDropDown = (key) => {
  if (key === 'logout') {
    signOutAPI().finally(() => window.location.reload());
  }
  if (key === 'login') {
    redirectToLogin();
  }
};

// features
onMounted(() => store.dispatch('loadFeatures'));

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
  display: flex;
  align-items: center;
  justify-content: center;
}

#app-header > div {
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 1600px;
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
  width: 80px;
  height: 30px;
  border-radius: var(--border-radius-medium);
  border: 1px solid rgba(var(--primary-4));
  padding: 4px;
  color: var(--color-text-1);
  text-align: center;
  font-weight: bold;
  cursor: pointer;
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

#app-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

#app-content > div {
  max-width: 1600px;
  width: 100%;
}

#app-content-scroll {
  height: 100%;
  overflow-y: scroll;
}

.show-min-height {
  min-height: calc(100vh - 160px)
}
</style>
