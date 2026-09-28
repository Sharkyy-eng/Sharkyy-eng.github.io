// Pulls published projects from the Notion "Projects" database and writes
// data/projects.json in the shape the portfolio site's JS expects.
//
// Requires env vars:
//   NOTION_API_KEY        — internal integration secret from notion.so/my-integrations
//   NOTION_DATA_SOURCE_ID — data source id for the Projects database (see README)
//
// Only rows with "Publish to Site" checked are included, so tracking-only
// entries (drafts, meta projects, ideas) stay private to Notion.

import { writeFile } from 'node:fs/promises';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;
const NOTION_VERSION = '2025-09-03';
const OUTPUT_PATH = 'data/projects.json';

if (!NOTION_API_KEY || !DATA_SOURCE_ID) {
  console.error('Missing NOTION_API_KEY or NOTION_DATA_SOURCE_ID env vars.');
  process.exit(1);
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function splitList(text) {
  return (text || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function plainText(richTextProp) {
  // The Notion API returns rich_text as an array of segments; join them.
  if (!richTextProp || !Array.isArray(richTextProp.rich_text)) return '';
  return richTextProp.rich_text.map(t => t.plain_text).join('');
}

function checkbox(prop) {
  return !!(prop && prop.checkbox);
}

function selectName(prop) {
  return prop && prop.select ? prop.select.name : null;
}

function multiSelectNames(prop) {
  return prop && Array.isArray(prop.multi_select)
    ? prop.multi_select.map(o => o.name)
    : [];
}

function dateStart(prop) {
  return prop && prop.date ? prop.date.start : null;
}

function dateEnd(prop) {
  return prop && prop.date ? prop.date.end : null;
}

function titleText(prop) {
  if (!prop || !Array.isArray(prop.title)) return '';
  return prop.title.map(t => t.plain_text).join('');
}

async function queryAllPages() {
  const pages = [];
  let cursor = undefined;

  do {
    const res = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_cursor: cursor,
        filter: {
          property: 'Publish to Site',
          checkbox: { equals: true },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Notion API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return pages;
}

function mapPageToProject(page) {
  const props = page.properties;
  const title = titleText(props['Name']);
  const status = selectName(props['Status']) === 'Done' ? 'done' : 'in-progress';
  const siteCategory = multiSelectNames(props['Site Category']);
  const category = status === 'in-progress' ? [...siteCategory, 'in-progress'] : siteCategory;

  return {
    id: slugify(title),
    title,
    category,
    status,
    startDate: dateStart(props['Start Date']),
    endDate: dateEnd(props['End Date']) || dateStart(props['End Date']),
    tech: splitList(plainText(props['Tech Stack'])),
    tags: splitList(plainText(props['Tags'])),
    description: plainText(props['Description']),
    github: props['GitHub URL'] ? props['GitHub URL'].url : null,
    featured: checkbox(props['Featured']),
  };
}

const pages = await queryAllPages();
const projects = pages.map(mapPageToProject);

// Featured projects first, otherwise keep Notion's own ordering.
projects.sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1));

await writeFile(OUTPUT_PATH, JSON.stringify(projects, null, 2) + '\n');
console.log(`Wrote ${projects.length} published projects to ${OUTPUT_PATH}`);
