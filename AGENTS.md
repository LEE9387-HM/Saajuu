# Saajuu — 에이전트 공통 지침

이 저장소에서 작업하는 모든 AI 도구(Codex, Claude Code 등)는 아래 순서를 따른다.

1. **[PROJECT_STATUS_README.md](./PROJECT_STATUS_README.md)를 가장 먼저 읽는다.**
   현재 상태, 아키텍처, 일일 운세 알고리즘, 한자 성명학 데이터 파이프라인,
   보류된 작업과 착수 조건, 안전/법적 가드레일이 전부 여기 있다.
2. 작업 방향이 제품/수익화 관련이면 [docs/monetization-plan.md](./docs/monetization-plan.md)를 본다.
3. UI/스타일 작업이면 [DESIGN.md](./DESIGN.md)의 색 토큰·타이포·카피 규칙을 따른다.
4. 새 작업이 [TODOS.md](./TODOS.md)에 적힌 보류 항목(PWA·SEO 페이지·다중 프로필)에
   해당하면, 착수 조건이 실제로 충족됐는지 사용자에게 먼저 확인한다. 코드가 없어서
   보류된 게 아니라 데이터나 의사결정이 없어서 보류된 것이다.
5. 변경 전 `npm test`로 기존 52개 테스트가 통과하는 상태인지 확인하고, 변경 후에도
   `npm test && npm run build`로 검증한다.
6. 작업이 끝나면 `CHANGELOG.md`, `VERSION`(및 `package.json`의 `version`),
   `PROJECT_STATUS_README.md`의 "최근 구현 내용"을 갱신한다.
7. `main`은 푸시 즉시 GitHub Pages에 자동 배포된다(`.github/workflows/deploy-pages.yml`).
   푸시 전에 사용자 승인을 받는다.

## 지키면 안 되는 것 (PROJECT_STATUS_README.md에 상세)

- API 키·LLM 키를 프런트엔드 코드에 직접 넣지 않는다.
- 생년월일시 등 개인정보를 서버로 전송하지 않는다 (현재 전부 클라이언트 계산).
- 공유 딥링크(`#r=...`)에 이름·고민·톤을 넣지 않는다.
- 단정적 예언 표현("무조건 결혼한다", "투자하면 돈 번다" 등)을 쓰지 않는다.
- 카드 카피를 "~가 아닙니다"로 시작하지 않는다 — 한 줄 결론(verdict)을 먼저 준다.
