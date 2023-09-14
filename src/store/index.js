import {createStore} from 'vuex';
import {homeAPI} from '../api/home';

const store = createStore({
  state() {
    return {
      mainLoading: false,
      isLogin: false,
      user: {
        username: '',
        nick_name: '',
        last_login: '',
        user_type: '',
      },
      userProperties: {
        avatar: null,
        phone_number: null,
        mail_address: null,
      },
      userPropertiesRaw: [],
    };
  },
  mutations: {
    setMainLoading(state, payload) {
      state.mainLoading = payload;
    },
    setUser(state, payload) {
      state.user = payload;
    },
    setIsLogin(state, payload) {
      state.isLogin = payload;
    },
    setUserProperty(state, payload) {
      payload.forEach((item) => state.userProperties[item.property_key] = item.property_val);
    },
    setUserPropertyRaw(state, payload) {
      state.userPropertiesRaw = payload;
    },
  },
  actions: {
    setMainLoading({commit}, payload) {
      if (payload) {
        commit('setMainLoading', true);
      } else {
        setTimeout(() => {
          commit('setMainLoading', false);
        }, 600);
      }
    },
    getUserInfo({commit}) {
      homeAPI().then((res) => {
        commit('setUser', res.data.user);
        commit('setIsLogin', true);
      });
    },
  },
});

export default store;
