export const routes = [
  {
    path: '/',
    component: () => import('@/layouts/dtro.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/home.vue'),
      },
      {
        path: 'dashboard',
        component: () => import('@/pages/dashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile',
        component: () => import('@/pages/profile.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'forbidden',
        component: () => import('@/pages/forbidden.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/trains',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['TRAIN_MANAGER', 'ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/train/views/TrainListView.vue') },
      { path: 'new', component: () => import('@/features/train/views/TrainFormView.vue') },
      { path: ':trainId', component: () => import('@/features/train/views/TrainDetailView.vue') },
      { path: ':trainId/edit', component: () => import('@/features/train/views/TrainFormView.vue') },
    ],
  },
  {
    path: '/login',
    component: () => import('@/layouts/dtro-auth.vue'),
    children: [{ path: '', component: () => import('@/pages/login.vue') }],
  },
  {
    path: '/register',
    component: () => import('@/layouts/dtro-auth.vue'),
    children: [{ path: '', component: () => import('@/pages/register.vue') }],
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/[...error].vue'),
      },
    ],
  },
]
