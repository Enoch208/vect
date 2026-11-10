#!/bin/sh
set -e

repo="$(git rev-parse --show-toplevel)"
cd "$repo"

git fetch -q origin main
sha="$(git rev-parse --short origin/main)"
ci="$(gh run list --commit "$(git rev-parse origin/main)" --limit 1 --json conclusion --jq '.[0].conclusion // "none"')"
if [ "$ci" != "success" ]; then
  printf 'CI for origin/main (%s) is "%s", not success. Push, wait for green, then deploy.\n' "$sha" "$ci" >&2
  exit 1
fi

work="$(mktemp -d "${TMPDIR:-/tmp}/vect-deploy-XXXXXX")"
trap 'git -C "$repo" worktree remove --force "$work" >/dev/null 2>&1 || true' EXIT
git worktree add -q --detach "$work" "$sha"
cp -R "$repo/.vercel" "$work/.vercel"

printf 'Deploying %s (CI green) to production from a clean worktree\n' "$sha"
url="$(cd "$work" && vercel deploy --prod --yes --scope tekcify --env "VECT_BUILD_SHA=$sha" 2>/dev/null | grep -oE 'https://vect-[a-z0-9]+-tekcify\.vercel\.app' | head -n 1)"
printf 'Deployment: %s\n' "$url"
printf 'Health: '
curl -s -m 30 "https://vect-pi.vercel.app/api/health"
printf '\n'
