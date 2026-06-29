# 무드바이(MOOD BY) 프로젝트 핸드오프 — for Codex

> 이 문서는 작업 이관용 정리본입니다. 2026-06-29 기준. 이 repo만 보고 이어서 작업할 수 있게 정리했습니다.

## 0. 한 줄 요약
결혼식 사회자 **에이전시** 브랜드 **무드바이(MOOD BY)** 홈페이지. 순수 정적 사이트(HTML/CSS/JS) + Sveltia CMS 관리자 + Cloudflare Pages/R2. 인프라는 완료된 것으로 전달받았고, 현재는 **브랜드 UI 고급화·콘텐츠 채움** 단계.

## 1. 브랜드/주체
- 모회사 **무드컴퍼니(mood company)** → 서브브랜드 3개: 💍무드바이(웨딩 사회자 에이전시·이 사이트) / 🎤무드랩(사회자 아카데미·사이트 내 Academy 섹션) / 🎙️무드온(스피치·기업교육, **이 사이트 범위 밖**).
- 대표 **정다원**(무드컴퍼니 대표 + 소속 사회자 "다원🍊"). 인스타 `jung_ddanddan`.
- 슬로건 **"mood by your story" / "Color your wedding mood."**
- 컨셉: 에이전시=큰 팔레트, 사회자=각자의 색. 직함(아나운서 등)이 아니라 **"무드(분위기)로 사회자를 매칭"**. 경쟁사(neulbom2020.com, annport.com)의 경력·숫자 신뢰 어필과 반대로 **친근·따뜻·감성** 차별화.
- 개발자/오너: 양준혁(yjh940331@gmail.com), GitHub `yjh940331-afk`.

## 2. 도메인 (확정)
- **moodby.kr** — 2026-06-29 가비아(Gabia)에서 구매 완료(16,500원). 결제 완료.
- 코드 전반 이미 moodby.kr로 반영됨: `CNAME`=moodby.kr, `admin/config.yml` site_url/display_url=https://moodby.kr, R2 public_url=https://media.moodby.kr, og:url 등.
- repo 이름은 `jungddanddan`이지만 도메인/브랜드는 무드바이 — **별개. repo 이름은 그대로 둬도 됨.**

## 3. 기술 스택 / 아키텍처
- **빌드 없음**(정적). `build.js`는 Cloudflare Pages 배포 시 `index.html`의 `?v=` 캐시버스터를 커밋 해시로 교체(없어도 동작).
- **SPA식 패널 네비**: `index.html`의 각 `section.content-panel[data-panel]`이 패널. 나브 클릭 시 해당 패널만 표시+스크롤(`js/main.js`의 activatePanel/showHome). 히어로는 홈.
- **데이터 주도 렌더**: 화면 내용은 전부 `content/settings.json` → `js/main.js`가 읽어 DOM 생성. `js/site-config.js`는 settings.json 로드 실패 시 폴백 기본값.
- **CMS**: `/admin/` = Sveltia CMS(Decap 호환). GitHub 백엔드. 스키마 `admin/config.yml`, 편집 UI `admin/index.html`. 저장→Publish→커밋→사이트 반영.
- **미디어**: 소량은 repo `images/`(현재 히어로 `images/moodby-hero-luxe.jpg`, OG `images/moodby-og-luxe.jpg`, 팔레트 `images/moodby-palette-luxe.jpg`, 홈 갤러리 이미지들), 대용량 원본은 Cloudflare R2.
- **Cloudflare Pages Functions**: `functions/_middleware.js` = 옛 서비스워커 자폭 + `/fix`,`/reset` 복구 페이지. `sw.js`/`service-worker.js`/`serviceworker.js` = kill-switch.

## 4. 파일 맵 (어디를 고치면 뭐가 바뀌나)
- `index.html` — 섹션 마크업/나브. 섹션 순서: Hero → About(회사소개+팔레트+대표소개+비전/미션) → Crew(일하는방식·차별점) → MC(사회자 명단) → Service(진행 프로세스+가격표) → Academy(무드랩) → Q&A → Contact(고객/사회자지원 2갈래) → Footer. 라이트박스 #lightbox.
- `css/style.css` — 최상단 스켈레톤 뒤, 파일 하단 "MOOD BY · 럭셔리 팔레트 업그레이드"가 실제 최종 스타일. 메인 컬러는 `--bg:#FFF8F2`, `--ink:#4E3D34`. 사회자별 색은 카드의 CSS 변수 `--mc-c`.
- `js/main.js` — 렌더러 전부. 핵심: SEO/OG 메타 갱신, 홈 에디토리얼 갤러리/숫자/마퀴 렌더, 히어로 형용사 로테이터+떠오르는 무드 단어, 팔레트 섹션/사회자 컬러 시그니처, MC 카드+무드 필터+상세 라이트박스(openMc), 가격표, 아카데미, 스크롤 진행바/카운터/카드 틸트. `PALETTE` 폴백색 배열.
- `js/site-config.js` — 폴백 기본값(구조는 settings.json과 동일).
- `content/settings.json` — **실제 콘텐츠.** 아래 5절.
- `admin/config.yml` — CMS 스키마(필드). settings.json 구조와 1:1. R2/도메인 설정도 여기.

## 5. content/settings.json 구조 (요약)
`brand`, `company`, `seo{title,description,image}`, `mcPrefix`("무드바이"), `instagram`, `kakao`(빈값),
`hero{image, words[](형용사 로테이션), tagline, sub}`,
`home{eyebrow,title,body,palette{},stats[],gallery[],marquee[]}` — 홈 팔레트/에디토리얼 섹션/숫자/흐르는 무드 단어,
`about{title, body, fit[]}`, `ceo{title,role,image,body}`, `vision{vision[],mission,promises[]}`,
`crew{lead, ways[]{icon,title,text}, diffs[]}`,
`mcs[]{name, emoji, color(hex), keywords[], strength, recommend, image, youtube, review}` — **현재 10명**(다원🍊 지후🪽 소담🌳 세미🩷 빛나🌊 이진🕊️ 예지🎀 예지⚡️ 유선🍎 연주🔮), strength/recommend는 채워짐, **image/youtube/review는 비어있음(자료 들어오면 CMS로 채움)**,
`process[]{title,desc}`(10단계), `pricing{note, tiers[]{name,desc,part1,part2}}`(대표60/20·전속40/10·파트너30/5만원),
`academy{title,sub,body,fit[],pipeline[],competencies[],talent,selection[],cta{text,url}}`, `faq[]{q,a}`, `booking{note}`.

## 6. 현재 상태 (완료)
- ✅ 무드바이 에이전시 구조로 전체 페이지 구현 + 컬러/팔레트 아이덴티티 반영, 로컬 렌더 검증.
- ✅ 도메인 moodby.kr 코드 반영(CNAME/config/og).
- ✅ 럭셔리 히어로/팔레트/무드랩/OG 이미지 추가됨(`images/moodby-hero-luxe.jpg`, `images/moodby-palette-luxe.jpg`, `images/moodby-lab-luxe.jpg`, `images/moodby-og-luxe.jpg`), MC strength/recommend 카피 채움.
- ⚠️ **이 변경분들이 아직 커밋/푸시 안 됐을 수 있음 → `git status` 확인 후 커밋·push 먼저.** 마지막 푸시 커밋: `760cae2`.

## 7. 인프라 참고값
moodby.kr 전용 값:
```
GitHub repo : yjh940331-afk/jungddanddan   (main)
도메인       : moodby.kr  (가비아 구매 완료)
R2 버킷      : moodby-images
미디어 도메인 : media.moodby.kr
R2 account_id: b8c01aa804c1c42982b17864b74e975b   (bonitasnap과 동일 Cloudflare 계정)
CMS auth worker: sveltia-cms-auth.yjh940331.workers.dev   (bonitasnap과 공유)
```
인프라를 다시 점검해야 할 때 확인 순서:
1. **가비아 → Cloudflare 네임서버 이전**: Cloudflare에 사이트 `moodby.kr` 추가 → 발급된 네임서버 2개를 가비아(My가비아 > 도메인 > 네임서버 설정)에 입력. (전파 후 진행)
2. **Cloudflare Pages**: 프로젝트 생성 → GitHub `yjh940331-afk/jungddanddan` 연결 → build command `node build.js`, output `/`(루트), branch `main` → Custom domains에 `moodby.kr`(+ `www.moodby.kr` → apex 리다이렉트).
3. **R2**: 버킷 `moodby-images` 생성 → Settings > Custom Domains에 `media.moodby.kr` 연결 → CORS에 origin `https://moodby.kr`(+ `http://localhost:4173`), 메서드 GET/PUT 허용 → API 토큰(Object Read&Write, **버킷 한정**) 발급 → **Access Key ID**를 `admin/config.yml`의 `access_key_id`(현재 `REPLACE_WITH_MOODBY_R2_ACCESS_KEY_ID`)에 기입, **Secret**은 repo에 넣지 말고 `/admin/` 첫 업로드 때 1회 입력.
4. **CMS 인증 worker**: `sveltia-cms-auth` worker > Settings > Variables > `ALLOWED_DOMAINS`에 `moodby.kr` 추가(콤마 구분). **새 OAuth앱/worker 불필요**(bonitasnap과 공유).
5. **사회자 계정 분리(선택)**: 각 사회자 GitHub 계정을 repo에 **Collaborator(Write)** 로 초대 → 각자 `/admin/`에서 GitHub 로그인. 권한이 repo 단위라 자연히 분리됨.

> 자매 프로젝트 `../bonitasnap`가 동일 스펙으로 이미 위 인프라를 셋업한 선례 → 막히면 bonitasnap의 Cloudflare/R2/worker 설정을 그대로 참고/복제.

## 8. 남은 작업 — 콘텐츠/UI
- 사회자 10명 **프로필 사진 + 진행 영상(youtube) + 후기(review)** 채우기(현재 이니셜+색으로 표시). CMS 또는 settings.json 직접.
- 대표 프로필 사진(`ceo.image`) — 현재 비어 사진 칸 자동 숨김(main.js의 ceo-grid no-photo 처리).
- 히어로 이미지는 `images/moodby-hero-luxe.jpg`, OG 대표 이미지는 `images/moodby-og-luxe.jpg`로 들어가 있음(둘 다 CMS에서 교체 가능).

## 9. 판단/확인 필요(미정)
- 가격 공개 여부(현재 공개), MC 카드 등급 표기 여부(현재 비노출, 무드 중심), 무드온 포함 여부(현재 제외) — 전부 정다원 확인 후 조정 가능. 전부 CMS/코드로 쉽게 변경.

## 10. 로컬 실행 & 검증
```
cd /Users/lotte/Desktop/workspace/private/jungddanddan
python3 -m http.server 4173   # → http://localhost:4173
```
- ⚠️ `index.html` 더블클릭(file://)은 settings.json fetch 실패로 폴백만 보임 → 반드시 http로.
- 변경 후 점검: `node -e "JSON.parse(require('fs').readFileSync('content/settings.json','utf8'))"` (JSON 유효성), `node --check js/main.js`.

## 11. Git / 주의
- remote origin URL에 **GitHub PAT가 박혀 있음**(bonitasnap과 동일 토큰, 같은 계정). 노출 주의. `git remote -v`로 확인.
- 커밋 메시지 끝에 `Co-Authored-By` 라인은 이전 컨벤션(선택).

## 12. 참고 링크
- 노션(브랜드 기획·메뉴 구성, 비공개): 정다원 보유. 본 README/HANDOFF에 핵심 반영됨.
- 레퍼런스: marchmuseum.imweb.me, doorsnap.co.kr(스냅), tria-plan.com(플래너), media-palette.co.kr(팀 스토리텔링).
