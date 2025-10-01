#!/bin/bash

# DOT-V0.2 Plan Setup Script
# Sets up implementation planning environment

set -e

JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Find the most recent feature spec file
FEATURE_SPEC=""
if [ -d "specs" ]; then
  FEATURE_SPEC=$(find specs -name "feature-*.md" -type f | sort -r | head -1)
fi

if [ -z "$FEATURE_SPEC" ]; then
  echo "Error: No feature specification found"
  exit 1
fi

# Convert to absolute path
FEATURE_SPEC="/home/ec2-user/DOT-V0.2/$FEATURE_SPEC"

# Create planning directories
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
SPECS_DIR="/home/ec2-user/DOT-V0.2/specs/plan-${TIMESTAMP}"
mkdir -p "$SPECS_DIR"
mkdir -p "$SPECS_DIR/contracts"
mkdir -p ".specify/memory"

# Implementation plan file
IMPL_PLAN="$SPECS_DIR/implementation-plan.md"

# Create constitution if it doesn't exist
CONSTITUTION_FILE="/home/ec2-user/DOT-V0.2/.specify/memory/constitution.md"
if [ ! -f "$CONSTITUTION_FILE" ]; then
cat > "$CONSTITUTION_FILE" << 'EOF'
# DOT Platform V0.2 개발 헌장

## 핵심 원칙

### 1. 마이크로 앱 아키텍처 우선
- 모든 기능은 독립적인 마이크로 앱으로 구현
- 플랫폼 코어는 최소한의 공통 서비스만 제공
- 앱 간 격리와 독립성 보장

### 2. 점진적 개발
- MVP 우선 접근법
- 베이스 플랫폼 먼저, 세부 기능은 추후
- 검증된 기능만 확장

### 3. 현대적 기술 스택
- Next.js + TypeScript 기반
- Supabase + Vercel 인프라
- MCP 통합 개발 환경

### 4. 품질 우선
- 포괄적 테스트 커버리지
- 코드 리뷰 필수
- 성능 및 보안 기준 준수

### 5. 문서화
- 모든 API는 문서화
- 아키텍처 결정 기록
- 개발자 가이드 유지
EOF
fi

# Create plan template if it doesn't exist
PLAN_TEMPLATE="/home/ec2-user/DOT-V0.2/.specify/templates/plan-template.md"
if [ ! -f "$PLAN_TEMPLATE" ]; then
cat > "$PLAN_TEMPLATE" << 'EOF'
# 구현 계획 템플릿

이 템플릿은 DOT Platform V0.2 구현 계획을 위한 실행 가능한 프레임워크입니다.

## 실행 흐름 (Main Function)

### Phase 0: 연구 및 분석
1. 기존 시스템 분석
2. 요구사항 정리
3. 기술적 제약사항 식별
4. 아키텍처 결정사항 문서화

### Phase 1: 설계 및 구조
1. 데이터 모델 설계
2. API 계약 정의
3. 컴포넌트 구조 설계
4. 퀵스타트 가이드 작성

### Phase 2: 구현 계획
1. 작업 분해 구조
2. 우선순위 정의
3. 마일스톤 설정
4. 리소스 할당

### 진행 상황 추적
- [ ] Phase 0 완료
- [ ] Phase 1 완료
- [ ] Phase 2 완료

### 오류 처리
각 단계에서 오류 발생 시:
1. 오류 로깅
2. 이전 단계로 롤백
3. 수정 후 재실행

### 품질 검증
- 각 Phase 완료 후 검증
- 문서 품질 확인
- 기술적 타당성 검토
EOF
fi

# Copy template to implementation plan
cp "$PLAN_TEMPLATE" "$IMPL_PLAN"

if [ "$JSON_OUTPUT" = true ]; then
  echo "{\"FEATURE_SPEC\":\"$FEATURE_SPEC\",\"IMPL_PLAN\":\"$IMPL_PLAN\",\"SPECS_DIR\":\"$SPECS_DIR\",\"BRANCH\":\"$CURRENT_BRANCH\"}"
else
  echo "Feature Spec: $FEATURE_SPEC"
  echo "Implementation Plan: $IMPL_PLAN"
  echo "Specs Directory: $SPECS_DIR"
  echo "Branch: $CURRENT_BRANCH"
fi