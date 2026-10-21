export const APP_ROLES = Object.freeze({
  GUEST: 'GUEST',
  USER: 'USER',
  TRAIN_MANAGER: 'TRAIN_MANAGER',
  ADMIN: 'ADMIN',
})

export const SIDE_MENU_SECTIONS = Object.freeze([
  {
    id: 'system-management',
    title: '시스템 관리',
    roles: [APP_ROLES.ADMIN],
    items: [
      { label: '대시보드', to: '/admin/dashboard' },
      { label: '사용자 관리', to: '/admin/members' },
    ],
  },
  {
    id: 'train-management',
    title: '열차 관리',
    roles: [APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN],
    items: [
      { label: '열차 현황', to: '/train-overview' },
      { label: '열차 정보', to: '/trains' },
      { label: '열차 운행 정보', to: '/trainoperations' },
      { label: '운행 장애 접수', to: '/incidents' },
      { label: '운행 장애 조치', to: '/incidents/actions' },
    ],
  },
  {
    id: 'board',
    title: '게시판',
    roles: [APP_ROLES.GUEST, APP_ROLES.USER, APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN],
    items: [
      { label: '공지사항', href: '#notice' },
      { label: '자료실', href: '#resources' },
    ],
  },
  {
    id: 'customer-service',
    title: '고객 서비스',
    roles: [APP_ROLES.USER, APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN],
    items: [
      { label: '고객 서비스 현황', to: '/customer-service-overview', roles: [APP_ROLES.ADMIN] },
      { label: '민원', to: '/complaints' },
      { label: '질문 및 답변', to: '/qnas' },
    ],
  },
])

// 사용자 권한으로 표시할 메뉴 묶음을 고른다.
export const fn_getVisibleMenuSections = role => SIDE_MENU_SECTIONS
    .filter(section => section.roles.includes(role))
    .map(section => ({
        ...section,
        items: section.items.filter(item => !item.roles || item.roles.includes(role)),
    }))
