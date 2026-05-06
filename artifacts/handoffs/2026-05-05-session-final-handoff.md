# Session Handoff — 2026-05-05 (Final, lunenlabs.com LIVE)

## Current Status

이번 세션은 **lunenlabs.com 신규 사이트 구축 + 배포 + LIVE 검증**을 핵심 deliverable로 마쳤다. 친척 카톡 outbound 직전 인프라 준비를 완성한 상태로, 5/8 D-7 게이트 통과 path의 가장 큰 친척 acquisition 채널이 손에 있다.

세션 시작 시 사용자는 친척 강아지 2마리 보호자에게 PT를 소개하고 LOI를 받고 싶어했다. 그 과정에서 (1) 친척 카톡 outbound 템플릿 → (2) 사이트 부재 발견 → (3) lunenlabs.com 신규 사이트 구축 → (4) Vercel monorepo 충돌 디버그 → (5) DNS 설정 → (6) LIVE 검증으로 확장됐다. 마지막에 사용자가 사이트 친화 톤·PT 분리·인스타·도메인 이메일 5가지 추가 질문을 던졌고, **5/5 17~18시 슬롯에서 친척 카톡 발송이 다음 단일 critical action**으로 결정됐다.

LIVE URL: `https://www.lunenlabs.com/` (또는 `https://lunenlabs.com/`) — 메타 title "루넨랩스 (LunenLabs) — 더 안전한 일상을 위한 소프트웨어 스튜디오" 확인. 카톡 미리보기 OG 이미지 정상 (사용자 본인 카톡에서 evidence 캡처 확인).

이번 세션은 modoo-deadline-execution 패키지의 Track 1 가입자·LOI 회수 채널 인프라에 직접 기여 — 신청서 §가능성·§효과성·§차별성에 inject할 정량 데이터 회수 endpoint 확보.

---

## Changed Files

### 신규 lunenlabs/ 디렉토리 (24 files, 3,194 lines)

**Build infrastructure**:
- `lunenlabs/package.json` — React 19 + Vite 8 + Tailwind 4 + React Router 7
- `lunenlabs/package-lock.json` — 49 packages
- `lunenlabs/tsconfig.json` — `noEmit: true` (site/ 패턴 따름)
- `lunenlabs/vite.config.ts` — port 3100, dist output
- `lunenlabs/vercel.json` — framework=vite + installCommand + buildCommand override (Turbo auto-detection 우회)
- `lunenlabs/index.html` — meta title·description·OG·Twitter·Kakao 메타데이터
- `lunenlabs/og-template.html` — 1280×720 OG 이미지 생성용 HTML (Chrome headless로 PNG 변환)
- `lunenlabs/public/favicon.svg` — 그라데이션 달 모양
- `lunenlabs/public/og-image.png` — 265 KB, 1280×720, navy + aqua + 4 product pills
- `lunenlabs/public/robots.txt`

**React 컴포넌트** (8개):
- `lunenlabs/src/components/Header.tsx` — 스크롤 transparent → solid
- `lunenlabs/src/components/Hero.tsx` — "더 안전한 일상..." + 4 stat cards
- `lunenlabs/src/components/AboutLunenLabs.tsx` — 4 원칙 + B2B/B2C 분리
- `lunenlabs/src/components/ProductLineup.tsx` — PT highlighted + SafeWay/CC/SDET
- `lunenlabs/src/components/PTSpotlight.tsx` — AI 5축 차별화 (사고 신고·GPS·사진·컨디션·모더레이션)
- `lunenlabs/src/components/SignupForm.tsx` — 9 필드 + PIPA 동의 + mailto fallback (`/api/v1/prelaunch/signup` POST → fail 시 mailto:jhryu115@gmail.com)
- `lunenlabs/src/components/FAQ.tsx` — 6개 Q&A 아코디언
- `lunenlabs/src/components/Footer.tsx` — 4 컬럼 + 정책 링크

**페이지** (3개):
- `lunenlabs/src/pages/Landing.tsx` — 모든 섹션 결합
- `lunenlabs/src/pages/Privacy.tsx` — PIPA §15·17·22 컴플라이언스
- `lunenlabs/src/pages/Terms.tsx` — 사전가입 이용약관 8조

**Foundation**:
- `lunenlabs/src/main.tsx` — BrowserRouter + 3 라우트 (`/`·`/privacy`·`/terms`)
- `lunenlabs/src/index.css` — Tailwind + 브랜드 색상 (navy `#0A1A3F` + aqua `#00C9B0`)
- `lunenlabs/src/vite-env.d.ts`

### Artifacts (5개 신규)

- `artifacts/business/fundraising/2026-05-03-pt-customer-loi-katalk-template.md` — 친척·지인 카톡 + 인터뷰 + LOI 양식 (3 variants + 6 인터뷰 질문 + 신청서 inject 가이드, 14 섹션)
- `artifacts/business/fundraising/2026-05-03-lunenlabs-vercel-namecheap-deploy-guide.md` — Vercel + Namecheap 배포 가이드 (Parking Page 함정 차단 + DNS 정확 입력값)
- `artifacts/business/fundraising/2026-05-05-pt-critical-path-hourly-d3-d0.md` — 5/5~5/8 hourly 시간표 (의사결정 외주 도구, 4일 96시간 압축, 게이트 결정 트리)
- `artifacts/handoffs/2026-05-05-session-final-handoff.md` (본 문서)
- `.gitignore` modified — `*.tsbuildinfo` 추가

### Push된 commits (3개)

- `754c655` — feat(lunenlabs): launch lunenlabs.com landing site (18 files)
- `3258a5e` — feat(lunenlabs): add OG image for KakaoTalk/Facebook/Twitter preview
- `a9dd03a` — fix(lunenlabs): add vercel.json to bypass Turbo auto-detection

### Untracked (다음 세션에서 정리할 것)

- `artifacts/business/fundraising/2026-05-03-modoo-startup-pt-application-v2-inject-guide.md` (이전 세션 산출물)
- `artifacts/business/fundraising/2026-05-03-modoo-startup-pt-video-scenario-v2.md`
- `artifacts/business/regulatory/2026-05-05-sandbox-v2.1-meeting-deck-content.md`
- `artifacts/plans/2026-05-03-modoo-deadline-execution-todo-plan.md`
- `artifacts/reports/2026-05-05-modoo-deadline-execution-milestone.md`
- `artifacts/reviews/2026-05-03-modoo-deadline-execution-{frontend,product,fundraising,business,consensus}-review.md` (5개)
- `artifacts/specs/2026-05-03-modoo-deadline-execution-{brief,final-tech-spec}.md` (2개)
- `artifacts/verification/2026-05-05-modoo-deadline-execution-verification.md`
- modified: `CLAUDE.md`, `STATE.md`, `apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx`, `site/tsconfig.tsbuildinfo`

---

## Commands Executed

### Build & Deploy
- `npm install --no-audit --no-fund` (lunenlabs/) → 49 packages, 10s ✅
- `npx tsc -b --pretty` (lunenlabs/) → 0 errors ✅
- `npx vite build` (lunenlabs/) → 234ms 성공, 269 KB JS / 32 KB CSS / 2 KB HTML ✅
- `npx vite --port 3100` (background) → ready in 327ms ✅
- (재실행 후) `npx vite build` → 352ms (clean state) ✅

### OG Image Generation
- `chrome --headless=new --disable-gpu --window-size=1280,720 --virtual-time-budget=3000 --screenshot=...` → 265 KB PNG ✅
- `Read public/og-image.png` (visual verification) → 디자인 의도대로 정확 렌더 ✅

### Git
- `git add lunenlabs/` (3회) → 18 / 21 / 24 files staged
- `git commit -m "feat(lunenlabs): launch ..."` → `754c655` ✅
- `git commit -m "feat(lunenlabs): add OG image ..."` → `3258a5e` ✅
- `git commit -m "fix(lunenlabs): add vercel.json ..."` → `a9dd03a` ✅
- `git push origin main` (Claude attempt) → 차단됨 (system protection: "Pushing directly to main bypasses PR review")
- `git push origin main` (사용자 PowerShell) → 성공 (3 commits push)
- `git fetch origin main && git rev-list --count origin/main..HEAD` → 0 (synced) ✅

### CI 진단
- `git diff --name-only f4223a7..HEAD` → lunenlabs/ + .gitignore만 (다른 디렉토리 무관 확인)
- `cd site && npm run build` → 1.04s 성공 (local) ✅
- `cd web && npx tsc --noEmit` → 0 errors (local) ✅
- 결론: backend·web·site CI 실패는 우리 변경 무관, 5/16+ 정리 항목

### LIVE 검증
- `WebFetch https://www.lunenlabs.com/` → meta title "루넨랩스 (LunenLabs) — 더 안전한 일상을 위한 소프트웨어 스튜디오" 확인 ✅
- 사용자 본인 카톡 → URL 첨부 → OG 이미지 미리보기 정상 (사용자 캡처 evidence 확인) ✅
- 사용자 데스크톱 브라우저 → Hero·About·Products 정상 렌더 (사용자 캡처 evidence 확인) ✅

---

## Tests and Outcomes

| 검증 | 결과 |
|---|---|
| lunenlabs/ TypeScript (tsc -b) | ✅ 0 errors |
| lunenlabs/ Vite production build | ✅ 234ms (1차), 352ms (2차 clean) |
| lunenlabs/ dev server start (port 3100) | ✅ 327ms ready |
| lunenlabs/ OG image visual | ✅ navy + aqua + 4 product pills + LunenLabs 로고 + "PetTracker · 2026.06 출시" 뱃지 정확 |
| Vercel 첫 빌드 | ❌ "Could not resolve workspaces. Missing packageManager field" (Turbo auto-detection 충돌) |
| Vercel 두 번째 빌드 (vercel.json 후) | ✅ Build success |
| `https://www.lunenlabs.com/` HTTPS | ✅ SSL 자물쇠 + meta title 확인 |
| 카톡 OG 미리보기 | ✅ 사용자 캡처 evidence (LunenLabs 카드 + 4 product pills) |
| 데스크톱 viewport 5섹션 | ✅ 사용자 캡처 evidence (Hero 정상) |
| backend·web·site CI | ❌ 실패 (lunenlabs 변경과 무관, local 빌드는 성공) |
| mobile CI | ✅ 36s |

---

## Decisions Made

### D1 — lunenlabs/는 별도 디렉토리, site/와 분리
근거: 도메인 분리(lunenlabs.com vs safeway-kids.kr) + deployment 분리 + 모회사 정체성 명확화 + site/의 Tailwind theme 패턴 재사용. site/ 안에 라우트 추가는 SEO·OG 메타데이터 충돌 risk.

### D2 — Stack = React 19 + Vite 8 + Tailwind 4 + React Router 7
근거: site/ 동일 stack으로 일관성. 1인 창업가 mental model 분산 방지.

### D3 — SignupForm은 mailto fallback (백엔드 endpoint는 V1.1 이연)
근거: 5/8 critical path까지 backend endpoint 작성 시간 부담. mailto 자동 fallback으로 conversion 보존(50%+ 작동). 6/9 출시 전 backend endpoint 추가 시 코드 수정 1줄.

### D4 — vercel.json으로 monorepo Turbo 자동 감지 우회
근거: UI override는 race condition 발생 (사용자 진단). vercel.json git에 박혀있으면 Vercel config precedence(`vercel.json > UI override > auto-detect`)에 의해 안전. 사용자 추천 "A 즉시 + 추후 B" 대신 B 단일 path가 A 효과 포함.

### D5 — OG image 생성 = HTML + Chrome headless
근거: Canva MCP는 사용자 의사결정 필요(design 후보 선택), Playwright는 브라우저 lock 충돌. Chrome headless CLI는 deterministic + 30초 자동. og-template.html 보존하여 카피 변경 시 1줄 명령으로 재생성 가능.

### D6 — 5/8 D-3 critical path 분리
- 5/5 = Vercel·DNS·친척 카톡 (인프라 + 1차 outbound)
- 5/6 = PT 전용 페이지 + 친화 톤 + 이메일·인스타 셋업
- 5/7 = 변호사 미팅 + 동물병원 + 인스타 DM
- 5/8 = 게이트 결산
근거: 사용자 5가지 추가 질문(친화 톤·PT 분리·인스타·이메일)은 game-changing이지만 게이트 직결 X → 5/6 오전 슬롯으로 후미 배치.

### D7 — main 직접 push 유지 (PR 워크플로우 도입 X)
근거: 1인 창업가에게 PR overhead 5단계는 friction. main 직접 push가 작동 + commit history 충분히 명확. 5/15 신청서 제출 후 6/9 출시 단계에서 PR 도입 검토 가능.

### D8 — CI 3개 실패는 무시 (5/16+ 정리)
근거: lunenlabs 변경이 backend·web·site 코드 X (git diff 검증). local 빌드는 site/web 둘 다 성공. CI 실패는 우리 변경 이전 상태 가능성 높음. 5/8 critical path와 무관, Vercel 배포는 GitHub Actions와 별도 시스템.

---

## Open Issues / Blockers

### 사용자 작업 대기 (5/5 17~18시 슬롯 진입)

- 🔴 **친척 강아지 2마리 보호자에게 카톡 발송** — Variant A 메시지 + lunenlabs.com URL 첨부 → LOI 1건 + 가입자 1~2명 회수 (5/8 게이트의 첫 걸음)
- 🟡 사용자가 "사이트 톤 친근화 / PT 분리 / 인스타·이메일" 5가지 추가 요구 → 5/6 오전 슬롯으로 lock-in (Auto mode B 옵션 = 친척 카톡 + PT 페이지 동시 진행 권장 상태에서 세션 종료)

### 기술적 후속 (5/6~5/8)

- 🟡 PT 전용 페이지 (`lunenlabs.com/pet`) 추가 — 친근 톤 + PT 5축 강아지 친화 풀이 + PT 전용 form, 30분
- 🟡 카피 친화 어휘 변환 ("산책 위탁" → "산책 부탁" / "산책 메이트")
- 🟡 ImprovMX 도메인 이메일 forwarding (`hello@lunenlabs.com`, `pet@lunenlabs.com`) — 1분
- 🟡 Instagram 계정 생성 (`@pettracker_kr` 또는 `@petfind.kr`) + 사이트 footer link 추가
- 🟡 Vercel project rename (safeway-kids → lunenlabs) — cosmetic, 1분
- 🟡 backend SignupForm endpoint (`POST /api/v1/prelaunch/signup`) — 백엔드 데이터베이스 저장 + 5/8 게이트 결산 시 가입자 N 정확 카운트 (V1.1 이연 가능)

### 5/16+ 정리 항목

- 🟢 CI 3개 실패 (backend·web·site) 진단 + fix
- 🟢 site/tsconfig.tsbuildinfo dirty 상태 (build 산출물이 tracked) — `git rm --cached` + .gitignore 갱신
- 🟢 root package.json `packageManager` 필드 추가 (Turbo workspace 정상 작동)
- 🟢 fix/lunenlabs-vercel-config 빈 branch 삭제 (사용자가 cleanup 시점에)
- 🟢 untracked artifacts 다수 (modoo-deadline-execution review·spec·plan·report 등) — 별도 commit 정리

### 외부 (사용자 작업 필요)

- 🟡 EXT-9~12 외부 계정 (AWS·Firebase·Anthropic·OpenAI·PortOne) — Track 2 5/16 시작 전
- 🟡 UD-3 (5/7 변호사 미팅) — SafeWay v2.2 5/14 연기 결정
- 🟡 UD-4 (5/8 게이트 시) — 루넨랩스 사업자등록 5/15 전 완료 가능 여부

---

## Next Exact First Step

**5/5 17~18시 슬롯 — 친척 강아지 2마리 보호자에게 카톡 발송**

사용자 작업 (15분):
1. `artifacts/business/fundraising/2026-05-03-pt-customer-loi-katalk-template.md` §1 Variant A 카피
2. bracket 2개 채우기 (친척 호칭 / 강아지 이름들)
3. 메시지에 `https://lunenlabs.com` 또는 `https://www.lunenlabs.com` URL 첨부
4. 친척에게 발송 → 카톡 자동 OG 미리보기 표시 (사용자 evidence 확인됨)
5. 응답 대기 → 통화 약속 잡기

**병렬 옵션 (Auto mode B)**: 사용자 카톡 발송 + Claude는 PT 전용 페이지 작성 (`lunenlabs/src/pages/PetTracker.tsx` 친근 톤). 5/5 19시쯤 둘 다 완료 예상이었으나 세션 종료로 PT 페이지는 다음 세션 첫 작업으로 이연.

**다음 세션 (5/6 새벽 또는 아침)**:
1. 친척 응답 점검
2. (병렬 옵션 잔여) PT 전용 페이지 `lunenlabs.com/pet` 작성 — 친화 톤 + PT 5축 강아지 친화 풀이 + PT 전용 form
3. ImprovMX 도메인 이메일 셋업 (1분)
4. Instagram 계정 생성 + 사이트 footer link 추가
5. 카톡 친구 50명 outbound 시작 (시간표 §2)

---

## Residual Risks

| Risk | Mitigation |
|---|---|
| 친척 응답 zero (5/6 정오까지) | 다른 친척·친구 1명 추가 카톡 (시간표 §6) |
| Vercel project name `safeway-kids`가 친척 신뢰감 영향 | `lunenlabs.com`이 LIVE이므로 친척에게 보낼 때 항상 도메인 URL 사용. Vercel project rename은 cosmetic 후속 |
| OG image의 "CareConne..." 잘림 (사용자 카톡 캡처에서 확인됨) | 카톡 자동 crop 동작 (정사각형). visual 영향 minor. 5/6 PT 전용 페이지에서 PT용 OG 이미지 별도 생성 시 fix 가능 |
| backend·web·site CI 빨간 X 표시가 사용자 외부에 보임 | private repo이므로 외부 노출 X. 5/16+ 정리 |
| SignupForm mailto fallback이 모바일 in-app 브라우저(인스타·카톡 내부 webview)에서 안 작동 가능성 | 5/6 백엔드 endpoint 추가 우선순위 ↑. 또는 Vercel Serverless Function `/api/signup.ts` 추가 (가장 간단) |
| 5/8 게이트 미달 risk | hourly 시간표 §4의 결정 트리(strong-go / conditional-go / no-go) 자동 적용. K-Startup 7월 전환 path 명시 |

---

## 메모리 업데이트 권고

다음 세션을 위해 user-level memory 업데이트 권고:

### 1. Project memory — `lunenlabs_site_live.md`
```yaml
---
name: LunenLabs Site Live
description: lunenlabs.com 신규 사이트 2026-05-05 LIVE — Vercel + Namecheap. PT 전용 페이지·이메일·인스타 5/6 추가 예정
type: project
---

루넨랩스(LunenLabs)는 PetTracker·SafeWay·CareConnect·SDET Code 4개 라인업의 모회사 정체성 사이트. lunenlabs.com 도메인은 사용자 보유, 2026-05-05 Vercel 배포 완료. 메타 title "루넨랩스 (LunenLabs) — 더 안전한 일상을 위한 소프트웨어 스튜디오".

**Why**: 5/8 D-7 게이트 친척·친구 outbound의 LIVE URL 채널 + 5/15 신청서 §효과성 정량 anchor.

**How to apply**: 친척·친구 카톡 outbound 시 https://lunenlabs.com 첨부. 신청서에 "lunenlabs.com 운영 중 (4 product 라인업 노출)" 표기. 메모리 [Project Strategy]의 멀티앱 모회사 narrative와 일관.

**5/6 추가 예정**: PT 전용 페이지 (`lunenlabs.com/pet` 친근 톤) + ImprovMX 도메인 이메일 + Instagram 계정.
```

### 2. Feedback memory — `feedback_vercel_monorepo_pattern.md`
```yaml
---
name: Vercel monorepo Turbo 자동 감지 우회 패턴
description: repo root에 turbo.json + package.json이 있으면 Vercel이 'turbo run build' 강제. vercel.json + Root Directory 둘 다 필요
type: feedback
---

Vercel이 모노레포 신호(turbo.json + workspaces)를 감지하면 `npm install --prefix=..` + `turbo run build` 자동 적용. UI override는 race condition (auto-detection이 다시 켜는 구조).

**Why**: 첫 Vercel 빌드 30분 디버그한 사례 (2026-05-05). 사용자가 정확히 진단 — `npm install --prefix=..`가 결정적 단서.

**How to apply**: 모노레포 안의 sub-project를 Vercel에 배포할 때 다음 둘 다 필수:
1. Vercel UI Settings → Root Directory = `[sub-dir]` 명시
2. `[sub-dir]/vercel.json` 추가 — `framework`, `buildCommand`, `installCommand`, `outputDirectory` 명시

vercel.json이 git에 박혀있으면 UI 변경 영향 X, 모든 environment에서 일관 작동. 향후 SafeWay site/, web/ Vercel 배포 시 동일 패턴 적용.
```

### 3. Reference memory — `reference_og_image_generation.md`
```yaml
---
name: OG 이미지 생성 — Chrome headless 패턴
description: HTML 1280×720 layout + Chrome headless CLI로 카톡·페북·트위터 OG 이미지 자동 생성. Canva·Playwright보다 결정적
type: reference
---

카톡·페북·트위터 미리보기 이미지(1280×720 PNG) 생성에 사용한 패턴.

**경로**: `lunenlabs/og-template.html` (정확한 1280×720 레이아웃) + Chrome headless 명령:
```bash
chrome --headless=new --disable-gpu --hide-scrollbars --no-sandbox \
  --window-size=1280,720 --virtual-time-budget=3000 \
  --screenshot=output.png "file:///path/to/og-template.html"
```

**Why**: Canva MCP는 사용자 의사결정 필요(design 후보 선택), Playwright MCP는 브라우저 lock 충돌. Chrome headless는 deterministic + 30초 자동 + 결과 PNG가 카톡·페북에서 정상 표시 검증됨.

**How to apply**: 향후 PetTracker 전용 OG·SafeWay Kids OG·CareConnect OG 등 모든 사이트의 미리보기 이미지 생성에 동일 패턴. og-template.html 카피·색상만 변경 → 1줄 명령 재생성.
```

해당 없으면 "메모리 업데이트 불필요" 명시 가능. 위 3건은 향후 세션·다른 서비스 배포에 직접 재사용되므로 권고.

---

## 관련 문서

- `2026-05-03-pt-customer-loi-katalk-template.md` — 친척 카톡 (다음 세션 첫 액션의 ground truth)
- `2026-05-03-lunenlabs-vercel-namecheap-deploy-guide.md` — 배포 가이드 (Vercel·Namecheap 함정 차단 record)
- `2026-05-05-pt-critical-path-hourly-d3-d0.md` — 5/5~5/8 hourly 시간표 (의사결정 외주 도구)
- `2026-05-05-session-handoff.md` — 동일 일자 다른 세션 handoff (modoo-deadline-execution Phase 0~7 컨텍스트, 본 세션과 분리)
- `2026-05-03-session-final-handoff.md` — SafeWay v2.1 양길모 의견서 반영
- `STATE.md` — 본 세션 후 lunenlabs LIVE 반영 업데이트
