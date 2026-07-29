#!/bin/bash
# Runs Prettier on the file that was just edited.
# Called by the PostToolUse hook after Edit, Write, or MultiEdit.

INPUT=$(cat -)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE" ] && exit 0

# Only format file types Prettier handles
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.json|*.md) ;;
  *) exit 0 ;;
esac

# Run Prettier in write mode
npx prettier --write "$FILE" 2>&1
exit 0
