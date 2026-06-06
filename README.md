<div align="center">

<img src="public/images/logo.png" alt="이음 로고" width="280" />

### 여행의 즐거움, 모두가 누릴 수 있도록

장애인·노약자·유아 동반 가족 모두를 위한 **배리어프리 여행 플래너**

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 소개

**이음**은 이동 보조기기 사용자, 시니어, 유아 동반 가족 등 다양한 여행자가 **접근성 정보를 기반으로 관광지를 검색하고 여행 일정을 계획**할 수 있는 웹 서비스입니다.

한국관광공사 API와 배리어프리 인증 데이터를 활용하여 휠체어 접근 가능 여부·엘리베이터 유무·장애인 화장실 등의 정보를 한눈에 확인하고 맞춤 추천을 받을 수 있습니다.

앱 전체가 사용자의 편의성과 직관성을 1순위로 두고 설계되어, 디지털 접근성이 낮은 사용자도 편리하게 이용할 수 있습니다.

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔍 **관광지 검색** | 키워드·지역·카테고리 필터로 관광지 탐색, 목록/지도 뷰 전환 |
| ♿ **접근성 필터** | 휠체어·유모차·엘리베이터·경사로 등 배리어프리 조건 필터링 |
| 🗺️ **지도 보기** | 카카오맵 기반 내 위치 주변 관광지 탐색 + 사이드바 상세정보 |
| 📋 **여행 일정 관리** | 여행 계획 생성·수정·삭제, 관광지를 일정에 추가하여 루트 구성 |
| 🏠 **홈 추천** | 맞춤 추천 / 부모님 동반 / 휠체어 친화 / 지역별 관광지 카드 |
| 📝 **게시판** | 여행 후기 작성 · 여행지 불편사항 제보 |
| 👤 **2단계 온보딩** | 회원가입 시 지체·시각·청각·유아동반 접근성 정보 수집 |
| ⚙️ **프로필 관리** | 닉네임·비밀번호·접근성 정보 통합 수정, 글자 크기 조절 |
| 🔐 **인메모리 인증** | Access Token을 브라우저 저장소에 두지 않는 보안 구조 |

## 🛠️ 기술 스택

### Frontend

| 분류 | 기술 |
|------|------|
| **Framework** | Vue.js 3.5 (Composition API + `<script setup>`) |
| **Build** | Vite 8 |
| **Styling** | Tailwind CSS 4 + CSS 변수 기반 디자인 시스템 |
| **상태 관리** | Pinia 3 |
| **라우팅** | Vue Router 4 |
| **HTTP** | Axios (인메모리 토큰 + httpOnly 쿠키 기반 인터셉터) |
| **지도** | 카카오맵 JavaScript SDK |
| **폰트** | Pretendard Variable, Material Symbols Outlined |
| **D&D** | vuedraggable (일정 순서 변경) |

### 디자인 시스템

- **어스톤(Earth-tone) 팔레트** — 부드러운 세이지 그린 / 틸 / 골드 기반
- 심플 모드 전용 UI (큰 터치 타겟, 큰 폰트)
- 접근성 우선 설계 (WCAG 2.1 AA 이상)

## 📁 프로젝트 구조

```
src/
├── api/                  # API 클라이언트 + Mock 데이터
│   ├── client.js         #   Axios 인스턴스 (인메모리 토큰 인터셉터)
│   ├── tokenStore.js     #   Access Token 메모리 홀더 (Vue ref)
│   ├── authApi.js        #   인증 API (login, signup, logout, refresh, checkId, 사용자 정보)
│   ├── scheduleApi.js    #   일정·노드·엣지 API
│   ├── tripApi.js        #   관광지 검색·필터 API
│   ├── recommendationApi.js  # 추천 API
│   ├── reviewApi.js        #   여행 후기 API
│   └── mock/             #   Mock API (오프라인 개발용)
├── assets/styles/        # 글로벌 CSS (디자인 시스템 토큰)
├── components/
│   ├── common/           #   BaseButton, BaseInput, BaseCard, ToastContainer 등
│   ├── attraction/       #   AttractionCard
│   ├── map/              #   KakaoMap
│   └── trip/             #   TripCard 등
├── composables/          # Vue Composables
│   ├── useKakaoMap.js    #   카카오맵 초기화·마커 관리
│   ├── useToast.js       #   토스트 알림
│   ├── useAccessibility.js   # 스크린 리더·포커스 트랩
│   ├── useResponsive.js  #   반응형 감지
│   └── useVoiceInput.js  #   음성 입력
├── constants/            # 상수 정의
│   ├── enums.js          #   DB 매핑 상수 (USER_DETAIL_FIELDS 등)
│   ├── accessibility.js  #   접근성 상태/카테고리 상수
│   ├── errorCodes.js     #   API 에러 코드
│   ├── categories.js     #   관광지 카테고리
│   └── regions.js        #   지역 코드
├── layouts/              # DefaultLayout, AuthLayout
├── pages/
│   ├── HomePage.vue      #   메인 (검색 + 추천 섹션)
│   ├── RecommendPage.vue #   관광지 탐색 (목록/지도 뷰)
│   ├── AttractionDetailPage.vue  # 관광지 상세
│   ├── MyPage.vue        #   내 여행 일정 관리
│   ├── TripDetailPage.vue #  여행 상세 보기
│   ├── NodeEditorPage.vue #  일정 노드 편집
│   ├── ProfilePage.vue   #   마이페이지 (정보 수정 + 설정)
│   ├── BoardWritePage.vue #  게시글 작성
│   ├── LoginPage.vue     #   로그인/회원가입 (1단계)
│   └── OnboardingPage.vue #  접근성 정보 입력 (2단계) → 가입 완료
├── router/               # Vue Router 설정 + 네비게이션 가드
├── stores/
│   ├── authStore.js      #   인증·프로필 (인메모리 토큰)
│   ├── scheduleStore.js  #   여행 일정 CRUD
│   ├── tripStore.js      #   관광지 상태 관리
│   ├── recommendationStore.js  # 추천 상태
│   └── themeStore.js     #   심플 모드·글자 크기
└── main.js               # 앱 엔트리 (세션 복원 → 마운트)
```

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **npm** 9 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/Modu-org/frontend.git
cd frontend

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.development

# 4. 개발 서버 실행
npm run dev
```

### 환경 변수

`.env.example`을 참고하여 `.env.development` 파일을 생성하세요.

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 | `/api` (Vite 프록시) |
| `VITE_KAKAO_MAP_KEY` | 카카오맵 JavaScript API 키 | — |
| `VITE_USE_MOCK` | Mock 데이터 사용 여부 | `false` |

> **참고**: 개발 시 Vite 프록시(`vite.config.js`)가 `/api` 요청을 백엔드로 전달하므로 CORS 문제가 발생하지 않습니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🔐 인증 구조

**인메모리 토큰** 방식으로 보안을 극대화합니다.

```
┌─────────────┐    ┌───────────────┐    ┌──────────────┐
│  tokenStore  │◄───│   authStore   │───►│   authApi    │
│  (Vue ref)   │    │  (Pinia)      │    │  (Axios)     │
│              │    │               │    │              │
│ accessToken  │◄───│ login/signup  │    │ POST /login  │
│ (메모리 only)│    │ logout        │    │ POST /signup │
│              │    │ tryRestore    │    │ POST /refresh│
└──────┬───────┘    └───────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐
│  client.js   │  ← 매 요청 시 Authorization 헤더 자동 첨부
│ 인터셉터     │  ← 401 시 /auth/refresh 시도 (httpOnly 쿠키)
└──────────────┘
```

- **Access Token**: JavaScript `ref()` 변수에만 존재 — localStorage·cookie 저장 없음
- **Refresh Token**: 서버가 httpOnly 쿠키로 관리 — 프론트에서 접근 불가
- **앱 시작 시**: `tryRestoreSession()`으로 refresh 시도 → 성공하면 자동 로그인

## 🌐 페이지 접근 권한

| 페이지 | 비로그인 | 로그인 |
|--------|:--------:|:------:|
| 홈 (`/`) | ✅ | ✅ |
| 관광지 탐색 (`/recommend`) | ✅ | ✅ |
| 관광지 상세 (`/attraction/:id`) | ✅ | ✅ |
| 내 여행 (`/mypage`) | ❌ → 로그인 | ✅ |
| 마이페이지 (`/profile`) | ❌ → 로그인 | ✅ |
| 게시글 작성 (`/board/write`) | ❌ → 로그인 | ✅ |
| 온보딩 (`/onboarding`) | ✅ (회원가입 2단계) | — |

## 🤝 기여하기

1. Fork 후 feature 브랜치 생성 (`git checkout -b feat/amazing-feature`)
2. 변경사항 커밋 (`git commit -m 'feat: 멋진 기능 추가'`)
3. 브랜치에 Push (`git push origin feat/amazing-feature`)
4. Pull Request 생성

---

<div align="center">

**이음** · 모두의 여행을 잇다

</div>
