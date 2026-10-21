import { onScopeDispose } from 'vue'
import { gfn_useMessageDialog } from '@/composables/useMessageDialog'

// 열차관리의 공통 팝업을 사용하며, 완료 안내를 닫은 뒤 화면을 이동한다.
export const gfn_useCustomerServiceDialog = () => {
  const { dialog, finishDialog: closeDialog, showMessage, askConfirm: requestConfirm } = gfn_useMessageDialog()
  let afterClose = null

  const finishDialog = accepted => {
    const callback = afterClose
    afterClose = null
    closeDialog(accepted)
    callback?.()
  }

  const showAccessDenied = (message = '작성자 본인과 관리자만 상세보기를 할 수 있습니다.', onClose = null) => {
    afterClose = onClose
    showMessage('warning', '접근 권한이 없습니다', message)
  }

  const showRequestError = (error, onAccessDenied = null) => {
    afterClose = null
    if (error.status === 403) {
      showAccessDenied(error.message || '이 작업을 수행할 권한이 없습니다.', onAccessDenied)
    } else if (error.status === 401) {
      afterClose = onAccessDenied
      showMessage('warning', '로그인이 필요합니다', error.message || '로그인 후 다시 이용해주세요.')
    } else {
      showMessage('error', '오류가 발생했습니다', error.message || '요청을 처리하지 못했습니다.')
    }
  }

  const showSuccess = (message, onClose = null) => {
    afterClose = onClose
    showMessage('success', '처리가 완료되었습니다', message)
  }

  const showValidationError = message => {
    afterClose = null
    showMessage('warning', '입력값을 확인해주세요', message)
  }

  const askConfirm = (...args) => {
    afterClose = null
    return requestConfirm(...args)
  }

  onScopeDispose(() => { afterClose = null })

  return { dialog, finishDialog, showAccessDenied, showRequestError, showSuccess, showValidationError, askConfirm }
}
