# Article Publishing Workflow

This repository lets you manage English and Japanese articles locally while publishing them to dev.to and Qiita. The Makefile-driven TypeScript scripts read front matter to decide where each article should go, persist remote post IDs in `.posts-map.*.json`, and update existing drafts instead of creating duplicates.

## Directory Layout

- `content/en/` — English Markdown articles that target dev.to.
- `content/ja/` — Japanese Markdown articles that target Qiita.
- `scripts/` — Platform-specific publishing scripts (`publish_devto.ts`, `publish_qiita.ts`).
- `.posts-map.devto.json` / `.posts-map.qiita.json` — Maps article file paths to remote post IDs, URLs, timestamps, and publish state. Local runs keep these files in sync.

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

- `tags`: Accepts an array or a comma-separated string. Qiita enforces between 1 and 5 tags per article, so keep your list withi
n that range when targeting Qiita.
- `platform`: Omit or set to `auto` to target both platforms. Include `devto` or `qiita` to limit publishing.
- `qiita_org`: Optional Qiita group identifier for organizational posts.
- dev.to-specific keys such as `canonical_url`, `cover_image`, `series`, and `organization_id` are supported.

## Local Publishing

The Make targets auto-detect modified Markdown under `content/en/` and `content/ja/` by diffing against `HEAD`. Stage only the files you want to process (or stash unrelated changes) before running the commands below.

- Inspect which localized files will run:
  ```bash
  make changed-files
  ```
- Create or update drafts (uses `PUBLISH_MODE=draft`):
  ```bash
  make draft
  ```
- Publish the pending drafts (uses `PUBLISH_MODE=publish` and requires the drafts to exist already):
  ```bash
  make publish
  ```

Each run updates the corresponding `.posts-map.*.json` file with the latest remote IDs, URLs, timestamps, and publish state. The scripts validate that drafts exist before publishing and prevent overwriting already-published posts without re-drafting.

### Draft vs. Publish Modes

`PUBLISH_MODE` defaults to `draft` for local development. The Makefile sets it automatically for each target, so you rarely need to override it manually. Publishing without an existing draft exits early with a helpful error so you can run `make draft` first.

### Automation

GitHub Actions workflows previously handled publishing on pushes to `main`, but the automation has been retired. Keep using the Make targets locally (or wire them into a different CI/CD system) to manage publication.

#### Remote sync enforcement

The `Verify article sync` workflow blocks merges when a synchronization branch targets `main` but remote articles are out of date.

- By default the workflow watches for pull requests whose head branch is `sync/articles`. You can override the branch name by defining a repository variable called `SYNC_BRANCH_NAME`.
- The check runs `scripts/verify_remote_sync.ts`, which confirms that the markdown content and titles for every entry in `.posts-map.devto.json` and `.posts-map.qiita.json` match their respective remote articles. It also validates that stored URLs, publish flags, and timestamps are in sync.
- Repository secrets named `DEVTO_API_KEY` and `QIITA_TOKEN` are required so the script can query private drafts.

## Operational Tips

- Run `npm run lint` before opening a PR to ensure the scripts pass TypeScript checks.
- If a remote article was deleted or its URL changed, remove the corresponding entry from `.posts-map.*.json` so the next run creates a fresh post.
- Keep `tags` and `platform` values consistent to reduce maintenance overhead; the scripts normalize both arrays and comma-separated strings.
- To force a local public publish (rare), run the script with `PUBLISH_MODE=publish` so it mirrors the Makefile's publish target.

### Simulating Missing Remote Drafts

Both publishing scripts can mimic a removed remote draft so you can test the automatic cleanup logic locally:

1. Create a draft normally so the `.posts-map.*.json` file records the remote ID.
2. Re-run the script with the corresponding simulation flag set while keeping `PUBLISH_MODE=draft`:
   ```bash
   SIMULATE_DEVTO_404=true npx ts-node scripts/publish_devto.ts content/en/example.md
   SIMULATE_QIITA_404=true npx ts-node scripts/publish_qiita.ts content/ja/example.md
   ```
3. The run logs that the remote draft is missing (HTTP 404), removes the saved mapping, and exits with a failure code so you notice the issue.
4. Run the script again without the simulation flag; because the map entry was removed, the draft is recreated cleanly with a new ID.

## Troubleshooting

- Errors like `DEVTO_API_KEY is not set.` or `QIITA_TOKEN is not set.` indicate missing environment variables or repository secrets.
- When an API call fails, the script logs the response body and exits with code 1. This makes it clear that publication did not complete.
