---
title: "How I Used Codex to Ship Nearly 80 Pull Requests in Two Days"
published: false
tags: [codex, productivity, developer-tools]
canonical_url: ""
cover_image: ""
series: ""
platform: auto
---

## About Me

I am a board-game-loving full-stack engineer.
I am constantly experimenting with LLM-powered coding assistants, and here is what I currently use:

* Copilot
  * Generate PR descriptions and pair with VS Code (I relied on it heavily for personal projects in the past)
* Cursor
  * Used intensively at work until a month or two ago
* Cursor CLI
  * Tried it for a few days right after the ChatGPT 5 release
* Claude Code
  * My primary assistant for work right now
* Codex (web)
  * Using it nonstop for the past month on side projects
* Codex CLI (web)
  * Hammering it daily over the past month as well
  * I even hit the ChatGPT Plus usage limit screen:
    ```
    ▌🖐  You've hit your usage limit. Upgrade to Pro (https://openai.com/chatgpt/pricing)
    ▌or try again in 19
    ▌hours 59 minutes.
    ```

## What Is Codex?

Codex is an LLM service that perfectly matches my needs as long as you have an active ChatGPT Plus subscription. It ships both a web interface and a CLI.

* Create an environment by pointing Codex at a repository, and it can read the entire code base
* Each task runs in a separate, isolated environment so work can proceed in parallel

I was already a ChatGPT Plus subscriber. After the mind-blowing experience of using Claude Code inside neovim, I was comparing multiple LLM coding assistants. Codex launched alongside ChatGPT 5, and I adopted it immediately.

Subjectively, **my development throughput jumped several times over**.

Here is the difference in what I could accomplish within the same amount of time:

* Before using Codex on the web
  * Work on two PRs locally, one after another, then merge them sequentially
* After switching to Codex on the web
  * Drive five PRs in parallel, only doing verification and small fixes before merging the ones that are ready

## Pricing

* Cost
  * Only ChatGPT Plus (no additional fee)
* Coverage
  * Includes ChatGPT, Codex on the web, and Codex CLI

## What Makes Codex—Especially the Web Version—So Great?

1. Parallel task execution
   * Multiple instructions progress simultaneously in isolated environments
   * It genuinely feels like managing a team of engineers

2. PR creation speed
   * Review rough drafts, request fixes if needed, and create a PR (Drafts included) with a single click

3. Idea generation via Ask
   * For example: “Give me three small refactoring ideas”
   * → Press Start Task to get Codex moving instantly

4. Development from a phone
   * Previously I could only review via the GitHub app, but now I can inspect diffs and even ship changes from my phone

![Placeholder for a screenshot showing Codex usage](IMAGE_PLACEHOLDER)

## My Codex-Driven Development Flow

1. Default to Codex on the web
   * Finish most tasks entirely in the browser
   * Split instructions by scope to encourage parallel work

2. Use Codex CLI for fine-grained edits
   * Handle UI tweaks or quick adjustments directly in the CLI

3. Craft prompts carefully
   * Frame requests as “the smallest steps that satisfy the requirement”
   * Think about scope boundaries to avoid conflicts
   * If a conflict appears anyway, rebase locally and resolve with the CLI

![Placeholder for the Codex CLI workflow dashboard](IMAGE_PLACEHOLDER)

## The Case Study: 80 PRs in Two Days

This was during development of a subscription-based product I am building. The repository has been active for about half a year and already closed roughly 400 PRs. The work spanned dev-environment improvements, library upgrades, UI polish, and mid-sized feature work.

Here is how I ran the cycle:

1. Request tasks in parallel
   * Assign around five tasks to Codex on the web at once while keeping an eye on merge conflicts

2. Create PRs
   * Skim the output, and if it looks good, convert it into a PR right away
   * If it is off, point out the issues and rerun

3. Handle CI and reviews
   * When CI finishes, address comments from Coderabbit or failures by pulling the remote branch
   * Combine Codex CLI with GitHub MCP to respond to reviews and push follow-up commits automatically

4. Merge
   * Once the comments and CI are green, manually run verification and merge

5. Reuse the idle time
   * While waiting for reviews or CI, jump back to other PRs and continue from step 3

![Placeholder for the Codex parallel task board](IMAGE_PLACEHOLDER)

With this loop, **I realized I had nearly 80 PRs ready within just two days.**

## What Comes Next

* Review feature
  * Drafts are produced by AI and humans handle the reviews today, but I want to explore Codex review capabilities
  * The new `/review` command in Codex CLI looks promising
* Deeper CLI usage
  * The web app is still my main driver, but I am convinced there are hidden gems in the CLI
* Tool benchmarking
  * I plan to keep using Claude Code and Coderabbit alongside Codex to leverage each tool’s strengths

## Takeaways

* Codex is the ultimate development environment if you already pay for ChatGPT Plus—no extra cost
* The combination of Codex on the web for direction and Codex CLI for precision edits unlocks a new development rhythm
* Parallel tasks and mobile development feel like switching from walking to riding a bike (if not a car)
* Shipping roughly 80 PRs in two days is absolutely doable

## Reflections

* The ability to decide “what to build” matters more than ever
  * Engineers need to excel at shaping the roadmap, not just implementation
* Codex on the web feels like a manager’s seat
  * You orchestrate four or five engineers, set direction, and review their work
* The art lies in precise task decomposition
  * Break work down in a way that Codex, acting as an engineer, can execute flawlessly
* Architectural understanding still counts
  * Knowing the big picture makes it easier to hand off scoped tasks
* For now, engineers gain the most
  * At this stage, engineers are the ones who can truly exploit these assistants
* The next battle is vision
  * As non-engineers master AI development tools, “what should we build?” becomes the real differentiator
