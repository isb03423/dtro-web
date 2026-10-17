import { onScopeDispose, ref } from 'vue'

// 메시지와 확인 팝업의 상태 및 응답을 공통으로 관리한다.
export const gfn_useMessageDialog = () => {
  const dialog = ref({ open: false, type: 'info', title: '', message: '', showCancel: false, confirmText: '확인' })
  let pending = null

  // 팝업을 닫고 대기 중인 확인 요청에 응답한다.
  const fn_finishDialog = accepted => {
    dialog.value.open = false
    pending?.(accepted)
    pending = null
  }

  // 확인 응답을 기다리지 않는 안내 메시지를 표시한다.
  const fn_showMessage = (type, title, message) => {
    pending?.(false)
    pending = null
    dialog.value = { open: true, type, title, message, showCancel: false, confirmText: '확인' }
  }

  // 확인 또는 취소 응답을 기다리는 팝업을 표시한다.
  const fn_askConfirm = (title, message, confirmText = '진행') => new Promise(resolve => {
    pending?.(false)
    pending = resolve
    dialog.value = { open: true, type: 'confirm', title, message, showCancel: true, confirmText }
  })

  onScopeDispose(() => pending?.(false))

  return { dialog, finishDialog: fn_finishDialog, showMessage: fn_showMessage, askConfirm: fn_askConfirm }
}
