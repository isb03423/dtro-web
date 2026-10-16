<template>
  <div class="forbidden-page">
    <h1>접근 권한이 없습니다.</h1>
    <p>이 화면을 이용할 수 있는 계정으로 로그인해 주세요.</p>
    <RouterLink to="/dashboard">대시보드로 이동</RouterLink>
  </div>
</template>

<style scoped>
.forbidden-page { padding: 32px; }
.forbidden-page h1 { margin-bottom: 12px; }
.forbidden-page p { margin-bottom: 16px; }
</style>
