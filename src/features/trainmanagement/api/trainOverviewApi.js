import { fn_apiRequest } from '@/api/http'

export const fn_getTrainOverview = () => fn_apiRequest('/api/train-overview')
