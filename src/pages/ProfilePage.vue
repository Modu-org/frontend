<template>
  <DefaultLayout title="마이페이지" show-back>
    <div class="profile-layout">
      <!-- ─── 좌측 사이드바 ─────────────────────────── -->
      <aside class="profile-sidebar">
        <div class="sidebar-user">
          <div class="sidebar-avatar">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size: 22px; color: var(--color-on-primary);">person</span>
          </div>
          <div class="sidebar-user__info">
            <p class="sidebar-user__name">{{ authStore.nickname }}</p>
            <p class="sidebar-user__id">@{{ authStore.user?.userName }}</p>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button
            :class="['sidebar-nav__item', { 'sidebar-nav__item--active': activeTab === 'profile' }]"
            @click="activeTab = 'profile'"
          >
            <span class="material-symbols-outlined">manage_accounts</span>
            내 정보 수정
          </button>
          <button
            :class="['sidebar-nav__item', { 'sidebar-nav__item--active': activeTab === 'reviews' }]"
            @click="activeTab = 'reviews'"
          >
            <span class="material-symbols-outlined">rate_review</span>
            내 리뷰
            <span v-if="myReviewTotal" class="sidebar-badge">{{ myReviewTotal }}</span>
          </button>
        </nav>
      </aside>

      <!-- ─── 우측 콘텐츠 ─────────────────────────── -->
      <div class="profile-content">

        <!-- 내 정보 수정 탭 -->
        <template v-if="activeTab === 'profile'">
          <!-- Profile Card -->
          <BaseCard padding="lg" elevated class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size: 28px; color: var(--color-on-primary);">person</span>
              </div>
              <div>
                <h2 class="profile-name">{{ authStore.nickname }}</h2>
                <p class="profile-id">@{{ authStore.user?.userName }}</p>
              </div>
            </div>
          </BaseCard>

          <!-- 기본 정보 수정 -->
          <h3 class="section-title">기본 정보</h3>
          <BaseCard padding="lg" elevated class="section-card">
            <BaseInput
              v-model="editForm.nickname"
              label="닉네임"
              placeholder="닉네임을 입력하세요"
            />
          </BaseCard>

          <!-- 접근성 정보 수정 -->
          <h3 class="section-title">접근성 정보</h3>
          <BaseCard padding="lg" elevated class="section-card">
            <div class="option-grid">
              <button
                v-for="field in USER_DETAIL_FIELDS"
                :key="field.key"
                :class="['option-card', { 'option-card--selected': editForm[field.key] }]"
                @click="editForm[field.key] = editForm[field.key] ? 0 : 1"
              >
                <span class="material-symbols-outlined option-card__icon">{{ field.icon }}</span>
                <span class="option-card__label">{{ field.label }}</span>
                <span v-if="editForm[field.key]" class="option-card__check material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              </button>
            </div>
          </BaseCard>

          <!-- 표시 설정 -->
          <h3 class="section-title">표시 설정</h3>
          <BaseCard padding="lg" elevated class="section-card">
            <p class="setting-label">글자 크기</p>
            <input
              type="range" min="1.0" max="1.8" step="0.1"
              :value="themeStore.fontScale"
              class="font-slider"
              @input="themeStore.setFontScale(Number($event.target.value))"
            />
            <div class="font-scale-labels">
              <span style="font-size: 14px;">가</span>
              <span style="font-size: 18px;">가</span>
              <span style="font-size: 22px;">가</span>
            </div>
          </BaseCard>

          <!-- 액션 버튼 -->
          <div class="profile-actions">
            <BaseButton full-width :loading="isSaving" @click="handleSave">
              <span class="material-symbols-outlined">save</span>
              저장
            </BaseButton>
            <BaseButton full-width variant="ghost" @click="handleLogout">
              <span class="material-symbols-outlined">logout</span>
              로그아웃
            </BaseButton>
          </div>
        </template>

        <!-- 내 리뷰 탭 -->
        <template v-else-if="activeTab === 'reviews'">
          <div class="reviews-tab">
            <div class="reviews-tab__header">
              <h2 class="reviews-tab__title">
                <span class="material-symbols-outlined">rate_review</span>
                내 리뷰
              </h2>
              <span class="reviews-tab__count">총 {{ myReviews.length }}개</span>
            </div>

            <!-- 정렬 -->
            <div class="reviews-tab__filters">
              <BaseSelect
                v-model="myReviewSort"
                :options="sortOptions"
                class="filter-sort-wrap"
                @change="loadMyReviews"
              />
            </div>

            <div v-if="isMyReviewLoading" class="reviews-loading"><LoadingSpinner /></div>
            <div v-else-if="myReviews.length === 0" class="reviews-empty">
              <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--color-outline);">rate_review</span>
              <p>작성한 리뷰가 없습니다.</p>
            </div>
            <ul v-else class="my-review-list">
              <li
                v-for="review in myReviews"
                :key="review.reviewId"
                class="my-review-item"
              >
                <!-- 관광지 이름 / 날짜 -->
                <div class="my-review-item__top">
                  <router-link
                    :to="`/attraction/${review.attractionId}`"
                    class="my-review-item__place"
                  >
                    <span class="material-symbols-outlined" style="font-size:1rem;">place</span>
                    {{ review.attractionName }}
                  </router-link>
                  <span class="my-review-item__date">{{ formatDate(review.createdAt) }}</span>
                  <span v-if="review.isPrivate" class="my-review-item__private">
                    <span class="material-symbols-outlined" style="font-size:0.9rem;">lock</span>비밀글
                  </span>
                </div>

                <!-- 별점 + 내용 -->
                <div class="my-review-item__stars">
                  <span v-for="s in 5" :key="s" :class="['star-icon', s <= review.rate ? 'star-icon--on' : '']">★</span>
                  <span class="my-review-item__rate-text">{{ review.rate }}점</span>
                </div>
                <p class="my-review-item__content">{{ review.content }}</p>

                <!-- 수정/삭제 -->
                <div class="my-review-item__actions">
                  <button class="action-btn action-btn--edit" @click="startEditMyReview(review)">
                    <span class="material-symbols-outlined">edit</span>수정
                  </button>
                  <button class="action-btn action-btn--delete" @click="deleteMyReview(review)">
                    <span class="material-symbols-outlined">delete</span>삭제
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </template>

      </div>
    </div>

    <!-- 리뷰 수정 모달 -->
    <div v-if="editingReview" class="review-edit-overlay" @click.self="cancelEditMyReview">
      <div class="review-edit-modal">
        <div class="review-edit-modal__header">
          <h3>리뷰 수정</h3>
          <button class="modal-close-btn" @click="cancelEditMyReview">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <p class="review-edit-modal__place">
          <span class="material-symbols-outlined" style="font-size:1rem;">place</span>
          {{ editingReview.attractionName }}
        </p>
        <div class="star-row">
          <button
            v-for="s in 5" :key="s"
            :class="['star-btn', { 'star-btn--active': myEditForm.rate >= s }]"
            @click="myEditForm.rate = s"
          >★</button>
          <span class="star-label">{{ myEditForm.rate ? `${myEditForm.rate}점` : '별점 선택' }}</span>
        </div>
        <textarea
          v-model="myEditForm.content"
          class="review-edit-textarea"
          placeholder="수정할 내용을 입력하세요."
          rows="4"
        ></textarea>
        <label class="privacy-toggle">
          <input v-model="myEditForm.isPrivate" type="checkbox" />
          <span class="privacy-toggle__label">
            <span class="material-symbols-outlined" style="font-size:1rem;">{{ myEditForm.isPrivate ? 'lock' : 'lock_open' }}</span>
            {{ myEditForm.isPrivate ? '비밀글' : '공개글' }}
          </span>
        </label>
        <div class="review-edit-modal__footer">
          <BaseButton variant="ghost" @click="cancelEditMyReview">취소</BaseButton>
          <BaseButton :loading="isEditing" @click="submitEditMyReview">수정 완료</BaseButton>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 다이얼로그 -->
    <BaseDialog
      v-model="deleteDialog.visible"
      title="리뷰 삭제"
      message="이 리뷰를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
      confirm-text="삭제"
      cancel-text="취소"
      confirm-variant="danger"
      @confirm="confirmDeleteMyReview"
      @cancel="deleteDialog.visible = false"
    />
  </DefaultLayout>
</template>

<script setup>
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useToast } from '@/composables/useToast'
import { USER_DETAIL_FIELDS } from '@/constants/enums'
import { reviewApi } from '@/api/reviewApi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { showToast } = useToast()

// ─── 탭 ────────────────────────────────────────────
// route query로 초기 탭 설정 가능: /profile?tab=reviews
const activeTab = ref(route.query.tab === 'reviews' ? 'reviews' : 'profile')

// ─── 내 정보 수정 ────────────────────────────────
const isSaving = ref(false)

const editForm = reactive({
  nickname: '',
  physical: 0,
  visual: 0,
  hearing: 0,
  infantFamily: 0,
})

watch(() => authStore.user, (u) => {
  if (u) {
    editForm.nickname = u.nickname || ''
    editForm.physical = u.physical || 0
    editForm.visual = u.visual || 0
    editForm.hearing = u.hearing || 0
    editForm.infantFamily = u.infantFamily || 0
  }
}, { immediate: true })

async function handleSave() {
  isSaving.value = true
  try {
    const payload = {
      userName: authStore.user?.userName,
      nickname: editForm.nickname,
      physical: editForm.physical,
      visual: editForm.visual,
      hearing: editForm.hearing,
      infant_family: editForm.infantFamily,
    }
    await authStore.updateMe(payload)
    if (authStore.user) {
      authStore.user.nickname = editForm.nickname
      authStore.user.physical = editForm.physical
      authStore.user.visual = editForm.visual
      authStore.user.hearing = editForm.hearing
      authStore.user.infantFamily = editForm.infantFamily
    }
    showToast('정보가 저장되었습니다.', 'success')
  } catch (err) {
    showToast(err?.response?.data?.message || '저장 중 오류가 발생했습니다.', 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  showToast('로그아웃되었습니다.', 'info')
  router.push('/')
}

// ─── 내 리뷰 ────────────────────────────────────
const myReviews = ref([])
const isMyReviewLoading = ref(false)
const myReviewSort = ref('LATEST')
const sortOptions = [
  { value: 'LATEST', label: '최신순' },
  { value: 'OLDEST', label: '오래된순' },
  { value: 'RATE_DESC', label: '평점 높은순' },
  { value: 'RATE_ASC', label: '평점 낮은순' },
]
const myReviewTotal = computed(() => myReviews.value.length || null)

// 탭이 reviews로 바뀌면 로드
watch(activeTab, (tab) => {
  if (tab === 'reviews' && myReviews.value.length === 0) {
    loadMyReviews()
  }
})

onMounted(() => {
  if (activeTab.value === 'reviews') loadMyReviews()
})

async function loadMyReviews() {
  isMyReviewLoading.value = true
  try {
    const { data: res } = await reviewApi.getMyReviews({ sort: myReviewSort.value })
    myReviews.value = res.data || []
  } catch {
    myReviews.value = []
  } finally {
    isMyReviewLoading.value = false
  }
}

// 수정
const editingReview = ref(null)
const myEditForm = ref({ content: '', rate: 0, isPrivate: false })
const isEditing = ref(false)

function startEditMyReview(review) {
  editingReview.value = review
  myEditForm.value = {
    content: review.content,
    rate: review.rate,
    isPrivate: review.isPrivate,
  }
}

function cancelEditMyReview() {
  editingReview.value = null
  myEditForm.value = { content: '', rate: 0, isPrivate: false }
}

async function submitEditMyReview() {
  if (!myEditForm.value.content.trim()) { showToast('내용을 입력해주세요.', 'error'); return }
  if (!myEditForm.value.rate) { showToast('별점을 선택해주세요.', 'error'); return }
  isEditing.value = true
  try {
    await reviewApi.update(editingReview.value.reviewId, {
      content: myEditForm.value.content,
      rate: myEditForm.value.rate,
      isPrivate: myEditForm.value.isPrivate,
    })
    showToast('리뷰가 수정되었습니다.', 'success')
    cancelEditMyReview()
    await loadMyReviews()
  } catch {
    showToast('수정에 실패했습니다.', 'error')
  } finally {
    isEditing.value = false
  }
}

// 삭제
const deleteDialog = reactive({ visible: false, target: null })

function deleteMyReview(review) {
  deleteDialog.target = review
  deleteDialog.visible = true
}

async function confirmDeleteMyReview() {
  if (!deleteDialog.target) return
  try {
    await reviewApi.remove(deleteDialog.target.reviewId)
    showToast('리뷰가 삭제되었습니다.', 'success')
    deleteDialog.visible = false
    deleteDialog.target = null
    await loadMyReviews()
  } catch {
    showToast('삭제에 실패했습니다.', 'error')
    deleteDialog.visible = false
  }
}

// ─── 유틸 ────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
/* ─── 전체 레이아웃 ─────────────────────────── */
.profile-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  min-height: 60vh;
}

/* ─── 사이드바 ───────────────────────────────── */
.profile-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-surface-container-lowest);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-DEFAULT);
  overflow: hidden;
  position: sticky;
  top: calc(var(--header-height) + 1rem);
}

@media (max-width: 767px) {
  .profile-layout { flex-direction: column; gap: 1rem; }
  .profile-sidebar { width: 100%; position: static; }
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1.5px solid var(--color-outline-variant);
  background: #fff;
}

.sidebar-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-user__info { min-width: 0; }
.sidebar-user__name { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user__id { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sidebar-nav { display: flex; flex-direction: column; }

@media (max-width: 767px) {
  .sidebar-nav { flex-direction: row; }
}

.sidebar-nav__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-on-surface-variant);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.18s;
  text-align: left;
  position: relative;
}

.sidebar-nav__item:hover { background: var(--color-primary); color: var(--color-on-surface); }

.sidebar-nav__item--active {
  color: var(--color-primary-deep);
  background: var(--color-primary-soft);
  font-weight: 700;
}

.sidebar-nav__item .material-symbols-outlined { font-size: 1.15rem; }

.sidebar-badge {
  margin-left: auto;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
}

/* ─── 우측 콘텐츠 ───────────────────────────── */
.profile-content { flex: 1; min-width: 0; }

/* ─── 내 정보 수정 탭 ───────────────────────── */
.profile-card { margin-bottom: 24px; }
.profile-header { display: flex; align-items: center; gap: 16px; }
.profile-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--gradient-primary);
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-md); flex-shrink: 0;
}
.profile-name { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-on-surface); }
.profile-id { font-size: var(--font-size-sm); color: var(--color-outline); }

.section-title {
  font-size: var(--font-size-base); font-weight: 700;
  color: var(--color-on-surface-variant);
  margin-bottom: 12px; padding-left: 12px;
  border-left: 4px solid var(--color-primary);
}
.section-card { margin-bottom: 24px; }

.option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.option-card {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 20px 12px; min-height: 100px;
  border-radius: var(--radius-DEFAULT);
  background: var(--color-surface-container-low);
  color: var(--color-on-surface-variant);
  border: 2px solid transparent;
  cursor: pointer; transition: all 0.2s;
}
.option-card:hover { background: var(--color-surface-container); }
.option-card:active { transform: scale(0.97); }
.option-card--selected {
  background: var(--color-primary); color: var(--color-on-primary);
  border-color: var(--color-primary); box-shadow: var(--shadow-md);
}
.option-card__icon { font-size: 32px; margin-bottom: 6px; }
.option-card__label { font-size: var(--font-size-sm); font-weight: 700; }
.option-card__check { position: absolute; top: 6px; right: 6px; font-size: 16px; }

.setting-label { font-size: var(--font-size-base); font-weight: 700; color: var(--color-on-surface); margin-bottom: 4px; }
.font-slider {
  width: 100%; height: 6px;
  accent-color: var(--color-primary);
  background: var(--color-surface-container);
  border-radius: 3px; cursor: pointer;
}
.font-scale-labels { display: flex; justify-content: space-between; margin-top: 4px; color: var(--color-outline); font-weight: 500; }
.profile-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }

/* ─── 내 리뷰 탭 ─────────────────────────────── */
.reviews-tab { display: flex; flex-direction: column; gap: 1rem; }

.reviews-tab__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-outline-variant);
}
.reviews-tab__title {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0;
}
.reviews-tab__title .material-symbols-outlined { color: var(--color-primary); }
.reviews-tab__count {
  margin-left: auto;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  font-weight: 600;
}

.reviews-tab__filters { display: flex; justify-content: flex-end; }
.filter-sort-wrap { flex: 0 0 auto; min-width: 120px; }

.reviews-loading { display: flex; justify-content: center; padding: 3rem; }
.reviews-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 1rem; text-align: center; color: var(--color-on-surface-variant); font-size: var(--font-size-sm); }

.my-review-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }

.my-review-item {
  background: var(--color-surface-container-lowest);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-DEFAULT);
  padding: 1.125rem 1.25rem;
  transition: box-shadow 0.18s;
}
.my-review-item:hover { box-shadow: var(--shadow-md); }

.my-review-item__top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.my-review-item__place {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary-deep);
  text-decoration: none;
  transition: opacity 0.15s;
}
.my-review-item__place:hover { opacity: 0.75; text-decoration: underline; }
.my-review-item__date { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); margin-left: auto; }
.my-review-item__private { display: flex; align-items: center; gap: 0.1rem; font-size: var(--font-size-xs); color: var(--color-outline); }

.my-review-item__stars { display: flex; align-items: center; gap: 2px; margin-bottom: 0.5rem; }
.star-icon { font-size: 1rem; color: var(--color-outline); }
.star-icon--on { color: var(--color-accent); }
.my-review-item__rate-text { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); margin-left: 0.25rem; font-weight: 600; }

.my-review-item__content { font-size: var(--font-size-sm); color: var(--color-on-surface); line-height: 1.65; white-space: pre-wrap; margin-bottom: 0.75rem; }

.my-review-item__actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-sm);
  background: none;
  border: 1.5px solid var(--color-outline-variant);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn .material-symbols-outlined { font-size: 0.95rem; }
.action-btn--edit { color: var(--color-primary-deep); }
.action-btn--edit:hover { background: var(--color-primary-soft); border-color: var(--color-primary); }
.action-btn--delete { color: #D85739; }
.action-btn--delete:hover { background: #FFE3DA; border-color: #D85739; }

/* ─── 수정 모달 오버레이 ─────────────────────── */
.review-edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.review-edit-modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: 1.75rem;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-edit-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.review-edit-modal__header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-on-surface); margin: 0; }

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}
.modal-close-btn:hover { background: var(--color-surface-container-low); }

.review-edit-modal__place {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary-deep);
  margin: 0;
}

.star-row { display: flex; align-items: center; gap: 0.375rem; }
.star-btn { background: none; border: none; font-size: 1.75rem; cursor: pointer; color: var(--color-outline); transition: color 0.15s, transform 0.1s; padding: 0; line-height: 1; }
.star-btn:hover, .star-btn--active { color: var(--color-accent); }
.star-label { font-size: var(--font-size-sm); color: var(--color-on-surface-variant); margin-left: 0.25rem; }

.review-edit-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant);
  background: var(--color-background);
  font-size: var(--font-size-sm);
  color: var(--color-on-surface);
  resize: none;
  font-family: inherit;
  outline: none;
  transition: border-color 0.18s;
}
.review-edit-textarea:focus { border-color: var(--color-primary); }

.privacy-toggle { display: flex; align-items: center; gap: 0.25rem; cursor: pointer; }
.privacy-toggle input { accent-color: var(--color-primary); }
.privacy-toggle__label { display: flex; align-items: center; gap: 0.25rem; font-size: var(--font-size-sm); color: var(--color-on-surface-variant); }

.review-edit-modal__footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>
