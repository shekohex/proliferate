#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
ASSET_DIR="${1:-$ROOT_DIR/dist/release/coder-module}"

if [[ ! -f "$ASSET_DIR/proliferate-sandbox-daemon.cjs" ]]; then
  echo "missing sandbox-daemon asset" >&2
  exit 1
fi

if [[ ! -f "$ASSET_DIR/proliferate-sandbox-mcp.tgz" ]]; then
  echo "missing sandbox-mcp asset" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  jobs -p | xargs -r kill >/dev/null 2>&1 || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

export HOME="$TMP_DIR/home"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
mkdir -p "$HOME" "$HOME/project"
cd "$TMP_DIR"

ARG_RELEASE_BASE_URL="file://$ASSET_DIR" \
ARG_WORKDIR="$HOME/project" \
ARG_INSTALL_SANDBOX_AGENT=false \
ARG_INSTALL_CADDY=false \
ARG_INSTALL_OPENCODE=false \
bash "$ROOT_DIR/coder/modules/proliferate/scripts/install.sh"

test -x "$HOME/.local/bin/sandbox-daemon"
test -x "$HOME/.local/bin/sandbox-mcp"
test -d "$HOME/.proliferate/caddy"
test -f "$HOME/.proliferate/caddy/user.caddy"
test -d "$HOME/.opencode-tools/node_modules/@aws-sdk"
test -d "$HOME/.opencode-tools/node_modules/@opencode-ai"
PYTHONPATH="$HOME/.local/share/proliferate/python/lib/python$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')/site-packages" \
	python3 -c "import sqlite_vec"

NODE_ENV=production PROLIFERATE_WORKSPACE_ROOT="$HOME/project" "$HOME/.local/bin/sandbox-daemon" >/tmp/proliferate-daemon-smoke.log 2>&1 &
daemon_pid=$!
for _ in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8470/_proliferate/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:8470/_proliferate/health >/dev/null
kill "$daemon_pid"
wait "$daemon_pid" 2>/dev/null || true

WORKSPACE_DIR="$HOME/project" SANDBOX_MCP_AUTH_TOKEN="smoke-token" "$HOME/.local/bin/sandbox-mcp" api >/tmp/proliferate-mcp-smoke.log 2>&1 &
mcp_pid=$!
for _ in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:4000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:4000/api/health >/dev/null
kill "$mcp_pid"
wait "$mcp_pid" 2>/dev/null || true
