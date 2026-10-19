import { fn_apiRequest } from '@/api/http'

// 관리자용 고객 서비스 집계를 조회한다.
export const fn_getCustomerServiceOverview = () => fn_apiRequest('/api/v1/customer-service-overview')
