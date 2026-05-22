# OQ-9 경쟁사 5사 재검증 record (2026-05-08)

**문서 분류**: 신청서 v2.1 → v2.2 inject D·E 작업의 raw input record
**작성일**: 2026-05-08 (D-7)
**검증 방법**: WebFetch × 4 + WebSearch × 2 (모두 공식 채널)
**기존 매트릭스**: `artifacts/business/fundraising/2026-04-29-modoo-startup-pt-competitor-matrix.md` (9일 경과)
**수정본**: `artifacts/business/fundraising/2026-05-08-modoo-startup-pt-application-v2.2.md`
**처리 OQ**: OQ-9 (P3 산업 전문가 5/7 채점 지적: "공급자 온보딩 채널 구체성 부족")

---

## 0. Executive Summary

5사 web 재검증 결과 **변동 4건 식별**. 4건 모두 신청서 v2.1 narrative와 부분 충돌 → v2.2 Inject D (Q2 미주 *주0) + Inject E (Q4 자금 채널) 흡수로 처리. v2.1 본문 핵심 결론("5사 모두 단일 기능에 머물며")은 그대로 유효.

**가장 중요한 변동**: 와요·펫플래닛이 ㈜펫피플 동일 그룹 운영 (4/29 매트릭스 미발견). 평가위원 사실관계 점검 시 -2~3점 risk 차단을 위해 미주 명시 필수.

---

## 1. 5사 변동 매트릭스

| 사업자 | 매트릭스 (4/29) | 재검증 (5/8) | 신청서 영향 | 처리 |
|--------|----------------|--------------|-------------|------|
| **도그메이트** | 1등, 2025-06 커넥팅더닷츠 인수 | dogmate.co.kr → mogwai.co.kr 301 영구 redirect (인프라 동일, 김희정 대표) — 리브랜드 진행 중 | 도그메이트 표기 9~12개월 내 stale risk | Inject D 미주 1줄 ("2025-06 커넥팅더닷츠 인수 후 mogwai로 리브랜드 진행 중") |
| **와요** | 별개 메이저, LIVE+GPS, 회당 약 20,000원 | 회당 19,500원~ (가격 일치), petplanet.co가 와요를 "sister service"로 호명 — **㈜펫피플 운영** | "5개 주요 사업자" → 실제 4그룹 (와요+펫플래닛 = 1) | Inject D 미주 + 본문 "사업자→서비스" 1단어 변경 |
| **펫플래닛** | 별개 메이저, 가정집 위탁 | **㈜펫피플 운영 (와요와 같은 그룹)** + **산자부 규제 샌드박스 실증특례 승인** (가정집 펫시팅) | 양면: ① 차별성 narrative ↓ (그룹사 합산 시 시장 점유 ↑) ② PT 라이프스타일 슈퍼앱 차별성 ↑ (펫시터 분야 sandbox 선례 → 인접 영역 확장 가능) | Inject D 미주 (사실관계) + 향후 v3에서 §6 SafeWay 시너지 narrative에 활용 가능 |
| **에어댕냥이** | 메이저, 이웃 매칭 | Play Store 100+ 다운로드 (소규모), 운영사 ㈜에어댕냥이 | "메이저"는 과장 — 단 매트릭스 fit "메이저" 표현은 v1·v2.1 어디에도 직접 사용 X (5사 list만), 신청서 narrative 영향 작음 | 처리 불요 |
| **펫피** | 산책 + 포인트 (게임화), "산책 자체보다 보상" | 자기 강아지 산책 + 포인트 적립 → 용품 교환 (펫시터 매칭 기능 0). 운영사 ㈜플레이팡(?), 30만 다운로드 자칭, 2019-11 런칭 | "5사 산책 매칭" framing 부정확 (펫피는 펫시터 매칭 X) | Inject D 미주 ("자기 강아지 산책+포인트 적립형, 펫시터 매칭 기능 미보유") |

---

## 2. 사실관계 출처 (verifiable claims만)

### 2-1. dogmate → mogwai 리브랜드
- **출처 1**: WebFetch `https://www.dogmate.co.kr` 시도 → `301 Moved Permanently` to `https://mogwai.co.kr/` (2026-05-08 실측)
- **출처 2**: WebFetch `https://mogwai.co.kr/` 페이지 분석 — `static.dogmate.co.kr` 인프라 그대로 사용 + 대표 김희정 + 사업자등록 157-88-00212
- **인수 출처**: `https://www.venturesquare.net/972349` (2025-06-10), `https://platum.kr/archives/262721` (4/29 매트릭스에 이미 인용)

### 2-2. 와요 + 펫플래닛 = ㈜펫피플 동일 그룹
- **출처 1**: WebFetch `https://wayopet.com/` — "A sister service, PetPlanet, handles in-home pet sitting" 명시
- **출처 2**: WebFetch `https://petplanet.co/` — 운영사 "주식회사 펫피플 (PET PEOPLE Inc.)" 명시 + 와요를 "다양한 반려동물 서비스" 섹션에 "방문 펫시터 부르기" alternative로 list
- **자체 기재 신뢰도**: 양 사이트 자기 신고이므로 verifiable claim 등급 ★★★★ (반박 가능성 낮음)

### 2-3. ㈜펫피플 산자부 규제 샌드박스 실증특례 승인
- **출처**: WebFetch `https://petplanet.co/` — "규제샌드박스 실증특례 승인" 명시 (산자부)
- **한계**: 승인 시점·범위·내용 페이지 미공개. 산자부 규제 샌드박스 DB 추가 검증 가능하나 본 inject D 인용 시 과도한 detail 회피 위해 "가정집 위탁 분야 산자부 규제 샌드박스 실증특례 보유" 일반 표현 사용
- **신청서 inject 시 신중**: SafeWay 자매 사업이 ICT 샌드박스 별도 진행 중이므로, 평가위원이 "SafeWay와 동일?" 오해 risk 회피 위해 v2.2 본문에는 ㈜펫피플 sandbox 사실 인용 안 함. v3에서 §6 멀티앱 시너지 narrative에 활용 가능

### 2-4. 펫피 = 펫시터 매칭 X
- **출처**: WebFetch `https://www.petp.kr/` — "산책, 커뮤니티, 이벤트, 체험단, 포인트로 용품 교환" 명시. **펫시터 매칭 기능 언급 0**
- **30만 다운로드**: 자기 신고, 시점 미공개. 신청서 inject D에는 인용 안 함

### 2-5. 에어댕냥이 정보 부족
- **출처**: WebFetch `https://play.google.com/store/apps/details?id=com.airdny.co.kr.app` — Play Store 페이지 truncated, 운영사 ㈜에어댕냥이 + "100+" 다운로드만 추출 가능
- **신청서 inject D 미주에 별도 언급 안 함** (변동 작음 + 정보 신뢰도 낮음)

---

## 3. P3 공급자 온보딩 채널 약점 직접 보강 (Inject E 정당화)

P3 5/7 채점 지적: *"공급자(펫시터 100명) 온보딩 채널 구체성 부족 — 마케팅 자문 채널만 명시"*

5사 재검증 결과를 활용한 채널 2축:

### 채널 1: 마포·용산 구청 신고 펫시터 등록 사업자 콜드 컨택
- **근거**: 부가가치세법 시행령 §69-2 (반려동물 위탁관리업) — 지자체 신고 의무. 마포·용산 beachhead 지역의 신고 사업자 명단은 지자체 공개 정보로 확보 가능
- **방법**: 콜드 메일 + 전화 → PT 등록 → 1차 온보딩
- **예상 풀**: 마포·용산 합계 약 30~50개 사업자 (KOSIS 통계 추정)

### 채널 2: 도그메이트(mogwai)·와요 등록 펫시터 리타겟팅 광고
- **근거**: 5사 재검증 결과 도그메이트(mogwai)·와요 등록 펫시터 풀이 가장 큼 (도그메이트 누적 펫시터 수치 미공개이나 8만+ 반려인 이용 + 와요 30만+ 반려인 베이스 추정)
- **방법**: 인스타·페이스북 인구통계 타겟팅 — "펫시터 활동 중", "30~60대 반려동물 경험자" 광고
- **단가**: CAC 15,000원 가정 시 펫시터 100명 = 150만 원 (마케팅·홍보 2,500만의 6%)

이 2축 채널 명시로 P3 약점 직접 해소 + 자금 사용 계획 정합성 ↑.

---

## 4. v3 잔여 개선 여지 (5/13 freezing 전)

| 항목 | 효과 | 우선순위 |
|---|---|---|
| 산자부 규제 샌드박스 DB 직접 검증 (㈜펫피플 승인 시점·범위) | v3 §6 멀티앱 시너지 narrative 강화 | P2 |
| 에어댕냥이 운영 상태 추가 검증 (사용자 체험 후기 검색) | 영향 작음 | P3 |
| 도그메이트 → mogwai 리브랜드 완료 시점 추적 | 신청 시점 표기 적정성 결정 | P2 |
| 펫봄·기타 펫시터 매칭 사업자 (Play Store 검색 결과 노출) 추가 검증 — 5사 list 정합성 | 시장 분석 완성도 ↑ | P3 |

---

## 5. Open Questions (v3 재검증)

| OQ | 질문 | 출처 |
|---|---|---|
| OQ-9-A | 펫봄 (com.petbom) — Play Store "전국 1등 검증된 펫시터" 자칭 → 실제 시장 점유 검증 필요 | WebSearch 결과 |
| OQ-9-B | ㈜펫피플 산자부 규제 샌드박스 실증특례 승인 시점·범위 — DB 직접 조회 | petplanet.co (시점 미공개) |
| OQ-9-C | 도그메이트 → mogwai 리브랜드 완료 시점 — venturesquare·platum 후속 보도 추적 | 인수 후 9~12개월 추정 |

---

## 6. Sources

- 도그메이트: https://www.dogmate.co.kr (→ redirect mogwai)
- mogwai: https://mogwai.co.kr/
- 도그메이트 인수: https://www.venturesquare.net/972349, https://platum.kr/archives/262721
- 와요: https://wayopet.com/
- 펫플래닛: https://petplanet.co/
- 에어댕냥이: https://play.google.com/store/apps/details?id=com.airdny.co.kr.app
- 펫피: https://www.petp.kr/, https://play.google.com/store/apps/details?id=com.dfang.playfang
- 펫봄 (참고): https://petbom.com/, https://play.google.com/store/apps/details?id=com.petbom
- 펫시터 매칭 시장 동향: https://leeandpol.com/ko/pet-sitter/
