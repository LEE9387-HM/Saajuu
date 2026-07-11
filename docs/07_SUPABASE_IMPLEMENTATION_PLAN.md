# Supabase Implementation Plan

작성일: 2026-07-11  
상태: 초기 스키마, advisor 보강, 인연 초대, 무료 상담 세션 Edge Function을 원격 적용 완료.

## 결정 사항

- Supabase project ref: `eizojtispxmlwvhgpmgs`
- Codex MCP server name: `supabase`
- 인증 상태: OAuth 연결 확인됨
- 프런트엔드: 현재 Vite 정적 앱 유지
- 백엔드 경계: Supabase Auth, Postgres, Edge Functions

현재 Codex 세션에서는 Supabase MCP 서버가 목록에 보이지만 실제 Supabase SQL/advisor 도구가 아직 노출되지 않았다. 원격 적용과 advisor 확인은 `npx --yes supabase` CLI로 수행했다.

## 현재 추가된 파일

- `supabase/migrations/20260711002500_initial_monetization_schema.sql`
- `supabase/migrations/20260711065737_harden_advisor_findings.sql`
- `supabase/migrations/20260711072928_relationship_invite_rpc.sql`
- `supabase/migrations/20260711073557_remove_relationship_invite_rpc.sql`
- `supabase/functions/accept-relationship-invite/index.ts`
- `supabase/functions/create-consultation-session/index.ts`
- `supabase/README.md`
- `.env.example`

## 스키마 범위

| 영역 | 테이블 |
|---|---|
| 계정 | `profiles`, `consent_logs` |
| 출생정보 | `birth_profiles` |
| 인연 연결 | `relationship_invites`, `relationship_links` |
| 상품 | `persona_catalog`, `products` |
| 결제 | `orders`, `entitlements` |
| 상담 | `concerns`, `consultation_sessions`, `consultation_messages`, `session_summaries` |
| 안전 | `safety_events` |
| 광고 보상 | `ad_reward_events` |
| 분석 | `analytics_events` |

모든 앱 테이블은 RLS를 켠다. 사용자는 본인 소유 데이터만 읽거나 제한적으로 생성한다. 결제, 이용권, 상담 메시지 생성처럼 신뢰가 필요한 쓰기는 Edge Functions가 service role로 처리한다.

## 필요한 Edge Functions

| 함수 | 역할 |
|---|---|
| `create-consultation-session` | 이용권/체험권 확인 후 상담 세션 생성 — v0.5.11 배포 완료 |
| `send-consultation-message` | 턴 수 차감, 안전 분류, LLM 호출, 메시지 저장 |
| `create-payment-order` | 상품 가격을 서버에서 검증하고 PG 주문 생성 |
| `portone-webhook` | 결제 승인/취소 웹훅 검증 후 이용권 발급 |
| `grant-ad-reward` | 보상형 광고 완료 검증 및 일일 한도 적용 |
| `accept-relationship-invite` | 초대 토큰 검증 후 양방향 인연 링크 생성 — v0.5.10 배포 완료 |

## Dashboard Checklist

1. Authentication > URL Configuration
   - Site URL: 현재 GitHub Pages URL 또는 커스텀 도메인
   - Redirect URLs: `http://localhost:5173`, `https://lee9387-hm.github.io/Saajuu/`, 향후 커스텀 도메인
2. Authentication Providers
   - Google, Kakao, email magic link 중 실제로 사용할 제공자만 활성화
3. Edge Function Secrets
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `PORTONE_API_SECRET`
   - `PORTONE_WEBHOOK_SECRET`
4. Database
   - 마이그레이션 적용 후 RLS advisor 확인
   - exposed schema의 신규 테이블에 RLS가 켜졌는지 확인
   - anon/authenticated 권한이 의도한 범위로만 열렸는지 확인

## 적용 전 검증

```bash
npm test
npm run build
npx --yes supabase link --project-ref eizojtispxmlwvhgpmgs
npx --yes supabase db push --dry-run
```

v0.5.8에서 실제 `db push`를 완료했고, 원격 advisor 결과는 `No issues found`다.

## v0.5.8 Remote Apply

실행 완료:

```bash
npx --yes supabase link --project-ref eizojtispxmlwvhgpmgs
npx --yes supabase db push --dry-run
npx --yes supabase db push
npx --yes supabase db advisors --linked --type all --level warn --fail-on none
```

적용된 마이그레이션:

- `20260711002500_initial_monetization_schema.sql`
- `20260711065737_harden_advisor_findings.sql`
- `20260711072928_relationship_invite_rpc.sql`
- `20260711073557_remove_relationship_invite_rpc.sql`

v0.5.10에서 공개 `SECURITY DEFINER` RPC는 advisor 경고 때문에 제거했고, 초대 수락은
Edge Function `accept-relationship-invite`로 이동했다. 최종 advisor 결과는 `No issues found`다.

## 다음 구현 순서

1. Supabase 클라이언트 초기화 모듈 추가
2. 로그인 버튼과 Auth callback 처리
3. `profiles` 및 `consent_logs` 생성 흐름
4. 관계 초대 링크 생성 UI — v0.5.10 완료
5. 초대 수락 후 `relationship_links` 연결 — v0.5.10 완료
6. 상담 세션 생성 Edge Function — v0.5.11 완료
7. 결제 주문/웹훅 Edge Function

## v0.5.6 OAuth 진행 상태

완료:

- `@supabase/supabase-js` 추가
- `src/auth.js` 클라이언트 모듈 추가
- 마이 영역에 카카오/Google OAuth 시작 버튼, 세션 표시, 로그아웃 버튼 추가
- v0.5.7에서 로그인 세션 생성 후 `profiles` upsert 준비 로직 추가
- v0.5.9에서 로그인 사용자 필수 동의 폼과 `consent_logs` insert 로직 추가

아직 필요 없는 키:

- `OPENAI_API_KEY`: 실제 AI 상담 Edge Function에서 LLM을 호출할 때 필요하다.
- `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`: 유료 상담권 결제와 웹훅 검증을 붙일 때 필요하다.

따라서 현재 단계에서는 Supabase Auth provider 설정만 먼저 완료하면 된다.

## v0.5.9 Consent Flow

필수 동의 항목:

- `terms` / version `2026-07-11`
- `privacy` / version `2026-07-11`
- `ai_notice` / version `2026-07-11`

현재는 약관 전문 페이지가 아니라 상담 체험 전 필요한 고지 확인용 최소 로그다. 결제 전에는 별도의 상품 약관, 환불 기준, 고객센터, 사업자 정보 고지 화면을 추가해야 한다.

## v0.5.10 Relationship Invite Flow

완료:

- 로그인 사용자가 인연 탭에서 관계 유형별 초대 링크를 생성한다.
- 브라우저는 32바이트 토큰을 만들고 SHA-256 해시만 `relationship_invites`에 저장한다.
- 공유 URL에는 `#invite=` 토큰만 들어가며 생년월일시, 이름, 고민은 포함하지 않는다.
- 초대 수락은 배포된 Edge Function `accept-relationship-invite`가 처리한다.
- 함수는 사용자 JWT를 확인한 뒤 service role로 초대 토큰, 만료, 폐기, 자기 초대, 중복 수락을 검증하고 `relationship_links`를 생성한다.
- 인증 없는 함수 호출은 401로 거절됨을 확인했다.

다음 확인:

- 실제 카카오/Google 계정 2개로 초대 생성 및 수락 end-to-end QA.
- 연결 상대의 표시 이름을 보여줄지 여부는 개인정보 노출 정책을 정한 뒤 별도 설계한다.

## v0.5.11 Consultation Session Flow

완료:

- 상담 탭에 무료 3턴 trial 세션 생성 UI를 추가했다.
- 필수 동의가 완료된 로그인 사용자만 `create-consultation-session`을 호출할 수 있다.
- Edge Function은 사용자 JWT, 필수 동의 로그, 상담사/주제/모드 입력값을 검증한다.
- 현재는 `trial_3_turns` 상품만 허용한다. 기본/프로 유료 상담은 결제와 이용권이 붙은 뒤 연다.
- 세션 생성 시 `concerns`와 `consultation_sessions`를 생성한다.
- 기존 활성 trial 세션이 있으면 중복 생성하지 않고 재사용한다.
- 인증 없는 함수 호출은 401로 거절됨을 확인했다.

다음 확인:

- 실제 로그인 계정으로 필수 동의 저장 후 trial 세션 생성 end-to-end QA.
- `send-consultation-message`에서 턴 차감, 안전 분류, LLM 호출, 메시지 저장을 구현한다.
