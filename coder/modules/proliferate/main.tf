terraform {
  required_version = ">= 1.0"

  required_providers {
    coder = {
      source  = "coder/coder"
      version = ">= 2.12"
    }
  }
}

variable "agent_id" {
  type        = string
  description = "The ID of a Coder agent."
}

data "coder_workspace" "me" {}

data "coder_workspace_owner" "me" {}

variable "order" {
  type        = number
  description = "The order determines the position of app in the UI presentation. The lowest order is shown first and apps with equal order are sorted by name (ascending order)."
  default     = null
}

variable "group" {
  type        = string
  description = "The name of a group that this app belongs to."
  default     = null
}

variable "icon" {
  type        = string
  description = "The icon to use for the app."
  default     = "https://proliferate.com/icon.svg"
}

variable "workdir" {
  type        = string
  description = "The folder to run Proliferate runtime services in."
}

variable "display_name" {
  type        = string
  description = "Display name for the Proliferate app."
  default     = "Proliferate"
}

variable "app_slug" {
  type        = string
  description = "Slug for the Proliferate app."
  default     = "proliferate"
}

variable "subdomain" {
  type        = bool
  description = "Whether to use a subdomain for the Proliferate app."
  default     = true
}

variable "release_ref" {
  type        = string
  description = "GitHub release tag/ref that contains the packaged Proliferate runtime artifacts."
  default     = "coder-module-nightly"
}

variable "github_repository" {
  type        = string
  description = "GitHub repository that publishes the Proliferate runtime release artifacts."
  default     = "shekohex/proliferate"
}

variable "artifact_base_url" {
  type        = string
  description = "Optional override for the release asset base URL."
  default     = ""
}

variable "sandbox_daemon_asset_name" {
  type        = string
  description = "Release asset name for the sandbox-daemon bundle."
  default     = "proliferate-sandbox-daemon.cjs"
}

variable "sandbox_mcp_asset_name" {
  type        = string
  description = "Release asset name for the sandbox-mcp package."
  default     = "proliferate-sandbox-mcp.tgz"
}

variable "install_sandbox_agent" {
  type        = bool
  description = "Whether to install sandbox-agent from Rivet."
  default     = true
}

variable "install_caddy" {
  type        = bool
  description = "Whether to install Caddy into the workspace user bin directory."
  default     = true
}

variable "caddy_version" {
  type        = string
  description = "Pinned Caddy version installed via mise into the user-local tool directory."
  default     = "2"
}

variable "sandbox_agent_install_url" {
  type        = string
  description = "Install script URL for sandbox-agent."
  default     = "https://releases.rivet.dev/sandbox-agent/0.2.28/install.sh"
}

variable "install_opencode" {
  type        = bool
  description = "Whether to install OpenCode."
  default     = true
}

variable "opencode_version" {
  type        = string
  description = "OpenCode version to install."
  default     = "latest"
}

variable "opencode_port" {
  type        = number
  description = "Port for the OpenCode web server."
  default     = 4096
}

variable "port" {
  type        = number
  description = "Port for the Proliferate Caddy entrypoint."
  default     = 20000
}

variable "sandbox_agent_port" {
  type        = number
  description = "Port for sandbox-agent ACP."
  default     = 2468
}

variable "sandbox_daemon_port" {
  type        = number
  description = "Port for sandbox-daemon."
  default     = 8470
}

variable "sandbox_mcp_port" {
  type        = number
  description = "Port for sandbox-mcp API."
  default     = 4000
}

variable "workspace_dir" {
  type        = string
  description = "Workspace root exposed to Proliferate services."
  default     = "/home/coder/workspace"
}

variable "session_id" {
  type        = string
  description = "Optional Proliferate session ID."
  default     = ""
}

variable "session_token" {
  type        = string
  description = "Optional auth token shared by Proliferate runtime services."
  default     = ""
  sensitive   = true
}

variable "gateway_url" {
  type        = string
  description = "Optional Proliferate gateway URL for manager/session integrations."
  default     = ""
}

variable "auth_json" {
  type        = string
  description = "Optional OpenCode auth.json content."
  default     = ""
  sensitive   = true
}

variable "config_json" {
  type        = string
  description = "Optional OpenCode config JSON content."
  default     = ""
}

variable "pre_install_script" {
  type        = string
  description = "Custom script to run before installing Proliferate runtime dependencies."
  default     = null
}

variable "post_install_script" {
  type        = string
  description = "Custom script to run after installing Proliferate runtime dependencies."
  default     = null
}

locals {
  workdir = trimsuffix(var.workdir, "/")
  release_base_url = trimsuffix(
    var.artifact_base_url != "" ? var.artifact_base_url : format("https://github.com/%s/releases/download/%s", var.github_repository, var.release_ref),
    "/",
  )
  install_script = file("${path.module}/scripts/install.sh")
  start_script   = file("${path.module}/scripts/start.sh")
}

resource "coder_script" "proliferate_start" {
  agent_id     = var.agent_id
  display_name = "Start Proliferate Runtime"
  icon         = var.icon
  script       = <<-EOT
    #!/bin/bash
    set -o errexit
    set -o pipefail

    INSTALL_SCRIPT="/tmp/proliferate-install-$$.sh"
    START_SCRIPT="/tmp/proliferate-start-$$.sh"

    echo -n '${base64encode(local.install_script)}' | base64 -d > "$INSTALL_SCRIPT"
    chmod +x "$INSTALL_SCRIPT"

    ARG_RELEASE_BASE_URL='${local.release_base_url}' \
    ARG_SANDBOX_DAEMON_ASSET_NAME='${var.sandbox_daemon_asset_name}' \
    ARG_SANDBOX_MCP_ASSET_NAME='${var.sandbox_mcp_asset_name}' \
    ARG_INSTALL_SANDBOX_AGENT='${var.install_sandbox_agent}' \
    ARG_INSTALL_CADDY='${var.install_caddy}' \
    ARG_CADDY_VERSION='${var.caddy_version}' \
    ARG_SANDBOX_AGENT_INSTALL_URL='${var.sandbox_agent_install_url}' \
    ARG_INSTALL_OPENCODE='${var.install_opencode}' \
    ARG_OPENCODE_VERSION='${var.opencode_version}' \
    ARG_WORKDIR='${local.workdir}' \
    ARG_AUTH_JSON='${var.auth_json != null ? base64encode(replace(var.auth_json, "'", "'\\''")) : ""}' \
    ARG_OPENCODE_CONFIG='${var.config_json != null ? base64encode(replace(var.config_json, "'", "'\\''")) : ""}' \
    ARG_PRE_INSTALL_SCRIPT='${var.pre_install_script != null ? base64encode(var.pre_install_script) : ""}' \
    ARG_POST_INSTALL_SCRIPT='${var.post_install_script != null ? base64encode(var.post_install_script) : ""}' \
    bash -lc "$INSTALL_SCRIPT"

    echo -n '${base64encode(local.start_script)}' | base64 -d > "$START_SCRIPT"
    chmod +x "$START_SCRIPT"

    ARG_WORKDIR='${local.workdir}' \
    ARG_WORKSPACE_DIR='${var.workspace_dir}' \
    ARG_SESSION_ID='${var.session_id}' \
    ARG_SESSION_TOKEN='${var.session_token != null ? base64encode(replace(var.session_token, "'", "'\\''")) : ""}' \
    ARG_GATEWAY_URL='${var.gateway_url}' \
    ARG_PORT='${var.port}' \
    ARG_OPENCODE_PORT='${var.opencode_port}' \
    ARG_SANDBOX_AGENT_PORT='${var.sandbox_agent_port}' \
    ARG_SANDBOX_DAEMON_PORT='${var.sandbox_daemon_port}' \
    ARG_SANDBOX_MCP_PORT='${var.sandbox_mcp_port}' \
    bash -lc "$START_SCRIPT"

    rm -f "$INSTALL_SCRIPT" "$START_SCRIPT"
  EOT
  run_on_start = true
}

resource "coder_app" "proliferate" {
  slug         = var.app_slug
  display_name = var.display_name
  agent_id     = var.agent_id
  url          = "http://localhost:${var.port}/"
  icon         = var.icon
  order        = var.order
  group        = var.group
  subdomain    = var.subdomain

  healthcheck {
    url       = "http://localhost:${var.sandbox_daemon_port}/_proliferate/health"
    interval  = 5
    threshold = 30
  }
}

output "app_id" {
  value = coder_app.proliferate.id
}

output "task_app_id" {
  value = coder_app.proliferate.id
}
