# Logging This Project into Notion

Paste this file's contents into any Claude Project chat that has real documentation for one of my projects. It tells Claude how to log that project into my "Projects" database in Notion ("Sharky's Space" workspace), using only what's actually documented in this chat.

## Where it goes

- Workspace: Sharky's Space
- Database: **Projects**
- Database URL: https://app.notion.com/p/0ebb94fba19841098b0f8f9cb2219a37
- Data source ID: `collection://35b01aab-4bfc-4ae2-a30b-5e73b7086952`

If that data source ID doesn't resolve, fetch the database URL above first — the fetch result will show the current `<data-source url="collection://...">` tag to use instead.

## Schema

- **Name** (title) — project name, exactly as documented here
- **Category** (multi-select) — reuse an existing option if it fits: `AI`, `Computer Vision Software`, `Robotics`, `Web Design`, `Cyberpi`, `n8n`. If none fit, add a new option that accurately describes the project (e.g. `Hardware`, `IoT`).
- **Status** (select) — one of: `Done`, `In progress`, `Upcoming`, `On Hold`
- **Start Date** (date)
- **End Date** (date) — omit if ongoing or unknown, don't guess one
- **Tasks Progress** (text) — e.g. `"6/9 tasks completed"`, or `"No tasks logged"` if there's no granular task breakdown in the documentation

## Page content format

```
<1–3 sentence description of what the project is/does, pulled directly from this chat's documentation>

## Tasks
- [x] Completed task
- [ ] Not-yet-done task
```

If tasks group naturally by day or phase, use `### ` subheadings, e.g. `### Day 1 — Jan 18, 2026`.

## Ground rules — read before writing anything

1. **Only log what's actually in this chat's documentation.** Don't invent, estimate, or pad dates, task names, or outcomes that aren't grounded in what's here.
2. **Flag reconstructed info as reconstructed.** If a date is approximate or pulled from memory rather than a contemporaneous log, say so explicitly in the page content (e.g. "dates approximate, reconstructed from memory").
3. **Ask, don't guess.** If something's missing or ambiguous — exact dates, whether a task was actually finished, current status — ask me before logging instead of filling the gap with something plausible-sounding.
4. **No duplicates.** Search the Projects database for a page with this project's name first. If it already exists, update that page instead of creating a new one.

## Tool sequence

1. `notion-fetch` the database URL above to confirm the live data source ID and check for an existing page with this project's name.
2. If no existing page: `notion-create-pages`, with `parent: {"type": "data_source_id", "data_source_id": "<id from step 1>"}`.
3. If a page already exists: `notion-update-page` on that page instead.
4. Report back what was logged (name, status, dates, task count) so I can confirm it's accurate before treating it as final.
