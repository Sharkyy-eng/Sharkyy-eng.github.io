# Notion → Site Project Sync

Projects on the site are driven by `data/projects.json`, which a scheduled GitHub Action (`.github/workflows/notion-sync.yml`) regenerates from the **Projects** database in your "Sharky's Space" Notion workspace every 6 hours (or on demand). To turn a project card on or off, edit it in Notion: no code changes needed.

## What controls what shows up

Each row in the Notion Projects database has:

- **Publish to Site** (checkbox): must be checked for the project to appear on the site at all. Everything else stays private tracking.
- **Site Category** (multi-select: `hardware`, `software`, `robotics`): drives the site's filter buttons.
- **Status**: anything other than `Done` shows an "In Progress" badge and adds it to the "In Progress" filter automatically.
- **Featured** (checkbox): featured projects sort first.
- **Description**, **Tech Stack** (comma-separated), **Tags** (comma-separated), **GitHub URL**: feed directly into the card.
- **Start Date** / **End Date**: kept for your own record-keeping; not currently shown on the card.

## One-time setup (you need to do this; I can't create API keys or GitHub secrets myself)

1. **Create a Notion internal integration** (separate from the Claude connector):
   - Go to https://www.notion.so/my-integrations → "New integration"
   - Name it something like "Portfolio Sync", associate it with **Sharky's Space**
   - Copy the generated "Internal Integration Secret": this is your `NOTION_API_KEY`

2. **Share the Projects database with that integration:**
   - Open the Projects database in Notion → `•••` menu → Connections → add "Portfolio Sync"

3. **Add two repo secrets** (GitHub repo → Settings → Secrets and variables → Actions → New repository secret):
   - `NOTION_API_KEY`: the integration secret from step 1
   - `NOTION_DATA_SOURCE_ID`: `35b01aab-4bfc-4ae2-a30b-5e73b7086952` (the current Projects data source id)

4. That's it: the workflow will run automatically every 6 hours, or trigger it manually from the Actions tab ("Sync Notion Projects" → Run workflow) to pull immediately after editing Notion.

## Projects not yet in Notion

Ten projects currently on the site (Autonomous Robot, Particle Filter Robot Localization, Rocket Launcher, SAD Light Diffuser, Gravity Based Water Pump, Drone Orientation Identifier, Fin McMissile, Desk Buddy, Finals Helper, AI Flappy Bird) aren't logged in Notion yet; `data/projects.json` currently includes them as a static baseline. Once the sync runs, it will **overwrite this file with only what's marked "Publish to Site" in Notion**, so if you want these to survive, import them into Notion (mark Publish to Site + fill in the fields above) before turning the schedule on, or ask to have them imported.
