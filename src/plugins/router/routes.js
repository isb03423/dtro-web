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
        path: 'profile/edit',
        component: () => import('@/pages/profile-edit.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile/password',
        component: () => import('@/pages/profile-password.vue'),
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
    path: '/admin/dashboard',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      { path: '', component: () => import('@/features/admin/views/AdminDashboardView.vue') },
    ],
  },
  {
    path: '/admin/members',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      { path: '', component: () => import('@/features/member/views/AdminMemberListView.vue') },
    ],
  },
  {
    path: '/train-overview',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['TRAIN_MANAGER', 'ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/trainmanagement/views/TrainOverviewView.vue') },
    ],
  },
  {
    path: '/trains',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['TRAIN_MANAGER', 'ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/train/views/TrainListView.vue') },
    ],
  },
  {
    path: '/trainoperations',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['TRAIN_MANAGER', 'ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/trainoperation/views/TrainoperationListView.vue') },
    ],
  },
  {
    path: '/incidents',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['TRAIN_MANAGER', 'ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/incident/views/IncidentListView.vue'), props: { mode: 'reception' } },
      { path: 'actions', component: () => import('@/features/incident/views/IncidentListView.vue'), props: { mode: 'action' } },
    ],
  },
  {
    path: '/customer-service-overview',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/customerservice/views/CustomerServiceOverviewView.vue') },
    ],
  },
  {
    path: '/complaints',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['USER', 'TRAIN_MANAGER', 'ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/complaint/views/ComplaintListView.vue') },
      { path: 'new', component: () => import('@/features/complaint/views/ComplaintFormView.vue'), meta: { roles: ['USER'] } },
      { path: ':complaintId', component: () => import('@/features/complaint/views/ComplaintDetailView.vue') },
      { path: ':complaintId/edit', component: () => import('@/features/complaint/views/ComplaintFormView.vue') },
    ],
  },
  {
    path: '/qnas',
    component: () => import('@/layouts/dtro.vue'),
    meta: { requiresAuth: true, roles: ['USER', 'TRAIN_MANAGER', 'ADMIN'], trainLayout: true },
    children: [
      { path: '', component: () => import('@/features/qna/views/QnaListView.vue') },
      { path: 'new', component: () => import('@/features/qna/views/QnaFormView.vue'), meta: { roles: ['USER', 'TRAIN_MANAGER'] } },
      { path: ':qnaId', component: () => import('@/features/qna/views/QnaDetailView.vue') },
      { path: ':qnaId/edit', component: () => import('@/features/qna/views/QnaFormView.vue') },
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
    path: '/session-error',
    component: () => import('@/layouts/dtro-auth.vue'),
    children: [{ path: '', component: () => import('@/pages/session-error.vue') }],
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
