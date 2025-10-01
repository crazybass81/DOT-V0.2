# DOT Platform V0.2 - 문서 체계

## 📚 문서 구조 개요

DOT Platform V0.2 마이크로 앱 아키텍처 플랫폼의 종합 문서입니다.

```
docs/
├── README.md                    # 이 파일 - 문서 체계 안내
├── 01-OVERVIEW.md              # 프로젝트 개요 및 비전
├── 02-ARCHITECTURE.md          # 시스템 아키텍처 설계
├── 03-API-REFERENCE.md         # API 명세 및 레퍼런스
├── 04-IMPLEMENTATION.md        # 구현 계획 및 작업 가이드
├── 05-QUICKSTART.md           # 빠른 시작 가이드
├── 06-DEVELOPMENT.md          # 개발자 가이드
└── 07-DEPLOYMENT.md           # 배포 및 운영 가이드
```

---

## 🚀 빠른 네비게이션

### 프로젝트 이해
- **[프로젝트 개요](01-OVERVIEW.md)** - DOT Platform V0.2 소개 및 목표
- **[시스템 아키텍처](02-ARCHITECTURE.md)** - 마이크로 앱 아키텍처 설계

### 개발 시작
- **[빠른 시작](05-QUICKSTART.md)** - 30분 내 플랫폼 실행
- **[API 레퍼런스](03-API-REFERENCE.md)** - 완전한 API 명세
- **[개발자 가이드](06-DEVELOPMENT.md)** - 개발 워크플로우

### 구현 및 배포
- **[구현 계획](04-IMPLEMENTATION.md)** - 단계별 구현 가이드
- **[배포 가이드](07-DEPLOYMENT.md)** - 프로덕션 배포

---

## ⚠️ 중요한 프로젝트 원칙

### 🎯 플랫폼 베이스 집중
이 프로젝트는 **마이크로 앱 아키텍처의 플랫폼 베이스 구축**에만 집중합니다:

- ✅ **구현하는 것**: 플랫폼 셸, 앱 레지스트리, 동적 로딩, 상태 관리
- ❌ **구현하지 않는 것**: 회원가입/로그인, 근태관리, 커뮤니티, 스케줄링

### 🏗️ 마이크로 앱 아키텍처
- **플랫폼 셸**: 모든 마이크로 앱을 실행하는 기반 환경
- **앱 레지스트리**: 앱 메타데이터 관리 및 생명주기 관리
- **동적 로딩**: 런타임 앱 로드/언로드 시스템
- **격리된 실행**: 각 앱이 독립적으로 실행되는 환경

### 🔧 기술 스택
- **Frontend**: Next.js 14+ + TypeScript 5+ + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **State Management**: Zustand
- **Development**: MCP 서버 통합, Claude Code 워크플로우
- **Deployment**: Vercel + GitHub Actions

---

## 📖 문서 읽는 순서

### 1. 처음 접하는 경우
1. **[프로젝트 개요](01-OVERVIEW.md)** - 전체 그림 이해
2. **[빠른 시작](05-QUICKSTART.md)** - 실제 실행해보기
3. **[시스템 아키텍처](02-ARCHITECTURE.md)** - 구조 이해

### 2. 개발자인 경우
1. **[개발자 가이드](06-DEVELOPMENT.md)** - 개발 환경 구성
2. **[API 레퍼런스](03-API-REFERENCE.md)** - API 이해
3. **[구현 계획](04-IMPLEMENTATION.md)** - 단계별 구현

### 3. 운영자인 경우
1. **[배포 가이드](07-DEPLOYMENT.md)** - 운영 환경 구성
2. **[시스템 아키텍처](02-ARCHITECTURE.md)** - 시스템 이해

---

## 🔍 문서 버전 정보

- **버전**: v1.0.0
- **최종 업데이트**: 2025년 9월 26일
- **상태**: 최신 (specs/plan-20250926-045018 기준)

## 📞 문의 및 지원

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **개발 문의**: DOT Platform 개발팀
- **문서 개선**: docs@dot-platform.com

---

**다음**: [프로젝트 개요](01-OVERVIEW.md)에서 DOT Platform V0.2의 전체적인 비전과 목표를 확인하세요.