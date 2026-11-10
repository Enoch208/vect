#!/bin/sh
set -e

lane="$1"
case "$lane" in
  engine) paths="src/domain src/verification src/agents src/fixtures tests/engine" ;;
  ai) paths="src/generation src/server api scripts/run-benchmark.ts tests/ai" ;;
  world) paths="src/components/world tests/world" ;;
  landing) paths="src/components/landing tests/landing" ;;
  studio) paths="src/main.tsx src/app src/components/studio src/components/game src/components/test src/components/proof src/store src/styles tests/studio" ;;
  *) printf 'usage: lane-gate.sh engine|ai|world|studio|landing\n' >&2; exit 2 ;;
esac

present=""
lintable=""
for path in $paths; do
  if [ -n "$(find "$path" -type f 2>/dev/null | head -n 1)" ]; then
    present="$present $path"
  fi
  if [ -n "$(find "$path" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \) 2>/dev/null | head -n 1)" ]; then
    lintable="$lintable $path"
  fi
done

printf '== %s: typecheck\n' "$lane"
pnpm exec tsc -p "tsconfig.$lane.json"

if [ -n "$lintable" ]; then
  printf '== %s: lint\n' "$lane"
  pnpm exec eslint --no-warn-ignored --no-error-on-unmatched-pattern $lintable
  if [ -f eslint.local.config.js ]; then
    pnpm exec eslint -c eslint.local.config.js --no-warn-ignored --no-error-on-unmatched-pattern $lintable
  fi
fi

if [ -n "$present" ]; then
  printf '== %s: format\n' "$lane"
  pnpm exec prettier --check --ignore-path .gitignore --ignore-path .prettierignore --ignore-path .git/info/exclude $present
fi

printf '== %s: test\n' "$lane"
pnpm exec vitest run --project "$lane" --passWithNoTests
