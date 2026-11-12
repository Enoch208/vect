#!/bin/sh
set -eu

host="root@76.13.10.76"
key="${VECT_SSH_KEY:-$HOME/.ssh/vect_deploy}"
site="https://usevect.xyz"

repo="$(git rev-parse --show-toplevel)"
cd "$repo"

git fetch -q origin main
full="$(git rev-parse origin/main)"
sha="$(git rev-parse --short origin/main)"
ci="$(gh run list --commit "$full" --limit 1 --json conclusion --jq '.[0].conclusion // "none"')"
if [ "$ci" != "success" ]; then
  printf 'CI for origin/main (%s) is "%s", not success. Push, wait for green, then deploy.\n' "$sha" "$ci" >&2
  exit 1
fi

remote() {
  ssh -i "$key" -o BatchMode=yes "$host" "$@"
}

release="/srv/vect/releases/$sha"
printf 'Shipping %s (CI green) to %s\n' "$sha" "$host"
git archive --format=tar "$full" | remote "rm -rf $release && mkdir -p $release && tar -x -C $release && chown -R vect:vect $release"
remote "cd $release && runuser -u vect -- env HOME=/srv/vect CI=1 sh -c 'pnpm install --frozen-lockfile >/dev/null && pnpm exec vite build >/dev/null'"
remote "set -e
printf 'VECT_BUILD_SHA=%s\n' $sha > /etc/vect/build.env
ln -sfn $release /srv/vect/current
systemctl restart vect-api
ls -1t /srv/vect/releases | tail -n +4 | sed 's|^|/srv/vect/releases/|' | xargs -r rm -rf
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  curl -fsS -m 5 http://127.0.0.1:8830/api/health && exit 0
  sleep 1
done
exit 1"
printf '\nPublic: '
curl -sS -m 30 "$site/api/health" || printf 'not reachable yet (DNS or TLS)'
printf '\n'
