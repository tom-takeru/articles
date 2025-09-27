# Article Publishing Workflow

This repository lets you manage English and Japanese articles locally while publishing them to dev.to and Qiita. The TypeScript scripts and GitHub Actions read front matter to decide where each article should go, persist remote post IDs in `.posts-map.*.json`, and update existing drafts instead of creating duplicates.

## Directory Layout

- `content/en/` — English Markdown articles that target dev.to.
- `content/ja/` — Japanese Markdown articles that target Qiita.
- `scripts/` — Platform-specific publishing scripts (`publish_devto.ts`, `publish_qiita.ts`).
- `.posts-map.devto.json` / `.posts-map.qiita.json` — Maps article file paths to remote post IDs, URLs, and timestamps. Both local runs and GitHub Actions keep these files in sync.

## Setup

1. Use Node.js 20 or newer.
2. Install dependencies.
   ```bash
   npm install
   ```
3. Export the API credentials.
   ```bash
   export DEVTO_API_KEY=xxxxxxxx
   export QIITA_TOKEN=xxxxxxxx
   ```

## Markdown Front Matter

Each Markdown file must start with YAML front matter. Only `title` is required.

```markdown
---
title: Sample Article
tags:
  - typescript
  - automation
platform: auto
---

Body...
```

- `tags`: Accepts an array or a comma-separated string.
- `platform`: Omit or set to `auto` to target both platforms. Include `devto` or `qiita` to limit publishing.
- `qiita_org`: Optional Qiita group identifier for organizational posts.
- dev.to-specific keys such as `canonical_url`, `cover_image`, `series`, and `organization_id` are supported.

## Local Publishing

Explicitly pass the files you changed. Multiple paths are processed sequentially.

- Publish or update on dev.to:
  ```bash
  npx ts-node scripts/publish_devto.ts content/en/example.md
  ```
- Publish or update on Qiita:
  ```bash
  npx ts-node scripts/publish_qiita.ts content/ja/example.md
  ```

After each run, the relevant `.posts-map.*.json` file is updated so future executions reference the correct remote post. Missing files or front matter issues cause the script to skip the entry and log a warning. By default (with no extra environment variables) the scripts create drafts, so you can preview articles safely before the CI job performs the public publish. Set `PUBLISH_MODE=publish` explicitly if you need to publish from your machine for exceptional cases.

## GitHub Actions

### Shared Behavior

- Both workflows run on `ubuntu-latest`, use `actions/checkout@v4` plus `actions/setup-node@v4` to provision Node.js 20, and set `PUBLISH_MODE=publish` so the main branch produces public posts.
- Dependencies are installed with `npm install`, then the appropriate TypeScript script runs via `npx ts-node`.
- Repository secrets `DEVTO_API_KEY` and `QIITA_TOKEN` must be configured for the workflows to authenticate.

### Publish to dev.to (`.github/workflows/publish_devto.yml`)

- Trigger: Any `push` to `main` that modifies files under `content/en/**.md`.
- Steps:
  1. Diff the previous commit and collect Markdown files under `content/en/`.
  2. If no English files changed, the job prints "No English markdown files changed. Skipping." and exits.
  3. Otherwise, it runs `scripts/publish_devto.ts` with the changed paths to create or update dev.to drafts.
- On success, `.posts-map.devto.json` captures the remote ID, URL, and last updated timestamp for each article.

### Publish to Qiita (`.github/workflows/publish_qiita.yml`)

- Trigger: Any `push` to `main` that modifies files under `content/ja/**.md`.
- Steps:
  1. Diff the previous commit and collect Markdown files under `content/ja/`.
  2. If no Japanese files changed, the job prints "No Japanese markdown files changed. Skipping." and exits.
  3. Otherwise, it runs `scripts/publish_qiita.ts` with the changed paths to create or update Qiita drafts or public posts.
- Because the workflow forces `PUBLISH_MODE=publish`, merged changes are published publicly; local runs without the flag stay private drafts. `.posts-map.qiita.json` stores the remote metadata just like the dev.to map.

## Operational Tips

- Run `npm run lint` before opening a PR to ensure the scripts pass TypeScript checks.
- If a remote article was deleted or its URL changed, remove the corresponding entry from `.posts-map.*.json` so the next run creates a fresh post.
- Keep `tags` and `platform` values consistent to reduce maintenance overhead; the scripts normalize both arrays and comma-separated strings.
- To force a local public publish (rare), run the script with `PUBLISH_MODE=publish` so it mirrors the CI behavior.

## Troubleshooting

- Errors like `DEVTO_API_KEY is not set.` or `QIITA_TOKEN is not set.` indicate missing environment variables or repository secrets.
- When an API call fails, the script logs the response body and exits with code 1. GitHub Actions treats this as a failed workflow run, making it clear that publication did not complete.
