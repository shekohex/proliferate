#!/bin/bash
set -euo pipefail

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
export MISE_DATA_DIR="${MISE_DATA_DIR:-$HOME/.local/share/mise}"
export MISE_CONFIG_DIR="${MISE_CONFIG_DIR:-$HOME/.config/mise}"
export MISE_GLOBAL_CONFIG_FILE="${MISE_GLOBAL_CONFIG_FILE:-$HOME/.config/mise/config.toml}"
export PATH="$MISE_DATA_DIR/shims:$PATH"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

resolve_bun_bin() {
  if [ -x "$HOME/.bun/bin/bun" ]; then
    printf '%s\n' "$HOME/.bun/bin/bun"
    return 0
  fi

  if command_exists bun; then
    command -v bun
    return 0
  fi

  return 1
}

ARG_RELEASE_BASE_URL=${ARG_RELEASE_BASE_URL:?}
ARG_SANDBOX_DAEMON_ASSET_NAME=${ARG_SANDBOX_DAEMON_ASSET_NAME:-proliferate-sandbox-daemon.cjs}
ARG_SANDBOX_MCP_ASSET_NAME=${ARG_SANDBOX_MCP_ASSET_NAME:-proliferate-sandbox-mcp.tgz}
ARG_INSTALL_SANDBOX_AGENT=${ARG_INSTALL_SANDBOX_AGENT:-true}
ARG_INSTALL_CADDY=${ARG_INSTALL_CADDY:-true}
ARG_CADDY_VERSION=${ARG_CADDY_VERSION:-2}
ARG_SANDBOX_AGENT_INSTALL_URL=${ARG_SANDBOX_AGENT_INSTALL_URL:-}
ARG_INSTALL_OPENCODE=${ARG_INSTALL_OPENCODE:-true}
ARG_OPENCODE_VERSION=${ARG_OPENCODE_VERSION:-latest}
ARG_WORKDIR=${ARG_WORKDIR:-"$HOME/project"}
ARG_AUTH_JSON=$(echo -n "${ARG_AUTH_JSON:-}" | base64 -d 2>/dev/null || echo "")
ARG_OPENCODE_CONFIG=$(echo -n "${ARG_OPENCODE_CONFIG:-}" | base64 -d 2>/dev/null || echo "")
ARG_PRE_INSTALL_SCRIPT=$(echo -n "${ARG_PRE_INSTALL_SCRIPT:-}" | base64 -d 2>/dev/null || echo "")
ARG_POST_INSTALL_SCRIPT=$(echo -n "${ARG_POST_INSTALL_SCRIPT:-}" | base64 -d 2>/dev/null || echo "")
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')

LOCAL_BIN="$HOME/.local/bin"
LOCAL_SHARE="$HOME/.local/share/proliferate"
PROLIFERATE_HOME="$HOME/.proliferate"
OPENCODE_TOOLS_DIR="$HOME/.opencode-tools"
PYTHON_SITE_PACKAGES="$LOCAL_SHARE/python/lib/python${PYTHON_VERSION}/site-packages"
mkdir -p "$LOCAL_BIN" "$LOCAL_SHARE" "$PROLIFERATE_HOME/caddy" "$HOME/.config/opencode" "$HOME/.local/share/opencode" "$OPENCODE_TOOLS_DIR" "$ARG_WORKDIR"

run_pre_install_script() {
  if [ -n "$ARG_PRE_INSTALL_SCRIPT" ]; then
    local script_path="/tmp/proliferate-pre-install.sh"
    printf '%s' "$ARG_PRE_INSTALL_SCRIPT" > "$script_path"
    chmod +x "$script_path"
    "$script_path"
  fi
}

download_asset() {
  local asset_name="$1"
  local target_path="$2"
  curl -fsSL "$ARG_RELEASE_BASE_URL/$asset_name" -o "$target_path"
}

install_sandbox_daemon() {
  local target_path="$LOCAL_BIN/sandbox-daemon"
  if [ -x "$target_path" ]; then
    return 0
  fi
  download_asset "$ARG_SANDBOX_DAEMON_ASSET_NAME" "$target_path"
  chmod +x "$target_path"
}

install_sandbox_mcp() {
  if command_exists sandbox-mcp; then
    return 0
  fi

  local package_path="$LOCAL_SHARE/$ARG_SANDBOX_MCP_ASSET_NAME"
  download_asset "$ARG_SANDBOX_MCP_ASSET_NAME" "$package_path"
  NPM_CONFIG_PREFIX="$HOME/.local" npm install -g "$package_path"
}

install_sandbox_agent() {
  if [ "$ARG_INSTALL_SANDBOX_AGENT" != "true" ]; then
    return 0
  fi

  if command_exists sandbox-agent; then
    return 0
  fi

  if [ -z "$ARG_SANDBOX_AGENT_INSTALL_URL" ]; then
    echo "sandbox-agent install URL is required" >&2
    exit 1
  fi

  curl -fsSL "$ARG_SANDBOX_AGENT_INSTALL_URL" | sh
}

install_caddy() {
  if [ "$ARG_INSTALL_CADDY" != "true" ]; then
    return 0
  fi

  if command_exists caddy; then
    return 0
  fi

  if ! command_exists mise; then
    echo "mise is required to install caddy" >&2
    exit 1
  fi

  mkdir -p "$MISE_DATA_DIR" "$MISE_CONFIG_DIR"
  mise use --global "aqua:caddyserver/caddy@${ARG_CADDY_VERSION}"
  mise install "aqua:caddyserver/caddy@${ARG_CADDY_VERSION}"
}

install_opencode() {
  if [ "$ARG_INSTALL_OPENCODE" != "true" ]; then
    return 0
  fi

  if command_exists opencode; then
    return 0
  fi

  local bun_bin
  bun_bin="$(resolve_bun_bin 2>/dev/null || true)"
  if [ -n "$bun_bin" ]; then
    if [ "$ARG_OPENCODE_VERSION" = "latest" ]; then
      "$bun_bin" add -g opencode-ai
    else
      "$bun_bin" add -g "opencode-ai@$ARG_OPENCODE_VERSION"
    fi
    return 0
  fi

  if [ "$ARG_OPENCODE_VERSION" = "latest" ]; then
    curl -fsSL https://opencode.ai/install | bash
  else
    VERSION="$ARG_OPENCODE_VERSION" curl -fsSL https://opencode.ai/install | bash
  fi
}

install_sqlite_vec() {
	if command_exists python3 && PYTHONPATH="$PYTHON_SITE_PACKAGES${PYTHONPATH:+:$PYTHONPATH}" python3 -c "import sqlite_vec" >/dev/null 2>&1; then
		return 0
	fi

	if ! command_exists uv; then
		echo "uv is required to install sqlite-vec" >&2
		exit 1
	fi

	mkdir -p "$PYTHON_SITE_PACKAGES"
	uv pip install --python "$(command -v python3)" --target "$PYTHON_SITE_PACKAGES" sqlite-vec
}

install_proliferate_home_deps() {
  if node -e "try { require('$PROLIFERATE_HOME/node_modules/better-sqlite3'); console.log('ok') } catch { console.log('missing') }" | grep -q ok; then
    return 0
  fi

  mkdir -p "$PROLIFERATE_HOME"
  if [ ! -f "$PROLIFERATE_HOME/package.json" ]; then
    printf '%s' '{"name":"proliferate-runtime-home","private":true}' > "$PROLIFERATE_HOME/package.json"
  fi
  (
    cd "$PROLIFERATE_HOME"
    npm install better-sqlite3@11
  )
}

install_opencode_tools() {
  if [ -d "$OPENCODE_TOOLS_DIR/node_modules/@aws-sdk" ] && [ -d "$OPENCODE_TOOLS_DIR/node_modules/@opencode-ai" ]; then
    return 0
  fi

  if [ ! -f "$OPENCODE_TOOLS_DIR/package.json" ]; then
    printf '%s' '{"name":"opencode-tools","version":"1.0.0","private":true}' > "$OPENCODE_TOOLS_DIR/package.json"
  fi

  (
    cd "$OPENCODE_TOOLS_DIR"
    npm install @aws-sdk/client-s3 @opencode-ai/plugin
  )
}

ensure_proliferate_dirs() {
  mkdir -p "$PROLIFERATE_HOME/caddy"
  touch "$PROLIFERATE_HOME/caddy/user.caddy"
}

write_opencode_files() {
  if [ -n "$ARG_AUTH_JSON" ]; then
    printf '%s' "$ARG_AUTH_JSON" > "$HOME/.local/share/opencode/auth.json"
  fi

  if [ -n "$ARG_OPENCODE_CONFIG" ]; then
    printf '%s' "$ARG_OPENCODE_CONFIG" > "$HOME/.config/opencode/opencode.jsonc"
  fi
}

run_post_install_script() {
  if [ -n "$ARG_POST_INSTALL_SCRIPT" ]; then
    local script_path="/tmp/proliferate-post-install.sh"
    printf '%s' "$ARG_POST_INSTALL_SCRIPT" > "$script_path"
    chmod +x "$script_path"
    "$script_path"
  fi
}

run_pre_install_script
install_sandbox_daemon
install_sandbox_mcp
install_sandbox_agent
install_caddy
install_opencode
install_sqlite_vec
install_proliferate_home_deps
install_opencode_tools
ensure_proliferate_dirs
write_opencode_files
run_post_install_script
