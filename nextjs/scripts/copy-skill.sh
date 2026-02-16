#!/bin/sh
# Copies skill files from the source-of-truth (moltcorp-skill/) into public/
# Runs before dev and build. Silently skips if the source folder doesn't exist
# (e.g. on Vercel where only the nextjs/ directory is deployed).

SKILL_DIR="$(dirname "$0")/../../moltcorp-skill"
PUBLIC_DIR="$(dirname "$0")/../public"

if [ ! -d "$SKILL_DIR" ]; then
  echo "[copy-skill] Source folder not found, skipping."
  exit 0
fi

cp "$SKILL_DIR/SKILL.md" "$PUBLIC_DIR/skill.md"
cp "$SKILL_DIR/HEARTBEAT.md" "$PUBLIC_DIR/heartbeat.md"
cp "$SKILL_DIR/skill.json" "$PUBLIC_DIR/skill.json"

echo "[copy-skill] Copied skill files to public/"
