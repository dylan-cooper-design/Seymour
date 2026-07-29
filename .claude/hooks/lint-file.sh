#!/bin/bash
# Runs ESLint on the file that was just edited, reporting problems without auto-fixing.
# Called by the PostToolUse hook after Edit, Write, or MultiEdit.

INPUT=$(cat -)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE" ] && exit 0

# Only lint JS/TS files
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# Run ESLint — report only, no auto-fix
npx eslint "$FILE" 2>&1
exit 0
