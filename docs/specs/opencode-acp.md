# OpenCode ACP Runtime — System Spec

## 1. Scope & Purpose

### In Scope
- OpenCode ACP session bootstrap and prompt transport.
- ACP session configuration surfaces (`configOptions`, transitional `modes`, and `set_*` mutation flows).
- ACP plan reporting via `session/update`.
- ACP capability negotiation for filesystem, terminals, and slash commands.
- ACP-native file read/write behavior.
- ACP-native terminal/command execution behavior.
- Slash command advertisement and invocation behavior.
- Gateway/runtime integration for ACP session identity, streaming, and reconnect.
- Deprecation path for legacy file/command bridge operations that duplicate ACP capabilities.

### Out of Scope
- Sandbox provider boot and compute orchestration — see `sandbox-providers.md`.
- Repo/workspace binding and provider settings — see `coder-provider.md`.
- Session ownership, leases, and non-ACP WebSocket control-plane behavior — see `sessions-gateway.md`.
- Agent prompt/tool contract and gateway-intercepted side effects — see `agent-contract.md`.
- Coder control-plane APIs and workspace bridge details — see `coder-provider.md`.

### Mental Models

OpenCode ACP is the runtime protocol, not the sandbox provider.

The ACP server owns the agent session and the low-level client capabilities:
- session initialization
- prompt turns
- file reads and writes
- terminal creation and lifecycle
- slash command advertisement

The gateway owns orchestration and policy:
- when to start or resume an ACP session,
- which sandbox/workspace to attach to,
- what auth token to use,
- how to stream events to the browser,
- when legacy fallback paths are allowed.

ACP-native capabilities should be preferred when available.
Legacy bridge methods are transitional and should be removed or demoted once ACP parity is reached.

Session configuration is part of the protocol contract:
- `configOptions` is the preferred interface.
- `modes` remains transitional compatibility.
- The agent must always have a default value for each config option.

Plans are protocol-level progress telemetry:
- they are sent as `session/update` notifications,
- they are not a separate task system,
- they may evolve during the session.

### Things Agents Get Wrong
- Assuming ACP is just `session/prompt`. It also defines filesystem, terminals, and slash commands.
- Assuming ACP file methods are always available. The client must check `initialize.result.clientCapabilities` first.
- Assuming terminal methods are blocking. `terminal/create` returns immediately; output is read separately.
- Assuming slash commands are separate RPCs. They are normal prompt turns with command text in the prompt.
- Assuming plan updates are separate transport. They are `session/update` notifications.
- Assuming `modes` is the long-term API. `configOptions` is the preferred path.
- Assuming the old platform bridge is the long-term source of truth. It is a compatibility path, not the target architecture.

---

## 2. Core Concepts

### ACP Server
The OpenCode ACP server is the runtime endpoint that accepts JSON-RPC over HTTP and streams session events over SSE.

The current gateway harness already uses ACP session methods via `SandboxAgentV2CodingHarnessAdapter` and `apps/gateway/src/harness/coding/sandbox-agent-v2/client.ts`.

### ACP Session Identity
ACP has two relevant identifiers in this codebase:
- Proliferate session ID / server ID used in the HTTP path.
- ACP-internal agent session ID returned by `session/new`.

The gateway must persist enough state to resume or reattach the same ACP session on reconnect when the sandbox/workspace still exists.

### Session Configuration State
ACP session configuration state is a complete snapshot returned at session setup and on mutation.

Relevant pieces:
- `configOptions`: preferred configuration surface
- `modes`: backwards-compatibility surface
- `currentModeId` / `currentValue`: current selection for the active mode/config

The gateway should prefer `configOptions` when available and only fall back to `modes` for older clients or older agent builds.

### Plan State
The plan is a complete list of execution entries reported through `session/update`.

Each update replaces the current plan state. The agent should send the full list, not deltas.

### Client Capabilities
ACP clients must read `initialize.result.clientCapabilities` before using optional methods.

Relevant capability gates:
- `fs.readTextFile`
- `fs.writeTextFile`
- `terminal`

Capabilities are authoritative. A missing capability means the gateway must not call that method.

### ACP-Native File IO
ACP file IO is the preferred path for text file reads and writes when supported.

This includes:
- reading workspace files,
- writing env files,
- updating helper/config files that belong to the workspace runtime.

### ACP-Native Terminals
ACP terminal methods are the preferred path for shell command execution when supported.

They cover:
- command launch,
- output retrieval,
- wait-for-exit,
- kill,
- release.

### Slash Commands
Slash commands are user-facing shortcuts advertised by the agent and invoked through normal prompt turns.

They are not a separate transport. They are a structured prompt convention.

### Legacy Bridge
Legacy bridge operations are any older file/command mechanisms that exist only because ACP-native file/terminal support was missing.

Examples:
- ad hoc shell helpers for file reads/writes,
- custom PTY-only command wrappers,
- bespoke workspace daemon APIs that duplicate ACP file/terminal semantics.

The legacy bridge remains allowed only as a fallback for environments that cannot speak ACP-native file/terminal methods.

### Session Modes
Session modes are the older mode-selection surface.

They remain supported only for compatibility while `configOptions` adoption is incomplete.

### Session Config Options
Session config options are the preferred session configuration surface.

They can represent:
- mode selection
- model selection
- reasoning/thought level selection
- any additional session-level toggle with a default value

---

## 5. Conventions & Patterns

### Do
- Prefer ACP-native `fs/*` and `terminal/*` methods when the client capabilities allow them.
- Keep `session/new` and `session/prompt` as the session lifecycle baseline.
- Prefer `configOptions` over `modes` for session configuration.
- Advertise slash commands through ACP session updates when the runtime has context-specific commands.
- Advertise plans through `session/update` when the model has a meaningful execution plan.
- Preserve Proliferate session identity across reconnects and sandbox recovery.
- Use the legacy bridge only as a fallback implementation detail.

### Don't
- Don't call file or terminal methods unless capability negotiation says they are supported.
- Don't treat `session/prompt` as the only ACP surface.
- Don't keep duplicate file/terminal bridges once ACP-native coverage exists.
- Don't keep `modes` as the primary session configuration API once `configOptions` is available.
- Don't make slash commands depend on separate RPC transport.
- Don't tie ACP session identity to transient gateway process memory only.

### Reliability
- ACP bootstrap must be retryable.
- File and terminal operations must fail explicitly when unsupported.
- Terminal lifecycles must release resources when commands are finished.
- Event streaming must survive transient disconnects without losing session identity.

### Security & Auth
- ACP requests must be authenticated per session/workspace.
- Capability gates are not authorization; they are feature support checks.
- File and terminal access should remain scoped to the attached workspace only.

---

## 6. Subsystem Deep Dives

### 6.1 ACP Bootstrap and Session Setup — `Implemented`

**Intent**
Create or reattach an OpenCode ACP session before any prompt or runtime operation.

**Current flow**
1. Wait for the ACP server to be ready.
2. Send `initialize`.
3. Send `session/new`.
4. Read initial session configuration (`configOptions` preferred, `modes` transitional).
5. Persist the returned ACP session ID.
6. Connect the SSE event stream.

**Invariants**
- `initialize` must happen before any optional ACP method use.
- `session/new` must happen before prompt turns.
- SSE event consumption must be attached to the same ACP session identity.
- The bootstrap response must preserve a complete configuration state with defaults.

**References**
- `apps/gateway/src/harness/coding/sandbox-agent-v2/client.ts`
- `apps/gateway/src/harness/coding/sandbox-agent-v2/adapter.ts`
- `apps/gateway/src/hub/session-runtime.ts`

### 6.2 ACP Filesystem Methods — `Planned`

**Intent**
Replace legacy file read/write bridges with ACP-native filesystem methods when supported.

**Methods**
- `fs/read_text_file`
- `fs/write_text_file`

**Invariants**
- `initialize.result.clientCapabilities.fs.readTextFile` must be true before reads.
- `initialize.result.clientCapabilities.fs.writeTextFile` must be true before writes.
- Writes must target workspace-local paths only.
- Env-file writes are just a specialized text-file write path.

**Deprecation target**
- Provider-specific shell helpers for file reads/writes.
- Workspace-daemon file RPCs that exist only to emulate ACP file IO.

### 6.3 ACP Terminals — `Planned`

**Intent**
Use ACP terminal methods as the canonical command execution path when supported.

**Methods**
- `terminal/create`
- `terminal/output`
- `terminal/wait_for_exit`
- `terminal/kill`
- `terminal/release`

**Invariants**
- `initialize.result.clientCapabilities.terminal` must be true before terminal use.
- `terminal/create` returns immediately and must be paired with a release path.
- Output is streamed or polled after creation; it is not part of creation itself.
- The runtime must release terminals when a command completes or is abandoned.

**Deprecation target**
- Ad hoc PTY bridges that are only used to run shell commands.
- Provider-specific exec wrappers that do not preserve terminal lifecycle semantics.

### 6.4 Slash Commands — `Planned`

**Intent**
Make workflow shortcuts available as structured ACP slash commands.

**Mechanics**
- Advertise commands with `available_commands_update`.
- Invoke them through normal `session/prompt` turns with `/command` text.

**Invariants**
- Commands must be context-appropriate and dynamically updatable.
- Command availability must remain advisory, not a hard security boundary.
- Existing prompt routing must continue to work when no slash commands are advertised.

**Deprecation target**
- Separate non-ACP command menus that duplicate agent capabilities.

### 6.5 Gateway Runtime Integration — `Planned`

**Intent**
Expand the gateway harness so ACP-native file/terminal support becomes the default for coding sessions.

**Rules**
- Keep the current session startup and SSE bridge.
- Add ACP file/terminal adapters behind capability checks.
- Persist enough session identity to reconnect after runtime interruption.
- Keep fallback paths for environments that cannot yet satisfy ACP capability gates.

**References**
- `apps/gateway/src/harness/coding/sandbox-agent-v2/adapter.ts`
- `apps/gateway/src/harness/coding/sandbox-agent-v2/client.ts`
- `apps/gateway/src/hub/session/runtime/sse-client.ts`

### 6.6 Legacy Bridge Retirement — `Planned`

**Intent**
Remove duplicated file/command operations after ACP-native coverage is in place.

**Retirement order**
1. Prefer ACP-native methods where supported.
2. Keep legacy bridge only for unsupported environments.
3. Remove bridge-only code paths once no supported provider depends on them.

**Do not retire yet**
- Core session bootstrap and SSE event streaming.
- Fallback paths for non-ACP environments.
- Provider boot logic unrelated to file/terminal semantics.

### 6.7 Session Config Options — `Planned`

**Intent**
Expose session-level configuration through ACP config options instead of a fixed mode API.

**Contract**
- `configOptions` is the preferred session setup and mutation surface.
- Every option must have a default/current value.
- `session/set_config_option` returns the full updated option list.
- `config_option_update` notifications carry the complete current state.

**Categories to support first**
- `mode`
- `model`
- `thought_level`

**Deprecation target**
- Primary reliance on `modes` for new clients.

### 6.8 Session Modes — `Deprecated`

**Intent**
Keep older clients working while `configOptions` becomes the canonical session configuration API.

**Rules**
- Agents may emit `modes` only as a compatibility fallback.
- Clients that support `configOptions` should ignore `modes`.
- If both are present, they must be kept in sync.

### 6.9 Agent Plans — `Planned`

**Intent**
Report execution strategy and progress as structured session updates.

**Contract**
- Use `session/update` with `sessionUpdate: "plan"`.
- Send the full list of plan entries each time.
- Support dynamic updates as the plan changes.

**Role in Proliferate**
- Plans are a UI visibility surface, not a separate persistence subsystem.
- The gateway may use plans for progress display and session telemetry, but not as authoritative execution state.

---

## 7. Cross-Cutting Concerns

| Dependency | Direction | Interface | Notes |
|---|---|---|---|
| Sessions | This -> `sessions-gateway.md` | session lifecycle + reconnect | ACP session identity must survive runtime reconnect. |
| Agent contract | This -> `agent-contract.md` | prompt/tool policy | ACP file/terminal methods reduce the need for bridge-only operations. |
| Sandbox providers | This -> `sandbox-providers.md` | sandbox boot + runtime endpoint | Providers still own workspace startup and readiness. |
| Coder provider | This -> `coder-provider.md` | helper bridge / fallback transport | Coder workspaces can host the ACP runtime and fallback bridge. |
| Session config UX | This -> `sessions-gateway.md` / web UI | `configOptions`, `modes`, `session/update` | UI should prefer config options and only display modes for compatibility. |

### Security & Auth
- Auth must be session-scoped.
- ACP capability support is not permission to access arbitrary files.
- Workspace file and terminal access must stay inside the attached execution target.

### Observability
- Log initialize/session/new/prompt/terminal/file capability failures separately.
- Track whether a session used ACP-native or legacy bridge paths.
- Log feature-gating decisions so legacy retirement can be measured.
- Track `plan` and `config_option_update` emissions as protocol-level state changes.

---

## 8. Acceptance Gates

- [ ] ACP bootstrap is documented as the session baseline.
- [ ] File IO is modeled as ACP-native when capabilities allow it.
- [ ] Terminal execution is modeled as ACP-native when capabilities allow it.
- [ ] Slash commands are documented as prompt-time command syntax.
- [ ] Session config options are preferred over modes and are documented as complete-state updates.
- [ ] Plan updates are documented as complete-state `session/update` notifications.
- [ ] Legacy bridge operations are explicitly marked transitional.
- [ ] Gateway integration points are named and cross-linked.
- [ ] Spec boundaries are reflected in `boundary-brief.md` and `feature-registry.md`.

---

## 9. Known Limitations & Tech Debt

- [ ] **Not every workspace/client will support ACP file or terminal methods** — fallbacks remain necessary.
- [ ] **Legacy bridge removal is incremental** — some environments will need it until capability parity exists.
- [ ] **Session identity mapping is still gateway-owned** — this spec does not replace runtime state management.
- [ ] **Command output lifecycle may vary by client** — terminal output retention and release semantics must be tested per runtime.
