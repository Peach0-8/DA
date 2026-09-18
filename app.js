/**
 * ============================================================
 *  app.js — UIForge Application Logic
 *  UI/UX Component Sharing Platform
 *
 *  Architecture:
 *  1. CONFIG          — Environment & feature flags
 *  2. DB SERVICE      — Database abstraction layer (Supabase-ready)
 *  3. DUMMY DATA      — 12 high-quality seed components
 *  4. STATE           — Application state management
 *  5. UTILS           — Helper functions
 *  6. UI COMPONENTS   — DOM rendering functions
 *  7. MODAL MANAGER   — Detail & upload modal logic
 *  8. EVENT HANDLERS  — All user interaction listeners
 *  9. INIT            — Bootstrap on DOMContentLoaded
 * ============================================================
 */

/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const CONFIG = {
  /** 
   * 🔌 DATABASE PROVIDER
   * Set to 'supabase' or 'firebase' when you're ready to go live.
   * While 'local', all data is served from DUMMY_DATA below.
   */
  DB_PROVIDER: 'local', // 'local' | 'supabase' | 'firebase'

  /** Supabase credentials — replace with yours */
  SUPABASE: {
    URL: 'https://YOUR_PROJECT_ID.supabase.co',
    ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  },

  /** Firebase credentials — replace with yours */
  FIREBASE: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },

  /** Pagination */
  PAGE_SIZE: 12,

  /** Simulated network delay for local mode (ms) */
  FAKE_DELAY: 150,
};

/* ============================================================
   2. DATABASE SERVICE LAYER
   ============================================================
   These async functions abstract over the DB provider.
   To connect a real backend:
     1. Set CONFIG.DB_PROVIDER = 'supabase' (or 'firebase')
     2. Install the SDK: npm i @supabase/supabase-js  (or firebase)
     3. The implementations below will handle the rest.
   ============================================================ */

/**
 * Lazy-initialised Supabase client singleton.
 * Only created when CONFIG.DB_PROVIDER === 'supabase'.
 */
let _supabaseClient = null;
function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  // Uncomment when supabase-js is available:
  // const { createClient } = supabase;
  // _supabaseClient = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
  console.warn('[UIForge] Supabase SDK not loaded. Using local mode.');
  return null;
}

/**
 * Lazy-initialised Firebase Firestore reference.
 * Only created when CONFIG.DB_PROVIDER === 'firebase'.
 */
let _firestoreDB = null;
function getFirestoreDB() {
  if (_firestoreDB) return _firestoreDB;
  // Uncomment when firebase is available:
  // const app = firebase.initializeApp(CONFIG.FIREBASE);
  // _firestoreDB = firebase.firestore(app);
  console.warn('[UIForge] Firebase SDK not loaded. Using local mode.');
  return null;
}

/* ---- Helper: fake async delay ---- */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---- Local in-memory "database" (populated from DUMMY_DATA) ---- */
let _localComponents = [];
const CODE_EDIT_STORAGE_KEY = 'uiforge_component_code_edits';

function getStoredCodeEdits() {
  try {
    return JSON.parse(localStorage.getItem(CODE_EDIT_STORAGE_KEY) || '{}');
  } catch (error) {
    console.warn('[UIForge] Could not read saved code edits:', error);
    return {};
  }
}

function applyStoredCodeEdits(components) {
  const edits = getStoredCodeEdits();
  components.forEach((component) => {
    const edit = edits[component.id];
    if (edit && typeof edit.html === 'string' && typeof edit.css === 'string') {
      component.html = edit.html;
      component.css = edit.css;
    }
  });
  return components;
}

/* ---- Category-based Lazy Loading for Uiverse Library (Approach 2) ---- */
const _categoryLoadPromises = {};
let _allCategoriesLoaded = false;
let _allCategoriesPromise = null;

async function loadCategoryData(categoryName) {
  if (window.UIVERSE_DATA && window.UIVERSE_DATA[categoryName]) {
    return window.UIVERSE_DATA[categoryName];
  }
  if (!window.UIVERSE_MANIFEST || !window.UIVERSE_MANIFEST.categories[categoryName]) {
    return [];
  }
  if (_categoryLoadPromises[categoryName]) {
    return _categoryLoadPromises[categoryName];
  }

  const filename = window.UIVERSE_MANIFEST.categories[categoryName].file;
  _categoryLoadPromises[categoryName] = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `data/${filename}`;
    script.async = true;
    script.onload = () => {
      const data = (window.UIVERSE_DATA && window.UIVERSE_DATA[categoryName]) || [];
      resolve(applyStoredCodeEdits(data));
    };
    script.onerror = (err) => {
      console.warn(`[UIForge] Could not load data/${filename}`, err);
      resolve([]);
    };
    document.head.appendChild(script);
  });

  return _categoryLoadPromises[categoryName];
}

async function loadAllCategories() {
  if (_allCategoriesLoaded) return;
  if (_allCategoriesPromise) return _allCategoriesPromise;
  if (!window.UIVERSE_MANIFEST) return;

  const categories = Object.keys(window.UIVERSE_MANIFEST.categories);
  _allCategoriesPromise = Promise.all(categories.map((cat) => loadCategoryData(cat))).then(() => {
    _allCategoriesLoaded = true;
    if (STATE.activeCategory === 'All') {
      const fullCount = window.UIVERSE_MANIFEST.total + _localComponents.length;
      STATE.total = fullCount;
      const countEl = document.getElementById('count-number');
      if (countEl) countEl.textContent = fullCount.toLocaleString();
    }
  });

  return _allCategoriesPromise;
}

/**
 * fetchComponents(options)
 * Returns a paginated, filtered, sorted list of components.
 *
 * @param {object} options
 * @param {string}  options.category  - Filter by category ('All' = no filter)
 * @param {string}  options.search    - Full-text search query
 * @param {string}  options.sort      - 'newest' | 'popular' | 'trending'
 * @param {number}  options.page      - Page number (1-based)
 * @param {number}  options.pageSize  - Items per page
 * @returns {Promise<{ data: Component[], total: number }>}
 */
async function fetchComponents({
  category = 'All',
  search = '',
  sort = 'newest',
  page = 1,
  pageSize = CONFIG.PAGE_SIZE,
} = {}) {
  if (CONFIG.DB_PROVIDER === 'supabase') {
    const sb = getSupabaseClient();
    if (sb) {
      let query = sb.from('components').select('*', { count: 'exact' });
      if (category !== 'All') query = query.eq('category', category);
      if (search) query = query.ilike('title', `%${search}%`);
      if (sort === 'popular') query = query.order('likes', { ascending: false });
      else if (sort === 'trending') query = query.order('views', { ascending: false });
      else query = query.order('created_at', { ascending: false });
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0 };
    }
  }

  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      let ref = db.collection('components');
      if (category !== 'All') ref = ref.where('category', '==', category);
      if (sort === 'popular') ref = ref.orderBy('likes', 'desc');
      else if (sort === 'trending') ref = ref.orderBy('views', 'desc');
      else ref = ref.orderBy('createdAt', 'desc');
      const snapshot = await ref.get();
      let docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (search) {
        const q = search.toLowerCase();
        docs = docs.filter(
          (d) => d.title.toLowerCase().includes(q) || d.author.toLowerCase().includes(q)
        );
      }
      const total = docs.length;
      const data = docs.slice((page - 1) * pageSize, page * pageSize);
      return { data, total };
    }
  }

  // ---- LOCAL FALLBACK WITH CATEGORY LAZY-LOADING ----
  await delay(CONFIG.FAKE_DELAY);
  let items = [];

  if (category === 'Favorites') {
    if (typeof loadAllCategories === 'function') {
      await loadAllCategories();
    }
    let pool = [..._localComponents];
    if (window.UIVERSE_DATA) {
      const existingIds = new Set(pool.map((c) => c.id));
      Object.values(window.UIVERSE_DATA).forEach((catItems) => {
        catItems.forEach((c) => {
          if (!existingIds.has(c.id)) {
            existingIds.add(c.id);
            pool.push(c);
          }
        });
      });
    }
    items = pool.filter((c) => STATE.likedIds.has(c.id));
  } else if (category !== 'All') {
    if (window.UIVERSE_MANIFEST && window.UIVERSE_MANIFEST.categories[category]) {
      const catData = await loadCategoryData(category);
      const dummyMatches = _localComponents.filter((c) => c.category === category);
      const dummyIds = new Set(dummyMatches.map((c) => c.id));
      items = [...dummyMatches, ...catData.filter((c) => !dummyIds.has(c.id))];
    } else {
      items = _localComponents.filter((c) => c.category === category);
    }
  } else {
    // 'All' category: start background loading of all categories
    loadAllCategories();

    let pool = [..._localComponents];
    if (window.UIVERSE_DATA) {
      const existingIds = new Set(pool.map((c) => c.id));
      Object.values(window.UIVERSE_DATA).forEach((catItems) => {
        catItems.forEach((c) => {
          if (!existingIds.has(c.id)) {
            existingIds.add(c.id);
            pool.push(c);
          }
        });
      });
    }

    const needed = page * pageSize;
    if (pool.length < needed && !_allCategoriesLoaded) {
      await loadAllCategories();
      pool = [..._localComponents];
      if (window.UIVERSE_DATA) {
        const existingIds = new Set(pool.map((c) => c.id));
        Object.values(window.UIVERSE_DATA).forEach((catItems) => {
          catItems.forEach((c) => {
            if (!existingIds.has(c.id)) {
              existingIds.add(c.id);
              pool.push(c);
            }
          });
        });
      }
    }

    items = pool;
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }
  if (sort === 'popular') items.sort((a, b) => b.likes - a.likes);
  else if (sort === 'trending') items.sort((a, b) => b.views - a.views);
  else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let total = items.length;
  if (category === 'All' && !search && window.UIVERSE_MANIFEST) {
    total = window.UIVERSE_MANIFEST.total + _localComponents.length;
  }

  applyStoredCodeEdits(items);
  const data = items.slice((page - 1) * pageSize, page * pageSize);
  return { data, total };
}

/**
 * fetchComponentById(id)
 * Returns a single component by its ID.
 *
 * @param {string} id
 * @returns {Promise<Component|null>}
 */
async function fetchComponentById(id) {
  if (CONFIG.DB_PROVIDER === 'supabase') {
    const sb = getSupabaseClient();
    if (sb) {
      const { data, error } = await sb.from('components').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    }
  }

  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      const doc = await db.collection('components').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
  }

  // LOCAL FALLBACK
  await delay(50);
  let found = _localComponents.find((c) => c.id === id);
  if (!found && window.UIVERSE_DATA) {
    for (const catList of Object.values(window.UIVERSE_DATA)) {
      found = catList.find((c) => c.id === id);
      if (found) break;
    }
  }
  return found ?? null;
}

/**
 * uploadComponent(payload)
 * Creates a new component in the database.
 *
 * @param {{ title: string, html: string, css: string, author: string, category: string }} payload
 * @returns {Promise<Component>} The created component record
 */
async function uploadComponent({ title, html, css, author = 'Anonymous', category = 'Other' }) {
  const newComponent = {
    id: `local-${Date.now()}`,
    title: title.trim(),
    html: html.trim(),
    css: css.trim(),
    author: author.trim() || 'Anonymous',
    category,
    likes: 0,
    views: 0,
    liked: false,
    createdAt: new Date().toISOString(),
  };

  if (CONFIG.DB_PROVIDER === 'supabase') {
    const sb = getSupabaseClient();
    if (sb) {
      const { data, error } = await sb.from('components').insert([newComponent]).select().single();
      if (error) throw error;
      return data;
    }
  }

  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      const ref = await db.collection('components').add({
        ...newComponent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return { ...newComponent, id: ref.id };
    }
  }

  // LOCAL FALLBACK
  await delay(600);
  _localComponents.unshift(newComponent);
  return newComponent;
}

/** Save editable component code using the currently configured data provider. */
async function updateComponentCode(id, { html, css }) {
  if (CONFIG.DB_PROVIDER === 'supabase') {
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from('components').update({ html, css }).eq('id', id);
      if (error) throw error;
      return;
    }
  }

  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      await db.collection('components').doc(id).update({ html, css });
      return;
    }
  }

  const edits = getStoredCodeEdits();
  edits[id] = { html, css };
  localStorage.setItem(CODE_EDIT_STORAGE_KEY, JSON.stringify(edits));
}

/**
 * likeComponent(id)
 * Toggles the like on a component (optimistic UI update).
 *
 * @param {string} id - Component ID
 * @returns {Promise<{ liked: boolean, likes: number }>}
 */
async function likeComponent(id, willBeLiked) {
  const component = findComponentAnywhere(id);

  if (CONFIG.DB_PROVIDER === 'supabase') {
    const sb = getSupabaseClient();
    if (sb) {
      // In a real app you'd check if the user already liked via a separate join table
      const newLikes = component?.likes ?? 0;
      const { data, error } = await sb
        .from('components')
        .update({ likes: newLikes })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { liked: willBeLiked, likes: data.likes };
    }
  }

  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      const ref = db.collection('components').doc(id);
      const delta = willBeLiked ? 1 : -1;
      await ref.update({
        likes: firebase.firestore.FieldValue.increment(delta),
      });
      return { liked: willBeLiked, likes: component?.likes ?? 0 };
    }
  }

  // LOCAL FALLBACK — component state was already updated by handleLike
  await delay(50);
  return { liked: willBeLiked, likes: component?.likes ?? 0 };
}

/**
 * incrementViews(id)
 * Increments the view counter on a component.
 * Called when the detail modal is opened.
 *
 * @param {string} id
 */
async function incrementViews(id) {
  if (CONFIG.DB_PROVIDER === 'supabase') {
    const sb = getSupabaseClient();
    if (sb) {
      await sb.rpc('increment_views', { row_id: id });
      return;
    }
  }

  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      await db.collection('components').doc(id).update({
        views: firebase.firestore.FieldValue.increment(1),
      });
      return;
    }
  }

  // LOCAL
  const c = _localComponents.find((c) => c.id === id);
  if (c) c.views = (c.views || 0) + 1;
}


/* ============================================================
   3. INITIAL COMPONENTS (Loaded from data/initial_components.js)
   ============================================================ */

const DUMMY_DATA = window.INITIAL_COMPONENTS || [];

/* ============================================================
   4. APPLICATION STATE
   ============================================================ */

const STATE = {
  components: [],          // Currently displayed components
  allComponents: [],          // All loaded components (for client-side filtering)
  total: 0,           // Total count from DB
  page: 1,
  pageSize: CONFIG.PAGE_SIZE,
  activeCategory: 'All',
  searchQuery: '',
  sort: 'newest',
  currentModal: null,        // ID of the open component (detail modal)
  isGridView: true,
  likedIds: new Set(JSON.parse(localStorage.getItem('uiforge_liked') || '[]')),
  isLoading: false,
};

/** Persist liked IDs to localStorage */
function persistLikes() {
  localStorage.setItem('uiforge_liked', JSON.stringify([...STATE.likedIds]));
}


/* ============================================================
   5. UTILITIES
   ============================================================ */

/**
 * showToast(message, type)
 * Displays a dismissible toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration - ms to auto-dismiss
 */
function showToast(message, type = 'info', duration = 3500) {
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
  };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 320);
  };

  setTimeout(dismiss, duration);
  toast.addEventListener('click', dismiss);
}

/**
 * copyToClipboard(text)
 * Copies text to clipboard, returns success boolean.
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-https environments
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * getInitials(name)
 * Returns up to 2 initials from a name string.
 */
function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/**
 * formatNumber(n)
 * Formats numbers: 1200 -> "1.2k"
 */
function formatNumber(n = 0) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
}

/**
 * formatDate(iso)
 * Formats an ISO date string to "Aug 20, 2026"
 */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

/** Debounce utility */
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * buildPreviewSrcDoc(html, css)
 * Builds a full HTML document for use in an <iframe> srcdoc attribute.
 */
function buildPreviewSrcDoc(html, css, category = '', isModal = false, bgColor = '#212121') {
  const isTailwind = !css || !css.trim();
  const tailwindHead = isTailwind ? `
<script>
  (() => {
    const _origWarn = console.warn;
    console.warn = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) return;
      _origWarn.apply(console, args);
    };
  })();
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
  };
</script>` : '';

  return `<!DOCTYPE html>
<html class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0">
${tailwindHead}
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    overflow: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: ${bgColor} !important;
    color: #f4f4f5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  body::-webkit-scrollbar { display: none; }

  /* Centered and Scaled Canvas Stage */
  #uiverse-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 16px;
    position: relative;
    transform-origin: center center;
  }

  ${css}
</style>
</head>
<body class="dark">
<div id="uiverse-stage">
${html}
</div>
<script>
  document.addEventListener('click', e => {
    if (e.target.closest('a')) e.preventDefault();
  });
  document.addEventListener('submit', e => e.preventDefault());

  function autoFit() {
    const stage = document.getElementById('uiverse-stage');
    if (!stage) return;
    const isModal = ${isModal};

    // Calculate natural content dimensions (measure the real rendered size,
    // never guess from the category — category is not a reliable proxy for
    // how big any individual component actually is).
    let w = stage.scrollWidth;
    let h = stage.scrollHeight;
    Array.from(stage.children).forEach(child => {
      const cr = child.getBoundingClientRect();
      if (cr.width > 0) w = Math.max(w, cr.width);
      if (cr.height > 0) h = Math.max(h, cr.height);
    });

    if (w <= 0 || h <= 0) return;

    const padding = 20;
    const availW = window.innerWidth - padding;
    const availH = window.innerHeight - padding;

    // Scale purely based on measured size vs. available space:
    // shrink anything that would overflow, and gently enlarge anything
    // that would otherwise look lost in the box. Bounds keep either
    // extreme (huge decorative SVGs, tiny checkboxes) from ever
    // overflowing or from being blown up past legibility.
    const fitScale = Math.min(availW / w, availH / h);
    const maxBoost = isModal ? 1.25 : 1.4;
    let s = Math.min(fitScale, maxBoost);
    s = Math.max(s, 0.25);

    if (Math.abs(s - 1) > 0.01) {
      stage.style.transform = 'scale(' + s + ')';
    }
  }

  window.addEventListener('DOMContentLoaded', autoFit);
  window.addEventListener('load', autoFit);
  window.addEventListener('resize', autoFit);
  setTimeout(autoFit, 50);
  setTimeout(autoFit, 150);
  setTimeout(autoFit, 300);
</script>
</body>
</html>`;
}

/**
 * animateCounter(el, target)
 * Animates a number from 0 to target.
 */
function animateCounter(el, target) {
  const duration = 1800;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(ease * target);
    el.textContent = current >= 1000 ? current.toLocaleString() : current;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}


/* ============================================================
   6. UI COMPONENTS — DOM Rendering
   ============================================================ */

/** Build category filter pills */
function renderCategoryFilters() {
  const categories = [
    'All', 'Buttons', 'Checkboxes', 'Inputs', 'Radio Buttons',
    'Cards', 'Toggles', 'Loaders', 'Tooltips', 'Forms', 'Patterns',
  ];
  const container = document.getElementById('sidebar-categories');
  if (!container) return;

  const categoryIcons = {
    All: 'fa-border-all',
    Buttons: 'fa-hand-pointer',
    Checkboxes: 'fa-square-check',
    Inputs: 'fa-keyboard',
    'Radio Buttons': 'fa-circle-dot',
    Cards: 'fa-rectangle-list',
    Toggles: 'fa-toggle-on',
    Loaders: 'fa-circle-notch',
    Tooltips: 'fa-comment-dots',
    Forms: 'fa-wpforms',
    Patterns: 'fa-table-cells-large',
  };

  container.innerHTML = categories.map((cat) => {
    const isActive = cat === STATE.activeCategory;
    let count = 0;
    if (cat === 'All') {
      count = window.UIVERSE_MANIFEST ? window.UIVERSE_MANIFEST.total + _localComponents.length : _localComponents.length;
    } else if (window.UIVERSE_MANIFEST && window.UIVERSE_MANIFEST.categories[cat]) {
      const dummyCount = _localComponents.filter((c) => c.category === cat).length;
      count = window.UIVERSE_MANIFEST.categories[cat].count + dummyCount;
    } else {
      count = _localComponents.filter((c) => c.category === cat).length;
    }

    return `
      <button
        class="sidebar-cat-btn flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}"
        data-category="${cat}"
        aria-pressed="${isActive}"
      >
        <span class="flex items-center gap-3">
          <i class="fa-solid ${categoryIcons[cat] || 'fa-tag'} w-5 text-center ${isActive ? 'text-brand-400' : ''}"></i>
          ${cat}
        </span>
        <div class="flex items-center gap-2">
          ${count > 0 ? `<span class="text-[11px] px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-brand-500/30 text-brand-200' : 'bg-white/5 text-gray-400'}">${count.toLocaleString()}</span>` : ''}
          ${isActive ? '<div class="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"></div>' : ''}
        </div>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.sidebar-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.activeCategory = btn.dataset.category;
      STATE.page = 1;

      // Update Main Content Title
      const titleEl = document.getElementById('current-category-title');
      if (titleEl) {
        titleEl.textContent = STATE.activeCategory === 'All' ? 'All Components' : STATE.activeCategory + ' Components';
      }

      renderCategoryFilters(); // Re-render to update active styling
      loadComponents(true);

      // Auto-close sidebar on mobile after selecting
      if (window.innerWidth < 1024) {
        document.getElementById('sidebar-close-btn').click();
      }
    });
  });
}

/**
 * renderComponentCard(component)
 * Returns the outer HTML string for a single component card.
 */
function renderComponentCard(component) {
  const isLiked = STATE.likedIds.has(component.id);
  const initials = getInitials(component.author);
  const likeCount = formatNumber(component.likes);
  const previewDoc = buildPreviewSrcDoc(component.html, component.css, component.category, false);
  const scaleClass = '';

  return `
    <article
      class="component-card"
      data-id="${component.id}"
      tabindex="0"
      role="button"
      aria-label="View ${component.title} component"
    >
      <!-- Preview -->
      <div class="card-preview">
        <div class="card-overlay">
          <button class="overlay-btn overlay-btn-primary card-open-btn" data-id="${component.id}">
            <i class="fa-solid fa-eye"></i> Preview
          </button>
          <button class="overlay-btn overlay-btn-secondary card-copy-btn" data-id="${component.id}" title="Quick copy HTML">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
        <iframe
          srcdoc="${escapeAttr(previewDoc)}"
          title="${escapeAttr(component.title)} preview"
          loading="lazy"
          sandbox="allow-scripts"
          class="card-iframe ${scaleClass}"
        ></iframe>
      </div>

      <!-- Body -->
      <div class="card-body">
        <div class="card-meta">
          <span class="card-title" title="${escapeAttr(component.title)}">${escapeHtml(component.title)}</span>
          <button
            class="like-btn ${isLiked ? 'liked' : ''}"
            data-id="${component.id}"
            aria-label="Like ${escapeAttr(component.title)}"
            aria-pressed="${isLiked}"
          >
            <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart like-icon"></i>
            <span class="like-count">${likeCount}</span>
          </button>
        </div>
        <div class="flex items-center justify-between">
          <p class="card-author">
            by <span>@${escapeHtml(component.author)}</span>
          </p>
          <span class="card-tag">${escapeHtml(component.category)}</span>
        </div>
      </div>
    </article>
  `;
}

/** Escape for HTML content */
function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escape for HTML attribute values */
function escapeAttr(str = '') {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * renderGrid(components, append)
 * Renders the component grid. If append=true, adds to existing cards.
 */
function renderGrid(components, append = false) {
  const grid = document.getElementById('components-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl = document.getElementById('count-number');
  const spinner = document.getElementById('infinite-scroll-spinner');
  const endMsg = document.getElementById('infinite-scroll-end');

  if (!grid) return;

  // Remove skeleton loaders on first render
  if (!append) {
    grid.querySelectorAll('.skeleton-card').forEach((s) => s.remove());
  }

  if (components.length === 0 && !append) {
    grid.style.display = 'none';
    emptyState.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
    if (endMsg) endMsg.classList.add('hidden');
    if (countEl) countEl.textContent = '0';
    return;
  }

  grid.style.display = '';
  emptyState.classList.add('hidden');

  if (!append) {
    grid.innerHTML = '';
  }

  components.forEach((comp) => {
    const div = document.createElement('div');
    div.innerHTML = renderComponentCard(comp);
    const card = div.firstElementChild;
    grid.appendChild(card);
  });

  // Update count
  if (countEl) countEl.textContent = STATE.total.toLocaleString();

  // Show/hide Infinite Scroll Spinner or End indicator
  const loaded = STATE.components.length;
  if (loaded < STATE.total) {
    if (spinner) spinner.classList.remove('hidden');
    if (endMsg) endMsg.classList.add('hidden');
  } else {
    if (spinner) spinner.classList.add('hidden');
    if (endMsg && STATE.total > 0) endMsg.classList.remove('hidden');
  }

  attachCardListeners();
}

/** Attach event listeners to newly rendered cards */
function attachCardListeners() {
  const grid = document.getElementById('components-grid');
  if (!grid) return;

  // Only bind events to cards that haven't been bound yet
  grid.querySelectorAll('.component-card:not([data-events-bound="true"])').forEach((card) => {
    card.dataset.eventsBound = 'true';

    // Card click → open detail modal
    card.addEventListener('click', (e) => {
      // Prevent triggering from like button or overlay buttons
      if (e.target.closest('.like-btn') || e.target.closest('.card-copy-btn') || e.target.closest('.card-open-btn')) return;
      const id = card.dataset.id;
      if (id) window.openModal?.(id);
    });

    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.dataset.id;
        if (id) window.openModal?.(id);
      }
    });

    // Quick copy HTML from card overlay
    const copyBtn = card.querySelector('.card-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = copyBtn.dataset.id;
        const comp = STATE.components.find((c) => c.id === id) || findComponentAnywhere(id);
        if (!comp) return;
        const ok = await copyToClipboard(comp.html);
        showToast(ok ? 'HTML copied to clipboard!' : 'Failed to copy', ok ? 'success' : 'error');
      });
    }

    // Like button handlers
    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await handleLike(likeBtn.dataset.id, likeBtn);
      });
    }
  });
}

/**
 * handleLike(id, btn?)
 * Handles liking / unliking a component — optimistic UI + DB call.
 */
function findComponentAnywhere(id) {
  let comp = STATE.components.find((c) => c.id === id) ||
    _localComponents.find((c) => c.id === id);
  if (!comp && window.UIVERSE_DATA) {
    for (const list of Object.values(window.UIVERSE_DATA)) {
      comp = list.find((c) => c.id === id);
      if (comp) break;
    }
  }
  return comp;
}

const _likingInFlight = new Set();

async function handleLike(id, btn) {
  if (!id) return;
  if (_likingInFlight.has(id)) return;
  _likingInFlight.add(id);

  try {
    const comp = findComponentAnywhere(id);
    if (!comp) return;

    // Optimistic update — calculate nextLikes precisely once
    const wasLiked = STATE.likedIds.has(id);
    const willBeLiked = !wasLiked;

    const uniqueComps = new Set();
    const collect = (c) => {
      if (c && c.id === id) uniqueComps.add(c);
    };
    if (comp) uniqueComps.add(comp);
    _localComponents.forEach(collect);
    if (window.UIVERSE_DATA) {
      Object.values(window.UIVERSE_DATA).forEach((list) => list.forEach(collect));
    }
    STATE.components.forEach(collect);

    const baseLikes = typeof comp.likes === 'number' ? comp.likes : 0;
    const nextLikes = Math.max(0, baseLikes + (willBeLiked ? 1 : -1));

    if (willBeLiked) {
      STATE.likedIds.add(id);
    } else {
      STATE.likedIds.delete(id);
    }

    uniqueComps.forEach((c) => {
      c.liked = willBeLiked;
      c.likes = nextLikes;
    });

    persistLikes();

    // Update all matching card buttons on the page
    document.querySelectorAll(`.like-btn[data-id="${id}"]`).forEach((b) => {
      updateLikeButton(b, willBeLiked, nextLikes);
      if (willBeLiked) {
        b.classList.add('pulse-heart');
        setTimeout(() => b.classList.remove('pulse-heart'), 600);
      }
    });

    // Update modal if this component is currently open in the preview modal
    if (STATE.currentModal === id) {
      const modalLikeCount = document.getElementById('modal-likes-count');
      const modalLikeBtn = document.getElementById('modal-like-btn');
      if (modalLikeCount) modalLikeCount.textContent = formatNumber(comp.likes);
      if (modalLikeBtn) {
        const modalHeartIcon = modalLikeBtn.querySelector('i');
        if (modalHeartIcon) {
          modalHeartIcon.className = willBeLiked ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart';
        }
      }
    }

    // Real DB call
    try {
      await likeComponent(id, willBeLiked);
    } catch (err) {
      console.error('[UIForge] Like failed:', err);
      showToast('Could not update like. Try again.', 'error');
      // Rollback
      if (wasLiked) {
        STATE.likedIds.add(id);
        comp.liked = true;
        comp.likes = (comp.likes || 0) + 1;
      } else {
        STATE.likedIds.delete(id);
        comp.liked = false;
        comp.likes = Math.max(0, (comp.likes || 0) - 1);
      }
      persistLikes();
      document.querySelectorAll(`.like-btn[data-id="${id}"]`).forEach((b) => {
        updateLikeButton(b, wasLiked, comp.likes);
      });
      if (STATE.currentModal === id) {
        const modalLikeCount = document.getElementById('modal-likes-count');
        const modalLikeBtn = document.getElementById('modal-like-btn');
        if (modalLikeCount) modalLikeCount.textContent = formatNumber(comp.likes);
        if (modalLikeBtn) {
          const modalHeartIcon = modalLikeBtn.querySelector('i');
          if (modalHeartIcon) {
            modalHeartIcon.className = wasLiked ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart';
          }
        }
      }
    }
  } finally {
    _likingInFlight.delete(id);
  }
}

function updateLikeButton(btn, liked, likes) {
  btn.classList.toggle('liked', liked);
  btn.setAttribute('aria-pressed', liked);
  const icon = btn.querySelector('.like-icon');
  const countSpan = btn.querySelector('.like-count');
  if (icon) icon.className = `${liked ? 'fa-solid' : 'fa-regular'} fa-heart like-icon`;
  if (countSpan) countSpan.textContent = formatNumber(likes);
}


/* ============================================================
   7. MODAL MANAGER
   ============================================================ */

/* --- Upload Modal --- */

function openUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('upload-title')?.focus();
}

function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  // Reset form
  document.getElementById('upload-form')?.reset();
  const errorEl = document.getElementById('upload-error');
  if (errorEl) errorEl.classList.add('hidden');
}


/* ============================================================
   8. DATA LOADING
   ============================================================ */

/**
 * loadComponents(reset)
 * Fetches components from the DB service and renders them.
 * @param {boolean} reset - If true, resets the page and grid.
 */
async function loadComponents(reset = false) {
  if (STATE.isLoading) return;
  STATE.isLoading = true;

  if (reset) {
    STATE.page = 1;
    STATE.components = [];
    const grid = document.getElementById('components-grid');
    if (grid) grid.classList.add('loading');
    const spinner = document.getElementById('infinite-scroll-spinner');
    const endMsg = document.getElementById('infinite-scroll-end');
    if (spinner) spinner.classList.remove('hidden');
    if (endMsg) endMsg.classList.add('hidden');
  }

  try {
    const { data, total } = await fetchComponents({
      category: STATE.activeCategory,
      search: STATE.searchQuery,
      sort: STATE.sort,
      page: STATE.page,
      pageSize: STATE.pageSize,
    });

    STATE.total = total;

    if (reset) {
      STATE.components = data;
    } else {
      STATE.components = [...STATE.components, ...data];
    }

    // Apply persisted likes
    STATE.components.forEach((c) => {
      c.liked = STATE.likedIds.has(c.id);
    });

    renderGrid(data, !reset);

    const grid = document.getElementById('components-grid');
    if (grid) grid.classList.remove('loading');

  } catch (err) {
    console.error('[UIForge] fetchComponents failed:', err);
    showToast('Failed to load components. Please try again.', 'error');
  } finally {
    STATE.isLoading = false;
  }
}


/* ============================================================
   9. EVENT HANDLERS
   ============================================================ */

function initEventHandlers() {

  /* --- Search --- */
  const debouncedSearch = debounce((query) => {
    STATE.searchQuery = query.trim();
    STATE.page = 1;
    loadComponents(true);
  }, 400);

  ['search-input', 'search-input-mobile'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => debouncedSearch(e.target.value));
      el.addEventListener('search', (e) => debouncedSearch(e.target.value)); // clear button
    }
  });

  /* --- Sidebar Favorites --- */
  document.getElementById('sidebar-favorites-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    STATE.activeCategory = 'Favorites';
    STATE.page = 1;

    // Update Main Content Title
    const titleEl = document.getElementById('current-category-title');
    if (titleEl) titleEl.textContent = 'Your Favorite Components';

    renderCategoryFilters(); // Re-render to clear active category pill
    loadComponents(true);

    // Auto-close sidebar on mobile
    if (window.innerWidth < 1024) {
      document.getElementById('sidebar-close-btn')?.click();
    }
  });

  /* --- Sort Select --- */
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    STATE.sort = e.target.value;
    loadComponents(true);
  });

  /* --- Infinite Scroll Observer --- */
  const sentinel = document.getElementById('infinite-scroll-sentinel');
  if (sentinel) {
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !STATE.isLoading) {
          if (STATE.components.length < STATE.total) {
            STATE.page++;
            loadComponents(false);
          }
        }
      });
    }, { rootMargin: '400px' });
    scrollObserver.observe(sentinel);
  }

  /* --- Clear Search (empty state) --- */
  document.getElementById('clear-search-btn')?.addEventListener('click', () => {
    STATE.searchQuery = '';
    STATE.activeCategory = 'All';
    ['search-input', 'search-input-mobile'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    // Reset category pills
    document.querySelectorAll('.filter-pill').forEach((b) => {
      b.classList.toggle('active', b.dataset.category === 'All');
    });
    loadComponents(true);
  });

  /* --- View Toggle --- */
  document.getElementById('grid-view-btn')?.addEventListener('click', () => {
    STATE.isGridView = true;
    document.getElementById('main-content')?.classList.remove('list-view');
    document.getElementById('grid-view-btn')?.classList.add('bg-brand-600', 'text-white');
    document.getElementById('grid-view-btn')?.classList.remove('text-gray-400');
    document.getElementById('list-view-btn')?.classList.remove('bg-brand-600', 'text-white');
    document.getElementById('list-view-btn')?.classList.add('text-gray-400');
    const grid = document.getElementById('components-grid');
    if (grid) {
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-all duration-300';
    }
  });

  document.getElementById('list-view-btn')?.addEventListener('click', () => {
    STATE.isGridView = false;
    document.getElementById('main-content')?.classList.add('list-view');
    document.getElementById('list-view-btn')?.classList.add('bg-brand-600', 'text-white');
    document.getElementById('list-view-btn')?.classList.remove('text-gray-400');
    document.getElementById('grid-view-btn')?.classList.remove('bg-brand-600', 'text-white');
    document.getElementById('grid-view-btn')?.classList.add('text-gray-400');
    const grid = document.getElementById('components-grid');
    if (grid) {
      grid.className = 'grid grid-cols-1 gap-5 transition-all duration-300';
    }
  });

  /* --- Upload Modal --- */
  ['open-upload-btn', 'hero-upload-btn'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', openUploadModal);
  });

  /* --- Sign In Modal --- */
  const signinModal = document.getElementById('signin-modal');
  const signinBackdrop = document.getElementById('signin-backdrop');
  const signinCloseBtn = document.getElementById('signin-close-btn');
  const authTabSignin = document.getElementById('auth-tab-signin');
  const authTabSignup = document.getElementById('auth-tab-signup');
  const authNameField = document.getElementById('auth-name-field');
  const authSubmitText = document.getElementById('auth-submit-text');
  const signinTitle = document.getElementById('signin-modal-title');
  const signinDesc = document.getElementById('signin-modal-desc');

  let isSignUpMode = false;

  function setAuthMode(isSignUp) {
    isSignUpMode = isSignUp;
    if (isSignUp) {
      authTabSignup.classList.replace('text-gray-400', 'text-white');
      authTabSignup.classList.replace('border-transparent', 'border-brand-500');
      authTabSignup.classList.add('font-bold');
      authTabSignup.classList.remove('font-medium');

      authTabSignin.classList.replace('text-white', 'text-gray-400');
      authTabSignin.classList.replace('border-brand-500', 'border-transparent');
      authTabSignin.classList.remove('font-bold');
      authTabSignin.classList.add('font-medium');

      authNameField.classList.remove('hidden');
      document.getElementById('signin-name').required = true;
      authSubmitText.textContent = 'Create Account';
      signinTitle.textContent = 'Create an Account';
      signinDesc.textContent = 'Join UIForge to share and save components';
    } else {
      authTabSignin.classList.replace('text-gray-400', 'text-white');
      authTabSignin.classList.replace('border-transparent', 'border-brand-500');
      authTabSignin.classList.add('font-bold');
      authTabSignin.classList.remove('font-medium');

      authTabSignup.classList.replace('text-white', 'text-gray-400');
      authTabSignup.classList.replace('border-brand-500', 'border-transparent');
      authTabSignup.classList.remove('font-bold');
      authTabSignup.classList.add('font-medium');

      authNameField.classList.add('hidden');
      document.getElementById('signin-name').required = false;
      authSubmitText.textContent = 'Sign In';
      signinTitle.textContent = 'Welcome Back';
      signinDesc.textContent = 'Sign in to like and save components';
    }
  }

  if (authTabSignin) authTabSignin.addEventListener('click', () => setAuthMode(false));
  if (authTabSignup) authTabSignup.addEventListener('click', () => setAuthMode(true));

  function openSigninModal() {
    if (signinModal) {
      signinModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      setAuthMode(false); // Default to sign in
    }
  }

  function closeSigninModal() {
    if (signinModal) {
      signinModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function simulateLogin(provider) {
    closeSigninModal();
    showToast(`Successfully logged in with ${provider}! (Demo)`, 'success');
    // Change Sign In button to an Avatar
    const topSignInBtn = document.getElementById('signin-btn');
    if (topSignInBtn) {
      topSignInBtn.innerHTML = `
        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-brand-glow text-white font-bold text-sm cursor-pointer">
          <i class="fa-solid fa-user"></i>
        </div>
      `;
      topSignInBtn.className = "flex items-center transition-transform hover:scale-105";
      topSignInBtn.removeAttribute('id'); // Remove id to prevent opening modal again
    }
  }

  document.getElementById('signin-btn')?.addEventListener('click', openSigninModal);
  if (signinCloseBtn) signinCloseBtn.addEventListener('click', closeSigninModal);
  if (signinBackdrop) signinBackdrop.addEventListener('click', closeSigninModal);

  document.getElementById('signin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    simulateLogin('Email');
  });

  document.getElementById('google-auth-btn')?.addEventListener('click', () => simulateLogin('Google'));
  document.getElementById('github-auth-btn')?.addEventListener('click', () => simulateLogin('GitHub'));

  document.getElementById('upload-close-btn')?.addEventListener('click', closeUploadModal);
  document.getElementById('upload-backdrop')?.addEventListener('click', closeUploadModal);

  // Upload form submission
  document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleUpload();
  });

  /* --- Hero Explore Button --- */
  document.getElementById('hero-explore-btn')?.addEventListener('click', () => {
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
  });

  /* --- Keyboard: Escape closes modals --- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('preview-modal')?.classList.contains('hidden')) {
        window.closeModal?.();
      } else if (!document.getElementById('upload-modal')?.classList.contains('hidden')) {
        closeUploadModal();
      }
    }
  });

  /* --- Navbar scroll shadow effect --- */
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    navbar.style.boxShadow = scrollY > 10
      ? '0 4px 32px rgba(0,0,0,0.4)'
      : 'none';
    lastScroll = scrollY;
  }, { passive: true });
}

/* ---- Upload Handler ---- */
async function handleUpload() {
  const titleEl = document.getElementById('upload-title');
  const htmlEl = document.getElementById('upload-html');
  const cssEl = document.getElementById('upload-css');
  const authorEl = document.getElementById('upload-author');
  const categoryEl = document.getElementById('upload-category');
  const errorEl = document.getElementById('upload-error');
  const errorText = document.getElementById('upload-error-text');
  const submitBtn = document.getElementById('upload-submit-btn');
  const btnIcon = document.getElementById('upload-btn-icon');
  const btnText = document.getElementById('upload-btn-text');

  // Clear errors
  errorEl?.classList.add('hidden');
  [titleEl, htmlEl].forEach((el) => el?.classList.remove('input-error'));

  // Validate
  if (!titleEl?.value.trim()) {
    titleEl?.classList.add('input-error');
    titleEl?.focus();
    if (errorText) errorText.textContent = 'Component title is required.';
    errorEl?.classList.remove('hidden');
    return;
  }

  if (!htmlEl?.value.trim()) {
    htmlEl?.classList.add('input-error');
    htmlEl?.focus();
    if (errorText) errorText.textContent = 'HTML code is required.';
    errorEl?.classList.remove('hidden');
    return;
  }

  // Loading state
  if (submitBtn) submitBtn.disabled = true;
  if (btnIcon) btnIcon.className = 'fa-solid fa-circle-notch spin';
  if (btnText) btnText.textContent = 'Publishing...';

  try {
    const newComp = await uploadComponent({
      title: titleEl.value.trim(),
      html: htmlEl.value.trim(),
      css: cssEl?.value.trim() || '',
      author: authorEl?.value.trim() || 'Anonymous',
      category: categoryEl?.value || 'Other',
    });

    // Add to live state immediately
    STATE.components.unshift(newComp);
    STATE.total++;

    closeUploadModal();
    showToast(`"${newComp.title}" published successfully!`, 'success');

    // Re-render so new card appears at top
    loadComponents(true);

  } catch (err) {
    console.error('[UIForge] Upload failed:', err);
    if (errorText) errorText.textContent = 'Upload failed. Please try again.';
    errorEl?.classList.remove('hidden');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnIcon) btnIcon.className = 'fa-solid fa-cloud-arrow-up';
    if (btnText) btnText.textContent = 'Publish Component';
  }
}


/* ============================================================
   10. INITIALISATION
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  console.log(`
  ██╗   ██╗██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██║   ██║██║██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  ██║   ██║██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗
  ██║   ██║██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
  ╚██████╔╝██║██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
   ╚═════╝ ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  UI/UX Component Sharing Platform v1.0
  DB Provider: ${CONFIG.DB_PROVIDER}
  Ready to go! 🚀
  `);

  // Seed the local "database" (already loaded from data/initial_components.js)
  _localComponents = DUMMY_DATA.map((comp) => ({
    ...comp,
    // Restore liked state from STATE.likedIds
    liked: STATE.likedIds.has(comp.id),
  }));
  applyStoredCodeEdits(_localComponents);

  // Render category filter pills
  renderCategoryFilters();

  // Attach all event handlers
  initEventHandlers();

  // Load initial components (with simulated delay for skeleton effect)
  loadComponents(true);

  // Preload all Uiverse categories in the background so infinite scroll is instant
  loadAllCategories();

  // Update hero stat counter from Uiverse manifest
  if (window.UIVERSE_MANIFEST) {
    const compCounter = document.querySelector('.counter[data-target="6800"]');
    if (compCounter) {
      compCounter.dataset.target = window.UIVERSE_MANIFEST.total + _localComponents.length;
    }
  }

  // Animate hero stat counters (observe when visible)
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach((el) => counterObserver.observe(el));

  // Lazy load card iframes (use IntersectionObserver)
  // Note: iframes use srcdoc so they load inline; this just avoids painting off-screen
  const iframeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const iframe = entry.target;
      if (entry.isIntersecting && iframe.dataset.srcdoc) {
        iframe.srcdoc = iframe.dataset.srcdoc;
        iframeObserver.unobserve(iframe);
      }
    });
  }, { rootMargin: '200px' });

  // Will attach to newly created iframes in renderGrid
  // (They use inline srcdoc already, observer is here for future lazy loading)

  // --- MODAL LOGIC ---
  // --- MODAL LOGIC (UIVERSE FULL-SCREEN PREVIEW) ---
  const modal = document.getElementById('preview-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalAuthor = document.getElementById('modal-author');
  const modalCategoryPrefix = document.getElementById('modal-category-prefix');
  const modalAvatar = document.getElementById('modal-author-avatar');
  const modalLikesCount = document.getElementById('modal-likes-count');
  const modalViewsCount = document.getElementById('modal-views-count');
  const modalLikeBtn = document.getElementById('modal-like-btn');
  const modalIframe = document.getElementById('modal-preview-iframe');
  const modalCodeEditor = document.getElementById('modal-code-editor');
  const modalLineNumbers = document.getElementById('modal-line-numbers');
  const modalSyntaxHighlight = document.getElementById('modal-syntax-highlight');
  const modalSyntaxCode = document.getElementById('modal-syntax-code');
  const modalColorPicker = document.getElementById('modal-code-color-picker');
  const modalColorValue = document.getElementById('modal-code-color-value');
  const modalCodeLines = document.getElementById('modal-code-lines');
  const modalStatusText = document.getElementById('modal-status-text');
  const tabBtns = document.querySelectorAll('#modal-tabs .tab-btn');
  const copyBtn = document.getElementById('modal-copy-btn');
  const resetBtn = document.getElementById('modal-reset-btn');
  const canvasWrapper = document.getElementById('preview-canvas-wrapper');
  const bgHexLabel = document.getElementById('preview-bg-hex');
  const themeToggleBtn = document.getElementById('preview-theme-toggle');
  const toggleThumb = document.getElementById('preview-toggle-thumb');
  const toggleIcon = document.getElementById('preview-toggle-icon');
  const bgPicker = document.getElementById('preview-bg-picker');
  const colorIndicator = document.getElementById('preview-color-indicator');

  let currentModalComponentId = null;
  let currentRawHtml = '';
  let currentRawCss = '';
  let savedRawHtml = '';
  let savedRawCss = '';
  let activeEditorTab = 'css';
  let activeColorRange = null;
  let previewUpdateTimer = null;
  let currentCanvasBg = '#212121';
  let isDarkCanvas = true;

  function findAnyComp(id) {
    return findComponentAnywhere(id);
  }

  function setModalStatus(status, type = 'saved') {
    if (!modalStatusText) return;
    if (type === 'unsaved') {
      modalStatusText.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1.5"></span>Modified (Live)';
      modalStatusText.className = 'text-amber-400/90 font-medium select-none';
    } else {
      modalStatusText.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5"></span>Live Preview';
      modalStatusText.className = 'text-emerald-400/90 font-medium select-none';
    }
  }

  function getActiveCode() {
    return activeEditorTab === 'html' ? currentRawHtml : currentRawCss;
  }

  function highlightCss(code) {
    return escapeHtml(code).replace(
      /(\/\*[\s\S]*?\*\/)|(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|ms|s|deg|fr)?\b)|(\b(?:@media|@keyframes|from|to|var|calc|rgba?|hsl|linear-gradient|transform|transition|display|flex|grid|absolute|relative|fixed|none|inherit|important)\b)|([a-zA-Z-]+)(?=\s*:)|(\.[\w-]+|#[\w-]+)/g,
      (match, comment, color, number, keyword, property, selector) => {
        if (comment) return `<span class="syntax-comment">${comment}</span>`;
        if (color) return `<span class="syntax-color">${color}</span>`;
        if (number) return `<span class="syntax-number">${number}</span>`;
        if (keyword) return `<span class="syntax-function">${keyword}</span>`;
        if (property) return `<span class="syntax-property">${property}</span>`;
        if (selector) return `<span class="syntax-selector">${selector}</span>`;
        return match;
      }
    );
  }

  function highlightHtml(code) {
    return escapeHtml(code).replace(
      /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([\w-]+)([\s\S]*?)(&gt;)/g,
      (match, comment, open, tagName, attributes, close) => {
        if (comment) return `<span class="syntax-comment">${comment}</span>`;
        const highlightedAttributes = attributes.replace(
          /([\w:-]+)(=)(&quot;.*?&quot;|&#39;.*?&#39;)/g,
          (_, attr, equals, value) => `<span class="syntax-attr">${attr}</span>${equals}<span class="syntax-string">${value}</span>`
        );
        return `<span class="syntax-tag">${open}</span><span class="syntax-tag-name">${tagName}</span>${highlightedAttributes}<span class="syntax-tag">${close}</span>`;
      }
    );
  }

  function renderSyntaxHighlight() {
    if (!modalSyntaxCode) return;
    const code = getActiveCode();
    modalSyntaxCode.innerHTML = activeEditorTab === 'html' ? highlightHtml(code) : highlightCss(code);
  }

  function getColorTokenAtCaret() {
    if (activeEditorTab !== 'css' || !modalCodeEditor) return null;
    const cursor = modalCodeEditor.selectionStart;
    const colorMatcher = /#[0-9a-fA-F]{3,8}\b/g;
    let match;
    while ((match = colorMatcher.exec(currentRawCss))) {
      const start = match.index;
      const end = start + match[0].length;
      if (cursor >= start && cursor <= end) return { value: match[0], start, end };
    }
    return null;
  }

  function hexForColorInput(hex) {
    const raw = hex.slice(1);
    if (raw.length === 3 || raw.length === 4) {
      return `#${raw.slice(0, 3).split('').map((char) => char + char).join('')}`;
    }
    return `#${raw.slice(0, 6)}`;
  }

  function syncColorControls() {
    activeColorRange = getColorTokenAtCaret();
    const enabled = Boolean(activeColorRange);
    if (modalColorPicker) modalColorPicker.disabled = !enabled;
    if (modalColorValue) modalColorValue.disabled = !enabled;
    if (!enabled) {
      if (modalColorValue) modalColorValue.value = '—';
      return;
    }
    const displayValue = activeColorRange.value.toUpperCase();
    if (modalColorPicker) modalColorPicker.value = hexForColorInput(activeColorRange.value);
    if (modalColorValue) modalColorValue.value = displayValue;
  }

  function syncEditorScroll() {
    if (!modalCodeEditor) return;
    const { scrollTop, scrollLeft } = modalCodeEditor;
    if (modalSyntaxHighlight) modalSyntaxHighlight.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    if (modalLineNumbers) modalLineNumbers.style.transform = `translateY(${-scrollTop}px)`;
  }

  function replaceActiveColor(nextColor) {
    if (!activeColorRange || !/^#[0-9a-fA-F]{6}$/.test(nextColor)) return;
    currentRawCss = `${currentRawCss.slice(0, activeColorRange.start)}${nextColor}${currentRawCss.slice(activeColorRange.end)}`;
    const nextRange = {
      value: nextColor,
      start: activeColorRange.start,
      end: activeColorRange.start + nextColor.length,
    };
    renderEditor();
    modalCodeEditor?.setSelectionRange(nextRange.end, nextRange.end);
    activeColorRange = nextRange;
    if (modalColorPicker) {
      modalColorPicker.disabled = false;
      modalColorPicker.value = nextColor;
    }
    if (modalColorValue) {
      modalColorValue.disabled = false;
      modalColorValue.value = nextColor.toUpperCase();
    }
    setModalStatus('', 'unsaved');
    clearTimeout(previewUpdateTimer);
    previewUpdateTimer = setTimeout(refreshModalPreview, 180);
  }

  function updateEditorMetrics() {
    const code = getActiveCode();
    const lineCount = Math.max(1, code.split('\n').length);
    if (modalLineNumbers) {
      modalLineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join('\n');
    }
    if (modalCodeLines) modalCodeLines.textContent = `${lineCount} line${lineCount === 1 ? '' : 's'}`;
    renderSyntaxHighlight();
  }

  function isModalDirty() {
    return currentRawHtml !== savedRawHtml || currentRawCss !== savedRawCss;
  }

  function refreshModalPreview() {
    if (!modalIframe || !currentModalComponentId) return;
    const comp = findAnyComp(currentModalComponentId);
    modalIframe.srcdoc = buildPreviewSrcDoc(
      currentRawHtml,
      currentRawCss,
      comp?.category || '',
      true,
      currentCanvasBg
    );
  }

  function renderEditor() {
    if (!modalCodeEditor) return;
    modalCodeEditor.value = getActiveCode();
    updateEditorMetrics();
    syncEditorScroll();
    syncColorControls();
    modalCodeEditor.focus({ preventScroll: true });
  }

  function formatCssCode(css) {
    if (!css) return '';
    return css.split('\n').map((line, idx) => {
      const formatted = line.replace(
        /(\/\*[\s\S]*?\*\/)|((?:['"])(?:(?!\2)[^\\]|\\.)*\2)|(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|ms|s|deg|fr)?\b)|(\b(?:calc|var|cubic-bezier|rgba?|linear-gradient|flex|relative|absolute|fixed|center|none|inline|block|border-box)\b)|([a-zA-Z0-9_-]+(?=\s*:))|(\.[a-zA-Z0-9_-]+)/g,
        (match, comment, str, hex, num, kw, prop, sel) => {
          if (comment) return `<span class="text-gray-500 italic">${escapeHtml(comment)}</span>`;
          if (str) return `<span class="text-emerald-300">${escapeHtml(str)}</span>`;
          if (hex) return `<span class="text-pink-400 font-medium">${hex}</span>`;
          if (num) return `<span class="text-orange-300 font-medium">${num}</span>`;
          if (kw) return `<span class="text-purple-400">${kw}</span>`;
          if (prop) return `<span class="text-sky-300">${prop}</span>`;
          if (sel) return `<span class="text-blue-400 font-semibold">${sel}</span>`;
          return escapeHtml(match);
        }
      );

      return `
        <div class="code-line">
          <span class="line-num">${idx + 1}</span>
          <span class="line-code">${formatted || '&nbsp;'}</span>
        </div>
      `;
    }).join('');
  }

  function formatHtmlCode(html) {
    if (!html) return '';
    return html.split('\n').map((line, idx) => {
      const formatted = line.replace(
        /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+(?==))|(=(?:".*?"|'.*?'))|(>)/g,
        (match, comment, tag, attr, val, gt) => {
          if (comment) return `<span class="text-gray-500 italic">${escapeHtml(comment)}</span>`;
          if (tag) return `<span class="text-rose-400 font-medium">${escapeHtml(tag)}</span>`;
          if (attr) return `<span class="text-amber-300">${attr}</span>`;
          if (val) {
            const quote = val[1];
            const content = val.slice(2, -1);
            return `=${quote}<span class="text-emerald-300">${escapeHtml(content)}</span>${quote}`;
          }
          if (gt) return `<span class="text-gray-400">&gt;</span>`;
          return escapeHtml(match);
        }
      );

      return `
        <div class="code-line">
          <span class="line-num">${idx + 1}</span>
          <span class="line-code">${formatted || '&nbsp;'}</span>
        </div>
      `;
    }).join('');
  }

  function updateCanvasBg(color, dark = true, shouldRefresh = true) {
    currentCanvasBg = color;
    isDarkCanvas = dark;
    if (canvasWrapper) canvasWrapper.style.backgroundColor = color;
    if (bgHexLabel) bgHexLabel.textContent = color.toUpperCase();
    if (colorIndicator) colorIndicator.style.backgroundColor = color;
    if (bgPicker) bgPicker.value = color;

    if (toggleThumb && toggleIcon) {
      if (dark) {
        toggleThumb.classList.add('translate-x-5');
        toggleThumb.classList.remove('translate-x-0');
        toggleIcon.className = 'fa-solid fa-sun text-[8px]';
      } else {
        toggleThumb.classList.remove('translate-x-5');
        toggleThumb.classList.add('translate-x-0');
        toggleIcon.className = 'fa-solid fa-moon text-[8px]';
      }
    }

    if (shouldRefresh) {
      refreshModalPreview();
    }
  }

  function openModal(id) {
    const comp = findAnyComp(id);
    if (!comp) return;
    currentModalComponentId = id;
    STATE.currentModal = id;

    // 1. Process and set component code state FIRST so preview is always current
    let rawHtml = comp.html || '';
    let rawCss = comp.css || '';

    if (typeof html_beautify !== 'undefined') {
      try {
        rawHtml = html_beautify(rawHtml, { indent_size: 2 });
      } catch (e) { console.error('html_beautify failed:', e); }
    }
    if (typeof css_beautify !== 'undefined') {
      try {
        rawCss = css_beautify(rawCss, { indent_size: 2 });
      } catch (e) { console.error('css_beautify failed:', e); }
    }

    currentRawHtml = rawHtml;
    currentRawCss = rawCss;
    savedRawHtml = currentRawHtml;
    savedRawCss = currentRawCss;

    // 2. Increment views
    if (typeof incrementViews === 'function') incrementViews(id);
    comp.views = (comp.views || 0) + 1;

    // 3. Header info
    if (modalCategoryPrefix) modalCategoryPrefix.textContent = comp.category || 'Component';
    if (modalAuthor) modalAuthor.textContent = '@' + comp.author;
    if (modalAvatar) modalAvatar.textContent = getInitials(comp.author);
    if (modalViewsCount) modalViewsCount.textContent = formatNumber(comp.views);
    if (modalLikesCount) modalLikesCount.textContent = formatNumber(comp.likes || 0);

    // 4. Set liked state
    const isLiked = STATE.likedIds.has(id);
    if (modalLikeBtn) {
      const icon = modalLikeBtn.querySelector('i');
      if (icon) icon.className = isLiked ? 'fa-solid fa-heart text-pink-500' : 'fa-regular fa-heart';
    }

    // 5. Canvas background (update UI without prematurely refreshing preview)
    updateCanvasBg('#212121', true, false);

    // 6. Default to CSS tab
    switchTab('css');

    // 7. Show modal FIRST so iframe is in rendered DOM before loading content
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setModalStatus('', 'saved');
    refreshModalPreview();
    requestAnimationFrame(renderEditor);
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (modalIframe) modalIframe.srcdoc = '';
    currentModalComponentId = null;
    currentRawHtml = '';
    currentRawCss = '';
    savedRawHtml = '';
    savedRawCss = '';
    if (previewUpdateTimer) clearTimeout(previewUpdateTimer);
    STATE.currentModal = null;
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  function switchTab(tabId) {
    if (!tabBtns.length) return;
    tabBtns.forEach(b => {
      const active = b.dataset.tab === tabId;
      b.classList.toggle('active', active);
      if (active) {
        b.classList.add('bg-[#27272a]', 'text-white', 'shadow-sm');
        b.classList.remove('text-gray-400');
      } else {
        b.classList.remove('bg-[#27272a]', 'text-white', 'shadow-sm');
        b.classList.add('text-gray-400');
      }
    });

    activeEditorTab = tabId;
    renderEditor();
  }

  // Bind close event
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  // Bind theme toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (isDarkCanvas) {
        updateCanvasBg('#f3f4f6', false);
      } else {
        updateCanvasBg('#212121', true);
      }
    });
  }

  // Bind color picker
  if (bgPicker) {
    bgPicker.addEventListener('input', (e) => {
      const val = e.target.value;
      updateCanvasBg(val, true);
    });
  }

  // Bind tab events
  tabBtns.forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  if (modalCodeEditor) {
    modalCodeEditor.addEventListener('input', () => {
      if (activeEditorTab === 'html') currentRawHtml = modalCodeEditor.value;
      else currentRawCss = modalCodeEditor.value;
      updateEditorMetrics();
      syncColorControls();
      setModalStatus('', 'unsaved');
      clearTimeout(previewUpdateTimer);
      previewUpdateTimer = setTimeout(refreshModalPreview, 180);
    });

    modalCodeEditor.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = modalCodeEditor.selectionStart;
        const end = modalCodeEditor.selectionEnd;
        modalCodeEditor.setRangeText('  ', start, end, 'end');
        modalCodeEditor.dispatchEvent(new Event('input'));
      }
    });

    modalCodeEditor.addEventListener('scroll', syncEditorScroll);
    modalCodeEditor.addEventListener('click', syncColorControls);
    modalCodeEditor.addEventListener('keyup', syncColorControls);
    modalCodeEditor.addEventListener('select', syncColorControls);
  }

  if (modalColorPicker) {
    modalColorPicker.addEventListener('input', () => replaceActiveColor(modalColorPicker.value));
  }

  if (modalColorValue) {
    modalColorValue.addEventListener('change', () => {
      const value = modalColorValue.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(value)) replaceActiveColor(value);
      else syncColorControls();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentRawHtml = savedRawHtml;
      currentRawCss = savedRawCss;
      renderEditor();
      refreshModalPreview();
      setModalStatus('', 'saved');
      showToast('Code restored to original', 'info');
    });
  }

  // Bind copy event
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const activeTabEl = document.querySelector('#modal-tabs .tab-btn.active');
      const activeTab = activeTabEl ? activeTabEl.dataset.tab : 'css';
      const textToCopy = activeTab === 'html' ? currentRawHtml : currentRawCss;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check text-green-400"></i><span>Copied!</span>';
        setTimeout(() => copyBtn.innerHTML = originalHtml, 2000);
      });
    });
  }

  // Delegate clicks on Grid for "Preview" buttons
  const gridEl = document.getElementById('components-grid');
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const openBtn = e.target.closest('.card-open-btn');
      if (openBtn) {
        e.stopPropagation();
        openModal(openBtn.dataset.id);
      }
    });
  }

  // Modal Like button — handleLike() already keeps the modal's heart icon
  // and like count in sync (via STATE.currentModal), so this just needs to
  // trigger it and pass along the matching card button (if any) to animate.
  if (modalLikeBtn) {
    modalLikeBtn.addEventListener('click', async () => {
      if (!currentModalComponentId) return;
      const cardBtn = document.querySelector(`.like-btn[data-id="${currentModalComponentId}"]`);
      await handleLike(currentModalComponentId, cardBtn);
    });
  }

  // --- SIDEBAR LOGIC ---
  const sidebar = document.getElementById('main-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebarOpenBtn = document.getElementById('sidebar-open-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebarBackdrop.classList.remove('hidden', 'pointer-events-none');
    sidebarBackdrop.classList.add('opacity-100');
    // Sync hamburgers
    if (sidebarOpenBtn) sidebarOpenBtn.querySelector('input').checked = true;
    if (sidebarCloseBtn) sidebarCloseBtn.querySelector('input').checked = true;
  }

  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarBackdrop.classList.remove('opacity-100');
    sidebarBackdrop.classList.add('pointer-events-none');
    setTimeout(() => {
      if (sidebar.classList.contains('-translate-x-full')) sidebarBackdrop.classList.add('hidden');
    }, 300);
    // Sync hamburgers
    if (sidebarOpenBtn) sidebarOpenBtn.querySelector('input').checked = false;
    if (sidebarCloseBtn) sidebarCloseBtn.querySelector('input').checked = false;
  }

  if (sidebarOpenBtn) sidebarOpenBtn.addEventListener('change', (e) => e.target.checked ? openSidebar() : closeSidebar());
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('change', (e) => !e.target.checked ? closeSidebar() : openSidebar());
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  // Bind Upload button inside Sidebar
  const sidebarUploadBtn = document.getElementById('sidebar-upload-btn');
  if (sidebarUploadBtn) {
    sidebarUploadBtn.addEventListener('click', () => {
      closeSidebar();
      const uploadModal = document.getElementById('upload-modal');
      if (uploadModal) {
        uploadModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  // --- FIREBASE AUTHENTICATION LOGIC ---
  const signinBtn = document.getElementById('signin-btn');
  const userMenu = document.getElementById('user-menu');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  const userMenuIcon = document.getElementById('user-menu-icon');
  const userNameEl = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');
  const userAvatarPlaceholder = document.getElementById('user-avatar-placeholder');
  const signoutBtn = document.getElementById('signout-btn');
  const googleAuthBtn = document.getElementById('google-auth-btn');
  const githubAuthBtn = document.getElementById('github-auth-btn');
  const signinModal = document.getElementById('signin-modal');
  const signinCloseBtn = document.getElementById('signin-close-btn');

  // Initialize Firebase (if not already initialized)
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
      firebase.initializeApp(CONFIG.FIREBASE);
    } catch (e) {
      console.error("Firebase init error:", e);
    }
  }

  if (typeof firebase !== 'undefined') {
    const auth = firebase.auth();

    // Toggle dropdown
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = !userDropdown.classList.contains('opacity-0');
        if (isExpanded) {
          userDropdown.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
          userMenuIcon.classList.remove('rotate-180');
        } else {
          userDropdown.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
          userMenuIcon.classList.add('rotate-180');
        }
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (userDropdown && !userDropdown.classList.contains('opacity-0')) {
        userDropdown.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        userMenuIcon.classList.remove('rotate-180');
      }
    });

    // Auth State Listener
    auth.onAuthStateChanged((user) => {
      if (user) {
        // Logged in
        if (signinBtn) signinBtn.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        
        // Update User Info
        if (userNameEl) userNameEl.textContent = user.displayName || user.email.split('@')[0];
        if (user.photoURL) {
          if (userAvatar) {
            userAvatar.src = user.photoURL;
            userAvatar.classList.remove('hidden');
          }
          if (userAvatarPlaceholder) userAvatarPlaceholder.classList.add('hidden');
        } else {
          if (userAvatarPlaceholder) {
            userAvatarPlaceholder.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
            userAvatarPlaceholder.classList.remove('hidden');
          }
          if (userAvatar) userAvatar.classList.add('hidden');
        }
      } else {
        // Logged out
        if (signinBtn) signinBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
      }
    });

    // Open Signin Modal
    if (signinBtn) {
      signinBtn.addEventListener('click', () => {
        if (signinModal) {
          signinModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    // Close Signin Modal
    const closeSigninModal = () => {
      if (signinModal) {
        signinModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    };

    if (signinCloseBtn) {
      signinCloseBtn.addEventListener('click', closeSigninModal);
    }
    
    // Close modal when clicking backdrop
    const signinBackdrop = document.getElementById('signin-backdrop');
    if (signinBackdrop) {
      signinBackdrop.addEventListener('click', closeSigninModal);
    }

    // Generic Toast Function
    const showToast = (message, type) => {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up flex items-center gap-3 ${type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-surface-700 border border-white/10 text-white'}`;
      toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> <span>${message}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };

    // Google Login
    if (googleAuthBtn) {
      googleAuthBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then((result) => {
            closeSigninModal();
            showToast('Signed in successfully!', 'success');
          })
          .catch((error) => {
            console.error(error);
            alert('Login failed: ' + error.message);
          });
      });
    }

    // GitHub Login
    if (githubAuthBtn) {
      githubAuthBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GithubAuthProvider();
        auth.signInWithPopup(provider)
          .then((result) => {
            closeSigninModal();
            showToast('Signed in successfully!', 'success');
          })
          .catch((error) => {
            console.error(error);
            alert('Login failed: ' + error.message);
          });
      });
    }

    // Sign Out
    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
          showToast('Signed out successfully.', 'info');
        }).catch((error) => {
          console.error(error);
        });
      });
    }
  } else {
    console.warn("[UIForge] Firebase SDK not loaded, authentication disabled.");
  }

  console.log('[UIForge] Initialised successfully.');
});
