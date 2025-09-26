#!/bin/bash

# Parse JSON flag
JSON_OUTPUT=false
if [[ "$1" == "--json" ]]; then
    JSON_OUTPUT=true
fi

# Get feature directory
FEATURE_DIR="$(pwd)/.specify/features"

# Check for available documents
AVAILABLE_DOCS=""
[ -f "$FEATURE_DIR/implementation-plan.md" ] && AVAILABLE_DOCS="$AVAILABLE_DOCS plan.md"
[ -f "$FEATURE_DIR/data-model.md" ] && AVAILABLE_DOCS="$AVAILABLE_DOCS data-model.md"
[ -d "$FEATURE_DIR/contracts" ] && AVAILABLE_DOCS="$AVAILABLE_DOCS contracts/"
[ -f "$FEATURE_DIR/research.md" ] && AVAILABLE_DOCS="$AVAILABLE_DOCS research.md"
[ -f "$FEATURE_DIR/quickstart.md" ] && AVAILABLE_DOCS="$AVAILABLE_DOCS quickstart.md"

# Output result
if [ "$JSON_OUTPUT" = true ]; then
    echo "{\"FEATURE_DIR\":\"$FEATURE_DIR\",\"AVAILABLE_DOCS\":\"$AVAILABLE_DOCS\"}"
else
    echo "Feature Directory: $FEATURE_DIR"
    echo "Available Documents: $AVAILABLE_DOCS"
fi