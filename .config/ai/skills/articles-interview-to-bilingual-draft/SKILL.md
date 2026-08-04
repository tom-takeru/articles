---
name: articles-interview-to-bilingual-draft
description: >
  Run the full lifecycle for firsthand bilingual technical articles in this repository:
  choose a focused theme, interview the author one question at a time, create matching
  Japanese and English Markdown drafts, incorporate title and body feedback, publish drafts
  to dev.to and Qiita, and publish final articles only after explicit confirmation.
  Use when the user wants to turn an idea or experience into an article, revise an article
  from feedback, create/update platform drafts, or complete the final publishing workflow.
---

# Article Interview, Feedback, and Publishing

Use this skill to guide an article from an initial theme through bilingual drafting, feedback,
draft publication, and final publication. Keep the author's firsthand experience and wording at
the center. Do not publish final articles without an explicit request.

## Lifecycle

Track the work through these states:

1. Theme and angle
2. Interview
3. Japanese and English drafts
4. Author feedback and revisions
5. Platform drafts
6. Final publication

Do not skip directly from an idea to publication. At each transition, report what is ready and
what confirmation is still required.

## 1. Establish context and publishing safety

Before editing or publishing:

1. Inspect existing articles under `content/ja` and `content/en` to avoid repeating recent themes.
2. Run `git status --short` and preserve unrelated user changes.
3. Inspect `.posts-map.devto.json` and `.posts-map.qiita.json` when the target Markdown already exists.
4. Determine whether the target is a new article, an unpublished draft, or an already published article.

Treat an existing map entry with `published: true` as a live article. Editing that Markdown and
running the repository commands will update the live article. Do not do this unless the user
explicitly asks to revise an already published article. A `make draft` run against an existing
published entry can also make the remote article unpublished/private because the API payload sets
the requested publication state, so never use it as a harmless preview for a live article.

If the user asks for a timely, trending, latest, or likely-to-perform angle, verify current trends
with web search before recommending the angle. Do not browse merely to embellish a firsthand article.

## 2. Choose the article angle

When the user provides a broad theme:

1. Extract the likely reader problem and the author's distinctive firsthand experience.
2. Recommend one narrow angle and explain briefly why it is useful and distinct from existing articles.
3. Keep the title and angle grounded in what the author actually experienced; do not invent metrics,
   failures, product capabilities, or stronger claims.
4. Prefer a title that expresses the author's idea without unwanted role labels or buzzwords.

Before drafting, define success as a concrete reader takeaway, such as a workflow, decision rule,
or checklist the reader can try.

## 3. Interview the author

Ask one focused question at a time. Continue until the material covers:

- the concrete product, task, or experience;
- the initial context and motivation;
- the actual workflow and tools;
- constraints and decision points;
- verification or review method;
- failure modes, uncertainty, or remaining trade-offs;
- the intended reader takeaway.

After each answer:

1. Summarize the usable article material in a few lines.
2. Preserve the author's preferred wording and uncertainty.
3. Ask a narrower follow-up when an answer is abstract or lacks a concrete example.
4. Avoid asking multiple interview questions in one message.

Use the author's analogy or phrasing when it makes the idea clearer. Replace wording throughout
the article if the author rejects a title, role name, or buzzword.

## 4. Create the bilingual drafts

Create matching files with the same slug:

- `content/ja/<slug>.md`
- `content/en/<slug>.md`

For the Japanese article:

1. Match the existing front matter shape and include a `title`.
2. Include a TL;DR, a concrete firsthand example, the practical workflow, decision criteria,
   limitations or risks, and a concise checklist or conclusion.
3. Write in the author's perspective. Use technical details only when they clarify the decision
   or workflow.
4. Avoid heavy bold text combined with nested lists and indentation.

For the English article:

1. Preserve the Japanese article's core claim, evidence, examples, and level of certainty.
2. Localize the title and tags for dev.to readers rather than translating mechanically.
3. Keep platform-specific front matter valid. Use the repository's normal dev.to platform settings.

Do not add publication metadata to the article body. The publishing scripts manage post IDs and URLs
in `.posts-map.devto.json` and `.posts-map.qiita.json`.

## 5. Handle author feedback and revisions

Treat feedback as an explicit revision loop, not as a one-off rewrite:

1. Show the current title, angle, and the main claims that the draft makes.
2. Ask for or accept focused feedback on title, tone, factual accuracy, structure, or examples.
3. Apply requested changes to both language versions while preserving meaning and platform fit.
4. If only the Japanese title changes, choose a natural English title with the same promise and
   update both front matters.
5. Re-check that no rejected wording remains and that the concrete example still supports the claim.
6. Run local verification again before any platform update.

Do not publish a draft immediately after a substantial revision unless the user asks for the update.
After updating an already published article, treat the change as a live-content revision and require
explicit confirmation before running `make publish`.

## 6. Verify locally

Before draft or final publication, run:

```sh
npm run lint
make changed-files
git diff --check
```

Confirm that the expected Japanese and English files are detected. If verification cannot run, report
the exact command and blocking error; do not claim the article is ready.

## 7. Publish platform drafts only on request

Run `make draft` only after the user explicitly requests draft publication or a draft update.

The command may require external network access. If the sandbox reports DNS or network failure, retry
with the approved elevated network path when available. Do not treat the Make target's zero exit code
as sufficient: the per-file output can contain `Failed to draft` while the command still completes.

After the command:

1. Confirm both per-file operations report `Created` or `Updated` rather than `Failed`.
2. Record the exact Japanese and English Markdown paths that were reviewed and drafted. Keep these
   paths available for final publication because the draft and post-map changes may be committed
   before the user gives final confirmation.
3. Run:

   ```sh
   git diff -- .posts-map.devto.json .posts-map.qiita.json
   ```

4. Confirm the expected entries have `published: false` and URLs.
5. Report both draft URLs and tell the user that final publication is still pending.

If one platform succeeds and the other fails, report the partial state precisely and do not retry
blindly without checking the post maps.

## 8. Publish final articles only on explicit confirmation

Run `make publish` only when the user explicitly asks to publish, go live, or run that command.
Before running it:

1. Confirm the intended changed files with `make changed-files`.
2. Confirm the map entries correspond to the drafts the user reviewed.
3. If the reviewed files are no longer listed because the draft and map changes were committed,
   publish using the exact paths recorded during draft publication instead of relying on
   `make changed-files`:

   ```sh
   npx ts-node scripts/entryPoint.ts --platform devto --mode publish content/en/<reviewed-slug>.md
   npx ts-node scripts/entryPoint.ts --platform qiita --mode publish content/ja/<reviewed-slug>.md
   ```

   Pass every reviewed file explicitly when publishing more than one article. Do not guess a path;
   if the reviewed paths are unavailable, stop and ask the user to confirm them.
4. If an entry is already `published: true`, state that the operation will update live content and
   ask for confirmation if that intent is not already explicit.

After the command:

1. Confirm both per-file operations report `Updated` or `Created` and do not report failures.
2. Inspect both post maps and confirm `published: true`, `publishedAt` where available, and public URLs.
3. Report the final dev.to and Qiita URLs.

## Repository commands and constraints

- `npm run lint` type-checks the TypeScript publisher.
- `make changed-files` identifies changed or unmapped localized Markdown.
- `make draft` creates or updates platform drafts for changed files.
- `make publish` publishes drafts for changed files.
- Keep API keys in environment variables or the local `.env`; never commit secrets.
- Use `apply_patch` for manual file edits.
- Do not revert unrelated content or post-map changes.
- Treat expected post-map changes from publishing as part of the workflow.

## Output checklist

Finish with a concise, self-contained summary containing:

- the Japanese and English article paths;
- the final title in both languages;
- verification commands and results;
- draft URLs when `make draft` was run;
- final URLs when `make publish` was run;
- any partial failure, remaining review, or next action.
