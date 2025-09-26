#!/bin/bash

# Parse JSON flag
JSON_OUTPUT=false
if [[ "$1" == "--json" ]]; then
    JSON_OUTPUT=true
    shift
fi

# Get feature description
FEATURE_DESC="$1"

# Generate branch name from feature description (simplified version)
BRANCH_NAME="feature/dev-environment-setup-$(date +%Y%m%d)"

# Create spec file path
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SPEC_FILE="$(pwd)/.specify/features/${BRANCH_NAME##*/}_${TIMESTAMP}.md"

# Initialize git if not already done
if [ ! -d .git ]; then
    git init
fi

# Create and checkout branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Create spec file
mkdir -p "$(dirname "$SPEC_FILE")"
touch "$SPEC_FILE"

# Output result
if [ "$JSON_OUTPUT" = true ]; then
    echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$SPEC_FILE\"}"
else
    echo "Branch: $BRANCH_NAME"
    echo "Spec File: $SPEC_FILE"
fi