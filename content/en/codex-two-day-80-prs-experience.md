---
title: "How I Used Codex to Ship Nearly 80 Pull Requests in Two Days"
tags: [codex, productivity, devtools]
canonical_url: ""
cover_image: ""
series: ""
platform: auto
qiita_org: "habitatHub"
---

## TL;DR

- Codex is the ultimate development environment if you already pay for ChatGPT Plus—parallel tasks and even mobile development made pushing almost 80 PRs in two days feel attainable.
- Leaning on Codex Web for direction, Codex CLI for precision edits, and Ask-driven idea generation sent my development throughput soaring.
- Next up, I want to explore the review feature, dig deeper into the CLI, and benchmark other assistants so I can shift more energy into deciding what to build.

## Introduction

I recently shipped almost 80 pull requests in just two days on a personal project. This article reorganizes that experience so you can see how I combine Codex Web and Codex CLI, from the background and setup to the workflow details and future plans.

## Background & Self-Introduction

I am a board-game-loving full-stack engineer. I am constantly experimenting with LLM-powered coding assistants, and here is what I recently use:

### My Current LLM Toolkit

- GitHub Copilot
  - Generate PR descriptions and pair with VS Code (I relied on it heavily for personal projects in the past)
- Cursor
  - Used intensively at work until a month or two ago
- Cursor CLI
  - Tried it for a few days right after the ChatGPT 5 release
- Claude Code
  - My primary assistant for work right now
- Codex Web
  - Using it nonstop for the past month on side projects
- Codex CLI
  - Hammering it daily over the past month as well
  - I even hit the ChatGPT Plus usage limit screen:

```console
▌🖐  You've hit your usage limit. Upgrade to Pro (https://openai.com/chatgpt/pricing)
▌or try again in 19
▌hours 59 minutes.
```

Here is the usage overlay that recently shipped (you can now see the 5h and weekly limits):

```console
╭──────────────────────────────────────────────────────────────────────────╮
│  >_ OpenAI Codex (v0.42.0)                                               │
│                                                                          │
│  Model:          gpt-5-codex (reasoning low, summaries auto)             │
│  Directory:      ~/.config/nvim                                          │
│  Approval:       on-request                                              │
│  Sandbox:        read-only                                               │
│  Agents.md:      <none>                                                  │
│  Account:        dummy-email@example.com (Plus)                          │
│  Session:        -dummy-session-id-                                      │
│                                                                          │
│  Token usage:    0 total  (0 input + 0 output)                           │
│  5h limit:       [████████████████████] 100% used (resets 18:31)         │
│  Weekly limit:   [█████████████░░░░░░░] 64% used (resets 19:58 on 1 Oct) |
╰──────────────────────────────────────────────────────────────────────────╯
```

## How I Think About Codex

- Codex is the LLM coding assistant service that perfectly matches my needs.
- It ships both a web interface and a CLI, and Codex Web in particular blew me away.

## Why I Started Using Codex

- Claude Code inside neovim showed me how powerful an LLM CLI could be for work, so I started searching for a service I could rely on in personal side projects.
- When I heard that my existing ChatGPT Plus subscription unlocked the Codex CLI, I jumped in immediately.

## How Codex Changed My Throughput

Subjectively, **my development throughput jumped several times over**. Here is the difference in what I could accomplish in the same amount of time:

- When using a single LLM locally via the CLI
  - Work on two PRs locally, one after another, then merge them sequentially
- When using Codex Web to run LLMs in parallel across multiple environments
  - Drive five PRs in parallel, only doing verification and small fixes before merging the ones that are ready

## Pricing and Coverage

- Cost
  - Only [ChatGPT Plus](https://openai.com/chatgpt/pricing) at $20/month (no additional Codex fee)
- Coverage
  - Includes ChatGPT, Codex Web, and Codex CLI

## Why Codex—Especially Codex Web—Stands Out

Combining Codex Web and Codex CLI reshaped task management and the overall development experience for me.

### Parallel Task Execution

- Point Codex at a repository to create an Environment and it clones the repo into its own isolated workspace.
- Multiple instructions progress simultaneously inside their own sandboxes.
- It genuinely feels like managing a team of engineers.

![Codex Web progressing tasks in parallel](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/2489161f-d654-47f4-87c5-f0319336ccf4.png)

### PR Creation Speed

- Review rough drafts in the browser, request fixes if needed, and create a PR (Drafts included) with a single click.

### Idea Generation via Ask

- Ask Codex for prompts like “Give me three small refactoring ideas.”
- → Press Start Task to get Codex moving instantly.

### Development from a Phone

- I used to stop at reviewing diffs in the GitHub app, but now I can inspect diffs and ship changes from my phone.

|                                                                                                                                                |                                                                                                                                      |                                                                                                                                                   |
| :--------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------: |
| ![Mobile development experience - Task list in the ChatGPT app](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/045102b6-c098-4c15-8ef8-68053fb8dab0.jpeg) | ![Mobile development experience - Summary view of a task](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/9d19e54c-328c-4990-8196-638fcd726cc1.jpeg) | ![Mobile development experience - Task diff and Push (Create PR) button](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/bd6b3c32-9bad-4862-929c-ba3c87cef76b.jpeg) |

## My Codex-Powered Workflow

Codex Web remains the hub, while the CLI and prompt design let me keep the pace high.

### Tip 1: Default to Codex Web

- Finish most development tasks entirely in the browser.
- Split instructions by scope to encourage parallel work and avoid conflicts.

### Tip 2: Use Codex CLI for Surgical Edits

- Handle UI tweaks or quick adjustments directly in the CLI.
- You can run LLM in multiple environments with the Codex CLI by cloning the repository to multiple directories. Of course you still need to consider avoiding conflicts. However, it can easily reach the Codex CLI usage limit, so I recommend using my approach to save on this.

### Tip 3: Shape Prompts Carefully

- Frame requests as “the smallest steps that satisfy the requirement.”
- Think about scope boundaries to avoid conflicts.
- If a conflict appears anyway, rebase locally and resolve with the CLI.

## Case Study: Shipping ~80 PRs in Two Days

This happened while building a subscription-based product I am working on. The repository has been active for about half a year and has already closed roughly 400 PRs covering dev-environment improvements, library upgrades, UI polish, and mid-sized feature work.

### Step-by-Step Loop

1. Request tasks in parallel
   - Assign around five tasks to Codex Web at once while keeping an eye on merge conflicts.
2. Create PRs
   - Skim the output, and if it looks good, convert it into a PR right away.
   - If it is off, point out the issues and rerun.
3. Handle CI and reviews
   - When CI finishes, address comments from Coderabbit or failures by pulling the remote branch.
   - Combine Codex CLI with GitHub MCP to respond to reviews and push follow-up commits automatically.
4. Merge
   - Once the comments and CI are green, manually run verification and merge.
5. Reuse the idle time
   - While waiting for reviews or CI, jump back to other PRs and continue from step 3.

With this loop, **I realized I had nearly 80 PRs ready within just two days.**

## What's Next

- Review feature
  - Drafts are produced by AI and humans handle the reviews today, but I want to explore Codex review capabilities.
  - The new `/review` command in Codex CLI looks promising.
- Deeper CLI usage
  - The web app is still my main driver, but I am convinced there are hidden gems in the CLI.
- Tool benchmarking
  - I plan to keep using Claude Code and Coderabbit alongside Codex to leverage each tool’s strengths.

## Reflections

- Codex feels red-hot right now, with updates seemingly landing every two days from my perspective.
  - https://github.com/openai/codex/releases
- Thinking hard about “what to build” matters even more.
  - Engineers will increasingly win by designing the direction, not just writing code.
- Codex Web genuinely feels like a manager’s console.
  - It is like coordinating four or five engineers, setting direction, and reviewing their code.
- Task decomposition precision is crucial.
  - The finer you can split work before handing it to the Codex “engineers,” the better the outcomes.
- Architecture understanding is valuable.
  - When the human understands the full picture, it is easier to define steps and delegate them.
- Right now it still favors engineers.
  - At this stage, engineers are the ones squeezing the most value out of it.
- The next battleground is deciding what to build.
  - As AI tooling becomes accessible to everyone, the premise shifts to “you can build anything,” and creativity becomes the differentiator.

## Key Takeaways

- Codex is the ultimate development environment if you already pay for ChatGPT Plus—no extra cost.
- The combination of Codex Web for direction and Codex CLI for precision edits unlocks a new development rhythm.
- Parallel tasks and mobile development feel like switching from walking to riding a bike (if not a car).
- Shipping roughly 80 PRs in two days is absolutely doable.

