# 구현 태스크 목록 - DOT Platform V0.2 환경 설정

## 개요
- **프로젝트**: DOT Platform V0.2 - 레스토랑 관리 시스템
- **기술 스택**: Next.js 14, Supabase, TypeScript, Tailwind CSS, Zustand
- **예상 기간**: 7일 (병렬 실행 시 5일)

## 병렬 실행 가이드
`[P]` 표시된 태스크는 병렬로 실행 가능합니다. Task 에이전트를 사용하여 동시 실행하세요:

```bash
# 예시: 여러 테스트 파일을 병렬로 생성
Task --parallel "T004, T005, T006 테스트 파일 생성"
```

---

## Phase 1: 프로젝트 초기 설정 (Day 1)

### T001: Next.js 프로젝트 초기화
**파일**: `package.json`, `next.config.js`, `tsconfig.json`
**명령어**:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --import-alias "@/*"
```
**체크리스트**:
- [ ] Next.js 14 설치 완료
- [ ] TypeScript 설정
- [ ] Tailwind CSS 설정
- [ ] ESLint 설정
- [ ] 경로 별칭 (@/*) 설정

### T002: 필수 의존성 설치
**파일**: `package.json`
**명령어**:
```bash
npm install @supabase/supabase-js @supabase/ssr zustand \
  react-hook-form @hookform/resolvers zod \
  i18next react-i18next next-i18next \
  @tanstack/react-query date-fns
```
**개발 의존성**:
```bash
npm install -D @types/node prettier eslint-config-prettier \
  @testing-library/react @testing-library/jest-dom \
  jest jest-environment-jsdom
```

### T003: 프로젝트 구조 생성 [P]
**파일 구조**:
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
├── api/
│   └── health/
│       └── route.ts
└── layout.tsx
components/
├── ui/
└── features/
lib/
├── supabase/
│   ├── client.ts
│   └── server.ts
└── utils.ts
hooks/
store/
types/
```

---

## Phase 2: 테스트 우선 개발 (TDD) (Day 2)

### T004: 사용자 모델 테스트 작성 [P]
**파일**: `__tests__/models/user.test.ts`
```typescript
describe('User 모델', () => {
  test('사용자 생성 유효성 검증');
  test('이메일 중복 체크');
  test('역할 권한 검증');
});
```

### T005: 조직 모델 테스트 작성 [P]
**파일**: `__tests__/models/organization.test.ts`
```typescript
describe('Organization 모델', () => {
  test('조직 생성 유효성 검증');
  test('영업시간 포맷 검증');
  test('조직 유형 검증');
});
```

### T006: 출석 모델 테스트 작성 [P]
**파일**: `__tests__/models/attendance.test.ts`
```typescript
describe('Attendance 모델', () => {
  test('출퇴근 기록 생성');
  test('중복 출근 방지');
  test('휴식시간 계산');
});
```

### T007: 인증 API 테스트 작성 [P]
**파일**: `__tests__/api/auth.test.ts`
```typescript
describe('인증 API', () => {
  test('POST /api/auth/login - 로그인');
  test('POST /api/auth/signup - 회원가입');
  test('POST /api/auth/logout - 로그아웃');
  test('GET /api/auth/session - 세션 확인');
});
```

---

## Phase 3: 데이터베이스 설정 (Day 2-3)

### T008: Supabase 클라이언트 설정
**파일**: `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### T009: Supabase 서버 클라이언트 설정
**파일**: `lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  // 서버 클라이언트 구현
}
```

### T010: 데이터베이스 마이그레이션 생성 [P]
**파일**: `supabase/migrations/001_create_users.sql`
```sql
-- Users 테이블 생성
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  -- 나머지 필드
);
```

### T011: RLS 정책 설정 [P]
**파일**: `supabase/migrations/002_rls_policies.sql`
```sql
-- RLS 활성화 및 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- 정책 생성
```

---

## Phase 4: 핵심 기능 구현 (Day 3-4)

### T012: 사용자 모델 구현
**파일**: `lib/models/user.ts`
**의존성**: T004 테스트 통과 필요
```typescript
import { z } from 'zod'

export const UserSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  fullName: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  role: z.enum(['admin', 'manager', 'employee']),
  // 추가 필드
})
```

### T013: 조직 모델 구현
**파일**: `lib/models/organization.ts`
**의존성**: T005 테스트 통과 필요

### T014: 출석 모델 구현
**파일**: `lib/models/attendance.ts`
**의존성**: T006 테스트 통과 필요

### T015: Zustand 스토어 설정
**파일**: `store/index.ts`
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  user: User | null
  currentOrg: Organization | null
  theme: 'light' | 'dark'
  language: 'ko' | 'en'
  // 액션들
}
```

### T016: 인증 훅 구현
**파일**: `hooks/use-auth.ts`
```typescript
export function useAuth() {
  // 인증 로직
}
```

---

## Phase 5: UI 컴포넌트 (Day 4-5)

### T017: shadcn/ui 설정
**명령어**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input label
```

### T018: 로그인 페이지 구현
**파일**: `app/(auth)/login/page.tsx`
**의존성**: T016, T017
```typescript
export default function LoginPage() {
  // React Hook Form + Zod 유효성 검증
  // Supabase 인증
}
```

### T019: 회원가입 페이지 구현
**파일**: `app/(auth)/signup/page.tsx`
**의존성**: T016, T017

### T020: 대시보드 레이아웃 구현
**파일**: `app/(dashboard)/layout.tsx`
```typescript
export default function DashboardLayout({ children }) {
  // 사이드바, 헤더, 푸터
}
```

### T021: 네비게이션 컴포넌트 [P]
**파일**: `components/features/navigation.tsx`

### T022: 사용자 프로필 컴포넌트 [P]
**파일**: `components/features/user-profile.tsx`

---

## Phase 6: API 라우트 (Day 5)

### T023: 헬스체크 API
**파일**: `app/api/health/route.ts`
```typescript
export async function GET() {
  return Response.json({ status: 'healthy' })
}
```

### T024: 인증 API 라우트
**파일**: `app/api/auth/[...action]/route.ts`
**의존성**: T007 테스트 통과 필요

### T025: 사용자 CRUD API [P]
**파일**: `app/api/users/route.ts`, `app/api/users/[id]/route.ts`

### T026: 조직 CRUD API [P]
**파일**: `app/api/organizations/route.ts`, `app/api/organizations/[id]/route.ts`

---

## Phase 7: 다국어 지원 (Day 6)

### T027: i18n 설정
**파일**: `lib/i18n/config.ts`
```typescript
export const i18nConfig = {
  locales: ['ko', 'en', 'ja', 'zh'],
  defaultLocale: 'ko'
}
```

### T028: 한국어 번역 파일 [P]
**파일**: `public/locales/ko/common.json`
```json
{
  "login": "로그인",
  "signup": "회원가입",
  "dashboard": "대시보드",
  "attendance": "출퇴근",
  "schedule": "일정"
}
```

### T029: 영어 번역 파일 [P]
**파일**: `public/locales/en/common.json`

---

## Phase 8: 통합 테스트 (Day 6)

### T030: 로그인 플로우 E2E 테스트
**파일**: `__tests__/e2e/auth-flow.test.ts`
```typescript
describe('인증 플로우', () => {
  test('사용자가 로그인하고 대시보드에 접근');
  test('비로그인 사용자 리다이렉션');
});
```

### T031: 출퇴근 기록 통합 테스트
**파일**: `__tests__/integration/attendance.test.ts`

---

## Phase 9: 배포 설정 (Day 7)

### T032: 환경 변수 설정
**파일**: `.env.local`, `.env.example`
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### T033: Vercel 배포 설정
**파일**: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### T034: GitHub Actions CI/CD [P]
**파일**: `.github/workflows/ci.yml`
```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

### T035: Docker 설정 [P]
**파일**: `Dockerfile`, `docker-compose.yml`

---

## Phase 10: 문서화 및 마무리 (Day 7)

### T036: README 작성
**파일**: `README.md`
- 프로젝트 소개
- 설치 방법
- 개발 가이드
- API 문서 링크

### T037: API 문서 생성 [P]
**파일**: `docs/api.md`

### T038: 컴포넌트 스토리북 [P]
**명령어**:
```bash
npx storybook@latest init
```

### T039: 성능 최적화
- 번들 크기 분석
- 이미지 최적화
- 코드 스플리팅

### T040: 보안 점검
- 환경 변수 확인
- CORS 설정
- Rate limiting
- Input validation

---

## 병렬 실행 예시

### 병렬 그룹 1: 테스트 작성 (T004-T007)
```bash
Task --parallel "T004-T007 모든 테스트 파일 동시 생성"
```

### 병렬 그룹 2: 데이터베이스 마이그레이션 (T010-T011)
```bash
Task --parallel "T010-T011 마이그레이션 파일 생성"
```

### 병렬 그룹 3: UI 컴포넌트 (T021-T022)
```bash
Task --parallel "T021-T022 독립 컴포넌트 구현"
```

### 병렬 그룹 4: API 라우트 (T025-T026)
```bash
Task --parallel "T025-T026 CRUD API 구현"
```

### 병렬 그룹 5: 번역 파일 (T028-T029)
```bash
Task --parallel "T028-T029 다국어 파일 생성"
```

---

## 의존성 그래프

```
T001 → T002 → T003
         ↓
    T004-T007 [P] → T012-T014
         ↓              ↓
    T008-T009      T015-T016
         ↓              ↓
    T010-T011 [P]  T017 → T018-T020
         ↓              ↓
         └──────→ T023-T026 [P]
                       ↓
                  T027 → T028-T029 [P]
                       ↓
                  T030-T031
                       ↓
                  T032-T035 [P]
                       ↓
                  T036-T040 [P]
```

---

## 완료 기준

### 각 태스크 완료 조건
- [ ] 코드 작성 완료
- [ ] 테스트 통과
- [ ] TypeScript 컴파일 성공
- [ ] ESLint 경고 없음
- [ ] 문서화 완료

### 전체 프로젝트 완료 조건
- [ ] 모든 P0 태스크 완료
- [ ] 테스트 커버리지 70% 이상
- [ ] 빌드 성공
- [ ] Vercel 배포 성공
- [ ] 로컬 개발 환경 정상 작동

---

## 주의사항

1. **병렬 실행**: [P] 표시된 태스크만 병렬로 실행하세요
2. **의존성 확인**: 각 태스크의 의존성을 반드시 확인하세요
3. **테스트 우선**: TDD 원칙에 따라 테스트를 먼저 작성하세요
4. **커밋 단위**: 각 태스크 완료 시 커밋하세요
5. **환경 변수**: 민감한 정보는 절대 커밋하지 마세요

## 예상 완료 시간

- **순차 실행**: 7일
- **병렬 실행 (권장)**: 5일
- **집중 개발 (팀)**: 3일

각 태스크는 구체적인 파일 경로와 구현 내용을 포함하여 LLM이 추가 컨텍스트 없이도 즉시 실행할 수 있도록 작성되었습니다.