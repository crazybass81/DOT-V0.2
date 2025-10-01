#!/bin/bash

# DOT Platform V0.2 - 초기 설정 스크립트
# 개발 환경 설정을 위한 자동화 스크립트

set -e

echo "🚀 DOT Platform V0.2 설정을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 정보 출력
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 함수: 경고 출력
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 함수: 에러 출력
error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Node.js 버전 확인
info "Node.js 버전 확인 중..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    info "Node.js 버전: $NODE_VERSION"

    # Node.js 18+ 필요
    if [[ $(node --version | cut -d. -f1 | cut -dv -f2) -lt 18 ]]; then
        error "Node.js 18 이상이 필요합니다. 현재 버전: $NODE_VERSION"
        exit 1
    fi
else
    error "Node.js가 설치되지 않았습니다."
    exit 1
fi

# npm 버전 확인
info "npm 버전 확인 중..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    info "npm 버전: $NPM_VERSION"
else
    error "npm이 설치되지 않았습니다."
    exit 1
fi

# 의존성 설치
info "의존성 패키지 설치 중..."
npm install

# 환경 파일 설정
if [ ! -f .env.local ]; then
    info "환경 설정 파일 생성 중..."
    cp .env.local.example .env.local
    warn "⚠️  .env.local 파일을 편집하여 실제 환경 변수 값을 설정하세요"
    warn "   특히 Supabase URL과 API 키를 설정해야 합니다"
else
    info "환경 설정 파일이 이미 존재합니다"
fi

# Git 설정 확인
if [ ! -d .git ]; then
    warn "Git 저장소가 초기화되지 않았습니다"
    read -p "Git 저장소를 초기화하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Git 저장소 초기화 중..."
        git init
        git add .
        git commit -m "Initial commit: DOT Platform V0.2 setup"
    fi
fi

# Husky 설정 (Git hooks)
if [ -d .git ]; then
    info "Git hooks 설정 중..."
    npm run prepare
fi

# TypeScript 컴파일 확인
info "TypeScript 타입 확인 중..."
npm run type-check

# 빌드 테스트
info "프로덕션 빌드 테스트 중..."
npm run build

# 개발 서버 준비 확인
info "린팅 확인 중..."
npm run lint

echo ""
info "✅ DOT Platform V0.2 설정이 완료되었습니다!"
echo ""
info "다음 단계:"
info "1. .env.local 파일에서 Supabase 설정을 완료하세요"
info "2. npm run dev 명령으로 개발 서버를 시작하세요"
info "3. http://localhost:3000 에서 플랫폼을 확인하세요"
echo ""
warn "⚠️  중요: 실제 서비스 전에 Supabase에서 데이터베이스 스키마를 적용해야 합니다"
warn "   스키마 파일: src/lib/database/schema.sql"
echo ""