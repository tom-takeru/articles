# Repository Guidelines

## Project Structure & Module Organization

- `scripts/` holds TypeScript automation. `run_publisher.ts` routes to the dev.to or Qiita workflows, which read Markdown front matter and push drafts to their platforms while persisting IDs in `.posts-map.*.json`.
- `content/` stores localized articles; use `content/en/` and `content/ja/` for language-specific Markdown with YAML front matter.
- `tsconfig.json` defines common compiler options, and `package.json` lists runtime (`gray-matter`, `node-fetch`) plus tooling (`ts-node`, `typescript`).

## Build, Test, and Development Commands

- `npm install` — install TypeScript toolchain and runtime dependencies.
- `npm run lint` — run `tsc --noEmit` to type-check all scripts for regressions.
- `make changed-files` — preview which localized Markdown files will be processed.
- `make draft` — auto-detect changed Markdown and update drafts on dev.to and/or Qiita with `PUBLISH_MODE=draft`.
- `make publish` — publish the pending drafts detected above with `PUBLISH_MODE=publish`.

## Coding Style & Naming Conventions

- Use TypeScript with two-space indentation, `const` by default, and `camelCase` variables/functions. Reserve `PascalCase` for types and exported classes.
- Keep modules focused; co-locate utilities near publishing scripts instead of global helpers until reuse is proven.
- Front matter must include `title`; optional keys (`tags`, `platform`, `qiita_org`, etc.) align with downstream platform schemas. Publishing mode is controlled by the `PUBLISH_MODE` environment variable when running scripts.

## Testing Guidelines

- The repo currently relies on type-checking as the minimum safety net; run `npm run lint` before publishing.
- When adding scripts, include lightweight integration checks (e.g., dry-run functions or mock API wrappers) and commit sample fixtures under `content/` if needed.

## Commit & Pull Request Guidelines

- Use Conventional Commits (`feat:`, `fix:`, `chore:`) to clarify changes and aid release notes once history begins.
- Reference issue numbers when available, summarise the publishing impact, and note any required environment variables or manual steps.
- Before opening a PR, ensure type checks pass, provide a brief risk assessment, and include sample command output or screenshots if content formatting changes.

## Publishing & Secrets

- Store API keys (`DEVTO_API_KEY`, Qiita tokens) in local environment variables or secret managers; never commit them.
- Verify `.posts-map.*.json` stays in sync with live articles; remove stale entries only when the remote draft has been deleted.
