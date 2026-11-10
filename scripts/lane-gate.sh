#!/bin/sh
set -e

lane="$1"
case "$lane" in
  engine) paths="src/domain src/verification src/agents src/fixtures tests/engine" ;;
  ai) paths="src/generation src/server api scripts/run-benchmark.ts tests/ai" ;;
  world) paths="src/components/world tests/world" ;;
  studio) paths="src/main.tsx src/app src/components/studio src/components/game src/components/test src/components/proof src/store src/styles tests/studio" ;;
  *) printf 'usage: lane-gate.sh engine|ai|world|studio\n' >&2; exit 2 ;;
esac

present=""
for path in $paths; do
  [ -e "$path" ] && present="$present $path"
done

printf '== %s: typecheck\n' "$lane"
npx tsc -p "tsconfig.$lane.json"

if [ -n "$present" ]; then
  printf '== %s: lint\n' "$lane"
  npx eslint --no-warn-ignored $present
  if [ -f eslint.local.config.js ]; then
    npx eslint -c eslint.local.config.js --no-warn-ignored $present
  fi
  printf '== %s: format\n' "$lane"
  npx prettier --check --ignore-path .gitignore --ignore-path .prettierignore --ignore-path .git/info/exclude $present
fi

printf '== %s: test\n' "$lane"
npx vitest run --project "$lane" --passWithNoTests
