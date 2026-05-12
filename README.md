<div align="center">

<img src="public/images/logo.png" alt="모두의 여행 로고" width="280" />

### 여행의 즐거움, 모두가 누릴 수 있도록

장애인과 비장애인 모두를 위한 **배리어프리 여행 계획** 서비스

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 소개

**모두의 여행**은 이동 보조기기 사용자, 시니어, 유아 동반 가족 등 다양한 여행자가 **접근성 정보를 기반으로 관광지를 검색하고 여행 일정을 계획**할 수 있는 웹 서비스입니다.

한국관광공사 API와 배리어프리 인증 데이터를 활용하여, 휠체어 접근 가능 여부·엘리베이터 유무·장애인 화장실 등의 정보를 한눈에 확인하고 맞춤 추천을 받을 수 있습니다.

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔍 **관광지 검색** | 키워드·지역·카테고리 필터로 관광지 탐색, 목록/지도 뷰 전환 |
| ♿ **접근성 필터** | 휠체어·유모차·엘리베이터·경사로 등 배리어프리 조건 필터링 |
| 🗺️ **지도 보기** | 카카오맵 기반 내 위치 주변 관광지 탐색 + 사이드바 상세정보 |
| 📋 **여행 일정 관리** | 여행 계획 생성·수정·삭제, 관광지를 일정에 추가하여 루트 구성 |
| 🏠 **홈 추천 섹션** | 맞춤 추천 / 부모님 동반 / 휠체어 친화 / 지역별 관광지 스와이퍼 |
| 📝 **게시판** | 여행지 추천·불편사항 제보·건의사항 등 카테고리별 게시글 작성 |
| 👤 **온보딩** | 이동 보조기기·연령대·여행 유형 프로필 설정 (스킵 가능) |
| ⚙️ **접근성 설정** | 간편 모드(큰 글씨/버튼), 글자 크기 조절, 고대비 모드 |

## 🛠️ 기술 스택

### Frontend
- **Framework**: Vue.js 3.5 (Composition API + `<script setup>`)
- **Build**: Vite 8
- **Styling**: Tailwind CSS 4 + CSS 변수 기반 디자인 시스템
- **상태 관리**: Pinia 3
- **라우팅**: Vue Router 4
- **HTTP**: Axios (쿠키 기반 인증 인터셉터)
- **지도**: 카카오맵 JavaScript SDK
- **폰트**: Pretendard Variable, Material Symbols Outlined
- **D&D**: vuedraggable (일정 순서 변경)

### 디자인 시스템
- **Luminous Inclusion** — Material 3 Surface 계층 기반
- 접근성 우선 설계 (WCAG 2.1 AAA 목표)
- Sunlight Shadow, Ghost Border, No-Line 원칙

## 📁 프로젝트 구조

```
src/
├── api/                  # API 클라이언트 + Mock 데이터
│   ├── client.js         #   Axios 인스턴스 (쿠키 인터셉터)
│   ├── mock/             #   Mock API (백엔드 미연동 시 사용)
│   ├── authApi.js
│   ├── tripApi.js
│   └── userApi.js
├── assets/styles/        # 글로벌 CSS (디자인 시스템 토큰)
├── components/           # 재사용 가능한 컴포넌트
│   ├── common/           #   BaseButton, BaseInput, BaseCard 등
│   ├── attraction/       #   AttractionCard
│   └── map/              #   KakaoMap
├── composables/          # Vue Composables (useKakaoMap 등)
├── layouts/              # DefaultLayout, AuthLayout
├── pages/                # 라우트별 페이지 컴포넌트
│   ├── HomePage.vue      #   메인 (검색 + 추천 섹션)
│   ├── RecommendPage.vue #   관광지 탐색 (목록/지도)
│   ├── AttractionDetailPage.vue  # 관광지 상세
│   ├── MyPage.vue        #   내 여행 일정 관리
│   ├── ProfilePage.vue   #   마이페이지 (표시 설정)
│   ├── BoardWritePage.vue #  게시글 작성
│   ├── LoginPage.vue     #   로그인/회원가입
│   └── OnboardingPage.vue #  프로필 온보딩
├── router/               # Vue Router 설정 + 네비게이션 가드
├── stores/               # Pinia 상태 관리
│   ├── userStore.js      #   인증/프로필
│   ├── tripStore.js      #   여행 일정 CRUD
│   └── themeStore.js     #   테마/접근성 설정
└── main.js               # 앱 엔트리포인트
```

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **npm** 9 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/modu-trip-front.git
cd modu-trip-front

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
| `VITE_API_BASE_URL` | 백엔드 API 서버 주소 | `http://localhost:8080/api` |
| `VITE_KAKAO_MAP_KEY` | 카카오맵 JavaScript API 키 | — |
| `VITE_USE_MOCK` | Mock 데이터 사용 여부 | `true` |

> **참고**: `VITE_USE_MOCK=true`로 설정하면 백엔드 서버 없이도 더미 데이터로 모든 기능을 테스트할 수 있습니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🔐 인증 방식

백엔드 연동 전까지는 **쿠키 + localStorage** 이중 저장 방식으로 인증 상태를 유지합니다.

- 로그인/회원가입 시 JWT 토큰을 쿠키와 localStorage에 동시 저장
- Axios 인터셉터가 매 요청마다 쿠키에서 토큰을 읽어 `Authorization` 헤더에 자동 첨부
- 401 응답 시 Refresh Token으로 자동 갱신, 실패하면 로그아웃 처리

## 🌐 페이지 접근 권한

| 페이지 | 비로그인 | 로그인 |
|--------|:--------:|:------:|
| 홈 (/) | ✅ | ✅ |
| 관광지 탐색 (/recommend) | ✅ | ✅ |
| 관광지 상세 (/attraction/:id) | ✅ | ✅ |
| 내 여행 (/mypage) | ❌ → 로그인 유도 | ✅ |
| 마이페이지 (/profile) | ❌ → 로그인 유도 | ✅ |
| 게시글 작성 (/board/write) | ❌ → 로그인 유도 | ✅ |

## 🤝 기여하기

1. Fork 후 feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
2. 변경사항 커밋 (`git commit -m 'feat: 멋진 기능 추가'`)
3. 브랜치에 Push (`git push origin feature/amazing-feature`)
4. Pull Request 생성

---

<div align="center">

**모두의 여행** · Trip for Everyone

</div>
