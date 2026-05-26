<template>
  <DefaultLayout :title="attraction?.name || '관광지 상세'" show-back no-padding>
    <div v-if="isLoading" class="state-wrap">
      <LoadingSpinner />
    </div>
    <div v-else-if="!attraction" class="state-wrap">
      <span class="material-symbols-outlined" style="font-size:3rem;color:var(--color-outline);">error</span>
      <p>관광지 정보를 찾을 수 없습니다.</p>
      <BaseButton @click="$router.back()">뒤로 가기</BaseButton>
    </div>

    <template v-else>
      <!-- ① Hero: 전체 너비 -->
      <div class="detail-hero">
        <img
          :src="heroSrc"
          :alt="attraction.name"
          class="detail-hero__img"
          @error="e => e.target.src = FALLBACK_IMG"
        />
        <span class="detail-hero__type-badge">{{ getContentTypeLabel(attraction.contentTypeId) }}</span>
      </div>

      <!-- ② 메인 콘텐츠: 웹에서 2컬럼 -->
      <div class="detail-body">
        <div class="detail-layout">

          <!-- 좌측 컬럼 -->
          <div class="detail-col detail-col--left">
            <!-- 이름 + 주소 -->
            <div class="detail-header">
              <h1 class="detail-header__name">{{ attraction.name }}</h1>
              <p class="detail-header__addr">
                <span class="material-symbols-outlined" style="font-size:1.1em;">location_on</span>
                {{ attraction.address }}{{ attraction.addressDetail ? ` ${attraction.addressDetail}` : '' }}
              </p>
              <div v-if="attraction.tel || attraction.homepage" class="detail-header__contacts">
                <a v-if="attraction.tel" :href="`tel:${attraction.tel}`" class="contact-link">
                  <span class="material-symbols-outlined">call</span>{{ attraction.tel }}
                </a>
                <a v-if="attraction.homepage" :href="extractUrl(attraction.homepage)" target="_blank" rel="noopener" class="contact-link">
                  <span class="material-symbols-outlined">language</span>홈페이지
                </a>
              </div>
            </div>

            <!-- 접근성 -->
            <section v-if="groupedAccessibility.length" class="detail-section">
              <h2 class="detail-section__title">
                <span class="material-symbols-outlined">accessible_forward</span>접근성 정보
              </h2>
              <div class="acc-list">
                <div v-for="group in groupedAccessibility" :key="group.category" class="acc-item">
                  <span :class="['acc-badge', `acc-badge--${group.displayStatus.toLowerCase()}`]">
                    <span class="material-symbols-outlined acc-badge__icon">{{ ACC_CATEGORY_ICON[group.category] || 'info' }}</span>
                    <span class="acc-badge__label">{{ ACC_CATEGORY_LABEL[group.category] || group.category }}</span>
                    <span v-if="!group.hasDescriptions" class="acc-badge__status">정보 없음</span>
                  </span>
                  <ul v-if="group.hasDescriptions" class="acc-item__descs">
                    <li v-for="item in group.itemsWithDesc" :key="item.type" class="acc-item__desc">
                      <span :class="['acc-dot', `acc-dot--${item.status.toLowerCase()}`]"></span>
                      <span>
                        <span class="acc-desc__type">{{ ACC_TYPE_LABEL[item.type] || item.type }}</span>
                        <span class="acc-desc__sep">: </span>{{ item.description }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <!-- 상세 설명 -->
            <section v-if="attraction.overview" class="detail-section">
              <h2 class="detail-section__title">
                <span class="material-symbols-outlined">article</span>상세 설명
              </h2>
              <p class="detail-overview">{{ attraction.overview }}</p>
            </section>
          </div>

          <!-- 우측 컬럼 -->
          <div class="detail-col detail-col--right">
            <!-- 일정에 추가 CTA -->
            <div class="detail-cta">
              <BaseButton full-width size="lg" variant="accent" @click="handleAddSchedule">
                <span class="material-symbols-outlined">add_circle</span>일정에 추가
              </BaseButton>
            </div>

            <!-- 지도 -->
            <section v-if="attraction.latitude && attraction.longitude" class="detail-section">
              <h2 class="detail-section__title">
                <span class="material-symbols-outlined">map</span>위치
              </h2>
              <div ref="mapRef" class="kakao-map"></div>
            </section>

            <!-- 게시글 (여행 후기 + 별점) -->
            <section class="detail-board">
              <div class="board-header">
                <h2 class="detail-section__title" style="margin-bottom:0;">
                  <span class="material-symbols-outlined">rate_review</span>여행 후기
                </h2>
              </div>

              <!-- 작성 폼 -->
              <div v-if="authStore.isAuthenticated" class="board-write">
                <!-- 별점 -->
                <div class="star-row">
                  <button
                    v-for="s in 5" :key="s"
                    :class="['star-btn', { 'star-btn--active': s <= postForm.rate }]"
                    @click="postForm.rate = s"
                    :aria-label="`${s}점`"
                  >★</button>
                  <span class="star-label">{{ postForm.rate ? `${postForm.rate}점` : '별점 선택' }}</span>
                </div>
                <textarea
                  v-model="postForm.content"
                  class="board-write__textarea"
                  placeholder="여행 후기를 작성해주세요."
                  rows="3"
                ></textarea>
                <div class="board-write__footer">
                  <label class="privacy-toggle">
                    <input v-model="postForm.isPrivate" type="checkbox" />
                    <span class="privacy-toggle__label">
                      <span class="material-symbols-outlined" style="font-size:1rem;">{{ postForm.isPrivate ? 'lock' : 'lock_open' }}</span>
                      {{ postForm.isPrivate ? '비밀글' : '공개글' }}
                    </span>
                  </label>
                  <BaseButton size="sm" :loading="isPosting" @click="submitPost">등록</BaseButton>
                </div>
              </div>
              <div v-else class="board-login-prompt">
                <BaseButton variant="outline" size="sm" @click="goLogin">로그인하고 후기 작성하기</BaseButton>
              </div>

              <!-- 후기 목록 -->
              <div v-if="isPostLoading" class="board-list-loading"><LoadingSpinner /></div>
              <div v-else-if="filteredPosts.length === 0" class="board-empty">아직 작성된 후기가 없습니다.</div>
              <ul v-else class="board-list">
                <li v-for="post in visiblePosts" :key="post.postId" class="board-list__item">
                  <div class="board-list__meta">
                    <span class="board-list__nick">{{ post.nickname }}</span>
                    <span class="board-list__stars" v-if="post.rate">
                      <span v-for="s in 5" :key="s" :class="['star-icon', s <= post.rate ? 'star-icon--on' : '']">★</span>
                    </span>
                    <span class="board-list__date">{{ formatDate(post.createdAt) }}</span>
                    <span v-if="post.isPrivate" class="board-list__private">
                      <span class="material-symbols-outlined" style="font-size:0.9rem;">lock</span>비밀글
                    </span>
                  </div>
                  <p class="board-list__content">{{ post.content }}</p>
                </li>
              </ul>
              <button v-if="filteredPosts.length > visibleCount" class="board-more-btn" @click="visibleCount += 5">더보기</button>
            </section>
          </div>

        </div>
      </div>
    </template>

    <!-- AI FAB -->
    <button v-if="attraction" :class="['ai-fab', { 'ai-fab--loading': isAiLoading }]" aria-label="AI 음성 안내" @click="handleAiExplain">
      <span class="material-symbols-outlined" style="font-size:1.6rem;">{{ isAiLoading ? 'hourglass_top' : 'record_voice_over' }}</span>
    </button>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { attractionApi, postApi } from '@/api/attractionApi'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { CONTENT_TYPE_MAP } from '@/constants/enums'

const FALLBACK_IMG = 'https://placehold.co/800x450/DCE8C7/6F8F4E?text=No+Image'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const ACC_CATEGORY_LABEL = { PHYSICAL: '지체장애·노약자', VISUAL: '시각장애', HEARING: '청각장애', INFANT_FAMILY: '유모차 동반' }
const ACC_CATEGORY_ICON  = { PHYSICAL: 'accessible_forward', VISUAL: 'visibility', HEARING: 'hearing', INFANT_FAMILY: 'stroller' }
const ACC_TYPE_LABEL = {
  PARKING:'주차장', ACCESSIBLE_PARKING:'장애인 주차장', PUBLIC_TRANSPORT:'대중교통 접근성',
  ROUTE:'관광지 경사로', TICKET_OFFICE:'매표소 접근', WHEELCHAIR:'휠체어 대여',
  EXIT:'출입구 구조', ELEVATOR:'엘리베이터', RESTROOM:'화장실',
  ACCESSIBLE_RESTROOM:'장애인 화장실', AUDITORIUM:'관람석 접근성', ROOM:'객실 접근성',
  BRAILLE_BLOCK:'점자 블록', HELP_DOG:'보조견 동반', GUIDE_HUMAN:'안내 요원',
  AUDIO_GUIDE:'음성 안내', BIG_PRINT:'큰 글씨 안내판', BRAILLE_PROMOTION:'점자 안내문',
  GUIDE_SYSTEM:'가이드 제공', SIGN_GUIDE:'수어 안내', VIDEO_GUIDE:'자막 안내',
  STROLLER:'유모차 가능', LACTATION_ROOM:'수유실', BABY_SPARE_CHAIR:'유아용 의자',
  KIDS_FACILITY:'유아시설', PET:'애완동물 동반', ETC:'기타',
}
const STATUS_PRIORITY = { UNAVAILABLE:0, NEED_CHECK:1, PARTIAL:2, UNKNOWN:3, AVAILABLE:4 }

const attraction = ref(null)
const isLoading = ref(true)
const isAiLoading = ref(false)
const mapRef = ref(null)

const posts = ref([])
const isPostLoading = ref(false)
const isPosting = ref(false)
const visibleCount = ref(5)
const postForm = ref({ content: '', rate: 0, isPrivate: false })

const heroSrc = computed(() => attraction.value?.firstImageUrl || attraction.value?.thumbnailImageUrl || FALLBACK_IMG)

const groupedAccessibility = computed(() => {
  const arr = attraction.value?.accessibility || []
  const map = {}
  arr.forEach(item => {
    const cat = item.category
    if (!map[cat]) map[cat] = { category: cat, items: [], itemsWithDesc: [], hasDescriptions: false, displayStatus: 'UNKNOWN' }
    map[cat].items.push(item)
    if (item.description?.trim()) {
      map[cat].itemsWithDesc.push(item)
      map[cat].hasDescriptions = true
      if ((STATUS_PRIORITY[item.status] ?? 3) > (STATUS_PRIORITY[map[cat].displayStatus] ?? 3)) {
        map[cat].displayStatus = item.status
      }
    }
  })
  return Object.values(map)
})

const filteredPosts = computed(() =>
  posts.value.filter(p => !p.isPrivate || p.authorId === authStore.user?.userId || authStore.isAdmin)
)
const visiblePosts = computed(() => filteredPosts.value.slice(0, visibleCount.value))

// 카카오맵
async function loadKakaoMapScript() {
  return new Promise(resolve => {
    if (window.kakao?.maps) { window.kakao.maps.load(resolve); return }
    const key = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!key) { console.error('[kakao] VITE_KAKAO_MAP_KEY 없음'); resolve(); return }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
    script.onload = () => window.kakao.maps.load(resolve)
    script.onerror = () => { console.error('[kakao] SDK 로드 실패'); resolve() }
    document.head.appendChild(script)
  })
}

function initKakaoMap() {
  if (!window.kakao?.maps) { console.warn('[kakao] SDK 없음'); return }
  if (!mapRef.value) { console.warn('[kakao] mapRef 없음'); return }
  const lat = Number(attraction.value.latitude)
  const lng = Number(attraction.value.longitude)
  console.log('[kakao] 좌표:', lat, lng)
  if (!lat || !lng) {
    console.warn('[kakao] 유효한 좌표 없음 →', { latitude: attraction.value.latitude, longitude: attraction.value.longitude })
    return
  }
  const coords = new window.kakao.maps.LatLng(lat, lng)
  const map = new window.kakao.maps.Map(mapRef.value, { center: coords, level: 4 })
  new window.kakao.maps.Marker({ map, position: coords, title: attraction.value.name })
  setTimeout(() => map.relayout(), 150)
  setTimeout(() => { map.relayout(); map.setCenter(coords) }, 500)
  setTimeout(() => { map.relayout(); map.setCenter(coords) }, 1000)
}

onMounted(async () => {
  const id = route.params.id
  try {
    const { data: res } = await attractionApi.getDetail(id)
    attraction.value = res.data
    console.log('[detail] latitude:', res.data?.latitude, 'longitude:', res.data?.longitude)
    await loadPosts()
    await loadKakaoMapScript()
  } catch (err) {
    console.error('[detail] 오류:', err)
    if (err?.response?.data?.errorCode === 'ATTRACTION_NOT_FOUND') attraction.value = null
    else showToast('관광지 정보를 불러오지 못했습니다.', 'error')
  } finally {
    // isLoading을 먼저 false로 → 지도 div가 DOM에 렌더링됨
    isLoading.value = false
  }

  // isLoading=false 후 DOM이 완전히 그려진 다음 지도 초기화
  await nextTick()
  initKakaoMap()
})

async function loadPosts() {
  if (!attraction.value) return
  isPostLoading.value = true
  try {
    const { data: res } = await postApi.getList({ attractionId: attraction.value.attractionId, page: 0, size: 50 })
    posts.value = res.data?.content || []
  } catch { posts.value = [] } finally { isPostLoading.value = false }
}

async function submitPost() {
  if (!postForm.value.content.trim()) { showToast('내용을 입력해주세요.', 'error'); return }
  if (!postForm.value.rate) { showToast('별점을 선택해주세요.', 'error'); return }
  isPosting.value = true
  try {
    await postApi.create({
      attractionId: attraction.value.attractionId,
      content: postForm.value.content,
      rate: postForm.value.rate,
      postType: 'TRAVEL_REVIEW',
      isPrivate: postForm.value.isPrivate ? 1 : 0,
    })
    postForm.value = { content: '', rate: 0, isPrivate: false }
    showToast('후기가 등록되었습니다.', 'success')
    await loadPosts()
  } catch { showToast('등록에 실패했습니다.', 'error') } finally { isPosting.value = false }
}

function handleAddSchedule() {
  if (!authStore.isAuthenticated) { showToast('로그인이 필요합니다.', 'error'); router.push({ name: 'Login', query: { redirect: route.fullPath } }); return }
  showToast(`${attraction.value.name}이(가) 일정에 추가되었습니다.`, 'success')
}
function goLogin() { router.push({ name: 'Login', query: { redirect: route.fullPath } }) }
async function handleAiExplain() {
  if (isAiLoading.value) return
  isAiLoading.value = true
  showToast('AI가 관광지 설명을 준비 중입니다...', 'info')
  try { await new Promise(r => setTimeout(r, 1000)); showToast('AI 음성 안내 기능이 곧 제공됩니다.', 'info') }
  finally { isAiLoading.value = false }
}
function getContentTypeLabel(id) { return CONTENT_TYPE_MAP[id]?.label || '기타' }
function extractUrl(html) { const m = html?.match(/href="([^"]+)"/); return m ? m[1] : html || '#' }
function formatDate(dt) { if (!dt) return ''; return new Date(dt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) }
</script>

<style scoped>
.state-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; gap: 1rem; text-align: center; }

/* Hero */
.detail-hero { position: relative; width: 100%; }
.detail-hero__img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; max-height: 480px; }
.detail-hero__type-badge { position: absolute; bottom: 0.75rem; right: 0.75rem; background: rgba(0,0,0,.6); color:#fff; backdrop-filter:blur(6px); font-size:var(--font-size-xs); font-weight:700; padding:0.25rem 0.625rem; border-radius:var(--radius-sm); }

/* 본문 패딩 */
.detail-body { padding: 1.25rem 1rem 0; }
@media (min-width: 768px) { .detail-body { padding: 2rem 200px 0; } }

/* 2컬럼 레이아웃 */
.detail-layout { display: flex; flex-direction: column; gap: 1.5rem; }
@media (min-width: 900px) {
  .detail-layout { flex-direction: row; align-items: flex-start; gap: 2.5rem; }
  .detail-col--left { flex: 1.4; min-width: 0; }
  .detail-col--right { flex: 1; min-width: 320px; position: sticky; top: calc(var(--header-height) + 1rem); }
}

/* Header */
.detail-header { margin-bottom: 1.25rem; }
.detail-header__name { font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-on-surface); line-height: 1.2; margin-bottom: 0.375rem; }
.detail-header__addr { display: flex; align-items: center; gap: 0.25rem; font-size: var(--font-size-sm); color: var(--color-on-surface-variant); margin-bottom: 0.5rem; }
.detail-header__contacts { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.contact-link { display: flex; align-items: center; gap: 0.25rem; font-size: var(--font-size-sm); color: var(--color-primary-deep); font-weight: 600; text-decoration: underline; }

/* Section */
.detail-section { margin-bottom: 1.5rem; }
.detail-section__title { display: flex; align-items: center; gap: 0.375rem; font-size: var(--font-size-lg); font-weight: 700; color: var(--color-on-surface); margin-bottom: 0.75rem; }
.detail-section__title .material-symbols-outlined { color: var(--color-primary); }

/* 접근성 */
.acc-list { display: flex; flex-direction: column; gap: 1rem; }
.acc-item { display: flex; flex-direction: column; gap: 0.5rem; }
.acc-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; align-self: flex-start; }
.acc-badge--available { background: var(--color-primary-soft); color: var(--color-primary-deep); }
.acc-badge--unavailable { background: #FFE3DA; color: #D85739; }
.acc-badge--partial { background: #FFF8EA; color: #F3A92A; border: 1px solid #FFE1A0; }
.acc-badge--unknown { background: var(--color-surface-container-high); color: var(--color-on-surface-variant); }
.acc-badge--need_check { background: #FFF0CC; color: #B07800; }
.acc-badge__icon { font-size: 1.1rem; }
.acc-badge__status { font-size: var(--font-size-xs); font-weight: 400; opacity: 0.8; }
.acc-item__descs { margin: 0; padding: 0 0 0 0.5rem; list-style: none; display: flex; flex-direction: column; gap: 0.375rem; }
.acc-item__desc { display: flex; align-items: flex-start; gap: 0.5rem; font-size: var(--font-size-sm); color: var(--color-on-surface); line-height: 1.55; }
.acc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 0.42rem; }
.acc-dot--available { background: var(--color-primary); }
.acc-dot--unavailable { background: #D85739; }
.acc-dot--partial { background: #F3A92A; }
.acc-dot--unknown { background: var(--color-outline); }
.acc-dot--need_check { background: #B07800; }
.acc-desc__type { font-weight: 700; }
.acc-desc__sep { color: var(--color-outline); }

/* Overview */
.detail-overview { background: var(--color-surface-container-lowest); border: 1.5px solid var(--color-outline-variant); border-radius: var(--radius-DEFAULT); padding: 1.25rem; font-size: var(--font-size-sm); line-height: 1.75; color: var(--color-on-surface); }

/* CTA */
.detail-cta { margin-bottom: 1.5rem; }

/* 카카오맵 */
.kakao-map { width: 100%; height: 240px; border-radius: var(--radius-DEFAULT); overflow: hidden; border: 1.5px solid var(--color-outline-variant); display: block; }

/* 게시판 */
.detail-board { background: var(--color-surface-container-lowest); border: 1.5px solid var(--color-outline-variant); border-radius: var(--radius-DEFAULT); overflow: hidden; margin-bottom: 5rem; }
.board-header { padding: 1rem 1rem 0; }
.board-write { padding: 1rem; border-bottom: 1.5px solid var(--color-outline-variant); }

/* 별점 */
.star-row { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.75rem; }
.star-btn { background: none; border: none; font-size: 1.75rem; cursor: pointer; color: var(--color-outline); transition: color 0.15s, transform 0.1s; padding: 0; line-height: 1; }
.star-btn:hover, .star-btn--active { color: var(--color-accent); }
.star-btn:hover { transform: scale(1.15); }
.star-label { font-size: var(--font-size-sm); color: var(--color-on-surface-variant); margin-left: 0.25rem; }

.board-write__textarea { width: 100%; box-sizing: border-box; padding: 0.75rem; border-radius: var(--radius-DEFAULT); border: 1.5px solid var(--color-outline-variant); background: var(--color-background); font-size: var(--font-size-sm); color: var(--color-on-surface); resize: none; font-family: inherit; outline: none; transition: border-color 0.18s; margin-bottom: 0.5rem; }
.board-write__textarea:focus { border-color: var(--color-primary); }
.board-write__footer { display: flex; justify-content: space-between; align-items: center; }
.privacy-toggle { display: flex; align-items: center; gap: 0.25rem; cursor: pointer; }
.privacy-toggle input { accent-color: var(--color-primary); }
.privacy-toggle__label { display: flex; align-items: center; gap: 0.25rem; font-size: var(--font-size-sm); color: var(--color-on-surface-variant); }

.board-login-prompt { padding: 1rem; text-align: center; border-bottom: 1.5px solid var(--color-outline-variant); }
.board-list-loading { padding: 2rem; display: flex; justify-content: center; }
.board-empty { padding: 2rem; text-align: center; font-size: var(--font-size-sm); color: var(--color-on-surface-variant); }
.board-list { list-style: none; margin: 0; padding: 0; }
.board-list__item { padding: 0.875rem 1rem; border-bottom: 1px solid var(--color-outline-variant); }
.board-list__item:last-child { border-bottom: none; }
.board-list__meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem; flex-wrap: wrap; }
.board-list__nick { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface); }
.board-list__stars { display: flex; gap: 1px; }
.star-icon { font-size: 0.9rem; color: var(--color-outline); }
.star-icon--on { color: var(--color-accent); }
.board-list__date { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); }
.board-list__private { display: flex; align-items: center; gap: 0.125rem; font-size: var(--font-size-xs); color: var(--color-outline); }
.board-list__content { font-size: var(--font-size-sm); color: var(--color-on-surface); line-height: 1.6; white-space: pre-wrap; }
.board-more-btn { width: 100%; padding: 0.75rem; background: none; border: none; border-top: 1px solid var(--color-outline-variant); font-size: var(--font-size-sm); color: var(--color-primary-deep); font-weight: 600; cursor: pointer; }

/* AI FAB */
.ai-fab { position: fixed; bottom: calc(var(--bottom-nav-height) + 1.25rem); right: 1.25rem; width: 56px; height: 56px; border-radius: 50%; border: none; background: var(--color-accent); color: var(--color-on-accent); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 40; transition: all 0.18s; box-shadow: 0 4px 12px rgba(0,0,0,.15); }
.ai-fab:hover { transform: scale(1.07); }
.ai-fab:active { transform: scale(0.95); }
.ai-fab--loading { opacity: 0.7; cursor: wait; }
</style>
