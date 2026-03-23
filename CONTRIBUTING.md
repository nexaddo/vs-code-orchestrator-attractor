# Contributing to Attractor

## Dev Setup

```bash
git clone https://github.com/YOUR_ORG/vs-code-orchestrator-attractor
cd vs-code-orchestrator-attractor
pnpm install          # installs dependencies and configures git hooks
```

Requires Node.js ≥ 22 and pnpm ≥ 10.

## Commands

```bash
pnpm build            # TypeScript compilation across all packages
pnpm typecheck        # Strict type check, no emit
pnpm lint             # ESLint across all .ts and .mjs files
pnpm format           # Prettier auto-fix
pnpm format:check     # Prettier check (used in CI)
pnpm test             # Run all tests (vitest)
pnpm test:coverage    # Run tests with coverage (enforces thresholds)
pnpm ci:fast-checks   # lint + format:check + typecheck + test (mirrors CI gate)
pnpm pack             # Build VSIX (requires clean build first)
pnpm release:dry      # Full CI + pack dry-run (verify before tagging)
```

Run a single test file:

```bash
pnpm vitest run packages/shared/test/contracts/repository.test.ts
```

## Monorepo Structure

```
packages/
  shared/     @attractor/shared   — Zod-validated contracts; no VS Code deps
  extension/  @attractor/extension — VS Code extension host
  webview/    @attractor/webview  — Webview UI shell
test/
  meta/       Workflow drift tests (checks implementation stays aligned with plans)
```

Dependency direction: `extension` → `shared` ← `webview`. No circular deps.

## Architecture Layers (extension)

Strict layered architecture — never skip layers:

1. **Domain** — pure business rules, entities, value objects, domain events (zero deps)
2. **Application** — orchestration policies, command handlers, event publishing (domain + ports only)
3. **Infrastructure** — git, storage, Copilot adapters implementing application ports
4. **Extension** — VS Code activation, command registration, DI composition root

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Contract-First Development

All persisted and cross-boundary payloads are Zod-validated and versioned (`CONTRACT_VERSION = 1`). When adding new persisted or cross-boundary data:

1. Add the Zod schema to `packages/shared/src/contracts/`
2. Export it from `packages/shared/src/contracts/index.ts`
3. Add unit tests in `packages/shared/test/contracts/`
4. Implement the consumer after the contract is merged

Never pass untyped JSON across package or storage boundaries.

## Testing

| Package                       | Target coverage                     |
| ----------------------------- | ----------------------------------- |
| `@attractor/shared`           | ≥ 90% statements/branches           |
| `@attractor/webview`          | ≥ 80% statements/branches/functions |
| `@attractor/extension` (core) | ≥ 85% statements/branches           |

VS Code runtime glue (`extension.ts`, `infrastructure/chat`, `infrastructure/copilot`, `infrastructure/git`, `infrastructure/webview`) is tested via extension host integration tests, not unit tests — these files are excluded from the unit coverage gate.

Mock the `ModelGateway` boundary (`send()` / `stream()`) rather than Copilot internals.

Test fixtures live in `test/fixtures/`.

## Branching and PRs

- Work on feature branches; open PRs against `main`
- All CI checks must pass before merge: lint, format, typecheck, tests, coverage
- `main` is always releasable

## Release Process

1. **Verify locally**: `pnpm release:dry` — runs full CI + pack dry-run
2. **Bump version**: update `version` in `packages/extension/package.json` and add a `CHANGELOG.md` entry
3. **Tag**: `git tag v0.x.y && git push origin v0.x.y`
4. **CI handles the rest**: the release workflow builds VSIX, attaches it to a GitHub Release, and optionally publishes to the Marketplace (requires `VSCE_PAT` secret)

### Pre-publish checklist

- [ ] Set real `publisher` ID in `packages/extension/package.json` (currently `"attractor"` placeholder)
- [ ] Replace `YOUR_ORG` in repository URLs
- [ ] Add 128×128 PNG icon and set `"icon"` field
- [ ] Add `LICENSE` file
- [ ] Set `VSCE_PAT` secret in GitHub repo settings (Settings → Secrets → Actions)

## Commit Style

```
<type>(<scope>): <short summary>

Co-Authored-By: Paperclip <noreply@paperclip.ing>
```

Types: `feat`, `fix`, `refactor`, `test`, `ci`, `docs`, `chore`.
