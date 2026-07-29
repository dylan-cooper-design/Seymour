#!/bin/bash
# Blocks edits to protected design-system and dependency files.
# Edit this file to change the protected list.
# Called by the PreToolUse hook before Edit, Write, or MultiEdit.
#
# Exit 2 = block the tool call and show the message to Claude + user.
# Exit 0 = allow the edit to proceed.

INPUT=$(cat -)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE" ] && exit 0

BASENAME=$(basename "$FILE")

case "$BASENAME" in
  globals.css)
    echo "BLOCKED: globals.css is the design token source of truth — CSS custom properties, base styles, and font definitions all live here. Don't edit without Dylan explicitly asking." >&2
    exit 2
    ;;
  tailwind.config.ts)
    echo "BLOCKED: tailwind.config.ts defines the design system configuration — theme tokens, breakpoints, and plugin setup. Don't edit without Dylan explicitly asking." >&2
    exit 2
    ;;
  package.json)
    echo "BLOCKED: package.json controls project dependencies and scripts. Don't edit without Dylan explicitly asking." >&2
    exit 2
    ;;
  pnpm-lock.yaml)
    echo "BLOCKED: pnpm-lock.yaml is the dependency lockfile — it should only be updated by the package manager. Don't edit without Dylan explicitly asking." >&2
    exit 2
    ;;
esac

# Block any .env* files (e.g. .env.local, .env.production)
case "$BASENAME" in
  .env*)
    echo "BLOCKED: $BASENAME contains environment secrets and API keys. Don't edit without Dylan explicitly asking." >&2
    exit 2
    ;;
esac

exit 0
