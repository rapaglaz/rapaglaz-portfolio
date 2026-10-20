#!/bin/sh
# Production smoke checks for the pages of rapaglaz.de: the redirects, rewrites and response headers
# that Cloudflare rules in the dashboard decide, and the lang and canonical link of the prerender.
# Read-only: GET requests only. Run it with BASE=<url> to check another host, and with
# EXPECTED_DIR=<build output> to also check that /en and /de load the main bundle of that build.
set -u

BASE="${BASE:-https://rapaglaz.de}"
failed=0

check() { # description, expected, actual
  if [ "$2" = "$3" ]; then
    echo "PASS  $1"
  else
    echo "FAIL  $1 (expected '$2', got '$3')"
    failed=1
  fi
}

fetch() { curl -sS --max-time 20 --retry 3 --retry-delay 5 "$@"; }

status() { fetch -o /dev/null -w '%{http_code}' "$@"; }

bundle() { grep -o 'main-[A-Za-z0-9_-]*\.js' | head -n 1; } # first main bundle name in stdin

header() { # header name, then curl arguments
  name=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  shift
  fetch -o /dev/null -D - "$@" | tr -d '\r' |
    awk -v n="$name" 'index(tolower($0), n ": ") == 1 { print substr($0, length(n) + 3) }'
}

echo "== prerendered pages"
for lang in en de; do
  html=$(fetch "$BASE/$lang")
  check "/$lang answers 200" 200 "$(status "$BASE/$lang")"
  check "/$lang has <html lang=\"$lang\">" "$lang" \
    "$(printf '%s' "$html" | grep -o '<html[^>]*>' | sed -n 's/.*lang="\([^"]*\)".*/\1/p' | head -n 1)"
  check "/$lang points its canonical link to itself" "$BASE/$lang" \
    "$(printf '%s' "$html" | grep -o '<link[^>]*rel="canonical"[^>]*>' | sed -n 's/.*href="\([^"]*\)".*/\1/p' | head -n 1)"
  if [ -n "${EXPECTED_DIR:-}" ]; then
    expected=$(bundle < "$EXPECTED_DIR/$lang/index.html")
    check "/$lang serves the deployed main bundle" \
      "${expected:-no main bundle in $EXPECTED_DIR/$lang/index.html}" \
      "$(printf '%s' "$html" | bundle)"
  fi
done

echo "== redirects from /"
check "302 for a German browser" 302 "$(status -H 'Accept-Language: de-DE,de;q=0.9' "$BASE/")"
check "German browser goes to /de" "$BASE/de" "$(header location -H 'Accept-Language: de-DE,de;q=0.9' "$BASE/")"
check "English browser goes to /en" "$BASE/en" "$(header location -H 'Accept-Language: en-US' "$BASE/")"
check "no Accept-Language goes to /en" "$BASE/en" "$(header location "$BASE/")"

echo "== security headers (docs/SECURITY.md)"
check "Strict-Transport-Security" 'max-age=15768000' "$(header strict-transport-security "$BASE/en")"
check "X-Content-Type-Options" 'nosniff' "$(header x-content-type-options "$BASE/en")"
check "X-Frame-Options" 'DENY' "$(header x-frame-options "$BASE/en")"
check "Referrer-Policy" 'strict-origin-when-cross-origin' "$(header referrer-policy "$BASE/en")"
check "Permissions-Policy" 'geolocation=(), microphone=(), camera=()' "$(header permissions-policy "$BASE/en")"

echo
if [ "$failed" = 0 ]; then echo "All checks passed."; else echo "Some checks failed."; fi
exit "$failed"
