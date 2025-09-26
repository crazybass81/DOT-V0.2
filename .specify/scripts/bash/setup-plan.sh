#!/bin/bash

# Parse JSON flag
JSON_OUTPUT=false
if [[ "$1" == "--json" ]]; then
    JSON_OUTPUT=true
fi

# Get current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "feature/dev-environment-setup-20250926")

# Find latest spec file
SPECS_DIR="$(pwd)/.specify/features"
FEATURE_SPEC=$(ls -t "$SPECS_DIR"/*.md 2>/dev/null | head -1)

# Create implementation plan path
IMPL_PLAN="$(pwd)/.specify/memory/implementation-plan.md"
mkdir -p "$(dirname "$IMPL_PLAN")"

# Copy template if implementation plan doesn't exist
if [ ! -f "$IMPL_PLAN" ]; then
    if [ -f "$(pwd)/.specify/templates/plan-template.md" ]; then
        cp "$(pwd)/.specify/templates/plan-template.md" "$IMPL_PLAN"
    else
        touch "$IMPL_PLAN"
    fi
fi

# Output result
if [ "$JSON_OUTPUT" = true ]; then
    echo "{\"FEATURE_SPEC\":\"$FEATURE_SPEC\",\"IMPL_PLAN\":\"$IMPL_PLAN\",\"SPECS_DIR\":\"$SPECS_DIR\",\"BRANCH\":\"$BRANCH\"}"
else
    echo "Feature Spec: $FEATURE_SPEC"
    echo "Implementation Plan: $IMPL_PLAN"
    echo "Specs Directory: $SPECS_DIR"
    echo "Branch: $BRANCH"
fi