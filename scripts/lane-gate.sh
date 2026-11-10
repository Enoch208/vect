#!/bin/sh
set -e

lane="$1"
case "$lane" in
  engine) paths="src/domain src/verification src/agents src/fixtures tests/engine" ;;
  ai) paths="src/generation src/server api scripts/run-benchmark.ts tests/ai" ;;
  world) paths="src/components/world tests/world" ;;
  landing) paths="src/components/landing tests/landing" ;;
  studio) paths="src/main.tsx src/app src/components/studio src/components/game src/store/project-store.ts src/store/play-store.ts src/store/api-client.ts src/store/types.ts src/store/persistence.ts src/styles tests/studio" ;;
  proof) paths="src/components/test src/components/proof src/store/test-store.ts src/store/repair-flow.ts tests/proof" ;;
  *) printf 'usage: lane-gate.sh engine|ai|world|studio|landing|proof\n' >&2; exit 2 ;;
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

printf '== %s: commit safety\n' "$lane"
root="$(pwd)/"
pending="$( (git ls-files --others --exclude-standard; git diff --name-only HEAD) | sort -u)"
borrowed=""
for file in $(pnpm exec tsc -p "tsconfig.$lane.json" --listFilesOnly | grep -v '/node_modules/' | sed "s|^$root||"); do
  printf '%s\n' "$pending" | grep -Fxq "$file" || continue
  own=no
  for path in $paths; do
    case "$file" in "$path" | "$path"/*) own=yes ;; esac
  done
  [ "$own" = no ] && borrowed="$borrowed $file"
done
if [ -n "$borrowed" ]; then
  printf 'This lane depends on files another lane has not committed yet:\n' >&2
  for file in $borrowed; do printf '  %s\n' "$file" >&2; done
  printf 'Committing now would break main. Wait until they are committed, or remove the import.\n' >&2
  exit 1
fi

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
