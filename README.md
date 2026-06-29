# JUNG DDANDDAN · 정단땅 🤍

결혼식 전문 사회자 **정다원(정단땅)** 의 브랜드 홈페이지입니다.
HTML/CSS/JavaScript로만 만든 가벼운 정적 사이트라, 서버 없이 바로 동작합니다.
구조와 운영 방식은 자매 사이트 `bonitasnap` 과 동일한 스펙입니다.

- 도메인: **https://www.jungddanddan.com**
- 인스타그램: **https://www.instagram.com/jung_ddanddan/**

## 📁 폴더 구조

```
jungddanddan/
├─ index.html            ← 페이지 본문
├─ css/style.css         ← 디자인 (색상·폰트는 맨 위 :root 변수만 수정)
├─ js/
│  ├─ site-config.js     ← settings.json 을 못 불러올 때 쓰는 기본값(폴백)
│  └─ main.js            ← 동작 코드 (수정 불필요)
├─ content/settings.json ← ★ 실제 문구·사진·가격·Q&A 가 저장되는 곳
├─ admin/                ← 사장님용 관리자(Sveltia CMS)
├─ functions/            ← Cloudflare Pages Functions (옛 서비스워커 정리)
└─ images/uploads/       ← Git 기본 미디어 보관 폴더
```

## ⭐ 관리자 (Sveltia CMS · GitHub 로그인)

**GitHub 로그인 → 사진/문구 수정 → Publish(게시)** 만 하면 됩니다.

- 주소: **`https://www.jungddanddan.com/admin/`** (배포 후)
- 수정 후 우측 상단 **Publish** → 1~2분 뒤 사이트 자동 반영
- 모든 내용은 `content/settings.json` 에 저장되고, 사이트가 이 파일을 읽어 화면을 그립니다.
- CMS 설정/스키마: `admin/config.yml`, 편집 UI: `admin/index.html`

### 관리자에서 편집할 수 있는 것
- 🏠 기본 정보(인스타그램·카카오), 메인 배경/소개 문구
- 👤 사회자 소개, ✅ 신뢰 포인트, 🎬 포트폴리오(사진·유튜브 영상)
- 💰 사회 진행 상품·가격, 📅 예약 현황, 🤝 제휴 안내, 🧭 예약 절차, ❓ Q&A, 📩 문의 안내

## 🌐 배포 (Cloudflare Pages)

`bonitasnap` 과 동일하게 Cloudflare Pages 로 배포합니다.

1. 이 저장소를 Cloudflare Pages 프로젝트에 연결합니다. (build command: `node build.js`, output: 루트)
2. 커스텀 도메인에 `www.jungddanddan.com` (및 apex `jungddanddan.com`) 연결
3. `admin/config.yml` 의 GitHub 백엔드(`yjh940331-afk/jungddanddan`) 로 로그인하면 관리자 사용 가능

### ⚠️ 정단땅 전용으로 새로 세팅해야 하는 것
- **CMS 인증**: `admin/config.yml` 의 `base_url`(Sveltia CMS Auth Worker)에 `jungddanddan` GitHub OAuth 콜백/허용 도메인이 등록되어 있어야 합니다.
- **사진 저장소(R2)**: `media_libraries.cloudflare_r2` 의 `bucket: jungddanddan-images`, `public_url: https://media.jungddanddan.com` 은 **새 R2 버킷과 미디어 서브도메인을 만들어 연결**해야 합니다. (현재 값은 자리표시자)

## 💻 로컬 미리보기

```
python3 -m http.server 4173
```
후 브라우저에서 `http://localhost:4173` 접속. (`index.html` 더블클릭으로도 대략 확인 가능)
