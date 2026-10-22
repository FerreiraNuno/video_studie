#!/usr/bin/env sh
# Regenerates src/lib/database.types.ts from the live study_v2 schema.
# Needs SUPABASE_DB_URL in .env.local (session-pooler URI, never printed).
set -eu
cd "$(dirname "$0")/.."
set -a; . ./.env.local; set +a
out=src/lib/database.types.ts
header=$(sed -n '1,/^\/\* eslint-disable \*\/$/p' "$out")
tmp=$(mktemp)
npx --yes supabase@latest gen types typescript --db-url "$SUPABASE_DB_URL" --schema study_v2 > "$tmp"
npx --yes oxfmt "$tmp" >/dev/null 2>&1 || true
{ printf '%s\n' "$header"; cat "$tmp"; } > "$out"
rm -f "$tmp"
echo "wrote $out"
