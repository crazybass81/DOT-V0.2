# DOT Platform V0.2 - 개발 가이드

DOT Platform V0.2는 마이크로 앱 아키텍처 기반의 확장 가능한 플랫폼입니다.

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 저장소 복제
git clone <repository-url>
cd DOT-V0.2

# 자동 설정 스크립트 실행
./scripts/setup.sh
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값들을 설정하세요:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 기본 애플리케이션 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_VERSION=1.0.0
NEXT_PUBLIC_ENV=development
```

### 3. 데이터베이스 설정

Supabase 프로젝트에서 `src/lib/database/schema.sql` 파일의 내용을 실행하여 데이터베이스 스키마를 생성하세요.

### 4. 개발 서버 시작

```bash
npm run dev
```

http://localhost:3000 에서 플랫폼을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
DOT-V0.2/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # 전역 스타일
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   └── page.tsx           # 홈 페이지
│   └── lib/
│       ├── database/          # 데이터베이스 관련
│       │   ├── schema.sql     # 데이터베이스 스키마
│       │   ├── types.ts       # TypeScript 타입 정의
│       │   ├── client.ts      # Supabase 클라이언트
│       │   ├── migrations.ts  # 마이그레이션 시스템
│       │   └── index.ts       # 통합 export
│       └── auth/              # 인증 시스템
│           └── auth.ts        # 인증 함수들
├── config/                    # 설정 파일
├── scripts/                   # 유틸리티 스크립트
│   └── setup.sh              # 초기 설정 스크립트
├── docs/                      # 문서
└── specs/                     # 사양서 및 설계 문서
```

## 🛠 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# TypeScript 타입 검사
npm run type-check

# 타입 검사 (watch 모드)
npm run type-check:watch

# 린팅
npm run lint
```

## 🏗 아키텍처 개요

### 플랫폼 구조

DOT Platform V0.2는 다음과 같은 계층 구조를 가집니다:

1. **플랫폼 셸 (Platform Shell)**: 전체 플랫폼의 기본 틀
2. **코어 서비스 (Core Services)**: 앱 레지스트리, 상태 관리, 인증
3. **데이터 레이어 (Data Layer)**: Supabase, 실시간 통신, MCP 브리지

### 데이터베이스 구조

주요 테이블:
- `platforms`: 플랫폼 설정
- `apps`: 앱 레지스트리
- `user_apps`: 사용자별 앱 설치
- `user_profiles`: 사용자 프로필
- `app_data`: 앱별 데이터 저장소
- `app_permissions`: 앱 권한 관리
- `app_sessions`: 앱 세션
- `app_logs`: 앱 로그 및 모니터링

## 🔒 보안

### Row Level Security (RLS)

모든 테이블에 RLS 정책이 적용되어 있습니다:
- 사용자는 자신의 데이터만 접근 가능
- 개발자는 자신이 개발한 앱의 데이터에만 접근 가능
- 플랫폼 관리자만 플랫폼 설정 수정 가능

### 권한 시스템

앱별로 세분화된 권한 시스템:
- `read:profile`, `write:profile`: 프로필 접근
- `read:data`, `write:data`: 데이터 접근
- `admin:users`: 사용자 관리
- `system:files`: 파일 시스템 접근
- `network:external`: 외부 네트워크 접근

## 📊 상태 관리

### Zustand 기반 상태 관리

- 플랫폼 전역 상태
- 사용자 인증 상태
- 앱별 로컬 상태

### 실시간 동기화

Supabase Realtime을 통한 실시간 데이터 동기화:
- 앱 상태 변경
- 사용자 활동
- 시스템 알림

## 🧪 테스트

### 테스트 전략

1. **단위 테스트**: 유틸리티 함수, 컴포넌트
2. **통합 테스트**: API 엔드포인트, 데이터베이스
3. **E2E 테스트**: 사용자 시나리오

### 테스트 실행

```bash
# 테스트 실행 (준비 예정)
npm run test

# 테스트 커버리지
npm run test:coverage
```

## 🚀 배포

### Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### 환경 변수 설정

배포 환경에서 다음 환경 변수를 설정하세요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📈 모니터링

### 로깅

- 애플리케이션 레벨: console.log, console.error
- 데이터베이스 레벨: app_logs 테이블
- 시스템 레벨: Vercel Analytics

### 성능 모니터링

- Core Web Vitals 추적
- 실시간 사용자 모니터링
- 에러 추적 및 알림

## 🤝 개발 워크플로

### Git 워크플로

1. 기능 브랜치 생성: `git checkout -b feature/feature-name`
2. 개발 및 커밋: `git commit -m "feat: add feature"`
3. 테스트 실행: `npm run test`
4. 풀 리퀘스트 생성
5. 코드 리뷰 후 병합

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 기타 작업
```

## 📚 추가 문서

- [API 문서](./API.md) (준비 예정)
- [컴포넌트 가이드](./COMPONENTS.md) (준비 예정)
- [배포 가이드](./DEPLOYMENT.md) (준비 예정)
- [트러블슈팅](./TROUBLESHOOTING.md) (준비 예정)

## 🆘 지원

문제가 발생하거나 질문이 있으시면:

1. [Issues](../../issues)에서 기존 이슈 확인
2. 새로운 이슈 생성
3. 개발팀에 직접 연락

---

**DOT Platform V0.2** - 마이크로 앱 플랫폼의 미래를 만들어갑니다.