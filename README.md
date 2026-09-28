# Sharky Portfolio v2

Personal portfolio of Sharavanan Mathivanan - Mechatronics & AI Systems Engineering student.

Built with plain HTML, CSS, and vanilla JS. No frameworks. Single scrolling page (`index.html`) with anchor navigation; no separate About/Projects pages anymore.

**Live**: https://sharkyy.me

## Structure

- `index.html`, the entire site: Home, About, Skills, Experience, Education, Projects, Blog, Certifications, Contact
- `data/projects.json`: project cards, rendered client-side by `assets/js/main.js`. Synced from Notion; see `NOTION-SYNC-SETUP.md`
- `assets/`: CSS, JS, images, resume

## Notes

- `about.html` and `projects.html` are leftover from the old multi-page layout and are no longer linked from anywhere; safe to delete manually.
- Project data can be edited two ways: directly in `data/projects.json`, or through the Notion "Projects" database (auto-syncs every 6 hours once set up, see `NOTION-SYNC-SETUP.md`).
