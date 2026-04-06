#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
OUTPUT_DIR="${1:-$ROOT_DIR/dist/release/coder-module}"

mkdir -p "$OUTPUT_DIR"
rm -rf "$OUTPUT_DIR"/*

pnpm --filter @proliferate/sandbox-daemon bundle
pnpm -C "$ROOT_DIR/packages/sandbox-mcp" bundle
pnpm -C "$ROOT_DIR/packages/sandbox-mcp" pack --pack-destination "$OUTPUT_DIR"

cp "$ROOT_DIR/packages/sandbox-daemon/dist/daemon.cjs" "$OUTPUT_DIR/proliferate-sandbox-daemon.cjs"

SANDBOX_MCP_PACKAGE="$(find "$OUTPUT_DIR" -maxdepth 1 -type f -name 'proliferate-sandbox-mcp-*.tgz' | head -n1)"
if [[ -z "$SANDBOX_MCP_PACKAGE" ]]; then
  echo "sandbox-mcp package was not produced" >&2
  exit 1
fi
cp "$SANDBOX_MCP_PACKAGE" "$OUTPUT_DIR/proliferate-sandbox-mcp.tgz"

tar -czf "$OUTPUT_DIR/proliferate-terraform-module.tgz" -C "$ROOT_DIR" coder/modules/proliferate

node - "$OUTPUT_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const outputDir = process.argv[2];
const sandboxMcpPkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'packages/sandbox-mcp/package.json'), 'utf8'));
const daemonPkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'packages/sandbox-daemon/package.json'), 'utf8'));
const manifest = {
	artifacts: {
		terraformModule: 'proliferate-terraform-module.tgz',
		sandboxDaemon: 'proliferate-sandbox-daemon.cjs',
		sandboxMcp: 'proliferate-sandbox-mcp.tgz',
		sandboxMcpVersioned: path.basename(fs.readdirSync(outputDir).find((entry) => /^proliferate-sandbox-mcp-.*\.tgz$/.test(entry)) || ''),
	},
	versions: {
		sandboxDaemon: daemonPkg.version,
		sandboxMcp: sandboxMcpPkg.version,
	},
	gitSha: process.env.GITHUB_SHA || process.env.GIT_COMMIT || null,
};
fs.writeFileSync(path.join(outputDir, 'proliferate-artifacts.json'), JSON.stringify(manifest, null, 2));
EOF

(cd "$OUTPUT_DIR" && sha256sum * > SHA256SUMS)
