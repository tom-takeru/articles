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

- Codex is the ultimate development environment if you already pay for ChatGPT Plus—parallel tasks and even mobile development made shipping almost 80 PRs in two days feel realistic.
- Leaning on Codex Web as the hub, Codex CLI for precision edits, and splitting work across multiple environments with Ask-driven ideation sent my throughput skyrocketing.
- Next I want to stress-test the review feature, dig deeper into the CLI, and benchmark other assistants while pairing those experiments with stronger planning and architecture instincts so I can focus on deciding what to build.

## Introduction

Over two intense days of personal development I created nearly 80 pull requests. This article reorganizes that experience so you can see, at a glance, why Codex Web and Codex CLI together made it possible—from the background and motivation to the workflow details and what I plan to explore next.

## Background & Self-Introduction

I am a board-game-loving full-stack engineer who constantly experiments with LLM-powered coding assistants. Here is how my current toolkit looks.

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

CLI output when the limit triggers:

```console
▌🖐  You've hit your usage limit. Upgrade to Pro (https://openai.com/chatgpt/pricing)
▌or try again in 19
▌hours 59 minutes.
```

Recently released usage overlay (the new 5h and weekly limits are visible):

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

- Codex is the LLM coding assistant service that perfectly fits my needs.
- It ships both a web interface and a CLI, and Codex Web in particular blew me away with how it handles multi-tasking.

## Why I Started Using Codex

- Claude Code running inside neovim showed me how powerful an LLM CLI could be at work, so I started searching for something I could lean on for side projects.
- When I heard that my existing ChatGPT Plus subscription unlocked Codex CLI, I jumped in immediately.

## How Codex Changed My Throughput

Subjectively, **my development throughput jumped several times over**. In the same amount of time:

- When I used a single LLM locally via the CLI
  - I would work on two PRs sequentially and merge them one by one.
- When I let Codex Web run multiple environments in parallel
  - I could drive five PRs simultaneously, only hopping in to verify or apply tiny fixes before merging the ones that were ready.

## Pricing and Coverage

- Plan
  - [ChatGPT Plus](https://openai.com/chatgpt/pricing) only—$20/month with no additional Codex fee
- Coverage
  - Includes ChatGPT, Codex Web, and Codex CLI

## Why Codex—Especially Codex Web—Stands Out

Combining Codex Web and Codex CLI reshaped how I manage tasks and experience development. Breaking it down highlights where the acceleration comes from.

### Parallel Task Execution

- Create an Environment by pointing Codex at a repository and it clones the repo into its own isolated workspace.
- Multiple instructions progress simultaneously inside their own sandboxes.
- It genuinely feels like managing a team of engineers from a lead’s cockpit.

![Codex Web running multiple tasks in parallel](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/2489161f-d654-47f4-87c5-f0319336ccf4.png)

### PR Creation Speed

- Review rough drafts in the browser, request fixes if needed, and create a PR (Drafts included) with a single click.

Screens that show the diff review and PR creation experience in Codex Web:

| Codex Web displaying task diff after completion | Pull request generated via the Codex Web Push button |
| :--------------------------------------------: | :---------------------------------------------------: |
| ![Codex Web showing a completed task diff](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/d441358b-458d-416c-8788-1d1bf1356f69.png) | ![Pull request created from Codex Web Push button](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/9d493934-10f4-4fe0-b109-0c8091513858.png) |

### Idea Generation via Ask

- Ask Codex for prompts like “Give me three small refactoring ideas,” then hit Start Task to spin them into runnable work immediately.

Screens that show how Ask suggestions flow into actual tasks:

| Ask surface listing refactoring ideas | Starting a task directly from an Ask suggestion | Codex Web running multiple Ask-derived tasks in parallel |
| :-----------------------------------: | :---------------------------------------------: | :------------------------------------------------------: |
| ![Ask feature suggesting refactoring ideas](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/b34a107c-f341-4008-a02e-88cf7004e641.png) | ![Starting a task from an Ask suggestion](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/d97bacfb-5f0d-4708-a006-1c0d73eef6a3.png) | ![Codex processing multiple Ask-derived tasks](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/40348518-8347-4bae-944e-fc4c887040a9.png) |

### Development from a Phone

- I used to stop at reviewing diffs in the GitHub app, but now I can inspect diffs and ship changes end-to-end from my phone.

| Mobile task list inside the ChatGPT app | Summary view for a specific task | Task diff and Push (Create PR) button on mobile |
| :------------------------------------: | :--------------------------------: | :---------------------------------------------: |
| ![Mobile development experience - Task list in the ChatGPT app](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/045102b6-c098-4c15-8ef8-68053fb8dab0.jpeg) | ![Mobile development experience - Summary view of a task](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/9d19e54c-328c-4990-8196-638fcd726cc1.jpeg) | ![Mobile development experience - Task diff and Push (Create PR) button](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/bd6b3c32-9bad-4862-929c-ba3c87cef76b.jpeg) |

## Codex Power-Use Playbook

Codex Web sits at the center while the CLI and prompt design keep the pace high. This is the foundation I rely on.

### Tip 1: Lead With Codex Web

- Finish most development tasks entirely in the browser.
- Split instructions by scope so work progresses in parallel without stepping on itself.

### Tip 2: Use Codex CLI for Surgical Edits

- Apply UI tweaks or rapid validation directly from the CLI.
- Clone the repository into multiple directories to run Codex CLI across several environments. You still need to watch for conflicts, and it is easy to hit the Codex CLI quota, so this setup helps save that budget.

### Tip 3: Shape Prompts Carefully

- Break requests into “the smallest steps that satisfy the requirement.”
- Define scope boundaries up front to avoid conflicts.
- If something collides anyway, rebase locally and resolve with the CLI.

## Case Study: Shipping ~80 PRs in Two Days

This burst happened while building a subscription-style product I am developing. The repository has been active for about six months and has already closed roughly 400 PRs spanning dev-environment improvements, library upgrades, UI polish, and mid-sized feature additions.

### Step-by-Step Loop

1. Request tasks in parallel
   - Hand Codex Web around five tasks at a time while being mindful of conflict risk.
2. Create PRs
   - Skim the output and, if it looks good, turn it into a PR immediately.
   - If something is off, highlight the issues and rerun the task.
3. Handle CI and reviews
   - When CI finishes, respond to Coderabbit comments or failures by pulling the remote branch.
   - Combine Codex CLI with GitHub MCP so review follow-ups and pushes happen automatically from the PR link.
4. Merge
   - Once the feedback and CI are clear, run manual verification and merge.
5. Reuse idle time
   - While waiting for reviews or CI, hop back to other PRs and resume from step 3.

Running this loop meant that **I looked up mid-session and realized nearly 80 PRs were ready in just two days.**

## What's Next

- Review feature
  - Drafts are produced by AI and humans lead reviews today, but I want to try Codex’s review capabilities.
  - The newly added `/review` command in Codex CLI looks especially promising.
- Deeper CLI usage
  - The web app is still my primary driver, yet I am convinced there are hidden gems left in the CLI.
- Tool benchmarking
  - I plan to keep using Claude Code and Coderabbit alongside Codex so each tool can play to its strengths.

## Reflections

- Codex feels red-hot right now, with updates seemingly landing every two days.
  - https://github.com/openai/codex/releases
- Thinking hard about “what to build” matters even more.
  - Engineers will win by designing direction, not just writing code.
- Codex Web genuinely feels like a manager’s console.
  - It is like coordinating four or five engineers, setting direction, and reviewing their code.
- Task decomposition precision is crucial.
  - The finer you split work before handing it to the Codex “engineers,” the better the outcome.
- Architecture understanding is valuable.
  - When the human understands the full picture, it is easier to define steps and delegate them.
- Right now it still favors engineers.
  - At this stage, engineers squeeze the most value out of the toolset.
- The next battleground is deciding what to build.
  - As AI tooling becomes accessible to everyone, the default becomes “you can build anything,” so creativity and planning take center stage.

## Key Takeaways

- Codex is the ultimate development environment if you already pay for ChatGPT Plus—no additional fee.
- Pairing Codex Web for direction with Codex CLI for precision edits unlocks a new development rhythm.
- Parallel tasks and mobile development feel like switching from walking to riding a bike—maybe even jumping into a car.
- Shipping roughly 80 PRs in two days is absolutely doable.

