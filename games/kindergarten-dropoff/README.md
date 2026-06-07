# 유치원 등원 — 부모의 마음 🏫

집 식탁부터 유치원 정문까지, 짧은 등원길에 벌어지는 **변수 9가지** 앞에서
부모가 매번 무언가를 고르고 무언가를 내려놓는 — 선택 기반 웹 게임.
**정답은 없다.** 시간을 지키면 아이 마음을 놓치고, 다 받아주면 늦는다.

> React + Vite. SafeWay Kids 모노레포의 `games/` 아래 **독립 앱**(워크스페이스 미포함).

## 게이지 3종

| 게이지 | 의미 |
|--------|------|
| 😊 아이 기분 | 떼와 공감 사이 — 다그치면 ↓, 들어주면 ↑ |
| ⏰ 시간 여유 | 지각과 기다림 사이 — 지체할수록 ↓ |
| ❤️ 안심 | 보내는 마음과 지키는 마음 사이 |

## 케이스 11 (정상 1 + 변수 9 + 지각 엔딩)

등원길 순서대로:

1. 🍚 아침밥 거부 (집)
2. 🙅 "오늘 유치원 안 갈래" (현관)
3. 🎒 실내화·알림장 두고 옴 (골목)
4. 🐕 강아지 보고 멈춤 (골목)
5. 🩹 넘어져 무릎 까짐 (골목)
6. 🧍 낯선 사람이 말 걸기 (길)
7. 🤒 "배 아파" + 미열 (길)
8. 🚸 공 따라 차도로 돌진 (횡단보도)
9. 🚌 통학버스 놓칠 위기 (정문 앞)

**엔딩** (마지막 게이지로 결정):
- 👋 **씩씩한 등원** — 정상/좋은 엔딩 (아이 기분이 높게 유지됐을 때)
- 😢 **정문 앞 우는 아이** — 분리불안 (기분이 낮을 때)
- 🏃 **지각, 그래도 무사히** — 시간을 너무 많이 쓴 경우

플레이 후 게이지 균형에 따라 **오늘의 부모 유형**을 보여준다.

## 실행

```bash
cd games/kindergarten-dropoff
npm install
npm run dev      # http://localhost:5173
```

빌드 / 정적 배포:

```bash
npm run build    # dist/ 생성 (base: './' 라 어디든 그대로 호스팅)
npm run preview
```

## 웹 배포 (GitHub Pages)

`.github/workflows/deploy-kindergarten-game.yml` 가 이 폴더를 빌드해 **GitHub Pages** 로 올린다.

**최초 1회 설정** (repo 관리자):
1. GitHub repo → **Settings → Pages**
2. **Source** 를 **"GitHub Actions"** 로 변경

이후 `games/kindergarten-dropoff/**` 가 바뀌어 푸시되면 워크플로가 자동으로
빌드·배포한다. 수동 실행은 Actions 탭 → 해당 워크플로 → **Run workflow**.

공개 주소(프로젝트 페이지): `https://junghyunryu.github.io/safeway-kids/`
(Vite `base: './'` 라 서브경로에서 그대로 동작한다.)

## 구조

```
src/
  main.jsx            진입점
  App.jsx             상태 머신 (title → scene → result → ending)
  components/Gauges.jsx  게이지 3종 + 증감 플래시
  data/cases.js       케이스·엔딩·부모유형 데이터 (콘텐츠는 전부 여기)
  styles.css          따뜻한 아침 톤 팔레트
```

케이스를 더하거나 문구를 고치려면 **`src/data/cases.js`만** 만지면 된다.
