# DOT Platform V0.2

마이크로 앱 아키텍처 기반의 확장 가능한 플랫폼

## 🌟 개요

DOT Platform V0.2는 현대적인 웹 기술을 기반으로 한 마이크로 앱 플랫폼입니다. 각각의 앱이 독립적으로 동작하면서도 통합된 사용자 경험을 제공합니다.

### 주요 특징

- **🏗 마이크로 앱 아키텍처**: 독립적인 앱들이 하나의 플랫폼에서 동작
- **⚡ 현대적 기술 스택**: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4
- **🔒 강력한 보안**: Row Level Security 기반 데이터 보호
- **🔄 실시간 동기화**: Supabase Realtime을 통한 실시간 데이터 업데이트
- **📱 반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **🌐 다국어 지원**: 한국어 우선, 다국어 확장 가능
- **🔌 MCP 통합**: Model Context Protocol을 통한 확장 가능한 기능

## 🚀 빠른 시작

### 1. 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 프로젝트

### 2. 설치

```bash
# 저장소 클론
git clone <repository-url>
cd DOT-V0.2

# 자동 설정 실행
./scripts/setup.sh
```

### 3. 환경 설정

`.env.local` 파일을 생성하고 Supabase 설정을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 개발 서버 시작

```bash
npm run dev
```

http://localhost:3000 에서 플랫폼을 확인할 수 있습니다.

## 🏛 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    DOT Platform V0.2                    │
├─────────────────────────────────────────────────────────┤
│                   Platform Shell                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  Header     │ │ Navigation  │ │ App Container│      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│                   Core Services                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │App Registry │ │State Manager│ │Auth Service │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│                   Data Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Supabase    │ │  Realtime   │ │MCP Bridge   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 📚 기술 스택

### 프론트엔드
- **Next.js 15**: App Router, Server Components
- **React 19**: 최신 React 기능 활용
- **TypeScript 5**: 강타입 개발 환경
- **Tailwind CSS 3.4**: 유틸리티 우선 CSS 프레임워크

### 백엔드
- **Supabase**: PostgreSQL 데이터베이스, 인증, 실시간 기능
- **Row Level Security**: 데이터베이스 레벨 보안
- **RESTful API**: 표준 REST API 인터페이스

### 개발 도구
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **TypeScript**: 정적 타입 검사

## 📁 프로젝트 구조

```
DOT-V0.2/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css     # 전역 스타일
│   │   ├── layout.tsx      # 루트 레이아웃
│   │   └── page.tsx        # 홈 페이지
│   └── lib/
│       ├── database/       # 데이터베이스 관련
│       │   ├── schema.sql  # 데이터베이스 스키마
│       │   ├── types.ts    # TypeScript 타입 정의
│       │   ├── client.ts   # Supabase 클라이언트
│       │   └── migrations.ts # 마이그레이션 시스템
│       └── auth/           # 인증 시스템
│           └── auth.ts     # 인증 함수들
├── config/                 # 설정 파일
│   └── mcp-servers.json   # MCP 서버 구성
├── scripts/                # 유틸리티 스크립트
│   └── setup.sh           # 자동 설정 스크립트
├── docs/                   # 문서
│   └── README-DEV.md      # 개발 가이드
└── specs/                  # 사양서 및 설계
    └── plan-*             # 구현 계획
```

## 🔧 개발 가이드

자세한 개발 가이드는 [개발자 문서](./docs/README-DEV.md)를 참고하세요.

### 주요 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 타입 검사
npm run type-check

# 린팅
npm run lint

# 포맷팅
npm run format
```

## 🗄 데이터베이스

### 주요 테이블

- **platforms**: 플랫폼 전역 설정
- **apps**: 앱 레지스트리 및 메타데이터
- **user_apps**: 사용자별 앱 설치 정보
- **user_profiles**: 확장된 사용자 프로필
- **app_data**: 앱별 데이터 저장소
- **app_permissions**: 세분화된 권한 관리
- **app_sessions**: 앱 세션 추적
- **app_logs**: 종합 로깅 시스템

### 보안 정책

모든 테이블에 Row Level Security(RLS)가 적용되어 있습니다:
- 사용자는 자신의 데이터만 접근
- 개발자는 자신의 앱 데이터만 접근
- 관리자는 플랫폼 전체 관리

## 🔌 MCP 통합

### 지원하는 MCP 서버

- **filesystem**: 파일 시스템 작업 및 관리
- **github**: GitHub API 통합 및 저장소 관리
- **context7**: 공식 문서 및 프레임워크 패턴 가이드
- **morphllm**: 패턴 기반 코드 편집 및 대량 변환
- **magic**: 현대적인 UI 컴포넌트 생성 도구
- **playwright**: 브라우저 자동화 및 E2E 테스트

### MCP 서버 설정

MCP 서버 설정은 `config/mcp-servers.json`에서 관리됩니다. 각 서버는 독립적으로 활성화/비활성화할 수 있습니다.

## 🚀 배포

### Vercel (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### 환경 변수 설정

배포 시 다음 환경 변수를 설정하세요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🤝 기여하기

1. 이슈를 생성하거나 기존 이슈를 선택
2. 기능 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경사항 커밋: `git commit -m 'feat: Add amazing feature'`
4. 브랜치에 푸시: `git push origin feature/amazing-feature`
5. Pull Request 생성

### 커밋 메시지 규칙

```
feat: 새로운 기능
fix: 버그 수정
docs: 문서 업데이트
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 기타 작업
```

## 📄 라이선스

이 프로젝트는 ISC 라이선스 하에 제공됩니다.

## 🆘 지원

- 📝 [Issues](../../issues): 버그 신고 및 기능 요청
- 📖 [Wiki](../../wiki): 상세 문서
- 💬 [Discussions](../../discussions): 커뮤니티 토론

---

**DOT Platform V0.2** - 차세대 마이크로 앱 플랫폼 🚀