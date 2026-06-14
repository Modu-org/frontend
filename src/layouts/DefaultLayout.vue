<template>
  <div class="min-h-screen w-full bg-[var(--color-surface)] flex flex-col">
    <AppHeader :title="title" :show-back="showBack" />
    <main class="w-full flex-1 overflow-x-hidden">
      <!-- 전체 너비 슬롯 (배너, 히어로 이미지 등) -->
      <slot name="full-bleed" />

      <!-- 일반 콘텐츠: 모바일 px-4, 웹 md+ 200px 양측 패딩 -->
      <div
        v-if="$slots.default"
        :class="[
          noPadding ? 'px-0' : 'px-4 sm:px-8 md:px-[200px] max-w-[1920px] mx-auto w-full',
          noPadding ? '' : 'pt-6 md:pt-8'
        ]"
      >
        <slot />
      </div>

      <!-- 200px 여백 스페이서 -->
      <div class="h-[200px] w-full"></div>
    </main>

    <!-- 프리미엄 다크/글래스모피즘 푸터 -->
    <footer class="site-footer">
      <div class="footer-container">
        <div class="footer-top">
          <!-- 브랜드 로고 및 설명 -->
          <div class="footer-brand">
            <h2 class="footer-logo">
              <span class="logo-highlight">I :</span> EUM
            </h2>
            <p class="brand-slogan">모두의 여행을 잇다, 이음</p>
            <p class="brand-desc">
              장애인, 노약자, 영유아 동반 가족 등 관광약자 모두가 제약 없이 대한민국 전역을 마음껏 여행할 수 있도록 맞춤형 무장애 여행 일정 및 접근성 정보를 제공합니다.
            </p>
          </div>

          <!-- 서비스 탐색 링크 -->
          <div class="footer-links">
            <h3 class="footer-section-title">탐색</h3>
            <ul>
              <li><router-link to="/">홈으로</router-link></li>
              <li><router-link to="/attractions">관광지 검색</router-link></li>
              <li><router-link to="/schedules">내 여행 일정</router-link></li>
            </ul>
          </div>

          <!-- 약관 & 고객 정보 -->
          <div class="footer-support">
            <h3 class="footer-section-title">고객지원 & 안내</h3>
            <ul class="support-list">
              <li><router-link to="#" class="accent-link">이용약관</router-link></li>
              <li><router-link to="#" class="accent-link">개인정보처리방침</router-link></li>
              <li class="support-info">
                <span class="material-symbols-outlined icon">call</span>
                <span>고객센터: 1544-1234 <br/> <span class="call-time">(평일 09:00 - 18:00)</span></span>
              </li>
              <li class="support-info">
                <span class="material-symbols-outlined icon">mail</span>
                <span>이메일: support@ieum.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-divider"></div>

        <div class="footer-bottom">
          <div class="business-info">
            <p>공동대표: 오민석, 김한울 | 사업자등록번호: 120-00-00000 <br class="mobile-only"/> | 관광사업자등록: 제2026-00호</p>
            <p>주소: 경상북도 구미시 진미동 123-45 이음빌딩 4층 오호이얏차차 주식회사</p>
          </div>
          <p class="copyright">© 2026 I:EUM Co., Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>

    <AppBottomNav />
  </div>
</template>

<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppBottomNav from '@/components/common/AppBottomNav.vue'

defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  noPadding: { type: Boolean, default: false },
})
</script>

<style scoped>
.site-footer {
  background: linear-gradient(180deg, #1C2314 0%, #10160B 100%);
  color: #E2E8F0;
  border-top: 1px solid rgba(170, 198, 123, 0.12);
  padding: 3.5rem 0 2.5rem 0;
  font-family: var(--font-sans);
}

@media (max-width: 767px) {
  .site-footer {
    padding-bottom: calc(var(--bottom-nav-height) + 2rem);
  }

  .mobile-only {
    display: block;
  }
}

.footer-container {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .footer-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media (min-width: 768px) {
  .footer-container {
    padding-left: 200px;
    padding-right: 200px;
  }

  .mobile-only {
    display: none;
  }
}

.footer-top {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

@media (min-width: 1024px) {
  .footer-top {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 3rem;
  }
}

.footer-brand {
  flex: 2;
  max-width: 500px;
}

.footer-logo {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #FFFFFF;
}

.logo-highlight {
  color: var(--color-primary);
  font-weight: 900;
}

.brand-slogan {
  font-size: var(--font-size-sm);
  color: var(--color-primary-300);
  font-weight: 600;
  margin-top: 0.25rem;
  margin-bottom: 0.75rem;
}

.brand-desc {
  font-size: var(--font-size-xs);
  word-break: keep-all;
  color: #94A3B8;
  line-height: 1.7;
}

.footer-links {
  flex: 1;
  min-width: 140px;
}

.footer-support {
  flex: 1.5;
  min-width: 250px;
}

.footer-section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #F1F5F9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  border-bottom: 2px solid rgba(170, 198, 123, 0.25);
  padding-bottom: 0.25rem;
  display: inline-block;
}

.footer-links ul,
.footer-support ul {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
}

.footer-links a,
.footer-support a {
  font-size: var(--font-size-sm);
  color: #94A3B8;
  transition: all 0.2s ease;
  display: inline-block;
}

.footer-links a:hover,
.footer-support a:hover {
  color: var(--color-primary);
  transform: translateX(3px);
}

.accent-link {
  font-weight: 600;
}

.support-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.2;
  font-size: var(--font-size-sm);
  color: #94A3B8;
}

.support-info .icon {
  font-size: 1.15rem;
  color: var(--color-primary);
}

.footer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 2.5rem 0 1.5rem 0;
}

.footer-bottom {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .footer-bottom {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.business-info {
  font-size: 11px;
  color: #64748B;
  line-height: 1.6;
}

.business-info p {
  margin: 0;
}

.call-time {
  font-size: 16px;
}

.copyright {
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
  margin: 0;
}
</style>
