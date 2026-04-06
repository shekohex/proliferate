#!/bin/bash
set -euo pipefail

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$HOME/.opencode/bin:$PATH"
export MISE_DATA_DIR="$HOME/.local/share/mise"
export MISE_CONFIG_DIR="$HOME/.config/mise"
export MISE_GLOBAL_CONFIG_FILE="$HOME/.config/mise/config.toml"
export PATH="$MISE_DATA_DIR/shims:$PATH"
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
export PYTHONPATH="$HOME/.local/share/proliferate/python/lib/python${PYTHON_VERSION}/site-packages${PYTHONPATH:+:$PYTHONPATH}"

resolve_caddy_bin() {
	local candidate
	for candidate in \
		/usr/local/share/mise/installs/aqua-caddyserver-caddy/*/caddy \
		"$HOME/.local/share/mise/installs/aqua-caddyserver-caddy/*/caddy"; do
		if [ -x "$candidate" ]; then
			printf '%s\n' "$candidate"
			return 0
		fi
	done

	if command -v mise >/dev/null 2>&1; then
		local caddy_bin
		caddy_bin="$(mise which caddy 2>/dev/null || true)"
		if [ -n "$caddy_bin" ] && [ -x "$caddy_bin" ]; then
			printf '%s\n' "$caddy_bin"
			return 0
		fi
	fi

	if command -v caddy >/dev/null 2>&1; then
		command -v caddy
		return 0
	fi

	return 1
}

resolve_node_bin() {
	local candidate
	for candidate in \
		/usr/local/share/mise/installs/node/*/bin/node \
		"$HOME/.local/share/mise/installs/node/*/bin/node"; do
		if [ -x "$candidate" ]; then
			printf '%s\n' "$candidate"
			return 0
		fi
	done

	if command -v mise >/dev/null 2>&1; then
		local node_bin
		node_bin="$(mise which node 2>/dev/null || true)"
		if [ -n "$node_bin" ] && [ -x "$node_bin" ]; then
			printf '%s\n' "$node_bin"
			return 0
		fi
	fi

	if command -v node >/dev/null 2>&1; then
		command -v node
		return 0
	fi

	return 1
}

ARG_WORKDIR=${ARG_WORKDIR:-"$HOME/project"}
ARG_WORKSPACE_DIR=${ARG_WORKSPACE_DIR:-"$ARG_WORKDIR"}
ARG_SESSION_ID=${ARG_SESSION_ID:-}
ARG_SESSION_TOKEN=$(echo -n "${ARG_SESSION_TOKEN:-}" | base64 -d 2>/dev/null || echo "")
ARG_GATEWAY_URL=${ARG_GATEWAY_URL:-}
ARG_PORT=${ARG_PORT:-20000}
ARG_OPENCODE_PORT=${ARG_OPENCODE_PORT:-4096}
ARG_SANDBOX_AGENT_PORT=${ARG_SANDBOX_AGENT_PORT:-2468}
ARG_SANDBOX_DAEMON_PORT=${ARG_SANDBOX_DAEMON_PORT:-8470}
ARG_SANDBOX_MCP_PORT=${ARG_SANDBOX_MCP_PORT:-4000}

SANDBOX_MCP_BIN="$HOME/.local/bin/sandbox-mcp"
SANDBOX_DAEMON_BIN="$HOME/.local/bin/sandbox-daemon"

CADDY_BIN="$(resolve_caddy_bin 2>/dev/null || true)"
NODE_BIN="$(resolve_node_bin 2>/dev/null || true)"

if [ -n "$NODE_BIN" ]; then
	export PATH="$(dirname "$NODE_BIN"):$PATH"
fi

mkdir -p "$HOME/.proliferate/caddy"
touch "$HOME/.proliferate/caddy/user.caddy"

cat > "$HOME/Caddyfile" <<EOF
{
    admin off
}

:${ARG_PORT} {
    handle_path /_proliferate/mcp/* {
        reverse_proxy localhost:${ARG_SANDBOX_MCP_PORT}
    }

    handle /v1/* {
        reverse_proxy localhost:${ARG_SANDBOX_AGENT_PORT}
    }

    handle /_proliferate/* {
        reverse_proxy localhost:${ARG_SANDBOX_DAEMON_PORT}
    }

    import ${HOME}/.proliferate/caddy/user.caddy

    handle {
        reverse_proxy localhost:${ARG_OPENCODE_PORT}
        header {
            -X-Frame-Options
            -Content-Security-Policy
        }
    }
}
EOF

if ! pgrep -f "opencode serve --port ${ARG_OPENCODE_PORT}" >/dev/null 2>&1; then
  nohup bash -lc "cd '$ARG_WORKDIR' && opencode serve --port ${ARG_OPENCODE_PORT} --hostname 0.0.0.0 --print-logs" >/tmp/opencode-serve.log 2>&1 &
fi

if ! pgrep -f "$SANDBOX_MCP_BIN api" >/dev/null 2>&1; then
	nohup env WORKSPACE_DIR="$ARG_WORKSPACE_DIR" SANDBOX_MCP_AUTH_TOKEN="$ARG_SESSION_TOKEN" "$SANDBOX_MCP_BIN" api >/tmp/sandbox-mcp.log 2>&1 &
fi

if ! pgrep -f "$SANDBOX_DAEMON_BIN" >/dev/null 2>&1; then
	nohup env NODE_ENV=production PROLIFERATE_WORKSPACE_ROOT="$ARG_WORKSPACE_DIR" PROLIFERATE_SESSION_TOKEN="$ARG_SESSION_TOKEN" "$SANDBOX_DAEMON_BIN" >/tmp/sandbox-daemon.log 2>&1 &
fi

if ! pgrep -f "sandbox-agent server --host 0.0.0.0 --port ${ARG_SANDBOX_AGENT_PORT}" >/dev/null 2>&1; then
  nohup env HOME="$HOME" SESSION_ID="$ARG_SESSION_ID" PROLIFERATE_GATEWAY_URL="$ARG_GATEWAY_URL" OPENCODE_DISABLE_DEFAULT_PLUGINS=true sandbox-agent server --host 0.0.0.0 --port ${ARG_SANDBOX_AGENT_PORT} --no-token >/tmp/sandbox-agent.log 2>&1 &
fi

if [ -n "$CADDY_BIN" ] && ! pgrep -f "$CADDY_BIN run --config $HOME/Caddyfile" >/dev/null 2>&1; then
	nohup "$CADDY_BIN" run --config "$HOME/Caddyfile" >/tmp/proliferate-caddy.log 2>&1 &
fi
