---
title: "My AI-Era Technical Article Repository"
tags: [ai, technicalwriting, automation]
canonical_url: ""
cover_image: ""
series: ""
platform: devto
---

## TL;DR

- I keep English posts for dev.to and Japanese posts for Qiita in one GitHub repo, then lean on an AI-first writing flow to move faster🚀
- Make targets wrap TypeScript scripts so draft updates and publications reuse front matter settings without risky manual toggles.
- This repository is just my working example, so treat the structure and workflow as inspiration and remix them for your own stack.

## Introduction

I wanted to draft articles entirely inside my favorite AI editor, teach the model how I structure posts, and shorten the handoff from draft to publication—this repository is how I made that happen📚

Feel free to peek at [https://github.com/tom-takeru/articles](https://github.com/tom-takeru/articles) as you read. The setup routes Japanese pieces to [Qiita](https://qiita.com/) and English pieces to [dev.to](https://dev.to/) so each audience gets the right language. Qiita ships an [official CLI](https://github.com/increments/qiita-cli), but I skipped it here. dev.to currently lacks an official command-line client.

Pick the ingredients that help your workflow and rearrange the rest.

## Who this is for

### Writers who want AI-first editing

You prefer loading Markdown into an AI editor and iterating with prompts instead of jumping between browser tabs🖊️

### Writers who want to train their AI on house style

Keeping past articles and new drafts in one repo makes it easy to surface voice, format, and go-to sections for your assistant🧠

### Writers who want Git-powered article history

Git history doubles as your publishing log, which makes diffs and reviews painless when you need approval🗂️

### Writers shipping bilingual posts efficiently

You plan to publish Japanese to Qiita and English to dev.to in pairs, and you want automation to prevent duplicated work🌍

## Repository at a glance

Here’s a quick tour of [https://github.com/tom-takeru/articles](https://github.com/tom-takeru/articles).

- Markdown lives under `content/ja/` and `content/en/`, and each file’s `platform` field keeps the correct destination aligned🗃️
- TypeScript scripts in `scripts/` parse front matter and talk to the dev.to and Qiita APIs for draft and publish operations.
- `.posts-map.*.json` files synchronize local Markdown with remote IDs so the Makefile can run exactly the steps you need.

## Publishing workflow

### Step 1 Draft the article

Edit your Markdown with help from your AI assistant and keep momentum with tight prompt-feedback loops✍️

Existing posts in the repo become on-demand references for tone and structure, and once the Japanese version feels right you can ask the AI for an English translation before reviewing it yourself.

### Step 2 Create or refresh platform drafts

Run `make draft` to update dev.to and Qiita drafts🧪

`PUBLISH_MODE` defaults to `draft`, so you won’t accidentally ship a half-finished article.

#### If you need to embed images

Both Qiita and dev.to require manual uploads from their draft editors. The flow here is:

1. Run `make draft` to create the remote draft.
2. Upload images in each platform’s web UI.
3. Copy the generated URLs into your local Markdown.
4. Run `make draft` again to sync the updated content.

### Step 3 Publish the article

Once everything reads clean, run `make publish`🎯

The workflow refuses to publish if a draft was never created, which guards against accidental releases.

### Step 4 Merge changes into the main branch on GitHub

Commit your changes, push the branch, and open a PR💾

CI fetches the current publication status via API using the `.posts-map.*.json` records generated during your local runs. That safety net keeps forgotten draft or publish commands from slipping through.

When the checks pass, merge the PR into `main`.

If you need more detail, browse the README and source files in [https://github.com/tom-takeru/articles](https://github.com/tom-takeru/articles).

## Wrapping up

Pairing an AI editor with a Git-backed workflow turns article production into a tight loop of prompts, reviews, and scripted releases🌱

From here it’s all about tuning the process so it fits your voice and schedule.

## Side note

I wrote this article with Codex Web and Codex CLI. Codex Web is my current go-to OpenAI assistant for spinning up isolated development environments in parallel. If you’re curious, check out my write-up: [How I Used Codex to Ship Nearly 80 Pull Requests in Two Days](https://dev.to/tom-takeru/how-i-used-codex-to-ship-nearly-80-pull-requests-in-two-days-34me)
