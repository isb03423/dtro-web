import { APP_ROLES } from './sideMenu'

// 화면 확인용 임시 계정입니다. 실제 인증을 연결할 때 이 목록을 교체합니다.
export const DEMO_ACCOUNTS = Object.freeze([
  { id: 'admin', password: 'demo1234', role: APP_ROLES.ADMIN, label: '관리자' },
  { id: 'train_manager', password: 'demo1234', role: APP_ROLES.TRAIN_MANAGER, label: '열차 운영자' },
  { id: 'user', password: 'demo1234', role: APP_ROLES.USER, label: '일반 사용자' },
])
