# lunenlabs.com 배포 가이드 — Vercel + Namecheap

**문서 분류**: Deployment runbook (사용자 직접 실행, 단계별 클릭 sequence)
**작성일**: 2026-05-03
**목표 timeline**: 5/4 outbound 직전 LIVE URL (lunenlabs.com 또는 lunenlabs.vercel.app)
**예상 소요 시간**: 사용자 실작업 ~10분 + DNS propagation 대기 30분~1시간
**Critical path 기여**: 5/8 게이트 카톡 outbound 시 LIVE URL 첨부 → conversion +50%

---

## 0. 사전 체크리스트 (시작 전)

| 항목 | 상태 |
|---|---|
| ✅ lunenlabs/ 코드 작성 완료 (18 파일) | 2026-05-03 |
| ✅ 빌드 검증 완료 (TS 0 errors, Vite 352ms) | 2026-05-03 |
| ✅ Git commit 생성 완료 (local) | 2026-05-03 |
| ⏳ **Git push origin main** | **사용자 1줄 실행 필요** |
| ⏳ Vercel 계정 (없으면 가입) | 사용자 직접 |
| ⏳ Namecheap 로그인 가능 | 사용자 직접 |
| ⏳ GitHub `JunghyunRyu/safeway-kids` 접근 | 이미 보유 |

---

## 1. Git Push (사용자, 30초)

```powershell
cd C:/jhryu/01_project/safeway_kids
git push origin main
```

push 완료 후 GitHub에서 lunenlabs/ 디렉토리가 보이는지 확인:
`https://github.com/JunghyunRyu/safeway-kids/tree/main/lunenlabs`

---

## 2. Vercel 가입 + 프로젝트 Import (사용자, 5분)

### 2-1. 가입
브라우저에서 `https://vercel.com/signup` → **"Continue with GitHub"** 클릭 → JunghyunRyu 계정으로 OAuth 승인.

⚠️ **무료 플랜으로 시작** (개인 계정). 빌드 무료, 대역폭 100 GB/월 무료. lunenlabs.com 트래픽이 그 한도에 도달할 가능성 = 0.

### 2-2. 프로젝트 Import

1. Dashboard → **"Add New..."** (우상단) → **"Project"** 클릭
2. "Import Git Repository" 섹션에서 `JunghyunRyu/safeway-kids` 선택 → **"Import"** 클릭
3. **"Configure Project"** 화면에서 다음 정확히 설정:

| 필드 | 값 | 비고 |
|---|---|---|
| **Project Name** | `lunenlabs` | URL의 일부가 됨 (`lunenlabs.vercel.app`) |
| **Framework Preset** | `Vite` | 자동 감지될 가능성 높음 |
| **Root Directory** | `lunenlabs` | ⭐ **핵심 — 클릭해서 변경** (기본은 root). "Edit" 버튼 → 디렉토리 트리에서 `lunenlabs` 선택. |
| Build and Output Settings | (자동) | `npm run build` / `dist` |
| Install Command | (자동) | `npm install` |
| Environment Variables | 없음 | 프론트엔드 only |

4. **"Deploy"** 클릭 → 빌드 시작 (~30초~1분)

### 2-3. 배포 검증

배포 완료되면 임시 URL 확보:
- **`lunenlabs.vercel.app`** (또는 `lunenlabs-[hash].vercel.app`)

이 URL을 클릭해서 다음 6개 체크:
- [ ] Hero 섹션 "더 안전한 일상..." 헤드라인 표시
- [ ] About / Products / PT / Signup 4 섹션 스크롤 작동
- [ ] SignupForm 입력 가능 + 제출 시 mailto 또는 fallback 작동
- [ ] `/privacy` 페이지 작동
- [ ] `/terms` 페이지 작동
- [ ] 모바일 viewport (DevTools) 레이아웃 정상

⚡ **이 시점부터 친척 카톡에 URL 첨부 가능**. lunenlabs.com 연결을 안 기다리고 outbound 시작 가능.

---

## 3. Vercel 측 도메인 추가 (사용자, 1분)

### 3-1. lunenlabs.com 추가

1. Vercel Dashboard → `lunenlabs` 프로젝트 클릭
2. 상단 탭 **"Settings"** → 좌측 메뉴 **"Domains"**
3. **"Add"** 클릭 → 입력란에 `lunenlabs.com` 입력 → **"Add"** 클릭

### 3-2. www.lunenlabs.com도 추가 (권장)

같은 화면에서 `www.lunenlabs.com` 입력 → "Add" 클릭. Vercel이 자동으로 redirect 설정 옵션 제공 (apex로 redirect 권장).

### 3-3. Vercel이 표시하는 DNS records 메모

화면에 다음 비슷한 정보가 표시됩니다 (예시 — 실제 Vercel이 보여주는 값을 그대로 사용):

```
For lunenlabs.com (apex):
  Type: A
  Name: @
  Value: 76.76.21.21

For www.lunenlabs.com:
  Type: CNAME
  Name: www
  Value: cname.vercel-dns.com
```

⚠️ **Vercel이 보여주는 정확한 값을 사용**. 위 예시값은 Vercel 표준이지만 변경될 수 있음. 사용자가 화면에서 본 값이 정답.

---

## 4. Namecheap DNS 설정 (사용자, 3분)

### 4-1. Namecheap 로그인 + Advanced DNS 진입

1. `https://namecheap.com` → 우상단 **"Sign In"**
2. Dashboard → 좌측 메뉴 **"Domain List"**
3. `lunenlabs.com` 옆 **"Manage"** 버튼 클릭
4. 상단 탭에서 **"Advanced DNS"** 클릭

### 4-2. Parking Page / URL Forwarding 비활성화 (⭐ 필수)

`★ 흔한 함정 #1`
Namecheap 신규 도메인은 "URL Forwarding" 또는 "Parking Page"가 자동 활성화되어 있어요. 이게 활성 상태면 A record와 충돌해서 Vercel 검증이 80% 확률로 실패합니다.

체크할 항목:
- "URL Redirect Record" 또는 "URL Forwarding Records" 섹션 → 만약 항목 있으면 **모두 삭제** (각 항목 우측 휴지통 아이콘)
- "Domain" 탭 (Advanced DNS 옆) → "REDIRECT DOMAIN" 섹션 → 활성화되어 있으면 비활성화

### 4-3. 기본 Host Records 정리

Advanced DNS → "Host Records" 섹션 확인:

**삭제할 항목** (있으면):
- `CNAME` `www` → `parkingpage.namecheap.com.` ← Namecheap 기본 parking
- `URL Redirect` `@` → ... ← Namecheap 기본 redirect
- `A` `@` → 다른 IP ← 기존 설정이 있으면

각 항목의 우측 **휴지통 아이콘** 클릭 → 삭제.

### 4-4. Vercel용 Host Records 추가

**Record 1 — A (apex 도메인)**:
1. **"ADD NEW RECORD"** 버튼 클릭
2. Type 드롭다운에서 **`A Record`** 선택
3. **Host**: `@`
4. **Value**: `76.76.21.21` (Vercel이 보여준 정확한 IP)
5. **TTL**: `Automatic` (또는 `5 min`)
6. ✅ 체크 (저장) 클릭

**Record 2 — CNAME (www 서브도메인)**:
1. **"ADD NEW RECORD"** 클릭
2. Type 드롭다운에서 **`CNAME Record`** 선택
3. **Host**: `www`
4. **Value**: `cname.vercel-dns.com.` ⭐ **끝점(`.`) 포함** (Namecheap는 자동 처리하지만 안전)
5. **TTL**: `Automatic`
6. ✅ 체크 (저장) 클릭

### 4-5. 저장 확인

화면 상단에 **"All changes saved"** 메시지 또는 녹색 체크표시 확인. Namecheap는 자동 저장되지만 가끔 명시적 "Save Changes" 클릭이 필요할 수 있어요.

---

## 5. DNS Propagation 대기 + Vercel 검증 (자동, 30분~1시간)

### 5-1. Vercel Domain 페이지로 돌아가기

`Vercel Dashboard → lunenlabs → Settings → Domains`

`lunenlabs.com` 옆에 다음 단계로 표시 변화:
1. ⏳ "Invalid Configuration" — DNS 미반영 (~5-30분)
2. ⏳ "Pending Verification" — DNS 반영, SSL 발급 중 (~5-10분)
3. ✅ "Valid Configuration" — 완료 ⭐

### 5-2. DNS propagation 직접 확인 (옵션)

브라우저에서 `https://dnschecker.org/#A/lunenlabs.com` 접속.
- 한국 서버에서 `76.76.21.21` 표시되면 propagation 완료.
- 아직 다른 IP면 추가 대기.

또는 PowerShell:
```powershell
nslookup lunenlabs.com 8.8.8.8
```
출력에 `76.76.21.21` 보이면 OK.

### 5-3. SSL 검증

Vercel이 Let's Encrypt SSL을 자동 발급 (DNS 검증 후 5분 내).
- Vercel Domains 페이지에서 자물쇠 아이콘 + "Valid" 확인
- 브라우저에서 `https://lunenlabs.com` 직접 접속해서 자물쇠 표시 확인

---

## 6. 검증 (LIVE 후 5분)

### 6-1. lunenlabs.com 작동 확인 5개

브라우저에서 `https://lunenlabs.com` 접속 후:

- [ ] HTTP → HTTPS 자동 redirect (자물쇠 아이콘)
- [ ] Hero "더 안전한 일상..." 표시
- [ ] 스크롤 → About / Products / PT / Signup / FAQ 5섹션 모두 작동
- [ ] SignupForm 제출 → success 또는 mailto fallback
- [ ] 모바일 viewport (Chrome DevTools 모바일 모드) 깨짐 없음

### 6-2. www → apex redirect 확인

브라우저 주소창에 `https://www.lunenlabs.com` 입력 → 자동으로 `https://lunenlabs.com` 으로 redirect 되는지 확인.

### 6-3. 카톡 미리보기 테스트 (옵션)

본인 카톡에 `https://lunenlabs.com` 붙여넣기 → 미리보기 카드가 다음과 같이 표시:
- 제목: "루넨랩스 (LunenLabs) — 더 안전한 일상을 위한 소프트웨어 스튜디오"
- 설명: "루넨랩스는 PetTracker, SafeWay Kids..."
- 이미지: ⚠️ **og-image.png가 아직 placeholder** → 이건 별도 단계 (§8 참조)

---

## 7. 흔한 문제 + 해결법

| 증상 | 원인 | 해결 |
|---|---|---|
| Vercel "Invalid Configuration" 30분 이상 | Namecheap A record 미반영 | dnschecker.org에서 propagation 확인. 1시간 후에도 안 되면 Namecheap 설정 재확인 (Parking Page 비활성화 여부) |
| HTTPS 안 됨 (HTTP만) | SSL 미발급 | DNS 검증 완료 후 5분 더 대기. Vercel "Refresh" 클릭. 24시간 후에도 안 되면 Vercel support 컨택 |
| `www.lunenlabs.com` 작동 안 됨 | CNAME 누락 | Namecheap CNAME `www` → `cname.vercel-dns.com.` 재확인 |
| 페이지 빈 화면 | Build 실패 | Vercel Dashboard → "Deployments" → 최신 배포 → "Logs" 확인. 거의 발생하지 않지만 발생 시 가이드 작성자에게 알릴 것 |
| 카톡 미리보기 깨짐 | og-image.png 미생성 | §8 참조 (옵션, 5/15까지 OK) |
| Form 제출 시 "TypeError: Failed to fetch" | 백엔드 endpoint 미존재 (정상) | mailto fallback이 자동 작동. 백엔드는 V1.1에서 추가 |

---

## 8. 후속 작업 (5/8 이후)

### 8-1. og-image.png 생성 (5/15까지)
- 현재 `index.html`에 `<meta property="og:image" content="/og-image.png" />` 라고 되어있지만 실제 파일 없음
- 카톡·페북 미리보기에 이미지 표시 안 됨
- 후속: Canva MCP 또는 Figma로 1280×720 OG 이미지 생성 → `lunenlabs/public/og-image.png` 추가 → push → Vercel 자동 재배포

### 8-2. SignupForm 백엔드 endpoint 연결 (V1.0 출시 전)
- 현재 mailto fallback으로 작동
- 후속: 기존 backend FastAPI에 `/api/v1/prelaunch/signup` 추가
- 또는 Vercel `/api/signup.ts` Serverless Function 추가 (가장 간단)

### 8-3. Analytics 추가 (출시 전)
- Vercel Analytics (free tier) 또는 Plausible
- 사전가입 conversion funnel 측정

---

## 9. Timeline 요약 (사용자 작업 시점)

| 일자 | 행동 | 결과 |
|---|---|---|
| **5/3 (오늘)** | Step 1 (git push) | GitHub repo에 lunenlabs/ 추가 |
| **5/3 (오늘)** | Step 2 (Vercel import) | `lunenlabs.vercel.app` LIVE (5분) |
| **5/3 (오늘)** | Step 3+4 (DNS) | Namecheap A/CNAME 추가 |
| **5/3~5/4** | DNS propagation 대기 | `lunenlabs.com` LIVE (1시간) |
| **5/4 오전** | 카톡 친척 발송 시 URL 첨부 | conversion +50% |
| **5/8** | 게이트 결산 | LIVE site = §효과성 정량 anchor |
| **5/15** | 신청서 §1·5에 lunenlabs.com 인용 | "출시 전 운영 중" 평가 신호 |

---

## 10. 검증 / Verification

| 검증 항목 | 상태 |
|---|---|
| 단계 1 git push 명령 | ✅ |
| 단계 2 Vercel import 클릭 sequence | ✅ |
| 단계 3 Vercel 도메인 추가 클릭 sequence | ✅ |
| 단계 4 Namecheap DNS 설정 클릭 sequence (Parking Page 함정 포함) | ✅ |
| 단계 5 DNS propagation + SSL 검증 | ✅ |
| 단계 6 LIVE 후 검증 6개 | ✅ |
| 단계 7 흔한 문제 6개 + 해결 | ✅ |
| 단계 8 후속 작업 (og-image, backend, analytics) | ✅ |

---

## 11. 사용자 결정 (배포 진행 시점)

| 결정 | 옵션 |
|---|---|
| 지금 1단계 push 직접 실행할지 | (a) 즉시 / (b) 코드 검토 후 |
| Vercel 가입 시점 | (a) push 직후 / (b) 5/4 아침 |
| 배포 후 5/4 outbound 채널 | (a) 친척 카톡 + 인스타 DM 동시 / (b) 친척만 먼저 |

---

**관련 문서**:
- `2026-05-03-pt-customer-loi-katalk-template.md` — 친척 카톡 메시지 (URL inject 가능)
- `2026-04-30-modoo-startup-pt-application-v1.md` — 신청서 본문 (lunenlabs.com 인용 가능)
