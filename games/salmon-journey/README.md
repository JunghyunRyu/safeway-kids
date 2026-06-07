# 연어의 여행 🐟 (Salmon Journey)

알을 낳기 위해 강을 거슬러 올라가는 연어를 조작하는 아주 간단한 모바일 웹 게임.
외부 에셋·라이브러리 없이 **단일 HTML 파일**(`index.html`)로 동작한다.

## 플레이 방법
- 📱 모바일: 화면을 **위/아래로 스와이프**해 레인 이동
- 💻 데스크톱: **↑/↓** 또는 **W/S** (시작/재시작은 Space/Enter)
- 🪨 바위, 🐻 곰, 🎣 낚싯바늘을 피하고, 🟠 **알**을 먹으면 보너스 점수
- 거슬러 올라간 거리(m)가 점수. 시간이 지날수록 빨라진다.
- 최고 기록은 브라우저(localStorage)에 저장된다.

## 실행
설치 불필요. `index.html`을 브라우저로 열면 끝.

로컬 서버로 열고 싶다면:
```bash
cd games/salmon-journey
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080
```

## 구현 메모
- HTML5 Canvas + requestAnimationFrame 루프
- 4개 레인 기반 엔드리스 러너, 난이도(스폰 속도·이동 속도) 점진 증가
- 연어/장애물/알은 Canvas 도형 + 이모지로 그려 별도 이미지 파일 없음
- DPR 대응(고해상도 화면 선명), `viewport-fit=cover`로 노치 대응
