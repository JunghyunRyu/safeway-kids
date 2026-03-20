# 외부 의존성 설정 가이드

SAFEWAY KIDS 프로덕션 배포에 필요한 외부 서비스 및 하드웨어 의존성 설정 가이드.

---

## 1. NHN Cloud SMS (문자 인증)

### 용도
- OTP 인증번호 발송 (`backend/app/modules/auth/service.py`)
- SMS 알림 전송 (`backend/app/modules/notification/providers/sms.py`)

### 설정 절차
1. [NHN Cloud](https://www.nhncloud.com/) 가입 및 조직/프로젝트 생성
2. **Notification > SMS** 서비스 활성화
3. 앱키 발급: 프로젝트 설정 > 앱키 관리
4. 발신번호 등록: SMS > 발신번호 관리 > 번호 등록 및 인증 (통신사 서류 제출 필요)
5. Secret Key 발급: SMS > 보안 설정

### 환경변수
```env
NHN_SMS_APP_KEY=<앱키>
NHN_SMS_SECRET_KEY=<시크릿 키>
NHN_SMS_SENDER_NUMBER=<인증된 발신번호>
```

### 코드 위치
- `backend/app/modules/notification/providers/sms.py` — `NHNCloudSmsProvider.send_sms()`
- `backend/app/config.py` — `nhn_sms_app_key`, `nhn_sms_secret_key`, `nhn_sms_sender_number`

### 비용
- 단문 SMS: 건당 약 9.9원
- 발신번호 인증: 무료 (서류 제출 필요)

---

## 2. Firebase Cloud Messaging (FCM)

### 용도
- 모바일 푸시 알림 (탑승/하차/도착 예정 알림)

### 설정 절차
1. [Firebase Console](https://console.firebase.google.com/) 프로젝트 생성
2. 프로젝트 설정 > 서비스 계정 > **새 비공개 키 생성** (JSON 파일 다운로드)
3. JSON 파일을 `backend/firebase-credentials.json`에 배치
4. Android 앱 등록: SHA-1 인증서 지문 등록
5. iOS 앱 등록: APNs 인증 키 업로드

### 환경변수
```env
GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials.json
```

### 코드 위치
- `backend/app/modules/notification/providers/fcm.py` — `FCMProvider`
- Firebase Admin SDK가 `GOOGLE_APPLICATION_CREDENTIALS`를 자동 탐지

### 주의사항
- `firebase-credentials.json`은 `.gitignore`에 포함되어야 함
- 프로덕션에서는 Secret Manager 또는 환경변수로 주입 권장

---

## 3. Toss Payments (결제)

### 용도
- 학부모 월정산 결제 처리

### 설정 절차
1. [Toss Payments](https://www.tosspayments.com/) 가맹점 등록 신청
2. 사업자등록증, 통장 사본, 대표자 신분증 제출
3. 심사 완료 후 클라이언트 키/시크릿 키 발급
4. 테스트 키로 먼저 연동 테스트 후, 라이브 키 전환

### 환경변수
```env
TOSS_CLIENT_KEY=<클라이언트 키>
TOSS_SECRET_KEY=<시크릿 키>
```

### 코드 위치
- `backend/app/modules/billing/` — 결제 관련 API
- `mobile/src/screens/parent/BillingScreen.tsx` — 결제 위젯 UI

### 모바일 위젯 연동
- React Native에서 Toss Payments SDK 설치:
  ```bash
  npm install @tosspayments/widget-sdk-react-native
  ```
- `BillingScreen.tsx`에서 `preparePayment()` → Toss 위젯 호출 → `confirmPayment()` 플로우
- 현재 코드에 결제 준비/확인 API가 구현되어 있으며, PG 키만 설정하면 동작

### 수수료
- 카드 결제: 3.3% + VAT
- 가상계좌: 건당 300원

---

## 4. Expo Push Notifications

### 용도
- 모바일 푸시 알림의 클라이언트 측 수신

### 설정 절차
1. [Expo](https://expo.dev/) 계정 생성
2. `npx eas-cli login`으로 로그인
3. `app.json`의 `expo.extra.eas.projectId` 설정
4. EAS Build 설정: `eas build:configure`

### 설정 파일
```json
// app.json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "<your-project-id>"
      }
    }
  }
}
```

### 코드 위치
- `mobile/src/hooks/useNotifications.ts` — 푸시 토큰 등록 및 알림 수신
- `mobile/app.json` — Expo 프로젝트 설정

### 주의사항
- Expo Go에서는 푸시 테스트 불가 (실제 빌드 필요)
- iOS는 Apple Developer Program 가입 필요 ($99/년)
- Android는 Google Play Console 등록 필요 ($25 일회성)

---

## 5. Kakao Maps JavaScript API

### 용도
- 웹 대시보드 관제 센터 지도 표시
- 차량 실시간 위치 시각화

### 설정 절차
1. [Kakao Developers](https://developers.kakao.com/) 가입
2. 애플리케이션 등록
3. 플랫폼 > 웹 > 사이트 도메인 등록
4. 앱 키 > JavaScript 키 복사

### 환경변수
```env
VITE_KAKAO_MAPS_API_KEY=<JavaScript API 키>
```

### 코드 위치
- `web/src/pages/platform/PlatformMapPage.tsx` — 관제 센터 지도
- `web/index.html` — Kakao Maps SDK `<script>` 태그

### 주의사항
- 일 30만 건 무료 호출 제한
- 모바일 네이티브 SDK (KakaoMap)는 Expo Go에서 미지원 → 추후 EAS Build 필요
- 웹 JavaScript API는 바로 사용 가능

---

## 6. Edge AI 하드웨어

### 용도
- 차내 이상행동 감지, 안면인식 탑승 확인, 사각지대 감시, 잔류 아동 감지

### 요구 사양

| 항목 | 사양 |
|------|------|
| 컴퓨팅 | NVIDIA Jetson Orin Nano (8GB) 이상 |
| CCTV | 차내 카메라 2대 (전방/후방), 외부 사각지대 카메라 1대 |
| 네트워크 | LTE/5G 모뎀 (차량 이동 중 데이터 전송) |
| 전원 | 차량 12V → 5V DC 컨버터 |
| 저장장치 | NVMe SSD 128GB+ (영상 버퍼링용) |

### 소프트웨어 스택
- JetPack 6.0+ (L4T, CUDA, cuDNN, TensorRT)
- ONNX Runtime 또는 TensorRT 추론 엔진
- GStreamer 파이프라인 (RTSP → 추론 → 이벤트)

### 코드 위치
- `backend/app/modules/edge_gateway/` — Edge AI 이벤트 수신 API
- 추론 모델 코드는 별도 리포지토리에서 개발 예정

### 배포 고려사항
- 차량당 1대의 Jetson 설치
- 초기 파일럿: 5대 차량 × 1세트 = 약 500~700만원
- OTA 업데이트 메커니즘 필요 (NVIDIA Fleet Command 또는 자체 구축)

---

## 7. 앱스토어 / 플레이스토어 제출

### Apple App Store
1. Apple Developer Program 가입 ($99/년)
2. App Store Connect에 앱 등록
3. EAS Build로 iOS 빌드: `eas build --platform ios`
4. 제출 체크리스트:
   - 앱 아이콘 (1024×1024)
   - 스크린샷 (6.7", 6.1", 5.5" 각 최소 1장)
   - 앱 설명 (한국어/영어)
   - 개인정보 처리방침 URL
   - 앱 심사 가이드라인 준수 확인
   - 위치 권한 사용 설명 (NSLocationWhenInUseUsageDescription)
5. TestFlight 내부 테스트 → 외부 테스트 → 제출

### Google Play Store
1. Google Play Console 개발자 계정 등록 ($25 일회성)
2. EAS Build로 Android 빌드: `eas build --platform android`
3. 제출 체크리스트:
   - 앱 아이콘 (512×512)
   - 피처 그래픽 (1024×500)
   - 스크린샷 (폰, 태블릿 각 최소 2장)
   - 앱 설명 및 짧은 설명
   - 개인정보 처리방침 URL
   - 데이터 안전 양식 작성
   - 콘텐츠 등급 설문
4. 내부 테스트 → 비공개 테스트 → 프로덕션 출시

### 코드 위치
- `mobile/app.json` — Expo 앱 설정 (bundle ID, 버전 등)
- `mobile/eas.json` — EAS Build 프로필 설정

---

## 8. Kubernetes 프로덕션 배포

### 서버 요구사항

| 항목 | 최소 사양 |
|------|----------|
| 마스터 노드 | 3대 (HA 구성), 4 vCPU / 8GB RAM 각 |
| 워커 노드 | 2대 이상, 4 vCPU / 16GB RAM 각 |
| 스토리지 | 100GB SSD (PV용) |
| 로드밸런서 | L4/L7 LB 1대 (또는 클라우드 LB) |
| 도메인 | SSL 인증서 (Let's Encrypt 또는 유료) |
| DB | PostgreSQL 14+ (RDS 또는 자체 호스팅) |
| Redis | Redis 7+ (ElastiCache 또는 자체 호스팅) |

### 기존 매니페스트 위치
- `backend/k8s/` — Kubernetes 매니페스트 (확인 필요)
- `backend/Dockerfile` — 백엔드 Docker 이미지
- `backend/docker-compose.yml` — 로컬 개발용 Docker Compose

### 배포 절차
1. 컨테이너 레지스트리 설정 (ECR, GCR, 또는 DockerHub)
2. `docker build -t safeway-kids-api .` → 레지스트리 push
3. K8s 클러스터 프로비저닝 (EKS, GKE, 또는 자체 구축)
4. Namespace, ConfigMap, Secret 생성
5. Deployment, Service, Ingress 적용
6. PostgreSQL, Redis 프로비저닝 및 연결
7. SSL 인증서 설정 (cert-manager)
8. 모니터링: Prometheus + Grafana (이미 `/metrics` 엔드포인트 구현됨)

### 클라우드 추천 (한국)
- **NCP (네이버 클라우드)**: Kubernetes Service, Object Storage, DB for PostgreSQL
- **AWS Korea (서울 리전)**: EKS, RDS, ElastiCache, S3
- 예상 월 비용: 약 50~100만원 (초기 소규모 구성 기준)
