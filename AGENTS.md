# Repository Guidelines

## Project Structure & Module Organization

- `scripts/` holds TypeScript automation. `publish_devto.ts` and `publish_qiita.ts` read Markdown front matter and push drafts to their platforms while persisting IDs in `.posts-map.*.json`.
- `content/` stores localized articles; use `content/en/` and `content/ja/` for language-specific Markdown with YAML front matter.
- `tsconfig.json` defines common compiler options, and `package.json` lists runtime (`gray-matter`, `node-fetch`) plus tooling (`ts-node`, `typescript`).

## Build, Test, and Development Commands

- `npm install` — install TypeScript toolchain and runtime dependencies.
- `npm run lint` — run `tsc --noEmit` to type-check all scripts for regressions.
- `npx ts-node scripts/publish_devto.ts content/en/example.md` — publish or update the given article on dev.to (respects `platform` front matter and updates `.posts-map.devto.json`).
- `npx ts-node scripts/publish_qiita.ts content/ja/example.md` — mirror workflow for Qiita.

## Coding Style & Naming Conventions

- Use TypeScript with two-space indentation, `const` by default, and `camelCase` variables/functions. Reserve `PascalCase` for types and exported classes.
- Keep modules focused; co-locate utilities near publishing scripts instead of global helpers until reuse is proven.
- Front matter must include `title`; optional keys (`tags`, `platform`, `published`, etc.) align with downstream platform schemas.

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
