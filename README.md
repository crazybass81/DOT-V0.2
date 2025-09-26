# DOT Platform V0.2

## 🚀 프로젝트 소개

DOT Platform V0.2는 Next.js 14와 Supabase를 기반으로 한 현대적인 레스토랑 관리 시스템입니다.

### 주요 기능
- 👥 직원 관리 및 출퇴근 시스템
- 📅 스케줄 관리
- 💰 급여 관리
- 📊 실시간 대시보드
- 🌏 다국어 지원 (한국어, 영어, 일본어, 중국어)

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Hosting**: Vercel

## 📁 프로젝트 구조

```
DOT-V0.2/
├── app/                   # Next.js App Router
│   ├── (auth)/           # 인증 페이지
│   ├── (dashboard)/      # 대시보드 페이지
│   └── api/              # API 라우트
├── components/           # React 컴포넌트
│   ├── ui/              # shadcn UI 컴포넌트
│   └── features/        # 비즈니스 컴포넌트
├── lib/                  # 유틸리티 함수
│   └── supabase/        # Supabase 클라이언트
├── store/               # Zustand 상태 관리
└── .specify/            # 프로젝트 명세 및 문서
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- npm 8+
- Supabase 계정
- Vercel 계정 (배포용)

### 설치 방법

1. **저장소 클론**
```bash
git clone https://github.com/crazybass81/DOT-V0.2.git
cd DOT-V0.2
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
cp .env.example .env.local
# .env.local 파일을 열어 Supabase 자격 증명 입력
```

4. **개발 서버 실행**
```bash
npm run dev
```

## 📚 문서

### 프로젝트 명세
- [기능 명세서](.specify/features/dev-environment-setup-20250926_20250926_032234.md)
- [데이터 모델](.specify/features/data-model.md)
- [API 타입 정의](.specify/features/contracts/api-types.ts)
- [구현 계획](.specify/memory/implementation-plan.md)
- [태스크 목록](.specify/features/tasks.md)
- [빠른 시작 가이드](.specify/features/quickstart.md)

### MCP 서버 설정
프로젝트는 SuperClaude와 함께 사용할 수 있는 MCP 서버가 설정되어 있습니다:
- filesystem
- sequential-thinking
- github

자세한 내용은 [MCP 서버 문서](~/mcp-servers/README.md)를 참조하세요.

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 팀

- DOT Platform Team

## 🔗 관련 링크

- [DOT V0.1 (레거시)](https://github.com/crazybass81/DOT-V0.1)
- [프로젝트 이슈](https://github.com/crazybass81/DOT-V0.2/issues)

---

**Version**: 0.2.0
**Last Updated**: 2025-09-26