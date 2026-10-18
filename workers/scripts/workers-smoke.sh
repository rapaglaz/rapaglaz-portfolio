#!/usr/bin/env bash
# Production smoke checks for the rapaglaz.de Workers. Read-only: GET, OPTIONS and rejected requests.
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

status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

header() { # header name, then curl arguments
  local name
  name=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  shift
  curl -s -o /dev/null -D - "$@" | tr -d '\r' |
    awk -v n="$name" 'index(tolower($0), n ": ") == 1 { print substr($0, length(n) + 3) }'
}

echo "== portfolio-settings (/config)"
check "200 for the site" 200 "$(status -H "Origin: $SITE" "$BASE/config")"
check "CORS header for the site" "$SITE" "$(header access-control-allow-origin -H "Origin: $SITE" "$BASE/config")"
check "production site key" '0x4AAAAAAB98Vx1r87KQ9OmN' \
  "$(curl -s "$BASE/config" | sed -E 's/.*"turnstileSiteKey":"([^"]*)".*/\1/')"
etag=$(header etag "$BASE/config")
check "304 for a matching ETag" 304 "$(status -H "If-None-Match: $etag" "$BASE/config")"
check "405 for POST" 405 "$(status -X POST "$BASE/config")"
check "no CORS header for other origins" "" "$(header access-control-allow-origin -H "Origin: $OTHER" "$BASE/config")"

echo "== feature-flag (/feature-flag)"
check "200 for openToWork" 200 "$(status -H "Origin: $SITE" "$BASE/feature-flag/openToWork")"
check "boolean value" yes \
  "$(curl -s "$BASE/feature-flag/openToWork" | grep -Eq '^\{"openToWork":(true|false)\}$' && echo yes || echo no)"
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
