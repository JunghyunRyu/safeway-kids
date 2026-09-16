# 프로젝트 분리(Repository Decomposition) 히스토리

- **작성일**: 2026-06-08
- **작성자**: JunghyunRyu (+ Claude Opus 4.8)
- **범위**: 루넨랩스 멀티앱 포트폴리오의 모노레포 → 독립 저장소 분해 이력
- **검증 기준**: 모든 항목은 git 로그·working tree·원격 추적 상태로 확인 (CLAUDE.md 비협상 규칙 #2/#6 준수)

---

## 0. 한눈에 (TL;DR)

| 프로젝트 | 독립 repo | 분리 방식 | 분리 시점 | 모노레포에서 추출? | 상태 |
|---|---|---|---|---|---|
| **lunenlabs** (마케팅 사이트) | `JunghyunRyu/lunenlabs` | 모노레포에서 추출 | **2026-06-08 (오늘)** | ✅ 예 (`24c97a0`) | 독립 repo 푸시 완료 / 모노레포 제거 커밋 **미푸시** ⚠️ |
| **nightward** (구 tripwire, 회귀 방화벽) | `JunghyunRyu/nightward` | 처음부터 독립 | 2026-06-05 초기 커밋 | ❌ 아니오 | 독립 운영 중 |
| **claude-forge** (CC 플러그인 프레임워크) | `JunghyunRyu/claude-forge` | 처음부터 독립 | 2026-03-13 초기 커밋 | ❌ 아니오 | 독립 운영 중 |
| **safeway_kids** (본 모노레포 = SafeWay/PT/CareConnect + 백엔드) | `JunghyunRyu/safeway-kids` | (원본 모노레포) | — | — | 로컬 main 23 ahead / 6 behind origin ⚠️ |

> **정밀 구분**: 본 모노레포(`safeway_kids`)에서 *오늘 실제 추출된 것은 `lunenlabs` 1건*이다.
> `nightward`와 `claude-forge`는 모노레포에 트래킹된 적이 없는 *원래부터 독립 저장소*다 (제거 커밋 없음으로 확인).
> "여러가지 프로젝트 분리"는 포트폴리오 전체의 독립 repo 지형을 의미하는 것으로 본 문서는 4개 저장소를 모두 기록한다.

---

## 1. 오늘의 분리: lunenlabs 마케팅 사이트 추출 (2026-06-08)

### 1.1 무엇을 분리했나
모노레포 `lunenlabs/` 디렉토리 전체(Vite/React 랜딩 사이트, 43개 추적 파일)를 독립 git 저장소로 이관.

이 사이트는 **단일 제품 사이트가 아니라 포트폴리오 통합 마케팅 사이트**다 — 추출된 repo가 담고 있는 제품 페이지:

- `src/pages/Landing.tsx` — 루넨랩스 통합 랜딩
- `src/pages/PetTracker.tsx` + `src/components/pt/*` (9개) + `PTSpotlight.tsx` — PetTracker 제품 페이지
- `src/pages/Tripwire.tsx` + `src/components/tw/*` (8개) — tripwire/nightward 제품 페이지
- `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` — 법적 고지
- `api/signup.ts` — 사전가입 서버리스 함수, `vercel.json` — Vercel 배포 설정

### 1.2 분리 절차 (검증된 타임라인)

| 시각 (KST) | 저장소 | 커밋 | 내용 |
|---|---|---|---|
| 2026-06-08 23:40:05 | `../lunenlabs` (신규) | `3f5280f` | `chore: initialize git repository for lunenlabs marketing site` — 독립 repo 초기화 |
| 2026-06-08 23:52:18 | `safeway_kids` (본 모노레포) | `24c97a0` | `chore: remove lunenlabs/ — extracted to standalone repo` — 모노레포에서 43파일 삭제 |

분리 커밋(`24c97a0`) 메시지에 명시된 사항:
- 분리 대상: `lunenlabs/` 전체 (Vite/React 랜딩 사이트)
- 신규 위치: `../lunenlabs` (별도 저장소, 초기 커밋 `3f5280f`)
- 본 커밋은 삭제만 반영 (무관한 untracked 산출물은 미포함)

### 1.3 분리 후 상태 (검증 — VERIFIED)

**신규 repo `../lunenlabs`** (`JunghyunRyu/lunenlabs`):
- 초기 커밋 `3f5280f`가 `origin/main`에 존재 → **GitHub 푸시 완료** ✅
- `git status -sb`: `## main...origin/main` (ahead/behind 0, 동기화됨)

**본 모노레포 `safeway_kids`**:
- `lunenlabs/` 디렉토리: git 추적 파일 **0건**, `git check-ignore` → gitignore 처리됨, working tree 빈 디렉토리
  - ⚠️ 빈 디렉토리가 물리적으로 남아있음 (git은 빈 디렉토리를 추적하지 않으므로 무해하나, 수동 정리 권장)
- 제거 커밋 `24c97a0`: `git branch -r --contains 24c97a0` → **결과 없음 = origin 미푸시** ⚠️
- 로컬 `main`: origin/main 대비 **23 ahead / 6 behind (diverged)**

---

## 2. 기존 독립 저장소 (오늘 분리 아님 — 배경 기록)

### 2.1 nightward (구 tripwire)
- **정체**: AI 주도 변경에 대한 회귀 방화벽(regression firewall) — 본 모노레포의 QA 게이트 개념을 독립 제품화
- **이력** (검증):
  - 2026-06-05 22:40 `e32752f` — `Initial commit: tripwire v0.1.0`
  - 2026-06-06 01:26 `b789c06` — petshop 실증 데모 + GIF
  - 2026-06-07 05:28 `f45304e` — **리브랜드: tripwire → nightward** (패키지/CLI/store/docs)
  - 2026-06-07 20:00 `5732e82` — MCP agent-gate 기능 (run/status 노출, approve는 human CLI 격리)
- **모노레포 관계**: `safeway_kids`에 트래킹된 적 없음 (제거 커밋 부재 확인). 처음부터 독립.
- lunenlabs 마케팅 사이트 내 `tw/*` 컴포넌트 = nightward 제품 소개 페이지 (코드 본체는 nightward repo)

### 2.2 claude-forge
- **정체**: 본 모노레포가 사용하는 9-페이즈 evidence-first 운영 프레임워크(CC 플러그인)의 템플릿/배포본
- **이력** (검증):
  - 2026-03-13 10:01 `566b1dd` — `Initial commit: Claude Forge`
  - 2026-03-13 10:06 `e9c6950` — `claude-code-platform → claude-forge` 리네임
- **모노레포 관계**: `safeway_kids`는 이 플러그인을 *적용*받는 repo (CLAUDE.md = Claude Forge Charter). claude-forge repo는 프레임워크 자체의 배포본으로 별도 운영.

---

## 3. 분리 후 저장소 지형도 (현재)

```
C:/jhryu/01_project/
├── safeway_kids/     → JunghyunRyu/safeway-kids   (모노레포: SafeWay + PetTracker + CareConnect + backend)
│                        └ lunenlabs/ = 빈 디렉토리 (분리 완료, gitignore)
├── lunenlabs/        → JunghyunRyu/lunenlabs       (마케팅 사이트: PT/tripwire/PetTracker 페이지) ★오늘 분리
├── nightward/        → JunghyunRyu/nightward       (회귀 방화벽 제품)
└── claude-forge/     → JunghyunRyu/claude-forge    (CC 플러그인 프레임워크)
```

**분리 설계 의도(추정 — Assumption, 코드/커밋으로 미확정)**: 배포·버전·CI 라이프사이클이 다른 산출물을 독립 repo로 분해. 마케팅 사이트(Vercel 배포, 빈번한 카피 수정)와 제품 백엔드/앱(별도 릴리스 사이클)을 분리해 모노레포 빌드/리뷰 노이즈를 줄이는 패턴.

---

## 4. Assumption Register (가정 — 사실과 분리)

| # | 가정 | 근거 | 확정 필요 |
|---|---|---|---|
| A-1 | "여러가지 프로젝트 분리" = 포트폴리오 전체 독립 repo 지형(4개) | git에 커밋된 *오늘* 추출은 lunenlabs 1건뿐 | 사용자: 오늘 lunenlabs 외 추가 분리 작업이 있었나? |
| A-2 | 분리 목적 = 배포/릴리스 라이프사이클 분리 | 일반적 모노레포 분해 패턴, 커밋 메시지엔 명시 없음 | 사용자 의도 확인 시 §3 보강 |
| A-3 | lunenlabs 빈 디렉토리 잔존은 무해 | git은 빈 디렉토리 미추적, 빌드 영향 없음 | 수동 `rmdir` 정리 여부는 선택 |

---

## 5. Open Issues / 다음 단계 (미완 — 사실)

1. ⚠️ **모노레포 제거 커밋 `24c97a0` 미푸시** — origin/main에 없음. `git push` 필요. 푸시 전까지 "분리 완료"는 로컬에서만 참.
2. ⚠️ **로컬 main 23 ahead / 6 behind origin (diverged)** — lunenlabs 제거 외에도 미푸시 로컬 커밋 다수. push 전 `origin/main`과의 통합 전략 결정 필요 (참고: 과거 Windows autocrlf trap 이력 있음 — 메모리 `feedback_windows_autocrlf_trap`).
3. ⬜ **STATE.md 미반영** — 현재 STATE.md "Active workstream"에 lunenlabs 분리 없음. 구조 변경이므로 STATE.md / CLAUDE.md Active Work 갱신 권장.
4. ⬜ **빈 `lunenlabs/` 디렉토리** — 선택적 수동 정리.

---

## 6. 검증 증거 (재현 명령)

```bash
# 오늘 분리 커밋
git -C safeway_kids show 24c97a0 --stat              # → lunenlabs/ 43파일 삭제

# 신규 repo 푸시 확인
git -C ../lunenlabs branch -r --contains 3f5280f     # → origin/main (푸시됨)
git -C ../lunenlabs status -sb                       # → ## main...origin/main (동기화)

# 모노레포 제거 커밋 미푸시 확인
git -C safeway_kids branch -r --contains 24c97a0     # → (없음 = 미푸시)
git -C safeway_kids rev-list --left-right --count origin/main...main  # → 6  23

# lunenlabs/ 빈 디렉토리 + gitignore 확인
git -C safeway_kids ls-files lunenlabs/ | wc -l      # → 0
git -C safeway_kids check-ignore lunenlabs/          # → lunenlabs/
```
