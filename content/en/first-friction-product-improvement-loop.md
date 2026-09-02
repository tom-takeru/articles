---
title: "I Thought Loop Engineering Was Impractical. Then I Found a Use for It"
tags: [ai, agents, webdev, ux]
platform: auto
---

## TL;DR

- I knew loop engineering was trending, but I thought it would be difficult in real development because decisions grounded in the product's design philosophy and real-world problems are essential, and an irregular case can push an agent far away from the original intent.
- While upgrading the public demo for my web application, [KIBAKO](https://kibako.habitat-hub.com/en/demo), I gave an agent a task using [Browser](https://learn.chatgpt.com/docs/browser): act like a first-time user, find only the first point of friction, fix it, and start again.
- The live UI provides observations, "the first problem" limits scope, and replaying the journey from the same entry point provides verification. That combination made this task feel like a practical place to start looping.
- I also combined the loop with Scheduled in the ChatGPT desktop app and ran it until shortly before the weekly usage-limit reset shown in my app, using capacity that would otherwise have gone unused.

## Trending does not mean easy to use in practice

The phrase "loop engineering" has started appearing frequently in discussions about AI coding agents.

In simple terms, it means designing a system in which agents can repeatedly act, observe, adjust, and verify progress toward a goal, instead of waiting for a human to write the next prompt every time. [IBM describes the pattern](https://www.ibm.com/think/topics/loop-engineering) as Goal, Action, Observation, and Adjustment.

The term itself is still new. An August 2026 [review paper on loop engineering](https://arxiv.org/abs/2608.21884) describes it as a concept that practitioners began using around June 2026 and that spread rapidly alongside both ambitious claims and vocal skepticism.

I understood why the idea was gaining attention, and I was interested in it. My honest reaction was still:

> Loop engineering is trending. But using it safely in real software development still looks difficult.

The main reason was that real development depends on decisions grounded in the product's design philosophy and the problems it needs to solve.

It is relatively easy to define success when the task is "write code until these tests pass." Real projects repeatedly require choices about architecture, data models, migrations, infrastructure, security, cost, staged rollouts, and rollback strategies. Several options may be technically valid, while only one fits the product's direction and constraints.

Irregular cases worried me even more. One unexpected error, dependency, or conflict with an existing requirement can lead an agent to choose a locally reasonable workaround that moves far away from the original product or engineering decision.

Passing tests does not prove that the decision was right. A small deviation in one iteration can also be amplified by every iteration that follows.

- How does an agent decide that a UX has become easier to understand?
- What prevents it from making endless cosmetic changes?
- What prevents a local response to an irregular case from violating the original architecture or product direction?
- Which decisions involving the product's design philosophy and real-world problems must return to a human?
- What counts as done, and how many iterations should be allowed?
- How do we prevent a long run from consuming time and tokens without creating value?

Repeating an agent call is easy. Designing conditions that keep those calls moving safely toward value is the hard part. A method can be popular without being ready to drop unchanged into a real development workflow.

## The idea appeared while I was improving the KIBAKO demo

I develop [KIBAKO](https://kibako.habitat-hub.com/en), a web application for prototyping and playtesting board games online.

It has a [public interactive demo](https://kibako.habitat-hub.com/en/demo) that works without signing in. The demo starts in a creation room and walks through a real sequence: roll a die, move the matching token, edit the front and back of a card, create a playroom, move a card into a hand, and assign the hand to yourself.

Changes made in the demo are temporary. Reloading or leaving the page resets the experience instead of saving it to a real project. That makes it possible to repeat the journey from a clean starting point.

While trying to upgrade this demo with an AI agent and Browser use, I wrote an instruction like this:

```text
Actually use this feature once from the perspective of a first-time user
with no prior knowledge.
Find the first problem that makes you get stuck.
->
Fix it.

---

Repeat this loop.
```

The point is to temporarily take the perspective of a first-time user without prior knowledge, setting aside what the developer and agent already know.

The agent should not fill gaps with information from the source code or internal specifications. It should not assume, "This must be the button," or, "I know what this term means from the implementation." During observation, it should move through the product like a first-time visitor, using what the interface actually communicates.

This perspective also becomes harder for a human developer to recover the longer they have worked on the product. I cannot truly return to a state where I do not know the flows and terminology that have become obvious to me. That is why I found value in the instruction itself: explicitly tell the agent to set aside prior knowledge and operate as a first-time user.

Trying this shifted my thinking:

> Maybe loop engineering could be genuinely useful for this kind of task.

## Why this task looks loopable

### Browser use creates an observation surface

When an agent tries to improve UX from source code alone, its decisions tend to be based on implementation assumptions.

With Browser use, the agent can open the real entry point, inspect what is visible and interactive, click a control, and observe the result. In the KIBAKO demo, it can follow the real path through dice, tokens, cards, playrooms, and hands.

The feedback signal is no longer only, "The code looks correct." It becomes, "I could or could not continue through the actual interface."

### "Only the first problem" bounds the work

"Improve the UX" gives an agent almost unlimited scope. It could change copy, colors, layout, navigation, and functionality indefinitely.

The instruction instead limits each iteration to the first point of friction:

- The next action was unclear for several seconds
- The agent could not find the relevant control
- The result of an action was ambiguous
- An error or disabled state had no visible explanation
- Continuing required knowledge from outside the screen

Once the first one appears, the observation run stops. Later concerns can be recorded, but they do not belong to the current change. This boundary helps prevent the agent from wandering into open-ended "make it better" work.

### Replaying from the same entry point becomes verification

Looking only at the edited component does not prove that the user journey improved.

After the fix, the agent resets the state and repeats the original goal from the same URL. If it can pass the previous stopping point, the change has at least one observable effect. If it still stops there, the fix is incomplete.

After the old problem is removed, the next first point of friction naturally becomes the next task. The journey itself discovers and orders the work without requiring a human to reprioritize a backlog after every iteration.

### A resettable demo is a safer place to experiment

It would be dangerous to hand an autonomous browser loop a production flow that changes real data, submits payments, sends messages, or affects other users.

The KIBAKO demo is different. Its actions are temporary, and reloading restores the initial state. The agent can interact with a real UI while keeping the side effects of repetition bounded.

That taught me to ask a different question when looking for loopable work: not only "What do I want to improve?" but also "Where can the agent safely repeat the work from a known state?"

## Mapping the experiment to a small engineering loop

The instruction maps to the parts of a loop like this:

| Element | This task |
| --- | --- |
| Goal | Move the first-time KIBAKO demo journey closer to a hesitation-free experience |
| Action | Use Browser use to operate the demo from its real entry point |
| Observation | Record the first place where progress stops or becomes ambiguous |
| Adjustment | Investigate the cause and fix that one issue in the code |
| Verification | Run relevant tests and replay the same browser journey from a clean state |
| State | Keep fixes in code and tests, then rediscover the next problem by replaying the journey |
| Stop | Complete the target journey, hit a run or budget limit, or reach a decision that needs a human |

### State still matters, but the loop depends less on history

This task still needs state. The fixes remain in the code and tests, and the uncommitted diff is also state passed to the next run.

What felt different was the low dependence on past conversations and decision history. The demo can be reset every time. Even if the agent does not remember every previous step, it can start from the same entry point and discover the next problem again. Much of the necessary state is externalized into the code, tests, and live UI, so the agent can reconstruct it from the environment at the start of a run.

My current hypothesis is that tasks like this are easier to put into practical use with today's frontier models: each iteration is short, the result is observable, the environment can be reset safely, and the necessary state can be reconstructed from that environment.

An AI agent already performs an internal cycle of model inference and tool calls within a turn. OpenAI describes this core behavior in its explanation of the [Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/).

The outer loop I care about here is different. It also defines how the next piece of work is discovered, what evidence justifies a change, how the result is checked, and when the development workflow must stop.

## I used Scheduled as the outer trigger

I also combined this small loop with Scheduled in the ChatGPT desktop app. According to the [official OpenAI documentation](https://learn.chatgpt.com/docs/automations), scheduled work can target a local project or an isolated Git worktree.

I checked the weekly usage-limit reset time shown in my app and used capacity that was likely to go unused to run this loop until shortly before the reset. I limited it to a resettable target such as the KIBAKO demo, fixed only one problem per run, required tests and a Browser use replay, and kept the final changes subject to human review.

Burning credits was not the goal; that would recreate the exact risk of drifting away from the original decision. By defining the safe task first and using Scheduled as an outer trigger and time limit, the one-off prompt began to look much more like loop engineering.

## By IBM's definition, this is not a complete loop-engineering system yet

[IBM defines loop engineering](https://www.ibm.com/think/topics/loop-engineering) as designing workflows that guide AI agents toward user-defined goals with minimal human intervention. In addition to repeatedly acting, observing, deciding, and adjusting, the recursive goal should include clear and verifiable stopping criteria.

By that definition, my setup was not a finished loop-engineering system. The first experiment was a small loop initiated by one instruction, and I later added a trigger and time budget with Scheduled. It had Goal, Action, Observation, and Adjustment, but its only unambiguous stop condition was the time limit before my weekly usage limit reset. I had not built an automatic decision for a product-level goal such as whether a first-time user could finish without hesitation. I also had not fully automated an independent reviewer, strict state management across runs, or escalation for every kind of failure.

I also deliberately did not let the agent commit after each iteration. Automatic commits are not themselves part of IBM's definition, but leaving the changes uncommitted reflected the human checkpoint I still needed. The demo clearly felt better, yet there were still areas I wanted to improve. I did not trust the agent enough to decide that the work was complete or to finalize each commit boundary on its own.

So I am not claiming, "I have implemented loop engineering."

What matters to me is that one task contained three useful behaviors:

1. The agent uses Browser use to discover the next problem
2. It fixes only that problem
3. It replays the same journey to verify the fix and discover what comes next

Starting with a large autonomous system made the whole subject feel intimidating. Starting with a task that is observable, narrowly fixable, and repeatable felt concrete. Scheduled, state, budgets, reviewers, and escalation rules can then be added one at a time.

## Turning the initial idea into a usable agent instruction

The short prompt was enough to test the idea. For repeated use, I would add explicit boundaries:

```text
Goal:
Move the KIBAKO demo toward a state where a first-time visitor can complete
the target demo journey using only the guidance visible in the interface.

For each iteration:
1. Reset state and open the demo from its public entry point with Browser use.
2. Do not use source code or internal specifications to interpret the UI.
   Stop at the first moment of confusion.
3. Record the observation, expectation, actual result, and evidence.
4. Investigate the root cause in the code, scoped only to the first problem.
5. Make the smallest safe fix and run the relevant tests.
6. Replay the journey from the same state, entry point, and goal.
7. If the old problem is gone, make the next first friction the new target.

Constraints:
- Fix only one problem per iteration.
- Do not delete or weaken tests to make verification pass.
- Do not treat swallowed errors or silent fallbacks as final fixes.
- Do not automate actions with billing, external communication,
  permission changes, or other material side effects.
- Escalate decisions about product direction to a human.

Stop when:
- The target demo journey can be completed from the entry point.
- The run or budget limit is reached.
- A safe fix requires human product judgment.
```

The important shift is not just to say, "Use it like a first-time user." It is to specify what information the agent may use during observation, how much it may change, what evidence it must collect, how it must reproduce the result, and when it must stop.

## This does not replace real users

An agent with Browser use is not a real first-time user. It may find a control more easily than a human because it can read DOM structure and accessibility metadata. It may also miss visual discomfort, context, and emotional uncertainty that a person would notice.

This loop cannot replace user research.

- Test required viewports and input methods, not only one desktop setup
- Run automated tests and type checks separately
- Keep major UX decisions under human review
- Compare agent findings with real user behavior and feedback
- Preserve ways to report problems the loop does not discover

The loop is a supporting tool for continuously finding early friction that a developer's private knowledge makes easy to miss. It is not an autonomous solution to every UX problem.

## Similar tasks may already exist in your project

This experiment made me think that suitability for loop engineering depends less on task size and more on whether the result is observable, the state can be reset safely, and the loop has a clear stop condition.

Other candidates might include:

- Fixing first-time onboarding friction one issue at a time until a user can create their first artifact
- Executing documentation steps in a browser and fixing the first instruction that cannot be reproduced
- Starting from an error screen and fixing the first unclear recovery step
- Replaying a critical flow at a mobile viewport and fixing the first unusable interaction
- Running a public demo or sandbox from its initial state and fixing the first broken action

The common ingredients are an operable target, observable results, a first problem that can bound the change, a resettable initial state, and an explicit stop condition.

## Conclusion

My reaction to the growing loop-engineering conversation used to be, "The idea is interesting, but real development depends on decisions grounded in the product's design philosophy and real-world problems. An irregular case can also push the agent far away from the original direction, so bringing this into my workflow safely will be difficult."

Trying to improve the KIBAKO demo with Browser use changed that reaction.

Act like a first-time user. Fix the first point of friction. Reset the state and start again.

That loop uses the actual product as its observation surface while naturally limiting both the change and the next task. With Scheduled as its outer trigger, I could also spend otherwise-unused capacity shortly before my weekly limit reset on this deliberately bounded improvement work.

By IBM's definition, this is not yet a complete loop-engineering system. It still feels like a real first step toward bringing loops into my development workflow.

If your reaction is still, "Loop engineering? No way..." look for this kind of task in your own project. You may already have a small, safe, repeatable loop waiting to be designed.
