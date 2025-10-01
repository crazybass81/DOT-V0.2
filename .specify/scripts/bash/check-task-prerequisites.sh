#!/bin/bash

# Check task prerequisites and return JSON info
# Usage: check-task-prerequisites.sh [--json]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SPECS_DIR="$PROJECT_ROOT/specs"

# Find the latest plan directory
LATEST_PLAN_DIR=""
if [ -d "$SPECS_DIR" ]; then
    LATEST_PLAN_DIR=$(find "$SPECS_DIR" -name "plan-*" -type d | sort -r | head -n1)
fi

if [ -z "$LATEST_PLAN_DIR" ]; then
    echo "Error: No plan directory found in specs/" >&2
    exit 1
fi

FEATURE_DIR="$LATEST_PLAN_DIR"

# Check for available documents
AVAILABLE_DOCS=()

# Check for required documents
if [ -f "$FEATURE_DIR/research.md" ]; then
    AVAILABLE_DOCS+=("research.md")
fi

if [ -f "$FEATURE_DIR/data-model.md" ]; then
    AVAILABLE_DOCS+=("data-model.md")
fi

if [ -f "$FEATURE_DIR/quickstart.md" ]; then
    AVAILABLE_DOCS+=("quickstart.md")
fi

# Check for contracts directory
if [ -d "$FEATURE_DIR/contracts" ]; then
    CONTRACT_FILES=$(find "$FEATURE_DIR/contracts" -name "*.md" -type f | wc -l)
    if [ "$CONTRACT_FILES" -gt 0 ]; then
        AVAILABLE_DOCS+=("contracts/")
    fi
fi

# Check for implementation plan
if [ -f "$FEATURE_DIR/implementation-plan.md" ]; then
    AVAILABLE_DOCS+=("implementation-plan.md")
fi

# Output format
if [ "${1:-}" = "--json" ]; then
    echo "{"
    echo "  \"FEATURE_DIR\": \"$FEATURE_DIR\","
    echo "  \"AVAILABLE_DOCS\": ["
    for i in "${!AVAILABLE_DOCS[@]}"; do
        if [ $i -eq $((${#AVAILABLE_DOCS[@]} - 1)) ]; then
            echo "    \"${AVAILABLE_DOCS[$i]}\""
        else
            echo "    \"${AVAILABLE_DOCS[$i]}\","
        fi
    done
    echo "  ]"
    echo "}"
else
    echo "Feature Directory: $FEATURE_DIR"
    echo "Available Documents:"
    for doc in "${AVAILABLE_DOCS[@]}"; do
        echo "  - $doc"
    done
fi