<script setup>
const boards = [
  {
    id: 'notice',
    title: '공지사항',
    description: '대구교통공사의 새로운 소식을 확인하세요.',
    items: [
      { title: '고객 서비스 이용 안내', date: '2026.10.07' },
      { title: '온라인 민원 접수 안내', date: '2026.10.01' },
      { title: '개인정보 처리방침 안내', date: '2026.09.25' },
      { title: '자주 묻는 질문 이용 안내', date: '2026.09.18' },
      { title: '추석 연휴 이용 안내', date: '2026.09.11' },
    ],
  },
  {
    id: 'resources',
    title: '자료실',
    description: '필요한 서식과 이용 안내를 내려받으세요.',
    items: [
      { title: '도시철도 이용 가이드', date: '2026.10.08' },
      { title: '고객 서비스 이용 가이드', date: '2026.10.02' },
      { title: '분실물 신고서', date: '2026.09.26' },
      { title: '교통약자 이용 안내', date: '2026.09.19' },
      { title: '도시철도 노선도 및 역사 안내', date: '2026.09.12' },
    ],
  },
]
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
        <VBtn type="button" class="board-card__more" variant="text" size="small" :aria-label="`${board.title} 더보기`">
          <span>더보기</span>
          <i class="bx bx-chevron-right" aria-hidden="true" />
        </VBtn>
      </header>

      <ul class="board-card__list">
        <li v-for="item in board.items" :key="`${item.title}-${item.date}`">
          <button type="button" class="board-card__item">
            <span>{{ item.title }}</span>
            <time :datetime="item.date.replaceAll('.', '-')">{{ item.date }}</time>
          </button>
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-block-end: 12px;
  border-block-end: 2px solid rgb(var(--v-theme-primary));
  gap: 12px;
}

.board-card__header h2 {
  margin: 0;
  color: rgb(var(--v-theme-primary-darken-1));
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -.04em;
}

.board-card__header p {
  margin: 8px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 15px;
}

.board-card__more {
  display: inline-flex;
  min-block-size: 40px;
  flex: 0 0 auto;
  align-items: center;
  padding-inline: 8px 0;
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
  .board-card__header { gap: 8px; }
  .board-card__header p { font-size: 15px; line-height: 1.45; }
  .board-card__more { min-block-size: 44px; }
  .board-card__more span { display: none; }
  .board-card__item { min-block-size: 48px; font-size: 15px; }
  .board-card__item time { font-size: 13px; }
}
</style>
