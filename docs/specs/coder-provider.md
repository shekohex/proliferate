# Coder Provider Integration — System Spec

## 1. Scope & Purpose

### In Scope
- Coder provider adapter behavior for Proliferate sandbox sessions.
- Coder provider settings surface for org-scoped host/auth/template configuration.
- Template catalog synchronization from the Coder control plane.
- Per-template default parameter/value storage and resolution.
- Repo-to-workspace binding for GitHub repos that should reuse a prewarmed Coder workspace.
- Workspace acquisition and reuse when a prompt or session is scoped to a repo.
- Workspace bridge mechanics for command execution, file reads/writes, env file writes, and tunnel resolution.
- Session resume behavior when the selected execution target is a persisted Coder workspace rather than a disposable sandbox.

### Out of Scope
- Generic provider contract shape and shared capability flags — see `sandbox-providers.md`.
- Session hub ownership, WebSocket streaming, and session resume semantics outside provider selection — see `sessions-gateway.md`.
- Repo CRUD, configuration CRUD, and configuration snapshot builds — see `repos-prebuilds.md`.
- OAuth and GitHub token resolution lifecycle — see `integrations.md`.
- Tool schemas and sandbox capability injection — see `agent-contract.md`.
- Automation run lifecycle — see `automations-runs.md`.

### Mental Models

Coder is a workspace control plane, not a sandbox runtime. Proliferate should treat Coder as the system that provisions and persists a workspace, then layer session runtime behavior on top of it.

The Coder provider is stateful by design:
- A workspace can be reused across prompts and sessions.
- Stop/start is a recovery path, not a fresh creation path.
- Deletion is destructive and must invalidate bindings.

Template metadata is policy input, not session state:
- Template names, parameters, and defaults are synced from Coder.
- Org defaults refine the template catalog for the Proliferate account.
- Repo bindings select which workspace should be used for a repo.

The provider adapter is a thin control-plane wrapper plus an in-workspace bridge:
- `packages/codersdk` handles Coder API calls.
- A small helper inside the workspace handles file and command parity where the SDK does not expose direct runtime IO.

### Things Agents Get Wrong
- Assuming `packages/codersdk` alone is enough for sandbox parity. It is control-plane only.
- Assuming stop/start is the same as snapshot/restore. It preserves state, but it is not a filesystem snapshot primitive.
- Assuming repo-to-workspace binding should live in repo CRUD. It is provider-selection policy and workspace acquisition policy.
- Assuming a prompt with repo context must create a new workspace. If a bound workspace exists and is healthy, it should be reused.
- Assuming file read/write can be done entirely through Coder APIs. In practice, a workspace bridge or SSH/PTY path is needed.
- Assuming workspace defaults can be applied without template schema validation. Unknown parameters must be rejected or explicitly preserved by policy.

---

## 2. Core Concepts

### Provider Settings Profile
A Coder provider profile stores the connection details needed to talk to one Coder deployment.

It is org-scoped and should hold:
- Coder host/base URL.
- Auth token or session credential reference.
- Template catalog refresh policy.
- Org-level default values for known template parameters.

Evidence for the Coder control plane surface: `packages/codersdk/src/api.ts`, `packages/codersdk/src/typesGenerated.ts`.

### Template Catalog
The catalog is the normalized set of templates exposed by the connected Coder instance.

The catalog is used for three things:
- present available templates in the provider settings surface,
- validate template parameter names and types,
- resolve default values before workspace creation.

### Template Defaults
Template defaults are the Proliferate-owned overlay on top of the Coder template catalog.

Default values are versioned by template identity and resolved at creation time. Existing workspaces are not mutated when defaults change.

### Repo-to-Workspace Binding
A repo binding maps a GitHub repo identity to a preferred Coder workspace or workspace policy.

The binding answers:
- which template should be used,
- which workspace should be reused first,
- whether a stopped workspace may be restarted,
- whether a new workspace may be created if no reusable one exists.

### Workspace Bridge
The bridge is a small helper installed inside each workspace by template/bootstrap logic.

It exists to cover operations that the control-plane SDK does not model directly:
- `execCommand`
- `readFiles`
- `writeEnvFile`
- `resolveTunnels`
- health and heartbeat checks

### Workspace Reuse
Workspace reuse means the same Coder workspace can serve multiple prompts or sessions over time.

Reuse is preferred when:
- the workspace is already running,
- the workspace is bound to the target repo,
- the workspace health check succeeds,
- the workspace still matches the bound template policy.

### Session Attachment
Session attachment is the step where a Proliferate session record binds to a selected Coder workspace.

Once attached, follow-up prompts should reuse that binding unless the user explicitly requests a different workspace or a destructive reset.

---

## 5. Conventions & Patterns

### Do
- Use the Coder control plane for provisioning, start/stop, and workspace metadata.
- Use the workspace bridge for file and command parity when the SDK does not expose a direct primitive.
- Resolve template defaults before workspace creation, not after.
- Reuse a healthy bound workspace before creating a new one.
- Keep repo/workspace selection deterministic and inspectable.
- Fail closed on unknown template parameters unless the policy explicitly allows pass-through.

### Don't
- Don't treat Coder as a drop-in sandbox API.
- Don't couple repo CRUD to workspace creation side effects.
- Don't silently recreate a workspace if a bound one exists but is paused or unhealthy; prefer explicit recovery rules.
- Don't leak template auth or workspace tokens into client-visible state.
- Don't assume stop/start implies ephemeral cleanup.

### Reliability
- Template sync should be retryable and safe to repeat.
- Workspace acquisition should be idempotent for the same repo binding and session creation request.
- Bridge operations should be bounded by timeouts and return explicit failure reasons.
- Binding invalidation on workspace deletion must be immediate or strongly consistent enough to avoid accidental reuse.

### Security & Auth
- Provider settings mutations should require org admin or equivalent high-trust role.
- Repo binding mutations should require org-scoped authorization.
- Workspace bridge requests should be authenticated with a per-session or per-workspace secret.
- GitHub repo identity should come from the existing integrations/repo model, not from user-supplied strings alone.

---

## 6. Subsystem Deep Dives

### 6.1 Provider Settings and Catalog Sync — `Partial`

**Intent**
The settings surface should let an org configure one or more Coder deployments and see the templates exposed by each deployment.

**Invariants**
- Catalog sync is read-only against the Coder control plane.
- The synced catalog must retain the template identity used to create future workspaces.
- Catalog refresh should not mutate workspace bindings by itself.
- Unknown template fields must not be invented by the UI.

**Rules**
- If the SDK lacks the exact template-list shape, a thin wrapper around `packages/codersdk` should provide it.
- Admins should be able to inspect template parameters before creating or binding workspaces.

**Current slice**
- `/settings/environments` now renders a Coder settings section when `DEFAULT_SANDBOX_PROVIDER=coder`.
- Coder connection details remain env-backed (`CODER_URL`, `CODER_SESSION_TOKEN`), but template defaults now persist as org-scoped settings on `organization.coder_settings`.
- The settings UI can save the default template, optional preset ID, and default parameter values.
- Template parameter metadata is fetched lazily from Coder rich-parameter metadata and rendered dynamically in the UI.

**References**
- `packages/codersdk/src/api.ts`
- `packages/codersdk/src/typesGenerated.ts`
- `packages/codersdk/src/utils/OneWayWebSocket.ts`
- `apps/web/src/server/routers/coder-provider.ts`
- `apps/web/src/components/settings/environments/coder-settings-section.tsx`

### 6.2 Template Default Resolution — `Partial`

**Intent**
Resolve a workspace creation payload by layering the Coder template definition with Proliferate-owned defaults.

**Resolution order**
1. Template-provided defaults from the catalog.
2. Org/provider default values.
3. Repo-binding overrides.
4. Session or prompt-time overrides.

**Invariants**
- The effective parameter set must only contain known template parameters unless the control plane explicitly allows pass-through.
- Changing a default affects future acquisitions only.
- Default resolution must be deterministic for the same template version and binding state.

**Current slice**
- The setup/onboarding flow now lets the user choose a Coder template for a repo-backed environment before the configuration is created.
- Parameter inputs are derived from the selected template's rich parameters, including type, form kind, icons, options, and validation metadata.
- Org-level default values come from persisted Coder settings, not env.
- The selected template ID and parameter values are persisted on the configuration and passed through session runtime into `CreateSandboxOpts` for Coder-backed sessions.
- Existing configurations can edit the Coder template and parameter overrides from `/settings/environments`.

**References**
- `packages/codersdk/src/typesGenerated.ts`
- `packages/services/src/configurations/service.ts`
- `packages/services/src/repos/service.ts`
- `apps/web/src/components/workspace/onboard/coder-template-editor.tsx`
- `apps/gateway/src/hub/session/runtime/session-context-store.ts`

### 6.3 Repo-to-Workspace Binding — `Planned`

**Intent**
Let a GitHub repo resolve to a prewarmed or reusable Coder workspace instead of provisioning a new execution target every time.

**Invariants**
- A repo binding must identify the repo unambiguously.
- A binding may point to a preferred workspace plus a fallback creation policy.
- A binding can be reused across sessions as long as the workspace remains healthy and policy-compliant.
- Binding changes must be visible to future session acquisitions immediately enough to avoid stale workspace selection.

**Rules**
- If a repo has a healthy bound workspace, attach to it.
- If the bound workspace is stopped and restartable, restart it.
- If no workspace exists and creation is allowed, create one from the bound template and defaults.
- If multiple workspaces are eligible, selection should be ordered and deterministic.

**References**
- `packages/services/src/repos/service.ts`
- `packages/services/src/configurations/service.ts`
- `apps/gateway/src/hub/session-runtime.ts`
- `apps/gateway/src/hub/session-hub.ts`

### 6.4 Workspace Acquisition and Reuse — `Partial`

**Intent**
Prompt routing should be able to attach a session to an already running Coder workspace when repo context is present.

**Current slice**
- `SandboxProviderType` and the shared provider factory now accept `coder`.
- `packages/shared/src/providers/coder.ts` provides an env-backed `CoderProvider` that uses `packages/codersdk` for auth, template validation, workspace lookup, workspace start, and workspace creation.
- `ensureSandbox()` prefers a stored workspace ID, then falls back to a deterministic session-derived workspace name before creating a new workspace.
- `createSandbox()` validates `CODER_TEMPLATE_ID` and creates a workspace for the authenticated Coder user.
- Initial create/start parameters can be supplied through `CODER_TEMPLATE_VERSION_PRESET_ID` and `CODER_TEMPLATE_PARAMETERS_JSON`, which map to Coder's `template_version_preset_id` and `rich_parameter_values` fields.
- `checkSandboxes()` reports live workspaces from Coder build status for existing metering and liveness checks.
- Resulting `sandboxId` is the Coder workspace ID.
- `tunnelUrl` and `previewUrl` are intentionally empty in this slice because ACP/bootstrap bridge wiring is not implemented yet.

**Invariants**
- Prompt-time acquisition should prefer reuse over provisioning.
- A workspace that was already selected for a session should be reused on follow-up prompts.
- If acquisition fails because the workspace disappeared, policy decides whether to recreate or fail.
- The selected workspace identity must be persisted with the session.

**Rules**
- `ensureSandbox()`-style recovery should resolve by stored workspace identity before creating a new one.
- Follow-up prompts should not re-run provisioning if the session is already attached to a healthy workspace.
- Explicit user requests for a different workspace should override the existing binding.
- The initial adapter may use deployment env vars (`CODER_URL`, `CODER_SESSION_TOKEN`, `CODER_TEMPLATE_ID`) before the org-scoped settings surface exists.

**References**
- `packages/shared/src/providers/types.ts`
- `packages/shared/src/providers/index.ts`
- `packages/shared/src/providers/coder.ts`
- `apps/gateway/src/hub/session-hub.ts`
- `apps/gateway/src/hub/session-runtime.ts`

### 6.5 Workspace Bridge and Operational IO — `Planned`

**Intent**
Cover file and command parity with a small helper script or daemon inside each workspace.

**Invariants**
- The bridge must be installed by template/bootstrap logic.
- The bridge must not require direct DB or internal service credentials.
- Bridge calls must be authenticated and bounded.
- The bridge is the preferred path for `execCommand`, `readFiles`, and `writeEnvFile`.

**Rules**
- Use HTTPS or WebSockets for structured helper calls when possible.
- Use SSH/PTTY as a fallback transport when bridge availability is degraded.
- File reads should return workspace-relative paths only.
- Env writes should target the workspace-owned env file path, not arbitrary host locations.

**References**
- `packages/codersdk/src/api.ts`
- `packages/codersdk/src/utils/OneWayWebSocket.ts`
- `packages/shared/src/providers/types.ts`

### 6.6 Recovery, Persistence, and Deletion — `Planned`

**Intent**
Use Coder workspace persistence as the recovery boundary instead of a sandbox snapshot boundary.

**Invariants**
- State in the workspace home directory survives stop/start if the template mounts persistent storage.
- Full workspace deletion invalidates any session binding that depended on it.
- Stop/start should preserve repo state, helper state, and local files when the workspace storage model allows it.
- The provider must not promise snapshot semantics it cannot actually guarantee.

**Rules**
- Resume should prefer restart/reconnect over recreate.
- Follow-up questions should reuse the same attached workspace unless explicitly reset.
- If the workspace is gone, the binding must be marked stale and the user must see a recoverable failure or a fresh workspace path.

**References**
- `packages/codersdk/src/api.ts`
- `packages/codersdk/src/typesGenerated.ts`
- `sandbox-providers.md`

---

## 7. Cross-Cutting Concerns

| Dependency | Direction | Interface | Notes |
|---|---|---|---|
| Sandbox providers | This -> `sandbox-providers.md` | `SandboxProvider` contract | Generic lifecycle contract remains owned by the provider spec. |
| Sessions | This -> `sessions-gateway.md` | `ensureSandbox`, `resume`, session attachment | Session runtime owns prompt flow and WebSocket streaming. |
| Repos/configurations | This -> `repos-prebuilds.md` | repo identity, configuration defaults | Repo metadata remains the source for repo selection and defaults. |
| Integrations | This -> `integrations.md` | GitHub repo identity and token resolution | Repo access and token lookup stay in the integrations boundary. |
| Coder SDK | This -> `packages/codersdk` | control-plane client | Workspace lifecycle and metadata come from the SDK or a thin wrapper around it. |
| Agent contract | This -> `agent-contract.md` | tool injection and callback auth | Workspace bridge must preserve the tool contract. |

### Security & Auth
- Provider settings and repo binding mutations should be org-scoped.
- Workspace bridge auth must be secret-bound to the workspace/session.
- Repo prompts must not expose raw control-plane tokens.
- Deletion/rebind flows must require explicit authorization.

### Observability
- Catalog refresh should log template counts and refresh timestamps.
- Workspace acquisition should log repo binding hits, misses, starts, and recreations.
- Bridge failures should be distinguishable from control-plane failures.
- Stale-binding invalidation should be visible in session and provider logs.

---

## 8. Acceptance Gates

- [ ] Coder settings surface can list available templates.
- [ ] Per-template defaults persist and round-trip.
- [ ] A repo binding can resolve to an already running workspace.
- [ ] A stopped bound workspace can be restarted when policy allows it.
- [ ] `execCommand` works through the workspace bridge or SSH/PTTY fallback.
- [ ] `readFiles` and `writeEnvFile` work through the bridge path.
- [ ] Follow-up prompts reuse the same workspace binding.
- [ ] Workspace deletion invalidates stale bindings.
- [ ] Spec boundaries are reflected in `boundary-brief.md` and `feature-registry.md`.

---

## 9. Known Limitations & Tech Debt

- [ ] **Connection profile still env-backed** — host and auth remain process env today; only template defaults moved into persisted org settings.
- [ ] **No native snapshot parity** — Coder stop/start persistence is not the same as Modal/E2B snapshot restore.
- [ ] **Bridge dependency is mandatory for full parity** — `packages/codersdk` does not directly cover file/command IO.
- [ ] **Template schema drift risk** — template defaults may become stale if catalog sync lags control-plane changes.
- [ ] **Repo/workspace cardinality is not free** — the binding model must define how many workspaces a repo may own and how fallback selection works.
- [ ] **Selection policy needs explicit UX** — reuse vs create vs restart must be visible to the user to avoid surprising workspace choice.
- [ ] **Workspace deletion is destructive** — any session still attached to a deleted workspace must fail closed and re-acquire.
