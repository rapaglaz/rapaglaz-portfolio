#!/bin/bash
# Cloud sessions only
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
NODE_DIR=/opt/node-pinned

# Node version from .nvmrc, installed from the npm registry (nodejs.org is not reachable)
if npm install --no-audit --no-fund --prefix "$NODE_DIR" "node@$NODE_VERSION"; then
  export PATH="$NODE_DIR/node_modules/.bin:$PATH"
  # Persist PATH for the commands Claude runs later in the session
  [ -n "$CLAUDE_ENV_FILE" ] && echo "export PATH=\"$NODE_DIR/node_modules/.bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
else
  echo "WARN: node@$NODE_VERSION install failed, staying on $(node -v)" >&2
fi

echo "node $(node -v), pnpm $(pnpm -v)"
CI=true pnpm install --frozen-lockfile
exit 0
