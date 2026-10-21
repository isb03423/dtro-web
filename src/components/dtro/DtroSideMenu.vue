<script setup>
import { fn_getVisibleMenuSections } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()

// 현재 권한에 표시할 메뉴만 추린다.
const visibleSections = computed(() => fn_getVisibleMenuSections(authStore.role))

// 현재 경로가 열차 관리 화면인지 확인한다.
const isTrainPage = computed(() => Boolean(route.meta.trainLayout))

// 겹치는 경로는 가장 구체적인 메뉴 하나만 선택한다.
const selectedItem = computed(() => {
  const items = visibleSections.value.flatMap(section => section.items)
  const hashItem = items.find(item => item.href && item.href === route.hash)
  if (hashItem) {
    return hashItem
  }

  return items
    .filter(item => item.to && (route.path === item.to || route.path.startsWith(`${item.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]
})

// 메뉴 항목을 선택했을 때 이동할 경로를 만든다.
const fn_boardDestination = item => ({
  path: authStore.isAuthenticated ? '/dashboard' : '/',
  hash: item.href,
})
</script>

<template>
  <aside class="role-side-menu" :class="{ 'role-side-menu--train': isTrainPage }" aria-label="주요 메뉴">
    <section
      v-for="section in visibleSections"
      :key="section.id"
      class="role-side-menu__section"
    >
      <h2>{{ section.title }}</h2>

      <ul>
        <li v-for="item in section.items" :key="item.label">
          <RouterLink v-if="item.to" :to="item.to" :class="{ 'is-selected': selectedItem === item }" :aria-current="selectedItem === item ? 'page' : null">
            {{ item.label }}
          </RouterLink>
          <RouterLink v-else-if="section.id === 'board'" :to="fn_boardDestination(item)" :class="{ 'is-selected': selectedItem === item }" :aria-current="selectedItem === item ? 'location' : null">
            {{ item.label }}
          </RouterLink>
          <a v-else :href="item.href" :class="{ 'is-selected': selectedItem === item }" :aria-current="selectedItem === item ? 'location' : null">{{ item.label }}</a>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.role-side-menu {
  --menu-inline-padding: 24px;

  min-inline-size: 0;
  min-block-size: 0;
  align-self: stretch;
  overflow-y: auto;
  padding: 26px 0 32px;
  border-inline-end: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
}

.role-side-menu__section h2 {
  padding-inline: var(--menu-inline-padding);
}

.role-side-menu__section a {
  padding-inline: var(--menu-inline-padding);
}

.role-side-menu__section a.is-selected {
  border-inline-start: 6px solid #064494;
  border-radius: 0;
  background: #f3f7fc;
  color: #064494;
  padding-inline-start: calc(var(--menu-inline-padding) - 6px);
}

.role-side-menu__section + .role-side-menu__section {
  margin-block-start: 17px;
}

.role-side-menu__section h2 {
  margin: 0 0 5px;
  color: rgb(var(--v-theme-primary-darken-1));
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -.035em;
  line-height: 1.35;
}

.role-side-menu__section ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.role-side-menu__section a {
  display: flex;
  min-block-size: 32px;
  align-items: center;
  border-radius: dtro.$radius;
  color: rgb(var(--v-theme-on-surface));
  font-size: 16px;
  font-weight: 400;
  letter-spacing: -.025em;
  line-height: 1.4;
  text-decoration: none;
  transition: background-color .15s ease;
}

.role-side-menu__section a:not(.is-selected):hover {
  background: #f1f2f4;
}

.role-side-menu__section a:focus-visible {
  @include dtro.focus-ring;
}

@media (max-width: 900px) {
  .role-side-menu { --menu-inline-padding: 18px; }
  .role-side-menu__section h2 { font-size: 19px; }
  .role-side-menu__section a { font-size: 14px; }
}

@media (max-width: 640px) {
  .role-side-menu { --menu-inline-padding: 12px; padding-block: 18px 24px; }
  .role-side-menu__section + .role-side-menu__section { margin-block-start: 14px; }
  .role-side-menu__section h2 { font-size: 16px; }
  .role-side-menu__section a { min-block-size: 30px; font-size: 12px; }
  .role-side-menu--train {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    min-block-size: 0;
    gap: 16px;
    border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-inline-end: 0;
  }
  .role-side-menu--train .role-side-menu__section { flex: 0 0 auto; }
  .role-side-menu--train .role-side-menu__section + .role-side-menu__section { margin-block-start: 0; }
}

@media (max-width: 420px) {
  .role-side-menu { --menu-inline-padding: 8px; }
  .role-side-menu__section h2 { font-size: 14px; }
  .role-side-menu__section a { font-size: 11px; }
}
</style>
