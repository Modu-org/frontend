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
          <button
            :class="['sidebar-nav__item', { 'sidebar-nav__item--active': activeTab === 'caregiver' }]"
            @click="activeTab = 'caregiver'"
          >
            <span class="material-symbols-outlined">supervisor_account</span>
            보호자 관리
            <span v-if="pendingRequestCount" class="sidebar-badge sidebar-badge--accent">{{ pendingRequestCount }}</span>
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

          <!-- 푸시 알림 설정 -->
          <BaseCard padding="lg" elevated class="profile-card">
            <div class="push-setting">
              <div class="push-setting__info">
                <h3 class="push-setting__title">
                  <span class="material-symbols-outlined" style="font-size:1.15rem;">notifications_active</span>
                  푸시 알림
                </h3>
                <p class="push-setting__desc">
                  {{ pushDescText }}
                </p>
              </div>
              <BaseButton
                v-if="pushStatus !== 'granted' && !isIosNonPwa"
                size="sm"
                :variant="pushStatus === 'denied' ? 'ghost' : 'primary'"
                :disabled="pushStatus === 'denied' || !supportsNotification"
                @click="requestPushPermission"
              >
                <span class="material-symbols-outlined" style="font-size:0.9rem;">{{ pushStatus === 'denied' ? 'notifications_off' : 'notifications' }}</span>
                {{ pushStatus === 'denied' ? '차단됨' : '알림 허용' }}
              </BaseButton>
              <span v-else-if="pushStatus === 'granted'" class="push-status-badge">
                <span class="material-symbols-outlined" style="font-size:0.9rem;">check_circle</span>
                활성
              </span>
            </div>

            <!-- iOS 홈 화면 추가 안내 -->
            <div v-if="isIosNonPwa" class="ios-install-guide">
              <div class="ios-install-guide__icon">
                <span class="material-symbols-outlined" style="font-size:1.5rem;">ios_share</span>
              </div>
              <div class="ios-install-guide__steps">
                <p class="ios-install-guide__step"><strong>1.</strong> 하단 공유 버튼 <span class="material-symbols-outlined" style="font-size:0.85rem;vertical-align:middle;">ios_share</span> 을 눌러주세요</p>
                <p class="ios-install-guide__step"><strong>2.</strong> "홈 화면에 추가"를 선택해주세요</p>
                <p class="ios-install-guide__step"><strong>3.</strong> 설치된 앱에서 알림을 허용해주세요</p>
              </div>
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
                @change="loadMyReviews(true)"
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

        <!-- 보호자 관리 탭 -->
        <template v-else-if="activeTab === 'caregiver'">
          <div class="caregiver-tab">
            <div class="caregiver-tab__header">
              <h2 class="caregiver-tab__title">
                <span class="material-symbols-outlined">supervisor_account</span>
                보호자 관리
              </h2>
            </div>

            <!-- 보호자 등록 -->
            <BaseCard padding="lg" elevated class="section-card">
              <h3 class="cg-section-title">보호자 등록</h3>
              <p class="cg-section-desc">보호자의 아이디를 입력하여 등록 요청을 보낼 수 있습니다.</p>
              <form class="cg-register-form" @submit.prevent="handleRegisterCaregiver">
                <BaseInput
                  v-model="caregiverUserName"
                  placeholder="보호자 아이디 입력"
                  class="cg-register-input"
                />
                <BaseButton type="submit" :disabled="!caregiverUserName.trim() || isRegistering">
                  <span class="material-symbols-outlined" style="font-size:1rem;">person_add</span>
                  요청 보내기
                </BaseButton>
              </form>
            </BaseCard>

            <!-- 등록된 보호자 목록 -->
            <h3 class="cg-section-title cg-section-title--mt">내 보호자</h3>
            <div v-if="caregiverStore.isLoading" class="cg-loading"><LoadingSpinner /></div>
            <div v-else-if="caregiverStore.caregivers.length === 0" class="cg-empty">
              <span class="material-symbols-outlined" style="font-size:2rem;color:var(--color-outline);">group_off</span>
              <p>등록된 보호자가 없습니다.</p>
            </div>
            <ul v-else class="cg-list">
              <li v-for="cg in caregiverStore.caregivers" :key="cg.relationId" class="cg-item">
                <div class="cg-item__avatar">
                  <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;font-size:1.25rem;color:var(--color-on-primary);">person</span>
                </div>
                <div class="cg-item__info">
                  <span class="cg-item__name">{{ cg.caregiverName }}</span>
                  <span :class="['cg-item__status', cg.active ? 'cg-item__status--active' : 'cg-item__status--pending']">
                    {{ cg.active ? '활성' : '수락 대기중' }}
                  </span>
                </div>
                <button class="cg-item__remove" @click="handleRemoveCaregiver(cg)">
                  <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
                  해제
                </button>
              </li>
            </ul>

            <!-- 받은 보호자 요청 -->
            <h3 class="cg-section-title cg-section-title--mt">받은 보호자 요청</h3>
            <div v-if="caregiverStore.receivedRequests.length === 0" class="cg-empty">
              <p>받은 보호자 요청이 없습니다.</p>
            </div>
            <ul v-else class="cg-list">
              <li v-for="req in caregiverStore.receivedRequests" :key="req.relationId" class="cg-item cg-item--request">
                <div class="cg-item__avatar cg-item__avatar--incoming">
                  <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;font-size:1.25rem;color:#fff;">person_add</span>
                </div>
                <div class="cg-item__info">
                  <span class="cg-item__name">{{ req.travelerName }}</span>
                  <span class="cg-item__sub">보호자 등록을 요청했습니다.</span>
                </div>
                <div class="cg-item__req-actions">
                  <button class="cg-req-btn cg-req-btn--accept" @click="handleAcceptRequest(req.relationId)">
                    <span class="material-symbols-outlined" style="font-size:0.9rem;">check</span>
                    수락
                  </button>
                  <button class="cg-req-btn cg-req-btn--reject" @click="handleRejectRequest(req.relationId)">
                    <span class="material-symbols-outlined" style="font-size:0.9rem;">close</span>
                    거절
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
import { useCaregiverStore } from '@/stores/caregiverStore'
import { useToast } from '@/composables/useToast'
import { USER_DETAIL_FIELDS } from '@/constants/enums'
import { reviewApi } from '@/api/reviewApi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const caregiverStore = useCaregiverStore()
const { showToast } = useToast()

// ─── 탭 ────────────────────────────────────────────
const initialTab = route.query.tab === 'reviews' ? 'reviews' : route.query.tab === 'caregiver' ? 'caregiver' : 'profile'
const activeTab = ref(initialTab)

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

// ─── 푸시 알림 설정 ────────────────────────────────
const pushStatus = ref('default')
const supportsNotification = typeof window !== 'undefined' && 'Notification' in window
// iOS Safari에서 PWA로 설치하지 않은 경우 감지
const isIos = computed(() => {
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
})
const isStandalone = computed(() =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
)
const isIosNonPwa = computed(() => isIos.value && !isStandalone.value)

const pushDescText = computed(() => {
  if (isIosNonPwa.value) {
    return '아이폰에서 푸시 알림을 받으려면 이 앱을 홈 화면에 추가해야 합니다.'
  }
  if (!supportsNotification) {
    return '이 브라우저에서는 알림을 지원하지 않습니다.'
  }
  if (pushStatus.value === 'granted') return '알림이 활성화되어 있습니다.'
  if (pushStatus.value === 'denied') return '알림이 차단되어 있습니다. 브라우저 설정에서 허용해주세요.'
  return '보호자 도착 알림 등을 받으려면 알림을 허용해주세요.'
})

onMounted(() => {
  if (supportsNotification) {
    pushStatus.value = Notification.permission
  }
})

async function requestPushPermission() {
  try {
    const permission = await Notification.requestPermission()
    pushStatus.value = permission

    if (permission === 'granted') {
      showToast('알림이 활성화되었습니다!', 'success')

      // FCM 토큰 발급 및 서버 전송
      const { requestFcmToken } = await import('@/firebase')
      const { fcmApi } = await import('@/api/fcmApi')
      const token = await requestFcmToken()
      if (token) {
        await fcmApi.saveToken(token).catch(() => {})
      }
    } else if (permission === 'denied') {
      showToast('알림이 차단되었습니다. 브라우저 설정에서 허용해주세요.', 'error')
    }
  } catch (e) {
    showToast('알림 권한 요청에 실패했습니다.', 'error')
  }
}

// ─── 내 리뷰 ────────────────────────────────────
const myReviews = computed(() => authStore.myReviews)
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
  if (tab === 'reviews' && !authStore.isMyReviewsLoaded) {
    loadMyReviews()
  }
  if (tab === 'caregiver') {
    caregiverStore.fetchCaregivers()
    caregiverStore.fetchReceivedRequests()
  }
})

onMounted(() => {
  if (activeTab.value === 'reviews') loadMyReviews()
  if (activeTab.value === 'caregiver') {
    caregiverStore.fetchCaregivers()
    caregiverStore.fetchReceivedRequests()
  }
})

async function loadMyReviews(force = false) {
  if (authStore.isMyReviewsLoaded && !force) return
  isMyReviewLoading.value = true
  try {
    const { data: res } = await reviewApi.getMyReviews({ sort: myReviewSort.value })
    authStore.myReviews = res.data || []
    authStore.isMyReviewsLoaded = true
  } catch {
    authStore.myReviews = []
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
    await loadMyReviews(true)
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
    await loadMyReviews(true)
  } catch {
    showToast('삭제에 실패했습니다.', 'error')
    deleteDialog.visible = false
  }
}

// ─── 보호자 관리 ──────────────────────────────────
const caregiverUserName = ref('')
const isRegistering = ref(false)
const pendingRequestCount = computed(() => caregiverStore.receivedRequests.length || null)

async function handleRegisterCaregiver() {
  if (!caregiverUserName.value.trim()) return
  isRegistering.value = true
  try {
    await caregiverStore.registerCaregiver(caregiverUserName.value.trim())
    caregiverUserName.value = ''
  } finally {
    isRegistering.value = false
  }
}

function handleRemoveCaregiver(cg) {
  caregiverStore.removeCaregiver(cg.caregiverId)
}

function handleAcceptRequest(relationId) {
  caregiverStore.acceptRequest(relationId)
}

function handleRejectRequest(relationId) {
  caregiverStore.rejectRequest(relationId)
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
  .profile-content { width: 100%; }
  .sidebar-nav__item {
    flex: 1;
    justify-content: center;
  }
  .sidebar-badge {
    margin-left: 0.5rem;
  }
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
/* ─── 푸시 알림 설정 ─────────────────────── */
.push-setting {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.push-setting__info { flex: 1; min-width: 0; }
.push-setting__title {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: var(--font-size-sm); font-weight: 700;
  color: var(--color-on-surface); margin: 0 0 0.25rem;
}
.push-setting__desc {
  font-size: var(--font-size-xs); color: var(--color-on-surface-variant);
  margin: 0; line-height: 1.4;
}
.push-status-badge {
  display: flex; align-items: center; gap: 0.2rem;
  padding: 0.25rem 0.6rem; border-radius: var(--radius-full);
  background: #d1fae5; color: #065f46;
  font-size: var(--font-size-xs); font-weight: 700;
  flex-shrink: 0;
}

/* iOS 홈 화면 추가 안내 */
.ios-install-guide {
  display: flex; align-items: flex-start; gap: 0.75rem;
  margin-top: 1rem; padding: 0.875rem 1rem;
  background: #fef3c7; border: 1.5px solid #f59e0b;
  border-radius: var(--radius-DEFAULT);
}
.ios-install-guide__icon {
  flex-shrink: 0; color: #92400e;
  display: flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem;
  background: #fde68a; border-radius: var(--radius-DEFAULT);
}
.ios-install-guide__steps { flex: 1; }
.ios-install-guide__step {
  font-size: var(--font-size-xs); color: #78350f;
  margin: 0; line-height: 1.6;
}

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

/* ─── 보호자 관리 탭 ─────────────────────────── */
.sidebar-badge--accent {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.caregiver-tab { display: flex; flex-direction: column; gap: 1rem; }
.caregiver-tab__header {
  display: flex; align-items: center; gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-outline-variant);
}
.caregiver-tab__title {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: var(--font-size-xl); font-weight: 700;
  color: var(--color-on-surface); margin: 0;
}
.caregiver-tab__title .material-symbols-outlined { color: var(--color-primary); }

.cg-section-title {
  font-size: var(--font-size-base); font-weight: 700;
  color: var(--color-on-surface-variant);
  margin-bottom: 8px; padding-left: 12px;
  border-left: 4px solid var(--color-primary);
}
.cg-section-title--mt { margin-top: 1.5rem; }
.cg-section-desc {
  font-size: var(--font-size-sm); color: var(--color-on-surface-variant);
  margin-bottom: 12px;
}

.cg-register-form {
  display: flex; gap: 0.75rem; align-items: flex-end;
}
.cg-register-input { flex: 1; }

.cg-loading { display: flex; justify-content: center; padding: 2rem; }
.cg-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 2rem 1rem; text-align: center;
  color: var(--color-on-surface-variant); font-size: var(--font-size-sm);
}

.cg-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 0.5rem;
}

.cg-item {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-DEFAULT);
  background: var(--color-surface-container-lowest);
  border: 1.5px solid var(--color-outline-variant);
  transition: box-shadow 0.18s;
}
.cg-item:hover { box-shadow: var(--shadow-md); }
.cg-item--request {
  background: var(--color-accent-container);
  border-color: var(--color-accent-200);
}

.cg-item__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--gradient-primary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cg-item__avatar--incoming {
  background: var(--gradient-accent);
}

.cg-item__info { flex: 1; min-width: 0; }
.cg-item__name {
  font-size: var(--font-size-sm); font-weight: 700;
  color: var(--color-on-surface); display: block;
}
.cg-item__status {
  font-size: var(--font-size-xs); font-weight: 600;
}
.cg-item__status--active { color: var(--color-primary-deep); }
.cg-item__status--pending { color: var(--color-accent-500); }
.cg-item__sub {
  font-size: var(--font-size-xs); color: var(--color-on-surface-variant);
}

.cg-item__remove {
  display: flex; align-items: center; gap: 0.2rem;
  padding: 0.3rem 0.6rem; border-radius: var(--radius-sm);
  background: none; border: 1.5px solid var(--color-outline-variant);
  font-size: var(--font-size-xs); font-weight: 600;
  color: var(--color-error-deep); cursor: pointer;
  transition: all 0.15s;
}
.cg-item__remove:hover {
  background: var(--color-error-container);
  border-color: var(--color-error);
}

.cg-item__req-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

.cg-req-btn {
  display: flex; align-items: center; gap: 0.15rem;
  padding: 0.35rem 0.65rem; border-radius: var(--radius-sm);
  border: 1.5px solid; font-size: var(--font-size-xs);
  font-weight: 700; cursor: pointer;
  transition: all 0.15s; background: none;
}
.cg-req-btn--accept {
  color: var(--color-primary-deep);
  border-color: var(--color-primary);
}
.cg-req-btn--accept:hover { background: var(--color-primary-soft); }
.cg-req-btn--reject {
  color: var(--color-error-deep);
  border-color: var(--color-error);
}
.cg-req-btn--reject:hover { background: var(--color-error-container); }
</style>
