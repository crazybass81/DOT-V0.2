#!/bin/bash

# DOT-V0.2 Feature Creation Script
# Creates a new feature branch and spec file for development

set -e

FEATURE_DESCRIPTION=""
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      FEATURE_DESCRIPTION="$2"
      shift 2
      ;;
    *)
      FEATURE_DESCRIPTION="$1"
      shift
      ;;
  esac
done

if [ -z "$FEATURE_DESCRIPTION" ]; then
  echo "Error: Feature description required"
  exit 1
fi

# Generate branch name from feature description (simplified for Korean support)
BRANCH_NAME="feature/micro-app-platform-base"

# Create timestamp for unique identification
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
SPEC_FILE="specs/feature-${TIMESTAMP}.md"

# Create absolute path
ABSOLUTE_SPEC_FILE="/home/ec2-user/DOT-V0.2/${SPEC_FILE}"

# Create specs directory if it doesn't exist
mkdir -p specs

# Create and checkout new branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Initialize spec file with basic structure
cat > "$SPEC_FILE" << EOF
# 기능 명세서 - 초기화됨

## 개요
$FEATURE_DESCRIPTION

## 생성 정보
- 브랜치: $BRANCH_NAME
- 생성일: $(date)
- 타임스탬프: $TIMESTAMP

이 파일은 곧 상세한 명세로 업데이트됩니다.
EOF

if [ "$JSON_OUTPUT" = true ]; then
  echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$ABSOLUTE_SPEC_FILE\"}"
else
  echo "Branch: $BRANCH_NAME"
  echo "Spec file: $ABSOLUTE_SPEC_FILE"
fi