# 사주 한 장

생년월일시를 입력하면 사주의 네 기둥과 오행 분포를 보여주는 정적 웹 PoC입니다.
모든 계산은 브라우저에서 실행되며 입력값은 저장하거나 외부로 전송하지 않습니다.

## 과제 현황

다음 작업을 이어갈 때는 [PROJECT_STATUS_README.md](./PROJECT_STATUS_README.md)를 먼저 확인하세요.
현재 제품 방향, 배포 주소, 수익화 계획, 서버/LLM 확장 포인트, 남은 과제가 정리되어 있습니다.

## 주요 기능

- 양력·음력·윤달과 0~59분 단위의 출생시각 입력
- 연주·월주·일주·시주 계산
- 오행 분포와 짧은 규칙 기반 해석
- 일간·오행·십신 근거가 표시되는 네 가지 상세 풀이
- 모바일 대응
- `main` 브랜치 푸시 시 GitHub Pages 자동 배포

## 로컬 실행

```bash
npm install
npm run dev
```

테스트와 프로덕션 빌드:

```bash
npm test
npm run build
```

## 배포

`.github/workflows/deploy-pages.yml`이 `main` 브랜치 푸시를 감지해 테스트·빌드 후
GitHub Pages에 배포합니다. 저장소의 **Settings → Pages → Build and deployment →
Source**가 **GitHub Actions**로 설정되어 있어야 합니다.

## 계산 기준

사주 계산에는 [`manseryeok`](https://github.com/yhj1024/manseryeok) 라이브러리를
사용합니다. 이 서비스는 전통문화·오락용 PoC이며 중요한 의사결정의 근거가 아닙니다.
