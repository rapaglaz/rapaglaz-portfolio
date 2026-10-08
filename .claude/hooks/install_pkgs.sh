#!/bin/bash
# Cloud sessions only
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0

NODE_VERSION="$(tr -d '[:space:]' < "$CLAUDE_PROJECT_DIR/.nvmrc")"
NODE_DIR=/opt/node-pinned

# Node from the npm registry (nodejs.org is not reachable)
if ! npm install --no-audit --no-fund --prefix "$NODE_DIR" "node@$NODE_VERSION"; then
  echo "WARN: node@$NODE_VERSION install failed, staying on $(node -v)" >&2
  exit 0
fi

export PATH="$NODE_DIR/node_modules/.bin:$PATH"
# Persist PATH for the commands Claude runs later in the session
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "export PATH=\"$NODE_DIR/node_modules/.bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

cd "$CLAUDE_PROJECT_DIR" && CI=true pnpm install --frozen-lockfile
exit 0
