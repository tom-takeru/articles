---
title: "How I Used Codex to Ship Nearly 80 Pull Requests in Two Days"
tags: [codex, productivity, devtools]
canonical_url: ""
cover_image: ""
series: ""
platform: auto
---

## About Me

I am a board-game-loving full-stack engineer.
I am constantly experimenting with LLM-powered coding assistants, and here is what I currently use:

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

    ```
    ▌🖐  You've hit your usage limit. Upgrade to Pro (https://openai.com/chatgpt/pricing)
    ▌or try again in 19
    ▌hours 59 minutes.
    ```

    ```
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

## What Is Codex?

Codex is an LLM service that perfectly matches my needs as long as you have an active ChatGPT Plus subscription. It ships both a web interface and a CLI.

- Create an "Environment" by pointing Codex at a repository, and it can read the entire code base
- Each task runs in a separate, isolated environment so work can proceed in parallel

I was already a ChatGPT Plus subscriber. After the mind-blowing experience of using Claude Code inside neovim, I was comparing multiple LLM coding assistants. Codex launched alongside ChatGPT 5, and I adopted it immediately.

Subjectively, **my development throughput jumped several times over**.

Here is the difference in what I could accomplish within the same amount of time:

- When using a single LLM locally via the CLI
  - Work on two PRs locally, one after another, then merge them sequentially
- When using Codex Web to run LLMs in parallel across multiple environments
  - Drive five PRs in parallel, only doing verification and small fixes before merging the ones that are ready

## Pricing

- Cost
  - Only [ChatGPT Plus](https://openai.com/chatgpt/pricing) at $20/month (no additional Codex fee)
- Coverage
  - Includes ChatGPT, Codex Web, and Codex CLI

## What Makes Codex—Especially Codex Web—So Great?

- Parallel task execution
  - Multiple instructions progress simultaneously in isolated environments
  - It genuinely feels like managing a team of engineers

![Codex Web progressing tasks in parallel](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/2489161f-d654-47f4-87c5-f0319336ccf4.png)

- PR creation speed
  - Review rough drafts, request fixes if needed, and create a PR (Drafts included) with a single click

- Idea generation via Ask
  - For example: “Give me three small refactoring ideas”
  - → Press Start Task to get Codex moving instantly

- Development from a phone
  - Previously I could only review via the GitHub app, but now I can inspect diffs and even ship changes from my phone

|                                                                                                                                                                               |                                                                                                                                                                         |                                                                                                                                                                                        |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| ![Mobile development experience - Task list in the ChatGPT app](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/045102b6-c098-4c15-8ef8-68053fb8dab0.jpeg) | ![Mobile development experience - Summary view of a task](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/9d19e54c-328c-4990-8196-638fcd726cc1.jpeg) | ![Mobile development experience - Task diff and Push (Create PR) button](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/934995/bd6b3c32-9bad-4862-929c-ba3c87cef76b.jpeg) |

## My Codex-Driven Development Flow

1. Default to Codex Web
   - Finish most tasks entirely in the browser
   - Split instructions by scope to encourage parallel work

2. Use Codex CLI for fine-grained edits
   - Handle UI tweaks or quick adjustments directly in the CLI
   - You can run LLM in multiple environments with the Codex CLI by cloning the repository to multiple directories. Of course, you still need to consider avoiding conflicts. However, it can easily reach the Codex CLI usage limit, so I recommend using my approach to save on this.

3. Craft prompts carefully
   - Frame requests as “the smallest steps that satisfy the requirement”
   - Think about scope boundaries to avoid conflicts
   - If a conflict appears anyway, rebase locally and resolve with the CLI

## The Case Study: 80 PRs in Two Days

This was during development of a subscription-based product I am building. The repository has been active for about half a year and already closed roughly 400 PRs. The work spanned dev-environment improvements, library upgrades, UI polish, and mid-sized feature work.

Here is how I ran the cycle:

1. Request tasks in parallel
   - Assign around five tasks to Codex Web at once while keeping an eye on merge conflicts

2. Create PRs
   - Skim the output, and if it looks good, convert it into a PR right away
   - If it is off, point out the issues and rerun

3. Handle CI and reviews
   - When CI finishes, address comments from Coderabbit or failures by pulling the remote branch
   - Combine Codex CLI with GitHub MCP to respond to reviews and push follow-up commits automatically

4. Merge
   - Once the comments and CI are green, manually run verification and merge

5. Reuse the idle time
   - While waiting for reviews or CI, jump back to other PRs and continue from step 3

With this loop, **I realized I had nearly 80 PRs ready within just two days.**

## What Comes Next

- Review feature
  - Drafts are produced by AI and humans handle the reviews today, but I want to explore Codex review capabilities
  - The new `/review` command in Codex CLI looks promising
- Deeper CLI usage
  - The web app is still my main driver, but I am convinced there are hidden gems in the CLI
- Tool benchmarking
  - I plan to keep using Claude Code and Coderabbit alongside Codex to leverage each tool’s strengths

## Takeaways

- Codex is the ultimate development environment if you already pay for ChatGPT Plus—no extra cost
- The combination of Codex Web for direction and Codex CLI for precision edits unlocks a new development rhythm
- Parallel tasks and mobile development feel like switching from walking to riding a bike (if not a car)
- Shipping roughly 80 PRs in two days is absolutely doable

## Reflections

- Codex feels red-hot right now, with updates seemingly landing every two days from my perspective
  - https://github.com/openai/codex/releases
- The ability to decide “what to build” matters more than ever
  - Engineers need to excel at shaping the roadmap, not just implementation
- Codex Web feels like a manager’s seat
  - You orchestrate four or five engineers, set direction, and review their work
- The art lies in precise task decomposition
  - Break work down in a way that Codex, acting as an engineer, can execute flawlessly
- Architectural understanding still counts
  - When the person directing the work understands the big picture, it's much easier to break it into steps and delegate
- For now, engineers gain the most
  - At this stage, engineers are the ones who can truly exploit these assistants
- The next battle is vision
  - As non-engineers master AI development tools, “what should we build?” becomes the real differentiator
