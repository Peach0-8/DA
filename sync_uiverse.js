/**
 * UIverse.io Upstream Real-time Synchronizer for UIForge
 * 
 * Capabilities:
 * 1. Fetches all components directly from the official upstream repository: uiverse-io/galaxy
 * 2. Parses HTML structure, CSS stylesheet, creator metadata, friendlyId, and tags.
 * 3. Compares with existing components in data/*.js to prevent duplicates.
 * 4. Downloads missing items in concurrent batches and merges into local data files.
 * 5. Automatically updates data/manifest.js with new categories and accurate totals.
 * 6. Tracks upstream git commit SHAs in data/sync_state.json for incremental sync.
 * 7. Supports watch/daemon mode (--watch) for continuous periodic synchronization.
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = __dirname;
const DATA_DIR = path.join(WORKSPACE_DIR, 'data');
const SYNC_STATE_FILE = path.join(DATA_DIR, 'sync_state.json');
const GITHUB_API_BASE = 'https://api.github.com/repos/uiverse-io/galaxy';
const RAW_BASE = 'https://raw.githubusercontent.com/uiverse-io/galaxy/main';

const CATEGORY_MAP = {
  'Buttons':         { name: 'Buttons',        file: 'buttons.js' },
  'Cards':           { name: 'Cards',          file: 'cards.js' },
  'Checkboxes':      { name: 'Checkboxes',     file: 'checkboxes.js' },
  'Forms':           { name: 'Forms',          file: 'forms.js' },
  'Inputs':          { name: 'Inputs',         file: 'inputs.js' },
  'Notifications':   { name: 'Notifications',  file: 'notifications.js' },
  'Patterns':        { name: 'Patterns',       file: 'patterns.js' },
  'Radio-buttons':   { name: 'Radio Buttons',  file: 'radio_buttons.js' },
  'Toggle-switches': { name: 'Toggles',        file: 'toggles.js' },
  'Tooltips':        { name: 'Tooltips',       file: 'tooltips.js' },
  'loaders':         { name: 'Loaders',        file: 'loaders.js' },
};

// Batch concurrency for fast parallel downloads
const CONCURRENCY = 15;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'uiforge-synchronizer/1.0' }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'uiforge-synchronizer/1.0' }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.text();
}

function loadSyncState() {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'));
    } catch (e) {}
  }
  return { lastCommitSha: null, lastSync: null, totalSynced: 0 };
}

function saveSyncState(state) {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Loads all existing items from data/<file>
 */
function loadCategoryItems(filename, categoryName) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    const vm = require('vm');
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    if (sandbox.window.UIVERSE_DATA && sandbox.window.UIVERSE_DATA[categoryName]) {
      return sandbox.window.UIVERSE_DATA[categoryName];
    }
  } catch (err) {
    console.warn(`[Sync] Warning parsing ${filename} via VM:`, err.message);
  }
  return [];
}

/**
 * Saves category items to data/<file>
 */
function saveCategoryItems(filename, categoryName, items) {
  const filePath = path.join(DATA_DIR, filename);
  const content = `/**
 * UIverse.io Scraped & Synced Data - ${categoryName}
 * Updated: ${new Date().toISOString()}
 * Total: ${items.length}
 */

window.UIVERSE_DATA = window.UIVERSE_DATA || {};
window.UIVERSE_DATA['${categoryName}'] = ${JSON.stringify(items, null, 2)};
`;
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Updates data/manifest.js
 */
function updateManifest() {
  const manifestPath = path.join(DATA_DIR, 'manifest.js');
  const categories = {};
  let total = 0;

  for (const [folder, meta] of Object.entries(CATEGORY_MAP)) {
    const items = loadCategoryItems(meta.file, meta.name);
    if (items.length > 0) {
      categories[meta.name] = {
        count: items.length,
        file: meta.file
      };
      total += items.length;
    }
  }

  const manifest = {
    total: total,
    updatedAt: new Date().toISOString(),
    categories: categories
  };

  const fileContent = `/**
 * UIverse Components Manifest Metadata
 * Updated: ${manifest.updatedAt}
 * Total Components: ${total.toLocaleString()}
 */
window.UIVERSE_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;

  fs.writeFileSync(manifestPath, fileContent, 'utf8');
  console.log(`\n📄 [Manifest] Updated data/manifest.js with ${total.toLocaleString()} components across ${Object.keys(categories).length} categories!`);
  return total;
}

/**
 * Processes a single HTML file from uiverse-io/galaxy
 */
function parseGalaxyFile(rawText, filePath, categoryName) {
  const filename = path.basename(filePath, '.html');
  const parts = filename.split('_');
  const author = parts[0] || 'uiverse';
  const friendlyId = parts.slice(1).join('_') || filename;

  const styleMatch = rawText.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const css = styleMatch ? styleMatch[1].trim() : '';
  const html = rawText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();

  // Extract tags from CSS comment
  const tagMatch = css.match(/Tags:\s*([^\*\/]+)/i);
  const tags = tagMatch ? tagMatch[1].split(',').map((t) => t.trim().toLowerCase()) : [];

  const title = friendlyId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const id = `uiv-${randomDigits}`;

  return {
    id: id,
    title: title,
    author: author,
    category: categoryName,
    likes: 0,
    views: 0,
    liked: false,
    createdAt: new Date().toISOString(),
    html: html,
    css: css,
    tags: tags
  };
}

async function runSync() {
  console.log('================================================================');
  console.log('🚀 [UIForge Sync] Checking upstream uiverse-io/galaxy repository...');
  console.log('================================================================');

  const syncState = loadSyncState();

  // 1. Get latest commit SHA
  let latestCommitSha = null;
  try {
    const commits = await fetchJson(`${GITHUB_API_BASE}/commits?per_page=1`);
    if (commits && commits.length > 0) {
      latestCommitSha = commits[0].sha;
      console.log(`📌 Upstream Latest Commit: ${latestCommitSha.slice(0, 7)} (${commits[0].commit.message.split('\n')[0]})`);
    }
  } catch (err) {
    console.warn(`[Sync] Warning fetching commits:`, err.message);
  }

  // 2. Fetch entire repository tree
  console.log('📥 Fetching upstream galaxy tree...');
  const treeData = await fetchJson(`${GITHUB_API_BASE}/git/trees/main?recursive=1`);
  const htmlEntries = (treeData.tree || []).filter((t) => t.path.endsWith('.html'));
  console.log(`📦 Found ${htmlEntries.length} total element files in upstream galaxy.`);

  // 3. Load all existing component keys to prevent duplicates
  const existingKeys = new Set();
  const categoryCaches = {};

  for (const [folder, meta] of Object.entries(CATEGORY_MAP)) {
    const items = loadCategoryItems(meta.file, meta.name);
    categoryCaches[meta.name] = items;
    items.forEach((c) => {
      const a = (c.author || '').trim().toLowerCase();
      const t = (c.title || '').trim().toLowerCase();
      existingKeys.add(`${a}_${t}`);
      existingKeys.add(t);
    });
  }

  console.log(`🔍 Current local database has ${existingKeys.size} indexed keys.`);

  // 4. Identify missing items to fetch
  const missingByCat = {};
  let totalMissing = 0;

  for (const entry of htmlEntries) {
    const parts = entry.path.split('/');
    if (parts.length !== 2) continue;
    const [folder, filename] = parts;
    const catMeta = CATEGORY_MAP[folder];
    if (!catMeta) continue;

    const base = filename.slice(0, -5);
    const fParts = base.split('_');
    const author = (fParts[0] || '').trim().toLowerCase();
    const friendlyId = (fParts.slice(1).join('_') || base).trim().toLowerCase();
    const titleClean = friendlyId.replace(/-/g, ' ');

    const key1 = `${author}_${friendlyId}`;
    const key2 = `${author}_${titleClean}`;
    const key3 = friendlyId;

    if (!existingKeys.has(key1) && !existingKeys.has(key2) && !existingKeys.has(key3)) {
      if (!missingByCat[catMeta.name]) missingByCat[catMeta.name] = [];
      missingByCat[catMeta.name].push({ path: entry.path, folder: folder, meta: catMeta });
      totalMissing++;
    }
  }

  console.log(`✨ Found ${totalMissing} new/missing elements to ingest across ${Object.keys(missingByCat).length} categories!`);

  if (totalMissing === 0) {
    console.log('🎉 Everything is already 100% up to date with upstream Uiverse!');
    updateManifest();
    syncState.lastSync = new Date().toISOString();
    if (latestCommitSha) syncState.lastCommitSha = latestCommitSha;
    saveSyncState(syncState);
    return;
  }

  // 5. Ingest in concurrent batches
  let ingestedCount = 0;

  for (const [catName, fileList] of Object.entries(missingByCat)) {
    console.log(`\n⏳ Ingesting ${fileList.length} new components into [${catName}]...`);
    const targetItems = categoryCaches[catName];
    const catMeta = fileList[0].meta;

    // Process with concurrency limit
    for (let i = 0; i < fileList.length; i += CONCURRENCY) {
      const chunk = fileList.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (item) => {
          try {
            const rawUrl = `${RAW_BASE}/${encodeURIComponent(item.path).replace(/%2F/g, '/')}`;
            const text = await fetchText(rawUrl);
            return parseGalaxyFile(text, item.path, catName);
          } catch (e) {
            console.warn(`[Sync] Failed to download ${item.path}:`, e.message);
            return null;
          }
        })
      );

      results.forEach((parsed) => {
        if (parsed) {
          targetItems.push(parsed);
          ingestedCount++;
        }
      });

      process.stdout.write(`  [${ingestedCount}/${totalMissing}] `);
    }

    // Save updated category file
    saveCategoryItems(catMeta.file, catName, targetItems);
    console.log(`\n💾 Saved data/${catMeta.file} (Total: ${targetItems.length} components)`);
  }

  // 6. Update manifest
  const newGrandTotal = updateManifest();

  // 7. Update sync state
  syncState.lastSync = new Date().toISOString();
  if (latestCommitSha) syncState.lastCommitSha = latestCommitSha;
  syncState.totalSynced = newGrandTotal;
  saveSyncState(syncState);

  console.log('\n================================================================');
  console.log(`🎉 [Sync Complete] Added ${ingestedCount} new elements! Grand Total: ${newGrandTotal.toLocaleString()}`);
  console.log('================================================================');
}

// Watch mode for daemon / recurring synchronization
if (process.argv.includes('--watch')) {
  console.log('👀 [Sync Daemon] Running in continuous watch mode (checking hourly)...');
  runSync().then(() => {
    setInterval(() => {
      runSync().catch(console.error);
    }, 60 * 60 * 1000); // Every 1 hour
  }).catch(console.error);
} else {
  runSync().catch(console.error);
}

