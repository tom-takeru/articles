---
title: "You Won’t Know How Much to Delegate to AI Until You Use It Extensively"
tags: [ai, codereview, softwaredevelopment, productdevelopment]
canonical_url: ""
cover_image: ""
series: ""
platform: auto
---

## TL;DR

- How much you can delegate to AI, and how much human review it needs, depends on the task and the model.
- Tasks with few possible solutions and easy rollback are easier to delegate. Tasks with many possible solutions, product-policy implications, or long-term maintenance impact need human decision-making alongside AI.
- This is not something you define once and forget. You need to use models from different vendors repeatedly and build a feel for how much you can trust each one in your own work.

## AI capability and review depth are matters of intuition

It is difficult to measure "how much AI can do" and "how much review AI needs" with a single number.

The same instruction can produce different results depending on the model. And even with the same model, a minor UI change and a database schema design task require completely different levels of review.

That is why I believe you need to use models from different vendors in real work and build your own intuition about them.

This does not mean believing that a model is always correct. It is closer to the feeling a manager develops when delegating work to a teammate: "If I give this person instructions at this level of detail, what kind of output will come back?" You learn how much trust is appropriate and how closely your decision-making styles are aligned.

## Start by estimating the number of solutions

When I look at a task, the first thing I consider is how many solutions I can imagine for the problem.

### A task with almost one solution

Consider a request like, "Change the color of UI element X from white to gray." There is very little room for ambiguity in what the instruction means.

This kind of change is easy to delegate to AI. I still check the affected screen and diff, but it rarely requires a deep product-level review.

### A task with three or four solutions

When several implementation approaches are plausible, I ask AI to lay out the options and trade-offs before delegating the implementation.

AI is very useful for generating those options. But I decide which one to adopt by comparing it with the existing design and the product's likely future needs.

### A task with infinitely many solutions

When there are countless ways to solve a product problem, I do not jump straight to implementation. I use AI as a thinking partner to decide what to build and what scope to choose.

Here, I am not asking AI to make the final decision. I am asking it to help me articulate my thinking, compare alternatives, and surface concerns I may have missed.

## Designing feedback notes in KIBAKO

I encountered this kind of decision while building [KIBAKO](https://kibako.habitat-hub.com/), an online service for creating prototypes of board games.

KIBAKO has production rooms for creating a board game and play rooms for actually playing it. The goal was to take improvement ideas discovered during a playtest back into the production room smoothly, so they could inform the next round of work.

The hard part was not implementing an "improvement note" feature. We had to decide:

- What scope should own an improvement note?
- Where should users enter and read notes?
- Which participants should be allowed to see which notes?
- What should happen when several play rooms belong to the same project?

There were countless possible answers. I used AI as a thinking partner many times while deciding the product policy.

The final design stores improvement notes across a project, which spans multiple play rooms and the production room that creates them. Each note records which play room it came from.

Participants who only have permission for one play room can view only the notes created in that room. They can view them, but they cannot edit the entire project's notes.

I do not know yet whether this is the one correct answer. But considering the current use case and future extensibility, we committed to this design and implemented it. This is the kind of product decision I do not hand over to AI. I use AI to explore the space, then make the decision myself.

## Increase review depth when changes are hard to reverse

In addition to the number of possible solutions, I pay close attention to reversibility.

Database schema changes may be difficult or impossible to undo. Once users start entering valuable data under a schema, changing it later becomes much harder.

For that reason, reviewing a database migration is not just checking whether the migration file runs. I also consider:

- Can we roll it back before user data exists?
- What data migration will be needed after user data exists?
- How far can we roll back if something goes wrong?
- What constraints will this leave for future features and maintenance?

The larger the impact on the product's future direction or maintainability, the deeper the review needs to be.

## Use one everyday model and optimize for cost-effectiveness

I am not particularly good at switching models for every small task. So I try to find an affordable default model that gives me the best efficiency for my usual work, then use it extensively.

As of August 3, 2026, I use Codex's $100 Pro plan. My default is usually around `5.6 Luna High`.

For tasks with multiple solutions, database schema design reviews, or a significant impact on the future direction of the product or system, I start with `Terra` or `Sol` instead. I also adjust effort as appropriate and create the Markdown specification together with AI.

The important point is that I do not start with a cheaper model and only switch after the first output feels shallow. I look at the uncertainty and impact of the task first, then choose the model and effort level from the beginning.

## My review centers on the specification Markdown

After delegating implementation to AI, I do not read every line of code with the same intensity. I create the implementation plan in Markdown together with AI, then ask it to explain the parts that concern me in detail.

During the conversation, I ask questions such as:

- Why should this data have this scope?
- What are the trade-offs of another design?
- What could become visible to a user without the relevant permission?
- Which part could constrain future extensions?
- How far can we roll back if the implementation fails?

At the end, I review the entire specification Markdown. I check whether the implementation direction still matches the original problem we wanted to solve.

In other words, I do not review only the code. I review how AI arrived at the code and whether that reasoning still serves the product's purpose.

## You only learn what to delegate by using AI extensively

Model specification sheets cannot tell you exactly how much review AI needs.

You have to keep using AI with your own product, codebase, and way of giving instructions. Over time, you learn how much explanation it needs to understand your intent and what level of design you can safely delegate.

That intuition differs by model. A task that feels safe to delegate to one model may need more discussion with another. This is why it matters to use models from different vendors extensively and build a sense of trust based on your own work.

You do not need a perfect rubric from day one. Start with one everyday model. Pay attention to the number of possible solutions, reversibility, and long-term impact. Then remember what happened when you delegated the task and what your review uncovered.

## Conclusion

- Tasks with almost one solution and easy rollback are easier to delegate.
- When multiple solutions exist, ask AI for options and let a human decide the trade-offs.
- When the solution space is wide and product policy is involved, make the decision with AI as a thinking partner.
- Review database schema changes deeply when they affect reversibility or user data.
- Use your everyday model extensively and build a model-specific sense of how much you can delegate.

How much you can delegate to AI is not a fixed rule someone else can define for you. It is a judgment you sharpen by continuing to use AI in your own work.
