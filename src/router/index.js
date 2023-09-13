import * as vueRouter from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/login/',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/new/',
    name: 'NewDoc',
    component: () => import('../views/EditDoc.vue'),
  },
  {
    path: '/edit/:id/',
    name: 'EditDoc',
    component: () => import('../views/EditDoc.vue'),
  },
  {

    path: '/:pathMatch(.*)*',
    name: 'Notfound',
    component: () => import('../views/Error404.vue'),
  },
];

const router = vueRouter.createRouter({
  history: vueRouter.createWebHistory(),
  routes,
});

export default router;
