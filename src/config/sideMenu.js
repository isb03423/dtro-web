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
      { label: '대시보드', to: '/dashboard' },
      { label: '사용자 관리', href: '#user-management' },
    ],
  },
  {
    id: 'train-management',
    title: '열차 관리',
    roles: [APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN],
    items: [
      { label: '열차 정보', to: '/trains' },
      { label: '열차 운행 정보', href: '#train-operation' },
      { label: '운행 장애', href: '#operation-disruption' },
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
      { label: '민원', href: '#complaints' },
      { label: '질문 및 답변', href: '#questions-and-answers' },
    ],
  },
])

// 사용자 권한으로 표시할 메뉴 묶음을 고른다.
export const fn_getVisibleMenuSections = role => SIDE_MENU_SECTIONS.filter(section => section.roles.includes(role))
