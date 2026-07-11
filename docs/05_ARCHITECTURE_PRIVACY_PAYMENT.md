# 아키텍처·개인정보·결제 기준

작성일: 2026-07-11  
목적: 정적 PoC에서 유료 상담 서비스로 넘어갈 때 깨지면 안 되는 기술/법적 경계를 정리한다.

## 현재 아키텍처

Saajuu v0.5.0.0은 정적 Vite 앱이다.

- 사주 계산: 브라우저
- 오늘의 운세: 브라우저
- 한자 성명학: JSON lazy-load 후 브라우저 계산
- 프로필 저장: localStorage
- 공유: 개인정보가 제한된 `#r=` 해시
- 분석: GoatCounter 이벤트
- 서버, DB, 로그인, 결제, LLM: 없음

## 서버가 필요한 시점

아래 기능 중 하나라도 시작하면 서버 계층이 필요하다.

| 기능 | 이유 |
|---|---|
| LLM 상담 | API 키 보호, 프롬프트 버전, 안전 필터 |
| 결제 | 주문 생성, 금액 검증, 웹훅 검증 |
| 로그인 | 계정 식별, 동의 기록 |
| 상담 기록 | 저장, 삭제, 보관 기간 관리 |
| 광고 보상 | 일일 한도, 부정 사용 방지 |
| 이메일 리포트 | 이메일 동의, 발송 이력 |

## 권장 목표 구조

```text
Vite Frontend
  -> Server Functions / Edge Functions
    -> Auth
    -> Postgres
    -> Payment Provider
    -> LLM Provider
    -> Email Provider
```

초기 후보:

- Supabase Auth + Postgres + Edge Functions
- Vercel Functions + 관리형 Postgres
- Cloudflare Workers + D1/외부 DB

프런트엔드에 API 키, LLM 키, 결제 시크릿을 넣지 않는다.

## 데이터 모델 기준

| 테이블 | 목적 |
|---|---|
| `users` | 계정 식별 |
| `consent_logs` | 약관/개인정보/마케팅 동의 |
| `birth_profiles` | 암호화된 생년월일시, 달력 구분 |
| `concerns` | 고민 주제와 사용자 요약 |
| `persona_catalog` | 상담사 이름, 스타일, 제공 범위 |
| `products` | 가격, 턴 수, 유효기간 |
| `orders` | 주문금액, PG, 결제 상태 |
| `entitlements` | 사용 가능한 상담 턴과 만료일 |
| `ad_reward_events` | 광고 보상과 일일 한도 |
| `consultation_sessions` | 상담 상태, 상담사, 시작/종료 |
| `consultation_messages` | 대화 원문과 안전 분류 |
| `session_summaries` | 상담 요약, 선택지, 행동 계획 |
| `safety_events` | 위험 주제 감지와 대응 |
| `analytics_events` | 자체 퍼널 이벤트 |

## 결제 흐름

```text
상품 선택
  -> 서버 주문 생성
  -> PG 결제창
  -> PG 승인/웹훅
  -> 서버 금액 재검증
  -> 이용권 발급
  -> 상담 세션 활성화
  -> 영수증/주문내역 저장
```

프런트의 성공 콜백만 보고 이용권을 지급하지 않는다.

## 개인정보 원칙

- 비회원 무료 입력은 기본적으로 브라우저에만 둔다.
- 서버 저장은 로그인/결제/상담 이용 시 명시 동의를 받는다.
- 상담 원문은 가장 민감한 데이터로 취급한다.
- 상담 화면에는 광고 픽셀, 리타겟팅, 제3자 마케팅 태그를 넣지 않는다.
- 사용자 삭제 요청을 지원한다.
- 모델 학습 활용은 기본값 `사용 안 함`이며 별도 선택 동의를 받아야 한다.

## 보관 기간 초안

| 데이터 | 기본 보관 |
|---|---|
| 비회원 무료 입력 | 브라우저 localStorage |
| 가입자 출생정보 | 사용자가 삭제할 때까지 또는 별도 설정 |
| 무료 상담 원문 | 7~30일 |
| 유료 상담 원문 | 90일 또는 사용자 선택 |
| 상담 요약 | 사용자가 삭제할 때까지 |
| 결제정보 | 법정 보존기간 |
| 광고 보상 기록 | 부정 이용 방지에 필요한 기간 |

## 필수 고지

- AI 상담 고지
- 오락/자기성찰 목적 고지
- 의료·법률·투자·임신·출산 판단 대체 금지
- 상품 범위, 이용기간, 환불 기준
- 사업자 정보와 고객센터
- 제3자 처리 위탁: LLM, 결제, 이메일 등

## v0.5.5 Supabase 선택 및 적용 경계

Supabase 프로젝트 `eizojtispxmlwvhgpmgs`를 서버 계층의 1차 후보로 확정했다.

v0.5.8에서 초기 마이그레이션과 advisor 보강 마이그레이션을 Supabase 원격 DB에 적용했다.

- 마이그레이션: `supabase/migrations/20260711002500_initial_monetization_schema.sql`
- 보강 마이그레이션: `supabase/migrations/20260711065737_harden_advisor_findings.sql`
- 운영 메모: `supabase/README.md`
- 적용 계획: `docs/07_SUPABASE_IMPLEMENTATION_PLAN.md`
- 환경변수 예시: `.env.example`

적용 전 필수 조건:

1. 개인정보처리방침과 약관의 수집 항목, 보관기간, 삭제 정책 초안 확정
2. 상담 시작 전 AI 고지와 민감 상담 동의 문구 확정
3. Auth redirect URL과 로그인 제공자 확정
4. Edge Functions에서만 처리할 작업 경계 확정
5. Edge Functions 구현 전 실제 로그인/프로필 저장 동작 확인

프런트엔드는 브라우저 공개 키만 사용한다. `SUPABASE_SERVICE_ROLE_KEY`, LLM 키, PG 키는 Edge Functions 또는 별도 서버 런타임에서만 사용한다.

원격 적용 후 Supabase advisor 결과는 `No issues found`다.
