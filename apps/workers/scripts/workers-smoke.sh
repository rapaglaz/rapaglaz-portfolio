#!/usr/bin/env bash
# Production smoke checks for the rapaglaz.de Workers. Read-only: GET, OPTIONS and rejected requests.
# SMOKE_TOKEN is sent as X-Smoke-Token, so a Cloudflare WAF skip rule can let CI runners through.
set -u

BASE="${BASE:-https://rapaglaz.de}"
SITE="https://rapaglaz.de"
OTHER="https://attacker.example"
DL="$BASE/download?file=cv/Radoslaw_Pawel_Glaz_CV-EN.pdf"
failed=0

check() { # description, expected, actual
  if [ "$2" = "$3" ]; then
    echo "PASS  $1"
  else
    echo "FAIL  $1 (expected '$2', got '$3')"
    failed=1
  fi
}

req() { # curl -s; adds X-Smoke-Token when SMOKE_TOKEN is set
  if [ -n "${SMOKE_TOKEN:-}" ]; then set -- -H "X-Smoke-Token: $SMOKE_TOKEN" "$@"; fi
  curl -s "$@"
}

status() { req -o /dev/null -w '%{http_code}' "$@"; }

header() { # header name, then curl arguments
  local name
  name=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  shift
  req -o /dev/null -D - "$@" | tr -d '\r' |
    awk -v n="$name" 'index(tolower($0), n ": ") == 1 { print substr($0, length(n) + 3) }'
}

# Cloudflare answers a client it takes for a bot with a challenge page instead of the Worker, so
# every check would test that page. Without SMOKE_TOKEN that is expected on CI runners: skip with a
# warning. With SMOKE_TOKEN the skip rule should have let the request through: fail.
stop_if_challenged() { # URLs
  local url
  for url in "$@"; do
    [ "$(header cf-mitigated "$url")" = challenge ] || continue
    if [ -n "${SMOKE_TOKEN:-}" ]; then
      echo "FAIL  Cloudflare challenged $url although X-Smoke-Token was sent. Check the WAF skip"
      echo "      rule; Bot Fight Mode cannot be skipped by a rule."
      exit 1
    fi
    echo "SKIP  Cloudflare challenged $url, so no check would reach the Workers. Set SMOKE_TOKEN and"
    echo "      a WAF skip rule for the X-Smoke-Token header to run the checks from this host."
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
      echo "::warning::Workers smoke checks skipped: Cloudflare challenged the runner"
    fi
    exit 0
  done
}

stop_if_challenged "$BASE/config" "$BASE/feature-flag/openToWork" "$BASE/download"

echo "== portfolio-settings (/config)"
check "200 for the site" 200 "$(status -H "Origin: $SITE" "$BASE/config")"
check "CORS header for the site" "$SITE" "$(header access-control-allow-origin -H "Origin: $SITE" "$BASE/config")"
check "production site key" '0x4AAAAAAB98Vx1r87KQ9OmN' \
  "$(req "$BASE/config" | sed -E 's/.*"turnstileSiteKey":"([^"]*)".*/\1/')"
etag=$(header etag "$BASE/config")
check "304 for a matching ETag" 304 "$(status -H "If-None-Match: $etag" "$BASE/config")"
check "405 for POST" 405 "$(status -X POST "$BASE/config")"
check "no CORS header for other origins" "" "$(header access-control-allow-origin -H "Origin: $OTHER" "$BASE/config")"

echo "== feature-flag (/feature-flag)"
check "200 for openToWork" 200 "$(status -H "Origin: $SITE" "$BASE/feature-flag/openToWork")"
check "boolean value" yes \
  "$(req "$BASE/feature-flag/openToWork" | grep -Eq '^\{"openToWork":(true|false)\}$' && echo yes || echo no)"
check "404 for an unknown flag" 404 "$(status "$BASE/feature-flag/doesNotExist")"
check "403 for other origins" 403 "$(status -H "Origin: $OTHER" "$BASE/feature-flag/openToWork")"
check "405 for POST" 405 "$(status -X POST -H "Origin: $SITE" "$BASE/feature-flag/openToWork")"

echo "== cv-download (/download)"
check "preflight allows the token header" cf-turnstile-response \
  "$(header access-control-allow-headers -X OPTIONS -H "Origin: $SITE" -H "Access-Control-Request-Method: GET" "$DL")"
check "401 without a token" 401 "$(status -H "Origin: $SITE" "$DL")"
check "403 for other origins" 403 "$(status -H "Origin: $OTHER" -H "cf-turnstile-response: x" "$DL")"
check "no CORS header for an origin that only contains localhost" "" \
  "$(header access-control-allow-origin -H "Origin: https://localhost.attacker.example" -H "cf-turnstile-response: x" "$DL")"
check "400 for path traversal" 400 \
  "$(status -H "Origin: $SITE" -H "cf-turnstile-response: x" "$BASE/download?file=cv/../private.pdf")"
check "403 for the test token from localhost" 403 \
  "$(status -H "Origin: http://localhost:4200" -H "cf-turnstile-response: XXXX.DUMMY.TOKEN.XXXX" "$DL")"
check "403 for a made-up token" 403 "$(status -H "Origin: $SITE" -H "cf-turnstile-response: made-up" "$DL")"

echo
[ "$failed" = 0 ] && echo "All checks passed." || echo "Some checks failed."
exit "$failed"
