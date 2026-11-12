#!/bin/sh
set -eu

host="root@76.13.10.76"
key="${VECT_SSH_KEY:-$HOME/.ssh/vect_deploy}"
here="$(cd "$(dirname "$0")" && pwd)"

remote() {
  ssh -i "$key" -o BatchMode=yes "$host" "$@"
}

remote 'set -e
id vect >/dev/null 2>&1 || useradd --system --home-dir /srv/vect --create-home --shell /usr/sbin/nologin vect
mkdir -p /srv/vect/releases /etc/vect
chown vect:vect /srv/vect /srv/vect/releases
chmod 755 /srv/vect /srv/vect/releases
[ -f /etc/vect/vect.env ] || printf "%s\n" HOST=127.0.0.1 PORT=8830 OPENAI_MODEL=gpt-6.1-sol AI_TIMEOUT_MS=45000 AI_MAX_CONCURRENT=3 AI_RATE_LIMIT_PER_HOUR=20 > /etc/vect/vect.env
chown root:vect /etc/vect/vect.env
chmod 640 /etc/vect/vect.env'

scp -q -i "$key" "$here/vect-api.service" "$host:/etc/systemd/system/vect-api.service"
remote 'test -f /etc/nginx/sites-available/vect' || scp -q -i "$key" "$here/nginx.conf" "$host:/etc/nginx/sites-available/vect"

remote 'set -e
ln -sfn /etc/nginx/sites-available/vect /etc/nginx/sites-enabled/vect
nginx -t
systemctl reload nginx
systemctl daemon-reload
systemctl enable vect-api
[ -d /etc/letsencrypt/live/usevect.xyz ] || certbot --nginx --non-interactive --agree-tos --redirect -d usevect.xyz -d www.usevect.xyz'
