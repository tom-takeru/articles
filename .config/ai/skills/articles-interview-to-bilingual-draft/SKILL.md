---
name: articles-interview-to-bilingual-draft
description: >
  Interview the user to identify a timely article angle, extract concrete firsthand details,
  draft matching Japanese and English Markdown articles in this repository, and optionally
  run the repo's draft publishing flow for dev.to and Qiita.
---

# Interview To Bilingual Draft

Use this skill when the user wants to create a likely-to-perform article from interview answers and publish it as drafts through this articles repository. Success means the article angle is grounded in current trends and the user's firsthand experience, both Japanese and English Markdown files exist under `content/`, validation has passed, and draft URLs are reported when draft publishing is requested.

## Step 1: Establish Context

1. Read the automation memory if an automation ID or memory path is provided.
2. Inspect existing articles under `content/ja` and `content/en` to avoid repeating recent themes.
3. Check `git status --short` and keep unrelated user changes intact.
4. If the user asks for what is timely, trending, latest, or likely to grow, verify current trends with web search before choosing the angle.

## Step 2: Pick The Article Angle

1. Prefer a narrow angle that combines current reader interest with the user's firsthand experience.
2. Explain the recommended angle briefly and why it avoids overlap with existing articles.
3. If the user wants more interviewing, ask one focused question at a time.
4. Continue until the answers include the concrete product or experience, workflow, constraints, verification, failure modes, and the intended reader takeaway.

## Step 3: Capture Interview Answers

1. After each answer, record the usable article material in the automation memory when a memory path is available.
2. Preserve the user's preferred wording and avoid adding stronger claims than the answers support.
3. Convert vague answers into practical article points by asking a narrower follow-up question.
4. When the user dislikes wording such as a role name or buzzword, replace it throughout the title and body with the underlying idea.

## Step 4: Draft The Japanese Article

1. Create `content/ja/<slug>.md` with the repository's existing front matter shape.
2. Use a title that matches the user's final wording preference and is specific enough to be clickable.
3. Include a TL;DR, practical workflow sections, concrete examples from the interview, and a concise checklist.
4. Keep the article grounded in user perspective. Use technical details only where they explain the workflow or constraints.
5. Avoid heavy bold text combined with nested lists and indentation.

## Step 5: Draft The English Article

1. Create `content/en/<same-slug>.md`.
2. Preserve the Japanese article's core claim, structure, and examples.
3. Localize the title and tags for dev.to readers instead of doing a literal translation when a clearer English phrasing exists.
4. Keep platform-specific front matter valid for this repository.

## Step 6: Verify Locally

1. Run `npm run lint`.
2. Run `make changed-files` and confirm both expected files are detected.
3. Fix any validation or formatting issues before publishing drafts.

## Step 7: Publish Drafts When Requested

1. Run `make draft` only when the user asks for draft or temporary publishing.
2. Confirm dev.to and Qiita draft creation or update from the command output.
3. Check `git diff -- .posts-map.devto.json .posts-map.qiita.json` to confirm post IDs and URLs were saved.
4. Report the draft URLs and remind the user that final publication uses `make publish`.

## Constraints / Notes

- Do not publish final articles unless the user explicitly asks for publication.
- Do not revert unrelated content, `.posts-map.*.json`, or article files.
- Use `apply_patch` for manual file edits.
- Use current web verification for trend-based recommendations; recommendations about what will perform can change quickly.
- Keep interview questions one at a time when the user asks for that mode.
- Prefer titles that express the core idea without unwanted role labels or buzzwords.
- Treat `.posts-map.devto.json` and `.posts-map.qiita.json` changes from `make draft` as expected publishing metadata.

## Output

Finish with a concise summary that includes:

- Japanese article path.
- English article path.
- Verification commands and results.
- Draft URLs when `make draft` was run.
- Any remaining next step, usually reviewing drafts before `make publish`.
