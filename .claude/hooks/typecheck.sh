#!/bin/bash
# Runs TypeScript in check-only mode across the whole project.
# Called by the Stop hook after Claude finishes responding.
# Non-blocking — exits 0 regardless so it never interrupts workflow.

echo "--- TypeScript check ---"
npx tsc --noEmit 2>&1
echo "--- TypeScript check complete ---"
exit 0
