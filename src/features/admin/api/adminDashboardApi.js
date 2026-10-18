import { fn_apiRequest } from '@/api/http'

export const fn_getAdminDashboard = () => fn_apiRequest('/api/admin/dashboard')
