# 시연자 전용 노트 — 변호사에게 보여주지 마세요

> 본 파일은 `cheatsheet.html` 변호사용 소개 페이지에서 분리한 **시연자 본인 전용** 가이드입니다.
> 약점 방어 멘트, 응급 처치, 백업 명령, 오늘 적용한 패치 메모를 포함합니다.

---

## 1. 약점 + narration 처방 (변호사 질문 시 즉답 매뉴얼)

| 변호사 질문 | 즉답 패턴 |
|---|---|
| "§6 위치정보관리책임자 — 전화가 '준비중'으로 되어 있네요?" | "법인 설립 후 정식 등록 예정입니다. 시뮬레이터 단계에서는 jhryu115@gmail.com 단일 책임자 구조로 운영. 위치정보사업자 신고 시 실명 등록을 동시에 진행합니다." |
| "책임자 실명이 없는데?" | "1인 창업자 본인이 보호책임자를 겸임합니다. 법인 등기 직후 위치정보사업자 신고서에 실명을 등록할 예정. 양길모 변호사 자문에서도 '신고 직전 등록'으로 충분하다는 의견." |
| "AI 학습에 어린이 데이터를 쓰나요?" | "학습은 사전 학습된 ArcFace 모델을 사용합니다. 등록 단계에서 사용자별 특징 벡터를 생성할 뿐, 모델 자체를 fine-tuning하지 않습니다. 따라서 학습 데이터로 어린이 정보가 쓰이지 않습니다." |
| "사고 시 책임 소재?" | "운수사업자가 1차 운송계약 책임자, 학원이 위탁자, 플랫폼이 중개자. 양길모 변호사 의견서(KISED #32399) Q1 답변. 보험은 운수사 + 학원 양쪽 가입." |
| "동의 철회 시 데이터 삭제?" | "철회 즉시 위치정보는 삭제. 법정보관 의무 자료(세금계산서·운행기록 등)만 별도 보관. /location-terms §4·§5에 명시." |
| "제3자 제공 동의는 별도로?" | "위치정보법 §18에 따라 위치정보 동의는 본동의와 분리된 별도 양식. /location-terms 페이지가 그 별도 양식의 본문입니다. 회원가입 시 체크박스 분리." |
| "하드웨어(Jetson, LiDAR)는 실제 도입했나?" | "시뮬레이터로 동작 검증 완료, 하드웨어 구매는 샌드박스 통과 후 1차 파일럿 학원과 동시 진행. 기술적으로는 동일 알고리즘이 그대로 작동 — 오늘 보신 시뮬레이터가 실제 출시 코드입니다." |
| "왜 3대만 움직이나요? (GPS 시연 중)" | "시뮬레이터 인자값으로 동시 시연 차량 수를 3대로 제한한 것이고, 실제 운영 시에는 학원당 수십 대가 동시에 송신됩니다." |

---

## 2. 결정타 카드 — 미팅 도중 한 번씩 던지면 효과

- **CARD-1** "원본 이미지는 저장하지 않습니다. 512차원 특징 벡터만 AES-256으로 암호화 저장됩니다." (Edge AI 시연 직후)
- **CARD-2** "위치정보는 운행 종료 후 30일 보관, 이후 자동 익명화." (GPS 시연 직후)
- **CARD-3** "고영향 AI에 해당하지 않습니다. 양길모 변호사 자문(KISED #32399, 2026-05-02). 다만 자발적 거버넌스 이중 트랙으로 대응 — v2.1 §4.6에 명문화."
- **CARD-4** "운수사업자 = 1차 운송계약자, 학원 = 위탁자, 플랫폼 = 중개자. 양길모 자문 Q1 답변에 명시."
- **CARD-5** "Student.name은 AES-GCM 암호화 + name_hash 인덱스. OTP 6자리 만료 5분. 감사로그 100% 기록. 개보법 §29 안전조치 의무 충족."
- **CARD-6** "정통망법 임시조치 의무는 면제. 양길모 자문 Q3 — 통신매개자가 아닌 운송 중개자."
- **CARD-7 (Closing)** "방금 보신 모든 동작이 처리방침 §5에 법적으로 명문화되어 있습니다. 코드와 약관이 한 줄로 정렬되어 있다는 게 오늘 시연의 핵심입니다."

---

## 3. 응급 처치 — 시연 중 사고 대응

| 증상 | 즉시 대응 |
|---|---|
| Edge AI 웹캠 안 잡힘 | 다른 프로그램(Zoom/Teams)이 웹캠 점유 중 → 종료 → start.bat 재실행 |
| 웹 대시보드 토스트 폭주 ("서버 오류") | Redis 미기동 + redis.py wrapper가 동작 중. 새로고침 한 번 → 정상화 (이미 패치됨) |
| /map 차량 마커 안 보임 | ① [5] GPS 시뮬레이터 떠 있나? ② 백엔드 cmd 창에 POST /gps 200 OK 로그 있나? ③ 카카오 키 등록 도메인 (localhost:5173) 확인 |
| GPS sim에서 403 에러 | backend/scripts/gps_replay.py가 driver 토큰으로 시작하는지 + service.check_vehicle_access의 dev bypass 활성 확인 |
| 변호사가 폰으로 직접 보고 싶다 | 노트북 IP 확인(`ipconfig`) → 같은 와이파이에서 `http://노트북IP:5173` |
| 한글이 비디오 위에서 ?로 깨짐 | 이미 PIL 한글 헬퍼로 패치됨. 만약 재발하면 `C:\Windows\Fonts\malgun.ttf` 존재 여부 확인 |
| 전체 멈춤 — 가장 강한 reset | 런처 [9] (Stop ALL) → [6] (Start ALL) → 시드 데이터 1회 재실행 |

---

## 4. 백업 명령 — .bat 안 되면 직접 cmd

### 백엔드 단독 실행
```
cd C:\jhryu\01_project\safeway_kids\backend
.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 웹 대시보드 단독
```
cd C:\jhryu\01_project\safeway_kids\web
npm run dev
```

### 사이트 단독
```
cd C:\jhryu\01_project\safeway_kids\site
npm run dev
```

### GPS 시뮬레이터 단독
```
cd C:\jhryu\01_project\safeway_kids\backend
.venv\Scripts\activate
python scripts\gps_replay.py --vehicles 3 --interval 5
```

### Edge AI 단독
```
cd C:\jhryu\01_project\safeway_kids\edge_ai
start.bat
```

### 시드 데이터 재생성
```
cd C:\jhryu\01_project\safeway_kids\backend
.venv\Scripts\activate
python -m app.seed
```

---

## 5. 오늘(2026-05-07) 미팅 직전 적용한 패치 메모

시연 중 동일 증상이 또 나오면 빠르게 원인을 짚을 수 있도록 정리.

- **Edge AI config.py** — `FACE_TOLERANCE`, `YOLO_MODEL`, `BEHAVIOR_*_THRESHOLD` 4개 alias 추가
- **Edge AI main.py** — PIL 한글 헬퍼 `_put_text_kr` 추가, 비디오 위 한글 ???? 깨짐 해소
- **backend/app/redis.py** — Redis 미기동 시 NoOp fallback wrapper. set/get은 in-memory KV로 받침. shortcut path로 첫 호출 후 즉시 응답
- **backend/app/modules/vehicle_telemetry/service.py** — `check_vehicle_access`에 dev bypass 1줄 (`if settings.environment == "development": return True`)
- **backend/.env → web/.env.local** — `VITE_KAKAO_MAPS_API_KEY`로 이동 (Vite는 `VITE_` 접두사 + web/ 디렉토리에서만 읽음)
- **web PlatformMapPage.tsx** — `infoWindow.setPosition()` 호출 추가, 번호판 라벨이 마커 따라가도록
- **demo/05-gps-sim.bat** — health endpoint `/healthz` → `/health`
- **backend/scripts/gps_replay.py** — driver phone(01011111111) + role=driver 사용 (시드된 김운전 user 매칭)

---

## 6. 미팅 시작 5~10분 전 체크리스트

```
□ 노트북 외부모니터/미러링 설정 확인
□ 마이크/스피커 — Edge AI 음성 경고 들리는지 사전 테스트
□ 웹캠이 가려져 있지 않은지 + Zoom/Teams 종료
□ launcher.bat → [6] (Start ALL) 실행
□ 4창 다 떴는지 확인:
   - http://localhost:8000/docs       Swagger
   - http://localhost:5173            웹 대시보드
   - http://localhost:3000            사이트
   - http://localhost:7860            Edge AI
□ 웹 대시보드 → 플랫폼 관리자 로그인 (010-0000-0000 / 000000)
□ /seed 메뉴에서 시드 데이터 1회 생성 (이미 8대 있다면 skip)
□ /map 페이지 미리 띄워두기
□ launcher.bat [D] → cheatsheet.html을 변호사 측 화면에 미리 띄워두기
□ launcher.bat [5] GPS 시뮬레이터는 미팅 시작 직후 실시간 시연용 — 미리 띄우지 말기
```
