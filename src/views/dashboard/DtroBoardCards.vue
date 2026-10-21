<script setup>
import { onMounted, ref } from 'vue'
import { fn_listNotices } from '@/features/notice/api/noticeApi'
import { fn_listResources } from '@/features/resource/api/resourceApi'
import { gfn_formatDate } from '@/utils/date'

const boards = ref([
  {
    id: 'notice',
    title: '공지사항',
    description: '대구교통공사의 새로운 소식을 확인하세요.',
    to: '/notices',
    items: [],
    loading: true,
    error: '',
  },
  {
    id: 'resources',
    title: '자료실',
    description: '필요한 서식과 이용 안내를 내려받으세요.',
    to: '/resources',
    items: [],
    loading: true,
    error: '',
  },
])

const fn_loadBoard = async (board, listRequest, idField) => {
  board.loading = true
  board.error = ''
  try {
    const response = await listRequest({ page: 0, size: 5, sort: 'createdAt,desc' })
    const content = Array.isArray(response) ? response : response?.content ?? []
    board.items = content.slice(0, 5).map(item => ({
      id: item[idField],
      title: item.title,
      date: gfn_formatDate(item.createdAt, 'YYYY.MM.DD'),
      datetime: item.createdAt,
      to: board.id === 'notice' ? `/notices/${item[idField]}` : `/resources/${item[idField]}`,
    }))
  } catch (error) {
    board.error = error.message || `${board.title}를 불러오지 못했습니다.`
  } finally {
    board.loading = false
  }
}

onMounted(() => {
  fn_loadBoard(boards.value[0], fn_listNotices, 'id')
  fn_loadBoard(boards.value[1], fn_listResources, 'resourceId')
})
</script>

<template>
  <div class="board-grid">
    <VCard
      v-for="board in boards"
      :id="board.id"
      :key="board.id"
      class="board-card"
      tag="section"
      elevation="1"
      :aria-labelledby="`${board.id}-title`"
    >
      <header class="board-card__header">
        <div>
          <h2 :id="`${board.id}-title`">{{ board.title }}</h2>
          <p>{{ board.description }}</p>
        </div>
        <VBtn :to="board.to" class="board-card__more" variant="text" size="small" :aria-label="`${board.title} 더보기`">
          <span>더보기</span>
          <i class="bx bx-chevron-right" aria-hidden="true" />
        </VBtn>
      </header>

      <p v-if="board.loading" class="board-card__state" role="status">목록을 불러오는 중입니다.</p>
      <p v-else-if="board.error" class="board-card__state" role="alert">{{ board.error }}</p>
      <p v-else-if="!board.items.length" class="board-card__state">등록된 게시물이 없습니다.</p>
      <ul v-else class="board-card__list">
        <li v-for="item in board.items" :key="item.id">
          <RouterLink :to="item.to" class="board-card__item">
            <span>{{ item.title }}</span>
            <time :datetime="item.datetime">{{ item.date }}</time>
          </RouterLink>
        </li>
      </ul>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.board-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 2vw, 24px);
  padding: clamp(20px, 2.5vw, 32px);
}

.board-card.v-card {
  @include dtro.surface-card;

  min-inline-size: 0;
  padding: clamp(20px, 2vw, 24px);
}

.board-card__header {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;
  row-gap: 0;
  padding-block-end: 12px;
  border-block-end: 2px solid rgb(var(--v-theme-primary));
}

.board-card__header > div {
  display: contents;
}

.board-card__header h2 {
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  color: rgb(var(--v-theme-primary-darken-1));
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -.04em;
  line-height: 1.2;
}

.board-card__header p {
  grid-column: 1 / -1;
  grid-row: 2;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 13px;
  letter-spacing: -.02em;
  line-height: 1.2;
  white-space: nowrap;
}

.board-card__more {
  grid-column: 2;
  grid-row: 1;
  display: inline-flex;
  min-block-size: 24px;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 0 0 8px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 15px;
  gap: 2px;
  text-transform: none;
}

.board-card__more i { font-size: 19px; }
.board-card__more:hover { color: rgb(var(--v-theme-primary)); }

.board-card__list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.board-card__state {
  padding-block: 20px;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 14px;
}

.board-card__list li {
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.board-card__item {
  display: flex;
  inline-size: 100%;
  min-block-size: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  gap: 16px;
  text-align: start;
  text-decoration: none;
}

.board-card__item > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-card__item time {
  flex: 0 0 auto;
  color: rgba(var(--v-theme-on-surface), 0.52);
  font-size: 13px;
}

.board-card__item:hover { color: rgb(var(--v-theme-primary)); }

.board-card__more:focus-visible,
.board-card__item:focus-visible {
  border-radius: dtro.$radius;
  @include dtro.focus-ring;
}

@media (max-width: 900px) {
  .board-grid {
    grid-template-columns: minmax(0, 1fr);
    padding: 20px;
  }
}

@media (max-width: 640px) {
  .board-grid { gap: 12px; padding: 12px 10px; }
  .board-card.v-card { padding: 16px; border-radius: dtro.$radius; }
  .board-card__header { column-gap: 8px; }
  .board-card__header p { font-size: 13px; line-height: 1.45; }
  .board-card__more { min-block-size: 24px; }
  .board-card__more span { display: none; }
  .board-card__item { min-block-size: 48px; font-size: 15px; }
  .board-card__item time { font-size: 13px; }
}
</style>
