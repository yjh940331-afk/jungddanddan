# MOOD BY · 무드바이 🤍

결혼식 사회자 에이전시 **무드바이(MOOD BY)** 브랜드 홈페이지입니다.
모회사 **무드컴퍼니**의 서브브랜드 — 무드바이(에이전시) / 무드랩(아카데미) / 무드온(스피치) 중 무드바이+무드랩을 담습니다.
HTML/CSS/JavaScript로만 만든 가벼운 정적 사이트라, 서버 없이 바로 동작합니다. 운영 스펙은 자매 사이트 `bonitasnap` 과 동일합니다.

- 슬로건: **mood by your story**
- 인스타그램: https://www.instagram.com/jung_ddanddan/
- 도메인: 확정 전 (후보: `moodby.kr` / `jungddanddan.com`) — repo 이름과 도메인은 별개

## 📁 폴더 구조

```
jungddanddan/
├─ index.html            ← 페이지 본문(패널형 섹션)
├─ css/style.css         ← 디자인 (색상·폰트는 맨 위 :root 변수만 수정)
├─ js/
│  ├─ site-config.js     ← settings.json 을 못 불러올 때 쓰는 기본값(폴백)
│  └─ main.js            ← 동작 코드 (수정 불필요)
├─ content/settings.json ← ★ 실제 문구·사회자 명단·가격·아카데미·Q&A
├─ admin/                ← 관리자(Sveltia CMS)
├─ functions/            ← Cloudflare Pages Functions (옛 서비스워커 정리)
└─ images/uploads/       ← Git 기본 미디어 보관 폴더
```

## 🧭 사이트 구성 (패널형 내비)

Hero → **About**(회사소개·대표·비전/미션) → **Crew**(일하는 방식·차별점) → **MC**(사회자 명단, 무드 키워드 필터) → **Service**(진행 프로세스 10단계 + 등급별 가격표) → **Academy**(무드랩) → **Q&A** → **Contact**(고객 문의 / 사회자 지원 2갈래)

- 사회자 카드 클릭 → 라이트박스로 강점·추천 고객·진행 영상 표시
- MC 명단의 무드 키워드는 사회자 데이터에서 **필터 칩 자동 생성**

## ⭐ 관리자 (Sveltia CMS · GitHub 로그인)

- 주소: **`/admin/`** (배포 후)
- GitHub 로그인 → 사회자 명단·문구·가격 수정 → 우측 상단 **Publish** → 1~2분 뒤 반영
- 모든 내용은 `content/settings.json` 에 저장. CMS 스키마: `admin/config.yml`
- 사장님(사회자) 계정 분리 = 각자 GitHub 계정을 **자기 repo에만** 협업자로 초대

## 🌐 배포 (Cloudflare Pages)

`bonitasnap` 과 동일. 저장소를 Cloudflare Pages에 연결(build: `node build.js`, output: 루트) → 도메인 연결.

### ⚠️ 무드바이 전용으로 새로 세팅 필요
- **도메인 확정** 후 `CNAME`, `index.html` og:url, `admin/config.yml`(site_url·display_url·R2 public_url), 본 README 일괄 반영
- **CMS 인증**: `admin/config.yml` 의 `base_url`(공유 Sveltia Auth Worker) `ALLOWED_DOMAINS` 에 사이트 도메인 추가
- **사진/영상 저장소(R2)**: `bucket: jungddanddan-images`, `public_url` 은 전용 R2 버킷·미디어 서브도메인·전용 토큰을 만들어 채워야 함 (`access_key_id` 현재 자리표시자)

## 💻 로컬 미리보기

```
python3 -m http.server 4173
```
→ `http://localhost:4173`
