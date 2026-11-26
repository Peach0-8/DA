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
    apiKey: "AIzaSyAq5F5yX27FPNlsE9yDNTxbRxCWfVPENtM",
    authDomain: "haaaa-c869e.firebaseapp.com",
    databaseURL: "https://haaaa-c869e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "haaaa-c869e",
    storageBucket: "haaaa-c869e.firebasestorage.app",
    messagingSenderId: "704016186149",
    appId: "1:704016186149:web:02760a62fe1b1748e778cc"
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
  if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(CONFIG.FIREBASE);
      }
      _firestoreDB = firebase.firestore();
      return _firestoreDB;
    } catch (e) {
      console.warn('[UIForge] Firestore init error:', e);
    }
  }
  return null;
}

let _realtimeDB = null;
function getRealtimeDB() {
  if (_realtimeDB) return _realtimeDB;
  if (typeof firebase !== 'undefined' && typeof firebase.database === 'function') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(CONFIG.FIREBASE);
      }
      _realtimeDB = firebase.database();
      return _realtimeDB;
    } catch (e) {
      console.warn('[UIForge] Realtime Database init error:', e);
    }
  }
  return null;
}

/** Save component to Firebase so EVERYONE in the community can see it */
async function saveComponentToCloud(component) {
  const payload = {
    id: component.id,
    title: component.title || 'Untitled',
    html: component.html || '',
    css: component.css || '',
    author: component.author || 'Anonymous',
    authorEmail: component.authorEmail || '',
    userId: component.userId || '',
    category: component.category || 'Other',
    likes: component.likes || 0,
    views: component.views || 0,
    createdAt: component.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Try Firestore
  const db = getFirestoreDB();
  if (db) {
    try {
      await db.collection('components').doc(component.id).set(payload);
      console.log('[UIForge] Uploaded to Firestore:', component.id);
    } catch (e) {
      console.warn('[UIForge] Firestore write failed:', e);
    }
  }

  // 2. Try Realtime Database (as fallback or mirror)
  const rtdb = getRealtimeDB();
  if (rtdb) {
    try {
      await rtdb.ref('components/' + component.id).set(payload);
      console.log('[UIForge] Uploaded to Realtime Database:', component.id);
    } catch (e) {
      const msg = e ? (e.message || String(e)) : '';
      if (!msg.includes('permission_denied') && !msg.includes('PERMISSION_DENIED')) {
        console.warn('[UIForge] Realtime DB write failed:', e);
      }
    }
  }
}

/** Delete component from cloud */
async function deleteComponentFromCloud(id) {
  const db = getFirestoreDB();
  if (db) {
    try {
      await db.collection('components').doc(id).delete();
      console.log('[UIForge] Deleted from Firestore:', id);
    } catch (e) {
      console.warn('[UIForge] Firestore delete failed:', e);
    }
  }
  const rtdb = getRealtimeDB();
  if (rtdb) {
    try {
      await rtdb.ref('components/' + id).remove();
      console.log('[UIForge] Deleted from Realtime DB:', id);
    } catch (e) {
      const msg = e ? (e.message || String(e)) : '';
      if (!msg.includes('permission_denied') && !msg.includes('PERMISSION_DENIED')) {
        console.warn('[UIForge] Realtime DB delete failed:', e);
      }
    }
  }
}

/** Sync all community uploads from Firebase on load */
async function syncCommunityUploads() {
  const db = getFirestoreDB();
  const rtdb = getRealtimeDB();
  if (!db && !rtdb) return;

  const cloudComps = [];

  if (db) {
    try {
      const snap = await db.collection('components').get();
      if (snap && !snap.empty) {
        snap.forEach((doc) => {
          cloudComps.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (e) {
      if (e?.code !== 'permission-denied') {
        console.warn('[UIForge] Could not fetch from Firestore:', e);
      }
    }
  }

  if (!cloudComps.length) {
    const rtdb = getRealtimeDB();
    if (rtdb) {
      try {
        const snap = await rtdb.ref('components').once('value');
        if (snap && snap.exists()) {
          const val = snap.val();
          Object.keys(val).forEach((k) => {
            cloudComps.push({ id: k, ...val[k] });
          });
        }
      } catch (e) {
        console.warn('[UIForge] Could not fetch from Realtime DB:', e);
      }
    }
  }

  if (cloudComps.length > 0) {
    const deletedIds = getDeletedComponentIds();
    const filteredCloudComps = cloudComps.filter((c) => !deletedIds.has(c.id));
    console.log('[UIForge] Successfully fetched ' + filteredCloudComps.length + ' community components from Firebase!');
    filteredCloudComps.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Cache community uploads separately from user's personal uploads
    saveStoredCommunityUploads(filteredCloudComps);

    // Rebuild local component list combining user uploads, community uploads, and seeds
    rebuildLocalComponents();

    // Re-render feed cleanly without duplicating cards
    if (typeof loadComponents === 'function' && STATE.page === 1) {
      loadComponents(true);
    }
    if (typeof updateProfileStats === 'function') {
      updateProfileStats();
    }
  }
}

/* ---- Helper: fake async delay ---- */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---- Local in-memory "database" & persistent storage keys ---- */
let _localComponents = [];
const CODE_EDIT_STORAGE_KEY = 'uiforge_component_code_edits';
const USER_UPLOADS_STORAGE_KEY = 'uiforge_user_uploads';
const COMMUNITY_UPLOADS_STORAGE_KEY = 'uiforge_community_uploads';
const MY_UPLOAD_IDS_KEY = 'uiforge_my_upload_ids';
const DELETED_IDS_STORAGE_KEY = 'uiforge_deleted_ids';

function getDeletedComponentIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DELETED_IDS_STORAGE_KEY) || '[]'));
  } catch (e) {
    return new Set();
  }
}

function addDeletedComponentId(id) {
  if (!id) return;
  const ids = getDeletedComponentIds();
  ids.add(id);
  try {
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch (e) { }
}

function getMyUploadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(MY_UPLOAD_IDS_KEY) || '[]'));
  } catch (e) {
    return new Set();
  }
}

function saveMyUploadId(id) {
  const ids = getMyUploadIds();
  ids.add(id);
  try {
    localStorage.setItem(MY_UPLOAD_IDS_KEY, JSON.stringify([...ids]));
  } catch (e) { }
}

function removeMyUploadId(id) {
  const ids = getMyUploadIds();
  ids.delete(id);
  try {
    localStorage.setItem(MY_UPLOAD_IDS_KEY, JSON.stringify([...ids]));
  } catch (e) { }
}

function isUserComponentOwner(component) {
  if (!component) return false;
  // UIverse seed components can never be modified or deleted by users
  if (String(component.id).startsWith('uiv-')) return false;

  const currentUserId = STATE.currentUser?.uid;
  if (currentUserId && component.userId && component.userId === currentUserId) {
    return true;
  }
  const myIds = getMyUploadIds();
  if (myIds.has(component.id)) {
    return true;
  }
  const currentAuthor = STATE.currentUser?.displayName || (STATE.currentUser?.email ? STATE.currentUser.email.split('@')[0] : null);
  if (currentAuthor && component.author && component.author.toLowerCase() === currentAuthor.toLowerCase()) {
    return true;
  }
  const settingsName = typeof getUserSettings === 'function' ? getUserSettings().name : null;
  if (settingsName && component.author && component.author.toLowerCase() === settingsName.toLowerCase()) {
    return true;
  }
  if (component.isUserUpload) {
    return true;
  }
  return false;
}

function getStoredCommunityUploads() {
  try {
    const list = JSON.parse(localStorage.getItem(COMMUNITY_UPLOADS_STORAGE_KEY) || '[]');
    const deletedIds = getDeletedComponentIds();
    return Array.isArray(list) ? list.filter((c) => !deletedIds.has(c.id)) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredCommunityUploads(uploads) {
  try {
    const deletedIds = getDeletedComponentIds();
    const cleanList = Array.isArray(uploads) ? uploads.filter((c) => !deletedIds.has(c.id)) : [];
    localStorage.setItem(COMMUNITY_UPLOADS_STORAGE_KEY, JSON.stringify(cleanList));
  } catch (e) {
    console.warn('[UIForge] Could not save community uploads cache:', e);
  }
}

function getStoredUserUploads() {
  try {
    const list = JSON.parse(localStorage.getItem(USER_UPLOADS_STORAGE_KEY) || '[]');
    const deletedIds = getDeletedComponentIds();
    return Array.isArray(list) ? list.filter((c) => !deletedIds.has(c.id)) : [];
  } catch (error) {
    console.warn('[UIForge] Could not read user uploads:', error);
    return [];
  }
}

function saveStoredUserUploads(uploads) {
  try {
    const deletedIds = getDeletedComponentIds();
    const cleanList = Array.isArray(uploads) ? uploads.filter((c) => !deletedIds.has(c.id)) : [];
    localStorage.setItem(USER_UPLOADS_STORAGE_KEY, JSON.stringify(cleanList));
  } catch (error) {
    console.warn('[UIForge] Could not save user uploads:', error);
  }
}

function saveUserUploadLocally(component) {
  const uploads = getStoredUserUploads();
  const existingIdx = uploads.findIndex((c) => c.id === component.id);
  if (existingIdx >= 0) {
    uploads[existingIdx] = { ...uploads[existingIdx], ...component };
  } else {
    uploads.unshift(component);
  }
  saveStoredUserUploads(uploads);
  saveMyUploadId(component.id);

  // Also update in community uploads cache if present
  const community = getStoredCommunityUploads();
  const commIdx = community.findIndex((c) => c.id === component.id);
  if (commIdx >= 0) {
    community[commIdx] = { ...community[commIdx], ...component };
    saveStoredCommunityUploads(community);
  }
}

function removeUserUploadLocally(id) {
  if (!id) return;
  // 1. Mark in deleted IDs blacklist so nothing can revive it
  addDeletedComponentId(id);

  // 2. Remove from user uploads
  let uploads = getStoredUserUploads();
  uploads = uploads.filter((c) => c.id !== id);
  saveStoredUserUploads(uploads);

  // 3. Remove from community uploads cache
  let community = getStoredCommunityUploads();
  community = community.filter((c) => c.id !== id);
  saveStoredCommunityUploads(community);

  // 4. Remove from my uploads tracking
  removeMyUploadId(id);
}

function rebuildLocalComponents() {
  const deletedIds = getDeletedComponentIds();
  const myUploads = getStoredUserUploads().filter((c) => !deletedIds.has(c.id));
  const communityUploads = getStoredCommunityUploads().filter((c) => !deletedIds.has(c.id));
  const initialComps = (window.INITIAL_COMPONENTS || []).filter((c) => !deletedIds.has(c.id));

  const map = new Map();
  // 1. My uploads first
  myUploads.forEach((c) => {
    map.set(c.id, {
      ...c,
      isUserUpload: true,
      liked: STATE.likedIds ? STATE.likedIds.has(c.id) : false,
    });
  });
  // 2. Community uploads
  communityUploads.forEach((c) => {
    if (!map.has(c.id)) {
      map.set(c.id, {
        ...c,
        isUserUpload: true,
        liked: STATE.likedIds ? STATE.likedIds.has(c.id) : false,
      });
    }
  });
  // 3. Initial seed components
  initialComps.forEach((c) => {
    if (!map.has(c.id)) {
      map.set(c.id, {
        ...c,
        isUserUpload: false,
        liked: STATE.likedIds ? STATE.likedIds.has(c.id) : false,
      });
    }
  });

  _localComponents = Array.from(map.values());
  applyStoredCodeEdits(_localComponents);
}

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
  framework = STATE.framework || 'all',
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
    if (!STATE.likedIds || STATE.likedIds.size === 0) {
      return { data: [], total: 0 };
    }
    const likedArray = [...STATE.likedIds];
    const foundItems = [];
    const missingCategorySet = new Set();

    likedArray.forEach((id) => {
      const c = findComponentAnywhere(id);
      if (c) {
        foundItems.push(c);
      } else if (window.UIVERSE_MANIFEST) {
        for (const [catName, catMeta] of Object.entries(window.UIVERSE_MANIFEST.categories)) {
          if (catMeta.ids && catMeta.ids.includes(id)) {
            missingCategorySet.add(catName);
            break;
          }
        }
      }
    });

    if (missingCategorySet.size > 0) {
      await Promise.all([...missingCategorySet].map((cat) => loadCategoryData(cat)));
      likedArray.forEach((id) => {
        if (!foundItems.some((c) => c.id === id)) {
          const c = findComponentAnywhere(id);
          if (c) foundItems.push(c);
        }
      });
    }

    items = foundItems;
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
    if (category === 'All' && !_allCategoriesLoaded) {
      await loadAllCategories();
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
      items = pool;
    }
    const q = search.toLowerCase();
    items = items.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.author && c.author.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q))
    );
  }
  // Filter by Framework (All / Tailwind / Pure CSS - Uiverse Parity)
  const currentFw = framework || STATE.framework || 'all';
  if (currentFw !== 'all') {
    items = items.filter((c) => {
      const isTailwind = !c.css || !c.css.trim() || /\b(flex|grid|bg-|text-|p-|m-|rounded-|border-)\b/.test(c.html || '');
      if (currentFw === 'tailwind') return isTailwind;
      if (currentFw === 'css') return !isTailwind || (c.css && c.css.trim().length > 15);
      return true;
    });
  }

  // Ensure each component has accurate likes count and liked status
  items.forEach((c) => {
    c.likes = getComponentLikesCount(c);
    c.liked = STATE.likedIds.has(c.id);
  });

  function getTrendingScore(comp) {
    const likes = (typeof getComponentLikesCount === 'function' ? getComponentLikesCount(comp) : comp.likes) || 0;
    const views = comp.views || 0;
    const idStr = String(comp.id || '');
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
      hash |= 0;
    }
    const activityBonus = Math.abs(hash % 200);
    return (likes * 25) + (views * 3) + activityBonus;
  }

  if (sort === 'popular') items.sort((a, b) => b.likes - a.likes);
  else if (sort === 'trending') items.sort((a, b) => getTrendingScore(b) - getTrendingScore(a));
  else if (sort === 'random') items.sort(() => 0.5 - Math.random());
  else items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  let total = items.length;
  if (category === 'All' && !search && window.UIVERSE_MANIFEST) {
    total = window.UIVERSE_MANIFEST.total + (typeof getUserUploads === 'function' ? getUserUploads().length : 0);
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
 * Automated Security & Quality Validation Engine (Uiverse.io Parity)
 * Evaluates component HTML & CSS through 5 strict automated rules without human intervention.
 * 
 * @param {string} html 
 * @param {string} css 
 * @returns {{ passed: boolean, status: 'approved' | 'rejected', checks: Array, reasons: Array, scannedAt: string }}
 */
function evaluateComponentSecurity(html = '', css = '') {
  const h = String(html || '');
  const c = String(css || '');
  const reasons = [];
  const checks = [
    { name: 'zero_js', passed: true, label: 'Zero-JS Policy' },
    { name: 'no_event_handlers', passed: true, label: 'No Event Handlers' },
    { name: 'safe_links', passed: true, label: 'Safe Links & No Downloads' },
    { name: 'no_embeds', passed: true, label: 'No Dangerous Embeds' },
    { name: 'css_html_validity', passed: true, label: 'Valid UI Element & Scoped Styles' },
  ];

  // 1. Zero-JS Check
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(h) || /<script\b/i.test(h)) {
    checks[0].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_script_tag') : 'Forbidden <script> tag detected. UI components must be pure HTML & CSS.');
  }
  if (/javascript\s*:/i.test(h) || /javascript\s*:/i.test(c)) {
    checks[0].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_javascript_uri') : 'Forbidden "javascript:" URI detected.');
  }
  if (/\b(eval\s*\(|Function\s*\(|document\.cookie|window\.localStorage|sessionStorage)\b/i.test(h)) {
    checks[0].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_js_execution') : 'Forbidden JavaScript execution keyword detected.');
  }

  // 2. No Event Handlers
  const eventHandlerRegex = /\bon[a-z]{3,20}\s*=/i;
  if (eventHandlerRegex.test(h)) {
    checks[1].passed = false;
    const match = h.match(eventHandlerRegex);
    const attr = match ? match[0].replace('=', '').trim() : 'event';
    const baseMsg = typeof t === 'function' ? t('sec_err_event_handler') : 'Forbidden inline event handler "{attr}" detected.';
    reasons.push(baseMsg.replace('{attr}', attr));
  }

  // 3. No Malicious Downloads & Executable Extensions
  if (/\bdownload\s*=/i.test(h) || /<a\b[^>]*\bdownload\b/i.test(h)) {
    checks[2].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_download_attr') : 'File download triggers are not allowed in components.');
  }
  if (/\.(exe|zip|rar|tar|gz|bat|cmd|apk|vbs|msi|ps1|scr)\b/i.test(h) || /\.(exe|zip|rar|tar|gz|bat|cmd|apk|vbs|msi|ps1|scr)\b/i.test(c)) {
    checks[2].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_executable_file') : 'Suspicious executable or archive file link detected.');
  }

  // 4. No Dangerous Embeds
  if (/<(iframe|object|embed|applet)\b/i.test(h)) {
    checks[3].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_embed_tags') : 'External embedded frames (<iframe, <object, <embed) are prohibited.');
  }
  if (/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?/i.test(h)) {
    checks[3].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_meta_refresh') : 'Meta page redirects are prohibited.');
  }

  // 5. CSS & HTML Validity
  if (!h.trim() || !/<[a-z][\s\S]*>/i.test(h)) {
    checks[4].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_empty_html') : 'Component must contain at least one valid HTML element.');
  }
  if (/(?:^|\s)(?:html|body)\s*\{/i.test(c)) {
    checks[4].passed = false;
    reasons.push(typeof t === 'function' ? t('sec_err_global_css') : 'Global body/html styling overrides are prohibited. Use scoped classes.');
  }

  const passed = checks.every((ch) => ch.passed);
  return {
    passed,
    status: passed ? 'approved' : 'rejected',
    checks,
    reasons,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * uploadComponent(payload)
 * Creates a new component in the database.
 * Evaluates automated security checks before publishing.
 *
 * @param {{ title: string, html: string, css: string, author: string, category: string }} payload
 * @returns {Promise<Component>} The created component record
 */
async function uploadComponent({ title, html, css, author = 'Anonymous', category = 'Other' }) {
  const currentUser = STATE.currentUser || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null);
  const defaultName = (currentUser && currentUser.email) ? currentUser.email.split('@')[0] : (author.trim() || 'Anonymous');
  const authorName = (currentUser && currentUser.displayName) ? currentUser.displayName : defaultName;
  const authorEmail = (currentUser && currentUser.email) ? currentUser.email : '';
  const userId = currentUser ? currentUser.uid : ('guest-' + Date.now());

  // Run Automated Security & Quality Validation Engine
  const security = evaluateComponentSecurity(html, css);

  const newComponent = {
    id: `upload-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: title.trim(),
    html: html.trim(),
    css: css.trim(),
    author: authorName,
    authorEmail: authorEmail,
    userId: userId,
    isUserUpload: true,
    category: category || 'Other',
    likes: 0,
    views: 0,
    liked: false,
    status: security.status, // 'approved' or 'rejected'
    securityReport: security,
    rejectionReasons: security.passed ? [] : security.reasons,
    createdAt: new Date().toISOString(),
  };

  // Only approved components are published to public collections
  if (security.passed) {
    if (CONFIG.DB_PROVIDER === 'supabase') {
      const sb = getSupabaseClient();
      if (sb) {
        const { data, error } = await sb.from('components').insert([newComponent]).select().single();
        if (error) throw error;
        saveUserUploadLocally(data);
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
        const created = { ...newComponent, id: ref.id };
        saveUserUploadLocally(created);
        return created;
      }
    }

    _localComponents.unshift(newComponent);
    saveComponentToCloud(newComponent).catch((err) => {
      console.warn('[UIForge] Cloud upload failed, saved locally:', err);
    });
  }

  // Always save in user's personal uploads so rejected components can be viewed, fixed, and resubmitted
  saveUserUploadLocally(newComponent);
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
 * updateComponentDetails(id, payload)
 * Modifies title, category, html, css of an existing component.
 */
async function updateComponentDetails(id, { title, category, html, css }) {
  const component = findComponentAnywhere(id);
  if (!component) throw new Error('Component not found');

  if (!isUserComponentOwner(component)) {
    showToast('You do not have permission to edit this component.', 'error');
    throw new Error('Unauthorized');
  }

  // 1. Run Automated Security Engine on the edited code
  const security = evaluateComponentSecurity(html.trim(), css.trim());

  component.title = title.trim();
  component.category = category;
  component.html = html.trim();
  component.css = css.trim();
  component.updatedAt = new Date().toISOString();
  component.status = security.passed ? 'approved' : 'rejected';
  component.rejectionReasons = security.passed ? [] : security.reasons;

  // Save to stored code edits
  const edits = getStoredCodeEdits();
  edits[id] = { html: component.html, css: component.css };
  try {
    localStorage.setItem(CODE_EDIT_STORAGE_KEY, JSON.stringify(edits));
  } catch (e) { }

  // Update in user uploads storage
  saveUserUploadLocally(component);

  if (security.passed) {
    // If approved, sync to cloud and keep in public feed
    saveComponentToCloud(component).catch(() => { });
    if (CONFIG.DB_PROVIDER === 'firebase') {
      const db = getFirestoreDB();
      if (db) {
        try {
          await db.collection('components').doc(id).update({
            title: component.title,
            category: component.category,
            html: component.html,
            css: component.css,
            status: 'approved',
            rejectionReasons: []
          });
        } catch (err) {
          console.warn('[UIForge] Could not update Firestore:', err);
        }
      }
    }
  } else {
    // If rejected, immediately quarantine: remove from public feed and cloud
    STATE.components = STATE.components.filter(c => c.id !== id);
    STATE.total = Math.max(0, STATE.total - 1);
    deleteComponentFromCloud(id).catch(() => { });
  }

  // Update detail modal if open
  if (STATE.currentModal === id) {
    if (!security.passed) {
      if (typeof closeModal === 'function') closeModal();
    } else {
      const modalTitle = document.getElementById('modal-title');
      const modalCategory = document.getElementById('modal-category');
      if (modalTitle) modalTitle.textContent = component.title;
      if (modalCategory) modalCategory.textContent = component.category;
    }
  }

  // Refresh main page cards, hero stats, and category filters
  renderGrid(STATE.components);
  if (typeof updateHeroStats === 'function') updateHeroStats();
  if (typeof renderCategoryFilters === 'function') renderCategoryFilters();

  // Refresh profile modal if open
  if (typeof window._renderProfileUploads === 'function') window._renderProfileUploads();
  if (typeof window._renderProfileFavorites === 'function') window._renderProfileFavorites();
  if (typeof window._updateProfileStats === 'function') window._updateProfileStats();
  if (typeof window.updateProfileUserInfo === 'function') window.updateProfileUserInfo();

  return component;
}

/**
 * deleteComponent(id)
 * Deletes a component from memory, local storage, and remote DB.
 */
async function deleteComponent(id) {
  if (!id) return;
  const component = findComponentAnywhere(id);
  if (component && !isUserComponentOwner(component)) {
    showToast('You do not have permission to delete this component.', 'error');
    throw new Error('Unauthorized');
  }

  // 1. Remove from stored user uploads, community uploads, tracking & add to deleted IDs
  removeUserUploadLocally(id);

  // 2. Remove from in-memory arrays immediately
  _localComponents = _localComponents.filter((c) => c.id !== id);
  STATE.components = STATE.components.filter((c) => c.id !== id);
  if (Array.isArray(STATE.allComponents)) {
    STATE.allComponents = STATE.allComponents.filter((c) => c.id !== id);
  }
  if (STATE.total > 0) STATE.total--;

  // 3. Rebuild local components pool to ensure clean state
  rebuildLocalComponents();

  // 4. Delete from Firebase Cloud (Realtime DB & Firestore)
  deleteComponentFromCloud(id).catch((err) => {
    console.warn('[UIForge] Cloud delete failed:', err);
  });

  // 5. Remove from likes
  if (STATE.likedIds && STATE.likedIds.has(id)) {
    STATE.likedIds.delete(id);
    persistLikes();
  }

  // 6. Delete from Firestore if firebase provider is active
  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      try {
        await db.collection('components').doc(id).delete();
      } catch (err) {
        console.warn('[UIForge] Could not delete from Firestore:', err);
      }
    }
  }

  // 7. Close detail modal if open for this item
  if (STATE.currentModal === id && typeof closeModal === 'function') {
    closeModal();
  }

  // 8. Refresh main list and profile
  renderGrid(STATE.components);
  if (typeof updateHeroStats === 'function') updateHeroStats();
  if (typeof updateProfileUserInfo === 'function') updateProfileUserInfo();
  if (typeof window._renderProfileUploads === 'function') window._renderProfileUploads();
  if (typeof window._renderProfileFavorites === 'function') window._renderProfileFavorites();
  if (typeof window._updateProfileStats === 'function') window._updateProfileStats();
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
 * Increments the view counter on a component and persists it.
 * Called when the detail modal is opened or card is previewed.
 *
 * @param {string} id
 */
async function incrementViews(id) {
  if (CONFIG.DB_PROVIDER === 'supabase') {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        await sb.rpc('increment_views', { row_id: id });
      } catch (e) {
        console.warn('[UIForge] Supabase increment_views failed:', e);
      }
    }
  }

  if (CONFIG.DB_PROVIDER === 'firebase') {
    const db = getFirestoreDB();
    if (db) {
      try {
        await db.collection('components').doc(id).update({
          views: firebase.firestore.FieldValue.increment(1),
        });
      } catch (e) {}
    }
  }

  const rtdb = getRealtimeDB();
  if (rtdb) {
    try {
      rtdb.ref('components/' + id + '/views').transaction((val) => (val || 0) + 1);
    } catch (e) {}
  }

  // Persistent storage in localStorage
  const map = getStoredViewsMap();
  const comp = typeof findComponentAnywhere === 'function' ? findComponentAnywhere(id) : null;
  const current = typeof map[id] === 'number' ? map[id] : (comp?.views || 0);
  const next = current + 1;
  map[id] = next;
  try {
    localStorage.setItem(COMPONENT_VIEWS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {}

  if (comp) comp.views = next;
  const inLocal = _localComponents.find((c) => c.id === id);
  if (inLocal) inLocal.views = next;

  // If user-created upload, also update in stored user uploads
  const uploads = getStoredUserUploads();
  const uIdx = uploads.findIndex((u) => u.id === id);
  if (uIdx !== -1) {
    uploads[uIdx].views = next;
    saveStoredUserUploads(uploads);
  }
}


/* ============================================================
   3. INITIAL COMPONENTS (Loaded from data/initial_components.js)
   ============================================================ */

const DUMMY_DATA = window.INITIAL_COMPONENTS || [];

/* ============================================================
   4. APPLICATION STATE
   ============================================================ */

// One-time cleanup for test likes artifact from automated tests
const TEST_LIKES_CLEANUP_KEY = 'uiforge_test_likes_cleaned_v3';
try {
  if (!localStorage.getItem(TEST_LIKES_CLEANUP_KEY)) {
    localStorage.removeItem('uiforge_liked');
    localStorage.removeItem('uiforge_component_likes');
    localStorage.setItem(TEST_LIKES_CLEANUP_KEY, 'true');
  }
} catch (e) { }

function getStoredUser() {
  try {
    if (localStorage.getItem('uiforge_logged_out') === 'true') {
      return null;
    }
    const raw = localStorage.getItem('uiforge_user');
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return {
    uid: 'local-user-phitsamay',
    displayName: 'Phitsamay',
    email: 'phitsamay@example.com',
    photoURL: ''
  };
}

const STATE = {
  components: [],          // Currently displayed components
  allComponents: [],          // All loaded components (for client-side filtering)
  total: 0,           // Total count from DB
  page: 1,
  pageSize: CONFIG.PAGE_SIZE,
  activeCategory: 'All',
  framework: 'all',          // 'all' | 'tailwind' | 'css' (Uiverse Framework Filter)
  searchQuery: '',
  sort: 'newest',
  currentModal: null,        // ID of the open component (detail modal)
  isGridView: true,
  currentUser: getStoredUser(),
  activeProfileTab: 'uploads',
  canvasZoom: 1,             // Zoom scale in modal preview
  currentViewport: 'desktop',// 'desktop' | 'tablet' | 'mobile'
  likedIds: (() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('uiforge_liked') || '[]'));
    } catch (_) {
      return new Set();
    }
  })(),
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
      return true;
    }
  } catch (e) { }

  try {
    // Fallback for non-https or permission-blocked headless environments
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return !!ok;
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

/** Check if hex color is dark */
function isHexColorDark(hex) {
  if (!hex || typeof hex !== 'string') return true;
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6 && clean.length !== 3) return true;
  const r = parseInt(clean.length === 3 ? clean[0] + clean[0] : clean.substring(0, 2), 16);
  const g = parseInt(clean.length === 3 ? clean[1] + clean[1] : clean.substring(2, 4), 16);
  const b = parseInt(clean.length === 3 ? clean[2] + clean[2] : clean.substring(4, 6), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 128;
}

/**
 * buildPreviewSrcDoc(html, css)
 * Builds a full HTML document for use in an <iframe> srcdoc attribute.
 */
function buildPreviewSrcDoc(html, css, category = '', isModal = false, bgColor = '#212121') {
  let isLight = false;
  if (bgColor && bgColor !== 'transparent') {
    isLight = !isHexColorDark(bgColor);
  }
  const rootClass = isLight ? 'light' : 'dark';
  const initialBg = isModal ? bgColor : (isLight ? '#ffffff' : '#212121');
  const initialColor = isLight ? '#0f172a' : '#f4f4f5';

  const isTailwind = !css || !css.trim() || /\b(flex|grid|bg-|text-|p-|m-|rounded-|border-)\b/.test(html);
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

  const isPattern = category === 'Patterns';

  // Sanitize html for preview to prevent unclosed script tags from breaking the iframe runtime
  const safeHtml = (html || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<script\b[^>]*>/gi, '')
    .replace(/<\/script>/gi, '');

  return `<!DOCTYPE html>
<html class="${rootClass}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https:; font-src https: data:; img-src https: data: blob:; script-src https://cdn.tailwindcss.com 'unsafe-inline';">
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
    background-color: ${initialBg} !important;
    color: ${initialColor};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease, color 0.15s ease;
  }
  html.light, html.light body {
    color: #0f172a !important;
  }
  html.dark, html.dark body {
    color: #f4f4f5 !important;
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

  #stage-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transform-origin: center center;
    transition: transform 0.15s ease-out;
    ${isPattern ? 'width: 100%; height: 100%;' : ''}
  }

  ${css}
</style>
</head>
<body class="${rootClass}">
<div id="uiverse-stage">
  <div id="stage-inner">
${safeHtml}
  </div>
</div>
<script>
  document.addEventListener('click', e => {
    if (e.target.closest('a')) e.preventDefault();
  });
  document.addEventListener('submit', e => e.preventDefault());

  window.addEventListener('message', e => {
    if (!e.data) return;
    if (e.data.type === 'TOGGLE_THEME' || e.data.type === 'UPDATE_BG') {
      const isLight = e.data.isLight !== undefined ? e.data.isLight : e.data.theme === 'light';
      document.documentElement.classList.toggle('light', isLight);
      document.documentElement.classList.toggle('dark', !isLight);
      document.body.classList.toggle('light', isLight);
      document.body.classList.toggle('dark', !isLight);
      const bg = e.data.bg || (isLight ? '#ffffff' : '#212121');
      document.documentElement.style.setProperty('background-color', bg, 'important');
      document.body.style.setProperty('background-color', bg, 'important');
    }
  });

  function autoFit() {
    const stage = document.getElementById('uiverse-stage');
    const inner = document.getElementById('stage-inner');
    if (!stage || !inner) return;
    if (${isPattern}) return;

    inner.style.transform = 'none';
    const r = inner.getBoundingClientRect();
    const natW = r.width;
    const natH = r.height;
    if (natW <= 0 || natH <= 0) return;

    const isModal = ${isModal};
    const padding = isModal ? 32 : 16;
    const availW = window.innerWidth - padding;
    const availH = window.innerHeight - padding;

    let s = 1.0;
    if (natW < 120 && natH < 80) {
      // Small components (checkbox, switch, radio, loader)
      const targetMin = Math.min(availW, availH) * 0.28;
      const boost = targetMin / Math.max(natW, natH);
      s = Math.max(1.8, Math.min(boost, 2.5));
    } else if (natW > availW || natH > availH) {
      // Overflowing components
      s = Math.min(availW / natW, availH / natH) * 0.95;
    } else if (isModal && natW < 260 && natH < 200) {
      s = 1.25;
    }

    // Never exceed available space
    const maxAllowed = Math.min(availW / natW, availH / natH) * 0.95;
    s = Math.min(s, maxAllowed);
    s = Math.max(s, 0.25);
    s = Math.min(s, 3.0);

    if (Math.abs(s - 1) > 0.01) {
      inner.style.transform = 'scale(' + s + ')';
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
  if (!target || target <= 0 || isNaN(target)) {
    el.textContent = '0';
    return;
  }
  const duration = 1800;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(ease * target);
    el.textContent = current >= 1000 ? current.toLocaleString() : current;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target >= 1000 ? target.toLocaleString() : target;
  };
  requestAnimationFrame(step);
}

/**
 * Unified Public Components Counting Engine
 * Ensures 100% synchronization across Homepage Hero, Sidebar Drawer (3 ขีด),
 * and the Horizontal Category Bar. Only approved components are counted in public totals.
 */
function getApprovedPublicUploads() {
  const deletedIds = typeof getDeletedComponentIds === 'function' ? getDeletedComponentIds() : new Set();
  const pool = typeof getStoredUserUploads === 'function' ? getStoredUserUploads() : [];

  return pool.filter(c => {
    if (!c || deletedIds.has(c.id)) return false;
    if (String(c.id).startsWith('uiv-')) return false; // Already in manifest base count
    return c.status !== 'rejected' && c.status !== 'in-review';
  });
}

function getPublicCategoryCount(cat = 'All') {
  const approvedList = getApprovedPublicUploads();
  const extraCount = approvedList.filter(c => cat === 'All' || c.category === cat).length;

  if (cat === 'All') {
    const baseTotal = window.UIVERSE_MANIFEST ? window.UIVERSE_MANIFEST.total : 6002;
    return baseTotal + extraCount;
  }

  if (window.UIVERSE_MANIFEST && window.UIVERSE_MANIFEST.categories && window.UIVERSE_MANIFEST.categories[cat]) {
    return window.UIVERSE_MANIFEST.categories[cat].count + extraCount;
  }

  return extraCount;
}

/**
 * updateHeroStats()
 * Synchronizes hero section with 100% REAL platform metrics
 */
function updateHeroStats() {
  const compCounter = document.getElementById('hero-stat-components');
  const catCounter = document.getElementById('hero-stat-categories');
  const likeCounter = document.getElementById('hero-stat-likes');
  const devCounter = document.getElementById('hero-stat-developers');

  // Real component count - exactly matches category filter totals
  const totalComps = getPublicCategoryCount('All');
  if (compCounter) {
    compCounter.dataset.target = totalComps;
    compCounter.textContent = totalComps.toLocaleString();
  }

  // Real category count
  const totalCats = window.UIVERSE_MANIFEST && window.UIVERSE_MANIFEST.categories
    ? Object.keys(window.UIVERSE_MANIFEST.categories).length
    : 11;
  if (catCounter) {
    catCounter.dataset.target = totalCats;
    catCounter.textContent = totalCats.toLocaleString();
  }

  // Real user likes given on UIForge
  const likesMap = typeof getStoredLikesMap === 'function' ? getStoredLikesMap() : {};
  const totalLikes = Object.values(likesMap).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const realLikes = Math.max(STATE.likedIds ? STATE.likedIds.size : 0, totalLikes);
  if (likeCounter) {
    likeCounter.dataset.target = realLikes;
    likeCounter.textContent = realLikes.toLocaleString();
  }

  // Real registered users
  const realUsers = STATE.currentUser ? 1 : 0;
  if (devCounter) {
    devCounter.dataset.target = realUsers;
    devCounter.textContent = realUsers.toLocaleString();
  }
}

let _catScrollInitialized = false;

/**
 * setupHorizontalCategoryScroll()
 * Powers smooth horizontal scrolling via buttons, wheel, and drag
 */
function setupHorizontalCategoryScroll() {
  const container = document.getElementById('horizontal-categories');
  const leftBtn = document.getElementById('cat-scroll-left-btn');
  const rightBtn = document.getElementById('cat-scroll-right-btn');
  if (!container) return;

  function updateArrowVisibility() {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (leftBtn) {
      const canScrollLeft = scrollLeft > 10;
      leftBtn.classList.toggle('opacity-0', !canScrollLeft);
      leftBtn.classList.toggle('pointer-events-none', !canScrollLeft);
      leftBtn.classList.toggle('opacity-100', canScrollLeft);
    }
    if (rightBtn) {
      const canScrollRight = scrollLeft < maxScroll - 10;
      rightBtn.classList.toggle('opacity-0', !canScrollRight);
      rightBtn.classList.toggle('pointer-events-none', !canScrollRight);
      rightBtn.classList.toggle('opacity-90', canScrollRight);
    }
  }

  if (!_catScrollInitialized) {
    _catScrollInitialized = true;

    // 1. Arrow buttons click scrolling
    if (leftBtn) {
      leftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        container.scrollBy({ left: -280, behavior: 'smooth' });
      });
    }
    if (rightBtn) {
      rightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        container.scrollBy({ left: 280, behavior: 'smooth' });
      });
    }

    // 2. Mouse Wheel horizontal scrolling
    container.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 1.4;
        updateArrowVisibility();
      }
    }, { passive: false });

    // 3. Mouse Drag to Scroll (Grab and Drag)
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let hasMoved = false;

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasMoved = false;
      startX = e.pageX - container.offsetLeft;
      scrollStart = container.scrollLeft;
      container.classList.add('cursor-grabbing');
      container.classList.remove('scroll-smooth');
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        container.classList.remove('cursor-grabbing');
        container.classList.add('scroll-smooth');
        updateArrowVisibility();
      }
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 4) hasMoved = true;
      container.scrollLeft = scrollStart - walk;
      updateArrowVisibility();
    });

    // Suppress chip click if dragged
    container.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopImmediatePropagation();
        e.preventDefault();
        hasMoved = false;
      }
    }, true);

    container.addEventListener('scroll', updateArrowVisibility, { passive: true });
    window.addEventListener('resize', updateArrowVisibility);
  }

  requestAnimationFrame(() => {
    updateArrowVisibility();
  });
}


/* ============================================================
   6. UI COMPONENTS — DOM Rendering
   ============================================================ */

/** Build category filter pills */
function renderCategoryFilters() {
  const categories = [
    'All', 'Buttons', 'Checkboxes', 'Inputs', 'Radio Buttons',
    'Cards', 'Toggles', 'Loaders', 'Tooltips', 'Forms', 'Patterns', 'Notifications',
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
    Notifications: 'fa-bell',
  };

  container.innerHTML = categories.map((cat) => {
    const isActive = cat === STATE.activeCategory;
    const count = getPublicCategoryCount(cat);

    return `
      <button
        class="sidebar-cat-btn ${isActive ? 'is-active font-semibold' : ''} flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors border border-transparent cursor-pointer"
        data-category="${cat}"
        aria-pressed="${isActive}"
      >
        <span class="flex items-center gap-3">
          <i class="fa-solid ${categoryIcons[cat] || 'fa-tag'} w-4 text-center ${isActive ? 'text-brand-400' : ''}"></i>
          ${cat}
        </span>
        <div class="flex items-center gap-2">
          ${count > 0 ? `<span class="cat-chip-count">${count.toLocaleString()}</span>` : ''}
          ${isActive ? '<div class="w-1.5 h-1.5 rounded-full bg-brand-400"></div>' : ''}
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

      if (typeof window._updateSidebarMenuUI === 'function') window._updateSidebarMenuUI('');
      renderCategoryFilters(); // Re-render to update active styling
      loadComponents(true);

      // Auto-close sidebar on mobile after selecting
      if (window.innerWidth < 1024) {
        if (typeof window._closeSidebar === 'function') window._closeSidebar();
      }
      document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Render Horizontal Category Navigation Bar (Uiverse Signature Bar)
  const horizontalContainer = document.getElementById('horizontal-categories');
  if (horizontalContainer) {
    horizontalContainer.innerHTML = categories.map((cat) => {
      const isActive = cat === STATE.activeCategory;
      const count = getPublicCategoryCount(cat);

      return `
        <button
          type="button"
          class="horizontal-cat-chip ${isActive ? 'active' : ''}"
          data-category="${cat}"
          aria-pressed="${isActive}"
        >
          <i class="fa-solid ${categoryIcons[cat] || 'fa-tag'} cat-chip-icon text-xs"></i>
          <span>${cat}</span>
          ${count > 0 ? `<span class="cat-chip-count">${count.toLocaleString()}</span>` : ''}
        </button>
      `;
    }).join('');

    horizontalContainer.querySelectorAll('.horizontal-cat-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        STATE.activeCategory = btn.dataset.category;
        STATE.page = 1;

        const titleEl = document.getElementById('current-category-title');
        if (titleEl) {
          titleEl.textContent = STATE.activeCategory === 'All' ? 'All Components' : STATE.activeCategory + ' Components';
        }

        renderCategoryFilters();
        loadComponents(true);

        const newActive = document.querySelector(`.horizontal-cat-chip[data-category="${btn.dataset.category}"]`);
        if (newActive) {
          newActive.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });

    setupHorizontalCategoryScroll();
  }
}


const COMPONENT_LIKES_STORAGE_KEY = 'uiforge_component_likes';

function getStoredLikesMap() {
  try {
    return JSON.parse(localStorage.getItem(COMPONENT_LIKES_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function getComponentLikesCount(component) {
  if (!component) return 0;
  const map = getStoredLikesMap();
  const id = typeof component === 'object' ? component.id : component;
  const isLiked = STATE && STATE.likedIds && typeof STATE.likedIds.has === 'function' ? STATE.likedIds.has(id) : false;

  let count = 0;
  if (typeof map[id] === 'number') {
    count = map[id];
  } else {
    count = typeof component.likes === 'number' ? component.likes : 0;
  }

  // If this user has liked this item, the like count must NEVER be 0.
  if (isLiked && count <= 0) {
    count = 1;
    map[id] = 1;
    try {
      localStorage.setItem(COMPONENT_LIKES_STORAGE_KEY, JSON.stringify(map));
    } catch (e) { }
  }

  return count;
}

function setComponentLikesCount(id, count, delta = 0) {
  const map = getStoredLikesMap();
  map[id] = count;
  try {
    localStorage.setItem(COMPONENT_LIKES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) { }

  // Sync to Cloud atomically
  syncLikeToCloud(id, count, delta).catch(() => { });
}

async function syncLikeToCloud(id, count, delta = 0) {
  const rtdb = getRealtimeDB();
  if (rtdb) {
    try {
      if (delta !== 0) {
        await rtdb.ref('likes/' + id).transaction((curr) => {
          return Math.max(0, (curr || 0) + delta);
        });
      } else {
        await rtdb.ref('likes/' + id).set(count);
      }
      return;
    } catch (e) { }
  }
  const db = getFirestoreDB();
  if (db) {
    try {
      if (delta !== 0 && typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
        await db.collection('likes').doc(id).set({
          count: firebase.firestore.FieldValue.increment(delta)
        }, { merge: true });
      } else {
        await db.collection('likes').doc(id).set({ count: count }, { merge: true });
      }
    } catch (e) { }
  }
}

const COMPONENT_VIEWS_STORAGE_KEY = 'uiforge_component_views';

function getStoredViewsMap() {
  try {
    return JSON.parse(localStorage.getItem(COMPONENT_VIEWS_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function getComponentViewsCount(component) {
  if (!component) return 0;
  const map = getStoredViewsMap();
  const id = typeof component === 'object' ? component.id : component;
  let count = 0;
  if (typeof map[id] === 'number') {
    count = map[id];
  } else if (typeof component === 'object' && typeof component.views === 'number') {
    count = component.views;
  }

  // Realistic baseline: An element with likes must have been viewed at least as many times as it was liked
  const likes = getComponentLikesCount(component);
  if (count < likes) {
    count = likes;
    map[id] = count;
    try {
      localStorage.setItem(COMPONENT_VIEWS_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {}
  }
  return count;
}

async function syncCloudLikes() {
  const rtdb = getRealtimeDB();
  const db = getFirestoreDB();
  if (!rtdb && !db) return;
  let changed = false;
  let rtdbSuccess = false;
  const local = getStoredLikesMap();

  // 1. Try Realtime Database first (fastest & lowest bandwidth)
  if (rtdb) {
    try {
      const snap = await rtdb.ref('likes').once('value');
      if (snap && snap.exists()) {
        rtdbSuccess = true;
        const val = snap.val() || {};
        Object.keys(val).forEach((k) => {
          const cloudVal = Number(val[k]) || 0;
          if ((local[k] || 0) !== cloudVal) {
            local[k] = cloudVal;
            changed = true;
          }
        });
      }
    } catch (e) { }
  }

  // 2. Fallback to Firestore only if RTDB is unavailable or empty
  if (db && !rtdbSuccess) {
    try {
      const snapshot = await db.collection('likes').get();
      if (snapshot && !snapshot.empty) {
        snapshot.forEach((doc) => {
          const cloudVal = Number(doc.data()?.count) || 0;
          if ((local[doc.id] || 0) !== cloudVal) {
            local[doc.id] = cloudVal;
            changed = true;
          }
        });
      }
    } catch (e) { }
  }

  if (changed) {
    try {
      localStorage.setItem(COMPONENT_LIKES_STORAGE_KEY, JSON.stringify(local));
    } catch (e) { }

    // Refresh rendered like buttons in DOM immediately
    document.querySelectorAll('.like-btn').forEach((btn) => {
      const id = btn.dataset.id;
      if (id) {
        const comp = findComponentAnywhere(id);
        const count = getComponentLikesCount(comp || id);
        const isLiked = STATE.likedIds.has(id);
        updateLikeButton(btn, isLiked, count);
      }
    });

    if (STATE.currentModal) {
      const modalLikeCount = document.getElementById('modal-likes-count');
      if (modalLikeCount) {
        modalLikeCount.textContent = formatNumber(getComponentLikesCount(STATE.currentModal));
      }
    }
    if (typeof updateHeroStats === 'function') {
      updateHeroStats();
    }
  }
}

/**
 * renderComponentCard(component, eagerLoad)
 * Returns the outer HTML string for a single component card.
 */
function renderComponentCard(component, eagerLoad = false) {
  const isLiked = STATE.likedIds.has(component.id);
  const initials = getInitials(component.author);
  const currentLikes = getComponentLikesCount(component);
  component.likes = currentLikes;
  component.liked = isLiked;
  const likeCount = formatNumber(currentLikes);
  const previewDoc = buildPreviewSrcDoc(component.html, component.css, component.category, false);
  const scaleClass = '';
  const escapedPreview = escapeAttr(previewDoc);

  const isTailwind = !component.css || !component.css.trim() || /\b(flex|grid|bg-|text-|p-|m-|rounded-|border-)\b/.test(component.html || '');
  const fwName = isTailwind ? 'Tailwind' : 'CSS';
  const fwClass = isTailwind ? 'tailwind' : 'css';

  return `
    <article
      class="component-card"
      data-id="${component.id}"
      tabindex="0"
      role="button"
      aria-label="View ${component.title} component"
    >
      <!-- Preview -->
      <div class="card-preview" data-canvas-theme="dark">
        <!-- Canvas Theme Switcher (Uiverse style) -->
        <button
          type="button"
          class="card-theme-toggle"
          data-id="${component.id}"
          title="Toggle preview theme (Dark / Light / Pitch Black)"
          aria-label="Toggle card canvas theme"
        >
          <i class="fa-solid fa-circle-half-stroke text-[11px]"></i>
        </button>

        <div class="card-overlay">
          <button type="button" class="overlay-btn overlay-btn-primary card-open-btn" data-id="${component.id}" aria-label="Inspect and copy code for ${escapeAttr(component.title)}">
            <i class="fa-solid fa-code text-xs" aria-hidden="true"></i> Get code
          </button>
          <button type="button" class="overlay-btn overlay-btn-secondary card-copy-btn" data-id="${component.id}" title="Quick copy HTML & CSS" aria-label="Quick copy HTML and CSS for ${escapeAttr(component.title)}">
            <i class="fa-regular fa-copy" aria-hidden="true"></i>
          </button>
          <button type="button" class="overlay-btn overlay-btn-secondary card-share-btn" data-id="${component.id}" title="Copy direct link" aria-label="Copy share link for ${escapeAttr(component.title)}">
            <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
          </button>
        </div>
        <iframe
          srcdoc="${escapedPreview}"
          title="${escapeAttr(component.title)} preview"
          loading="lazy"
          sandbox="allow-scripts"
          class="card-iframe ${scaleClass} bg-transparent"
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
            by <span class="author-link cursor-pointer hover:underline font-medium" data-author="${escapeAttr(component.author)}">@${escapeHtml(component.author)}</span>
          </p>
          <div class="flex items-center gap-1.5">
            <span class="card-framework-badge ${fwClass}">${fwName}</span>
            <span class="card-tag">${escapeHtml(component.category)}</span>
          </div>
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
 * Setup IntersectionObserver for virtualized lazy-loading of card iframes.
 */
function setupIframeObserver() {
  if (typeof IntersectionObserver === 'undefined') return;
  if (!window._cardIframeObserver) {
    window._cardIframeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          if (iframe.dataset.srcdoc && iframe.srcdoc !== iframe.dataset.srcdoc) {
            iframe.srcdoc = iframe.dataset.srcdoc;
          }
          observer.unobserve(iframe);
        }
      });
    }, { rootMargin: '350px 0px' });
  }

  const grid = document.getElementById('components-grid');
  if (!grid) return;
  grid.querySelectorAll('iframe[data-srcdoc]:not([data-observed="true"])').forEach((iframe) => {
    iframe.dataset.observed = 'true';
    if (iframe.srcdoc === 'about:blank') {
      window._cardIframeObserver.observe(iframe);
    }
  });
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

    if (STATE.activeCategory === 'Favorites') {
      emptyState.innerHTML = `
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <i class="fa-solid fa-star text-3xl text-amber-400"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No Favorites Yet</h3>
        <p class="text-gray-400 mb-6 max-w-sm mx-auto text-sm">You haven't saved any components to your favorites yet. Tap the heart or bookmark icon on any card to add it here!</p>
        <button id="empty-explore-favorites-btn" type="button"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 text-white font-medium hover:brightness-110 shadow-lg shadow-brand-500/25 transition-all text-xs cursor-pointer">
          <i class="fa-solid fa-compass mr-1.5"></i> Explore Components
        </button>
      `;
      document.getElementById('empty-explore-favorites-btn')?.addEventListener('click', () => {
        document.getElementById('sidebar-home-btn')?.click();
      });
    } else {
      emptyState.innerHTML = `
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-700/50 flex items-center justify-center">
          <i class="fa-solid fa-wind text-3xl text-gray-600"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-400 mb-2" data-i18n="empty_title">No components found</h3>
        <p class="text-gray-600 mb-6" data-i18n="empty_hint">Try a different search term or category.</p>
        <button id="clear-search-btn" type="button"
          class="px-5 py-2.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-400 hover:bg-brand-600/30 transition-all text-sm font-medium cursor-pointer"
          data-i18n="main_clear_search">
          Clear search
        </button>
      `;
      document.getElementById('clear-search-btn')?.addEventListener('click', () => {
        STATE.searchQuery = '';
        STATE.activeCategory = 'All';
        STATE.framework = 'all';
        STATE.sort = 'newest';
        ['search-input', 'search-input-mobile'].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        updateFrameworkPillsUI('all');
        updateSortPillsUI('newest');
        renderCategoryFilters();
        loadComponents(true);
      });
    }
    return;
  }

  grid.style.display = '';
  emptyState.classList.add('hidden');

  if (!append) {
    grid.innerHTML = '';
  }

  components.forEach((comp, idx) => {
    // Eagerly load the first 12 cards on screen, lazy virtualize the rest
    const eagerLoad = !append && idx < 12;
    const div = document.createElement('div');
    div.innerHTML = renderComponentCard(comp, eagerLoad);
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
  setupIframeObserver();
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
      if (
        e.target.closest('.like-btn') ||
        e.target.closest('.card-copy-btn') ||
        e.target.closest('.card-share-btn') ||
        e.target.closest('.card-open-btn') ||
        e.target.closest('.card-theme-toggle') ||
        e.target.closest('.author-link')
      ) return;
      const id = card.dataset.id;
      if (id) window.openModal?.(id);
    });

    // Keyboard accessibility (ignore nested interactive buttons)
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.dataset.id;
        if (id) window.openModal?.(id);
      }
    });

    // Get code button from card overlay
    const openBtn = card.querySelector('.card-open-btn');
    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = openBtn.dataset.id || card.dataset.id;
        if (id) window.openModal?.(id);
      });
    }

    // Quick copy HTML & CSS from card overlay
    const copyBtn = card.querySelector('.card-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = copyBtn.dataset.id;
        const comp = STATE.components.find((c) => c.id === id) || findComponentAnywhere(id);
        if (!comp) return;
        const bundleCode = `<style>\n${comp.css || ''}\n</style>\n${comp.html || ''}`;
        const ok = await copyToClipboard(bundleCode);
        showToast(ok ? 'HTML & CSS copied to clipboard!' : 'Failed to copy', ok ? 'success' : 'error');
      });
    }

    // Direct Share Link button from card overlay
    const shareBtn = card.querySelector('.card-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = shareBtn.dataset.id;
        const shareUrl = window.location.origin + window.location.pathname + '#item-' + id;
        const ok = await copyToClipboard(shareUrl);
        showToast(ok ? 'Direct link copied to clipboard!' : 'Failed to copy link', ok ? 'success' : 'error');
      });
    }

    // Card Theme Toggle (Dark / Light / Pitch Black)
    const themeBtn = card.querySelector('.card-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const previewEl = card.querySelector('.card-preview');
        if (!previewEl) return;
        const iframe = previewEl.querySelector('iframe');
        const currentTheme = previewEl.dataset.canvasTheme || 'dark';

        // สลับ 2 โหมด: กลางคืน (dark) <-> กลางวัน (light)
        const isCurrentlyDark = currentTheme !== 'light';
        const nextTheme = isCurrentlyDark ? 'light' : 'dark';
        const nextBg = isCurrentlyDark ? '#ffffff' : '#212121';

        previewEl.dataset.canvasTheme = nextTheme;
        previewEl.style.backgroundColor = nextBg;

        // ไอคอนรูปครึ่งวงกลมขาว-ดำ (fa-circle-half-stroke) คงเดิมเสมอ
        themeBtn.title = nextTheme === 'light' ? 'Switch to Night mode' : 'Switch to Day mode';
        const iconEl = themeBtn.querySelector('i');
        if (iconEl) iconEl.className = 'fa-solid fa-circle-half-stroke text-[11px]';

        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage({ type: 'TOGGLE_THEME', theme: nextTheme }, '*');
          } catch (err) { }
        }
        try {
          if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
            iframe.contentDocument.documentElement.classList.toggle('dark', nextTheme !== 'light');
            iframe.contentDocument.documentElement.classList.toggle('light', nextTheme === 'light');
            iframe.contentDocument.body.classList.toggle('dark', nextTheme !== 'light');
            iframe.contentDocument.body.classList.toggle('light', nextTheme === 'light');
            iframe.contentDocument.documentElement.style.setProperty('background-color', nextBg, 'important');
            iframe.contentDocument.body.style.setProperty('background-color', nextBg, 'important');
          }
        } catch (err) { }
      });
    }

    // Click on author to filter by author
    const authorEl = card.querySelector('.author-link');
    if (authorEl) {
      authorEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const author = authorEl.dataset.author;
        if (author) {
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.value = author;
            searchInput.dispatchEvent(new Event('input'));
          }
        }
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
  if (!id) return null;
  if (typeof id === 'object' && id.id) id = id.id;

  const deletedIds = getDeletedComponentIds();
  if (deletedIds.has(id)) return null;

  let comp = STATE.components.find((c) => c.id === id) ||
    _localComponents.find((c) => c.id === id);

  if (!comp) {
    const uploads = getStoredUserUploads();
    comp = uploads.find((c) => c.id === id);
  }

  if (!comp) {
    const community = getStoredCommunityUploads();
    comp = community.find((c) => c.id === id);
  }

  if (!comp && window.INITIAL_COMPONENTS) {
    comp = window.INITIAL_COMPONENTS.find((c) => c.id === id);
  }

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
  // Gated action: Anonymous visitors cannot like without signing in
  if (!STATE.currentUser) {
    showToast('Please sign in to like components', 'info');
    if (typeof openSigninModal === 'function') {
      openSigninModal('signin', 'Sign in to like and save your favorite components');
    }
    return;
  }
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

    const baseLikes = getComponentLikesCount(comp);
    const nextLikes = willBeLiked
      ? Math.max(1, (wasLiked ? baseLikes : baseLikes + 1))
      : Math.max(0, baseLikes - 1);

    if (willBeLiked) {
      STATE.likedIds.add(id);
    } else {
      STATE.likedIds.delete(id);
    }

    const delta = willBeLiked ? 1 : -1;
    setComponentLikesCount(id, nextLikes, delta);

    uniqueComps.forEach((c) => {
      c.liked = willBeLiked;
      c.likes = nextLikes;
    });

    persistLikes();
    if (typeof updateHeroStats === 'function') updateHeroStats();

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
      if (typeof updateHeroStats === 'function') updateHeroStats();
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

/* --- Upload Modal & Uiverse Studio System --- */

const UIVERSE_CATEGORIES = [
  {
    id: 'Buttons',
    name: 'Button',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="3" y="10" width="26" height="12" rx="6" stroke="#9ca3af" stroke-width="2"/><rect x="7" y="13" width="10" height="6" rx="3" fill="#6366f1"/></svg>`
  },
  {
    id: 'Toggles',
    name: 'Toggle switch',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="4" y="10" width="24" height="12" rx="6" fill="#374151" stroke="#6b7280" stroke-width="1.5"/><circle cx="10" cy="16" r="4.5" fill="#fff"/></svg>`
  },
  {
    id: 'Checkboxes',
    name: 'Checkbox',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="6" y="6" width="20" height="20" rx="5" fill="#374151" stroke="#6b7280" stroke-width="1.5"/><path d="M11 16l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    id: 'Cards',
    name: 'Card',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="7" y="5" width="18" height="22" rx="4" fill="#374151" stroke="#6b7280" stroke-width="1.5"/><rect x="11" y="9" width="6" height="2" rx="1" fill="#fff"/><rect x="11" y="14" width="10" height="2" rx="1" fill="#9ca3af"/></svg>`
  },
  {
    id: 'Loaders',
    name: 'Loader',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><path d="M16 4v4M16 24v4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M4 16h4M24 16h4M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'Inputs',
    name: 'Input',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="4" y="10" width="24" height="12" rx="4" fill="#374151" stroke="#6b7280" stroke-width="1.5"/><circle cx="10" cy="16" r="1.5" fill="#9ca3af"/><circle cx="16" cy="16" r="1.5" fill="#9ca3af"/><circle cx="22" cy="16" r="1.5" fill="#9ca3af"/></svg>`
  },
  {
    id: 'Forms',
    name: 'Form',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="6" y="8" width="20" height="3" rx="1.5" fill="#9ca3af"/><rect x="6" y="14" width="15" height="3" rx="1.5" fill="#9ca3af"/><rect x="6" y="20" width="10" height="3" rx="1.5" fill="#9ca3af"/></svg>`
  },
  {
    id: 'Patterns',
    name: 'Pattern',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><path d="M6 26L26 6M6 18L18 6M6 10L10 6M14 26L26 14M22 26L26 22" stroke="#9ca3af" stroke-width="2.2" stroke-linecap="round"/></svg>`
  },
  {
    id: 'Radio buttons',
    name: 'Radio buttons',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><circle cx="8" cy="16" r="4.5" fill="#6366f1"/><circle cx="8" cy="16" r="2" fill="#fff"/><circle cx="16" cy="16" r="4" fill="#374151" stroke="#6b7280" stroke-width="1.5"/><circle cx="24" cy="16" r="4" fill="#374151" stroke="#6b7280" stroke-width="1.5"/></svg>`
  },
  {
    id: 'Tooltips',
    name: 'Tooltips',
    iconSvg: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="5" y="8" width="22" height="12" rx="4" fill="#374151" stroke="#6b7280" stroke-width="1.5"/><path d="M13 20L16 24L19 20Z" fill="#374151"/></svg>`
  }
];

const BOILERPLATES = {
  css: {
    Buttons: {
      title: 'My Custom Button',
      category: 'Buttons',
      html: `<button class="button">\n  Button\n</button>`,
      css: `.button {\n  cursor: pointer;\n  position: relative;\n  padding: 10px 24px;\n  font-size: 16px;\n  color: #ffffff;\n  border: 2px solid #3b82f6;\n  border-radius: 34px;\n  background-color: #1e1f24;\n  font-weight: 600;\n  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);\n  overflow: hidden;\n}\n\n.button:hover {\n  box-shadow: 0 0 16px rgba(59, 130, 246, 0.4);\n  background-color: #3b82f6;\n  color: #ffffff;\n  transform: translateY(-2px);\n}\n\n.button:active {\n  transform: scale(0.95);\n}`,
      bg: '#212121',
      activeTab: 'css',
    },
    Toggles: {
      title: 'My Custom Toggle Switch',
      category: 'Toggles',
      html: `<label class="switch">\n  <input type="checkbox">\n  <span class="slider"></span>\n</label>`,
      css: `/* The switch - the box around the slider */\n.switch {\n  font-size: 17px;\n  position: relative;\n  display: inline-block;\n  width: 3.5em;\n  height: 2em;\n}\n\n/* Hide default HTML checkbox */\n.switch input {\n  opacity: 0;\n  width: 0;\n  height: 0;\n}\n\n/* The slider */\n.slider {\n  position: absolute;\n  cursor: pointer;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background-color: #ccc;\n  transition: .4s;\n  border-radius: 30px;\n}\n\n.slider:before {\n  position: absolute;\n  content: "";\n  height: 1.4em;\n  width: 1.4em;\n  border-radius: 20px;\n  left: 0.3em;\n  bottom: 0.3em;\n  background-color: white;\n  transition: .4s;\n}\n\ninput:checked + .slider {\n  background-color: #2196F3;\n}\n\ninput:focus + .slider {\n  box-shadow: 0 0 1px #2196F3;\n}\n\ninput:checked + .slider:before {\n  transform: translateX(1.5em);\n}`,
      bg: '#212121',
      activeTab: 'html',
    },
    Checkboxes: {
      title: 'My Custom Checkbox',
      category: 'Checkboxes',
      html: `<label class="container">\n  <input type="checkbox" checked="checked">\n  <div class="checkmark"></div>\n</label>`,
      css: `/* Hide default checkbox */\n.container input {\n  position: absolute;\n  opacity: 0;\n  cursor: pointer;\n  height: 0;\n  width: 0;\n}\n\n.container {\n  display: block;\n  position: relative;\n  cursor: pointer;\n  font-size: 20px;\n  user-select: none;\n}\n\n.checkmark {\n  position: relative;\n  top: 0;\n  left: 0;\n  height: 1.3em;\n  width: 1.3em;\n  background-color: #ccc;\n  border-radius: 4px;\n  transition: 0.2s;\n}\n\n.container input:checked ~ .checkmark {\n  background-color: #2196F3;\n}\n\n.checkmark:after {\n  content: "";\n  position: absolute;\n  display: none;\n}\n\n.container input:checked ~ .checkmark:after {\n  display: block;\n}\n\n.container .checkmark:after {\n  left: 0.45em;\n  top: 0.25em;\n  width: 0.25em;\n  height: 0.5em;\n  border: solid white;\n  border-width: 0 0.15em 0.15em 0;\n  transform: rotate(45deg);\n}`,
      bg: '#212121',
      activeTab: 'html',
    },
    Cards: {
      title: 'My Custom Card',
      category: 'Cards',
      html: `<div class="card">\n  <div class="card-details">\n    <p class="text-title">Card Title</p>\n    <p class="text-body">Here are the details of the card</p>\n  </div>\n  <button class="card-button">More info</button>\n</div>`,
      css: `.card {\n  width: 190px;\n  height: 254px;\n  border-radius: 20px;\n  background: #212121;\n  position: relative;\n  padding: 1.8rem;\n  border: 2px solid #c3c6ce;\n  transition: 0.5s ease-out;\n  overflow: visible;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n}\n\n.card-details {\n  color: white;\n  height: 100%;\n  gap: .5em;\n  display: grid;\n  place-content: center;\n}\n\n.card-button {\n  transform: translate(-50%, 125%);\n  width: 60%;\n  border-radius: 1rem;\n  border: none;\n  background-color: #008bf8;\n  color: #fff;\n  font-size: 1rem;\n  padding: .5rem 1rem;\n  position: absolute;\n  left: 50%;\n  bottom: 0;\n  opacity: 0;\n  transition: 0.3s ease-out;\n  cursor: pointer;\n}\n\n.text-body {\n  color: rgb(134, 134, 134);\n  font-size: 0.8em;\n  text-align: center;\n}\n\n.text-title {\n  font-size: 1.5em;\n  font-weight: bold;\n  text-align: center;\n}\n\n.card:hover {\n  border-color: #008bf8;\n  box-shadow: 0 4px 18px 0 rgba(0, 0, 0, 0.25);\n}\n\n.card:hover .card-button {\n  transform: translate(-50%, 50%);\n  opacity: 1;\n}`,
      bg: '#212121',
      activeTab: 'html',
    },
    Loaders: {
      title: 'My Custom Loader',
      category: 'Loaders',
      html: `<div class="loader"></div>`,
      css: `.loader {\n  width: 48px;\n  height: 48px;\n  border: 5px solid #FFF;\n  border-bottom-color: #FF3D00;\n  border-radius: 50%;\n  display: inline-block;\n  box-sizing: border-box;\n  animation: rotation 1s linear infinite;\n}\n\n@keyframes rotation {\n  0% { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }\n}`,
      bg: '#212121',
      activeTab: 'css',
    },
    Inputs: {
      title: 'My Custom Input',
      category: 'Inputs',
      html: `<div class="input-group">\n  <input required="" type="text" name="text" autocomplete="off" class="input">\n  <label class="user-label">First Name</label>\n</div>`,
      css: `.input-group {\n  position: relative;\n}\n\n.input {\n  border: solid 1.5px #9e9e9e;\n  border-radius: 1rem;\n  background: none;\n  padding: 1rem;\n  font-size: 1rem;\n  color: #f5f5f5;\n  transition: border 150ms cubic-bezier(0.4,0,0.2,1);\n}\n\n.user-label {\n  position: absolute;\n  left: 15px;\n  color: #e8e8e8;\n  pointer-events: none;\n  transform: translateY(1rem);\n  transition: 150ms cubic-bezier(0.4,0,0.2,1);\n}\n\n.input:focus, input:valid {\n  outline: none;\n  border: 1.5px solid #1a73e8;\n}\n\n.input:focus ~ label, input:valid ~ label {\n  transform: translateY(-50%) scale(0.8);\n  background-color: #212121;\n  padding: 0 .2em;\n  color: #2196f3;\n}`,
      bg: '#212121',
      activeTab: 'html',
    },
    Forms: {
      title: 'My Custom Form',
      category: 'Forms',
      html: `<form class="form">\n  <p class="title">Register</p>\n  <p class="message">Signup now and get full access to our app.</p>\n  <label>\n    <input required="" placeholder="" type="email" class="input">\n    <span>Email</span>\n  </label>\n  <label>\n    <input required="" placeholder="" type="password" class="input">\n    <span>Password</span>\n  </label>\n  <button class="submit">Submit</button>\n</form>`,
      css: `.form {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  max-width: 350px;\n  background-color: #1f1f1f;\n  padding: 20px;\n  border-radius: 20px;\n  position: relative;\n}\n\n.title {\n  font-size: 28px;\n  color: royalblue;\n  font-weight: 600;\n  letter-spacing: -1px;\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n\n.message {\n  color: rgba(255, 255, 255, 0.7);\n  font-size: 14px;\n}\n\n.form label {\n  position: relative;\n}\n\n.form label .input {\n  width: 100%;\n  padding: 10px 10px 20px 10px;\n  outline: 0;\n  border: 1px solid rgba(255, 255, 255, 0.3);\n  border-radius: 10px;\n  background: transparent;\n  color: #fff;\n}\n\n.form label .input + span {\n  position: absolute;\n  left: 10px;\n  top: 15px;\n  color: grey;\n  font-size: 0.9em;\n  cursor: text;\n  transition: 0.3s ease;\n}\n\n.form label .input:focus + span,\n.form label .input:valid + span {\n  top: 30px;\n  font-size: 0.7em;\n  font-weight: 600;\n}\n\n.submit {\n  border: none;\n  outline: none;\n  background-color: royalblue;\n  padding: 10px;\n  border-radius: 10px;\n  color: #fff;\n  font-size: 16px;\n  cursor: pointer;\n}\n\n.submit:hover {\n  background-color: rgb(56, 90, 194);\n}`,
      bg: '#212121',
      activeTab: 'html',
    },
    Patterns: {
      title: 'My Custom Pattern',
      category: 'Patterns',
      html: `<div class="pattern-container"></div>`,
      css: `.pattern-container {\n  width: 100%;\n  height: 100%;\n  min-height: 240px;\n  --color: rgba(255, 255, 255, 0.15);\n  background-color: #212121;\n  background-image: linear-gradient(0deg, transparent 24%, var(--color) 25%, var(--color) 26%, transparent 27%, transparent 74%, var(--color) 75%, var(--color) 76%, transparent 77%, transparent),\n      linear-gradient(90deg, transparent 24%, var(--color) 25%, var(--color) 26%, transparent 27%, transparent 74%, var(--color) 75%, var(--color) 76%, transparent 77%, transparent);\n  background-size: 55px 55px;\n}`,
      bg: '#212121',
      activeTab: 'css',
    },
    'Radio buttons': {
      title: 'My Custom Radio Buttons',
      category: 'Radio buttons',
      html: `<div class="radio-input">\n  <label>\n    <input type="radio" id="value-1" name="value-radio" value="value-1" checked="">\n    <span>Option 1</span>\n  </label>\n  <label>\n    <input type="radio" id="value-2" name="value-radio" value="value-2">\n    <span>Option 2</span>\n  </label>\n  <label>\n    <input type="radio" id="value-3" name="value-radio" value="value-3">\n    <span>Option 3</span>\n  </label>\n  <span class="selection"></span>\n</div>`,
      css: `.radio-input input {\n  display: none;\n}\n\n.radio-input {\n  --container_width: 300px;\n  position: relative;\n  display: flex;\n  align-items: center;\n  border-radius: 10px;\n  background-color: #212121;\n  color: #fff;\n  width: var(--container_width);\n  overflow: hidden;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}\n\n.radio-input label {\n  width: 100%;\n  padding: 10px;\n  cursor: pointer;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  z-index: 1;\n  font-weight: 600;\n  letter-spacing: -1px;\n  font-size: 14px;\n}\n\n.selection {\n  display: none;\n  position: absolute;\n  height: 100%;\n  width: calc(var(--container_width) / 3);\n  z-index: 0;\n  left: 0;\n  top: 0;\n  transition: .15s ease;\n}\n\n.radio-input label:has(input:checked) {\n  color: #fff;\n}\n\n.radio-input label:has(input:checked) ~ .selection {\n  background-color: #6366f1;\n  display: inline-block;\n}\n\n.radio-input label:nth-child(1):has(input:checked) ~ .selection {\n  transform: translateX(calc(var(--container_width) * 0/3));\n}\n\n.radio-input label:nth-child(2):has(input:checked) ~ .selection {\n  transform: translateX(calc(var(--container_width) * 1/3));\n}\n\n.radio-input label:nth-child(3):has(input:checked) ~ .selection {\n  transform: translateX(calc(var(--container_width) * 2/3));\n}`,
      bg: '#212121',
      activeTab: 'html',
    },
    Tooltips: {
      title: 'My Custom Tooltip',
      category: 'Tooltips',
      html: `<div class="tooltip-container">\n  <span class="tooltip">Hello, I'm a tooltip!</span>\n  <span class="text">Hover me</span>\n</div>`,
      css: `.tooltip-container {\n  position: relative;\n  cursor: pointer;\n  transition: all 0.2s;\n  font-size: 17px;\n  border-radius: 10px;\n}\n\n.tooltip {\n  position: absolute;\n  top: 0;\n  left: 50%;\n  transform: translateX(-50%);\n  padding: 10px;\n  opacity: 0;\n  pointer-events: none;\n  transition: all 0.3s;\n  border-radius: 15px;\n  box-shadow: inset 5px 5px 5px rgba(0, 0, 0, 0.2),\n    inset -5px -5px 15px rgba(255, 255, 255, 0.1),\n    5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.1);\n  background: #212121;\n  color: white;\n  white-space: nowrap;\n  font-size: 13px;\n}\n\n.tooltip-container:hover .tooltip {\n  top: -45px;\n  opacity: 1;\n  visibility: visible;\n  pointer-events: auto;\n}\n\n.text {\n  color: white;\n  background: #333;\n  padding: 10px 20px;\n  border-radius: 8px;\n  display: inline-block;\n}`,
      bg: '#212121',
      activeTab: 'html',
    }
  },
  tailwind: {
    Buttons: {
      title: 'My Custom Button',
      category: 'Buttons',
      html: `<button class="px-5 py-2.5 font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all cursor-pointer">\n  Button\n</button>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Toggles: {
      title: 'My Custom Toggle Switch',
      category: 'Toggles',
      html: `<label class="relative inline-flex items-center cursor-pointer">\n  <input type="checkbox" class="sr-only peer">\n  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>\n</label>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Checkboxes: {
      title: 'My Custom Checkbox',
      category: 'Checkboxes',
      html: `<label class="flex items-center space-x-2.5 cursor-pointer select-none">\n  <input type="checkbox" checked class="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2">\n  <span class="text-sm font-medium text-gray-200">Checkbox</span>\n</label>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Cards: {
      title: 'My Custom Card',
      category: 'Cards',
      html: `<div class="max-w-xs p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl text-center">\n  <h5 class="mb-2 text-xl font-bold tracking-tight text-white">Card Title</h5>\n  <p class="mb-4 text-xs text-gray-400">Here are the details of the card in Tailwind CSS.</p>\n  <button class="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">\n    More info\n  </button>\n</div>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Loaders: {
      title: 'My Custom Loader',
      category: 'Loaders',
      html: `<div class="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Inputs: {
      title: 'My Custom Input',
      category: 'Inputs',
      html: `<div class="w-64">\n  <input type="text" placeholder="Enter text..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm">\n</div>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Forms: {
      title: 'My Custom Form',
      category: 'Forms',
      html: `<form class="w-72 p-6 bg-gray-900 border border-gray-800 rounded-2xl space-y-3.5">\n  <h2 class="text-lg font-bold text-white">Login</h2>\n  <div>\n    <input type="email" placeholder="Email" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">\n  </div>\n  <div>\n    <input type="password" placeholder="Password" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">\n  </div>\n  <button type="button" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors">\n    Submit\n  </button>\n</form>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Patterns: {
      title: 'My Custom Pattern',
      category: 'Patterns',
      html: `<div class="w-64 h-64 bg-gray-950 rounded-2xl border border-gray-800 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    'Radio buttons': {
      title: 'My Custom Radio Buttons',
      category: 'Radio buttons',
      html: `<div class="flex items-center space-x-4 bg-gray-900 p-3 rounded-xl border border-gray-800">\n  <label class="flex items-center space-x-2 cursor-pointer">\n    <input type="radio" name="radio-demo" checked class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 focus:ring-blue-500">\n    <span class="text-xs text-gray-300">Option 1</span>\n  </label>\n  <label class="flex items-center space-x-2 cursor-pointer">\n    <input type="radio" name="radio-demo" class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 focus:ring-blue-500">\n    <span class="text-xs text-gray-300">Option 2</span>\n  </label>\n</div>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    },
    Tooltips: {
      title: 'My Custom Tooltip',
      category: 'Tooltips',
      html: `<div class="group relative inline-block">\n  <button class="px-4 py-2 bg-gray-800 text-white text-xs rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">\n    Hover me\n  </button>\n  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2.5 py-1 bg-black text-white text-[11px] rounded shadow-lg whitespace-nowrap">\n    Tooltip text\n  </div>\n</div>`,
      css: '',
      bg: '#212121',
      activeTab: 'html',
    }
  }
};

// Fallback direct category access for compatibility
Object.keys(BOILERPLATES.css).forEach(k => {
  BOILERPLATES[k] = BOILERPLATES.css[k];
});

const UPLOAD_STUDIO = {
  title: 'My Custom Button',
  category: 'Buttons',
  tech: 'css',
  pendingTech: 'css',
  activeTab: 'css',
  html: '',
  css: '',
  bg: '#212121',
  pendingCategory: 'Buttons',
  isDirty: false
};
window.UPLOAD_STUDIO = UPLOAD_STUDIO;

function updateTechSelectorUI(tech) {
  tech = tech || UPLOAD_STUDIO.pendingTech || 'css';
  const techBtns = document.querySelectorAll('#tech-selector button');
  techBtns.forEach(btn => {
    const isCur = btn.dataset.tech === tech;
    btn.classList.toggle('active', isCur);
    btn.classList.toggle('bg-[#27272a]', isCur);
    btn.classList.toggle('text-white', isCur);
    btn.classList.toggle('text-gray-400', !isCur);
  });
}

function renderCategoryDialogGrid() {
  const grid = document.getElementById('category-dialog-grid');
  if (!grid) return;
  grid.innerHTML = UIVERSE_CATEGORIES.map(cat => {
    const isSelected = cat.id === UPLOAD_STUDIO.pendingCategory;
    return `
      <div class="category-choice-card flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-[#1e1f24] hover:bg-[#25262e] border transition-all cursor-pointer select-none group ${isSelected ? 'border-2 border-indigo-500 bg-[#252433] shadow-md shadow-indigo-500/20' : 'border-white/10 hover:border-white/25'}" data-category="${cat.id}">
        <div class="mb-2 group-hover:scale-110 transition-transform flex items-center justify-center">
          ${cat.iconSvg}
        </div>
        <span class="text-xs font-semibold text-gray-200 group-hover:text-white text-center">${cat.name}</span>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.category-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      const catId = card.dataset.category;
      UPLOAD_STUDIO.pendingCategory = catId;
      grid.querySelectorAll('.category-choice-card').forEach(c => {
        const sel = c.dataset.category === catId;
        c.className = `category-choice-card flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-[#1e1f24] hover:bg-[#25262e] border transition-all cursor-pointer select-none group ${sel ? 'border-2 border-indigo-500 bg-[#252433] shadow-md shadow-indigo-500/20' : 'border-white/10 hover:border-white/25'}`;
      });
    });
    // Double click to immediately apply and close
    card.addEventListener('dblclick', () => {
      applySelectedCategory(card.dataset.category, UPLOAD_STUDIO.pendingTech);
    });
  });
}

function renderUploadTabs() {
  const container = document.getElementById('upload-tabs');
  if (!container) return;

  if (UPLOAD_STUDIO.tech === 'tailwind') {
    container.innerHTML = `
      <button type="button"
        class="tab-btn active px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-[#27272a] text-white shadow-sm cursor-pointer"
        data-upload-tab="html">
        <i class="fa-brands fa-html5 text-[#e34f26] text-sm"></i>
        <span>HTML</span>
        <span class="text-gray-400 font-normal">+</span>
        <i class="fa-solid fa-wind text-sky-400 text-sm"></i>
        <span>TailwindCSS</span>
      </button>
    `;
    UPLOAD_STUDIO.activeTab = 'html';
  } else {
    const isHtml = UPLOAD_STUDIO.activeTab === 'html';
    const isCss = UPLOAD_STUDIO.activeTab === 'css';
    container.innerHTML = `
      <button type="button"
        class="tab-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${isHtml ? 'active bg-[#27272a] text-white shadow-sm' : 'text-gray-400 hover:text-white'}"
        data-upload-tab="html">
        <i class="fa-brands fa-html5 text-[#e34f26] text-sm"></i>
        <span>HTML</span>
      </button>
      <button type="button"
        class="tab-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${isCss ? 'active bg-[#27272a] text-white shadow-sm' : 'text-gray-400 hover:text-white'}"
        data-upload-tab="css">
        <i class="fa-brands fa-css3-alt text-[#1572b6] text-sm"></i>
        <span>CSS</span>
      </button>
    `;
  }

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.uploadTab;
      if (tab) setUploadActiveTab(tab);
    });
  });
}

function applySelectedCategory(catId, tech) {
  if (UPLOAD_STUDIO.isDirty) {
    if (!confirm('การเปลี่ยนหมวดหมู่หรือเทคโนโลยีจะเขียนทับโค้ดที่คุณแก้ไขอยู่ในปัจจุบันด้วยเทมเพลตเริ่มต้น คุณต้องการดำเนินการต่อหรือไม่?')) {
      return false;
    }
  }
  catId = catId || UPLOAD_STUDIO.pendingCategory || 'Buttons';
  tech = tech || UPLOAD_STUDIO.pendingTech || 'css';
  UPLOAD_STUDIO.category = catId;
  UPLOAD_STUDIO.tech = tech;
  UPLOAD_STUDIO.pendingCategory = catId;
  UPLOAD_STUDIO.pendingTech = tech;

  const templates = BOILERPLATES[tech] || BOILERPLATES.css;
  const template = templates[catId] || templates.Buttons;

  UPLOAD_STUDIO.title = template.title;
  UPLOAD_STUDIO.html = template.html;
  UPLOAD_STUDIO.css = template.css;
  UPLOAD_STUDIO.bg = template.bg || '#212121';
  UPLOAD_STUDIO.isDirty = false;

  if (tech === 'css') {
    UPLOAD_STUDIO.activeTab = template.activeTab || 'html';
  } else {
    UPLOAD_STUDIO.activeTab = 'html';
  }

  // Sync inputs
  const titleInput = document.getElementById('upload-title');
  if (titleInput) titleInput.value = UPLOAD_STUDIO.title;
  const catBadge = document.getElementById('upload-category-badge');
  const catObj = UIVERSE_CATEGORIES.find(c => c.id === catId);
  if (catBadge) catBadge.textContent = catObj ? catObj.name : catId;
  const hiddenCat = document.getElementById('upload-category');
  if (hiddenCat) hiddenCat.value = catId;

  // Render tabs for selected tech 00
  renderUploadTabs();

  // Sync editor with active tab & background
  updateUploadBg(UPLOAD_STUDIO.bg);
  syncUploadEditorFromState();
  updateUploadPreview();
  updateUploadStatus('Unsaved changes', true);

  // Hide category dialog
  const catDialog = document.getElementById('upload-category-dialog');
  if (catDialog) catDialog.classList.add('hidden');
}

function setUploadActiveTab(tab) {
  // Save current editor text into state
  const editor = document.getElementById('upload-code-editor');
  if (editor) {
    if (UPLOAD_STUDIO.activeTab === 'html') UPLOAD_STUDIO.html = editor.value;
    else if (UPLOAD_STUDIO.activeTab === 'css') UPLOAD_STUDIO.css = editor.value;
  }
  UPLOAD_STUDIO.activeTab = tab;

  // Toggle tab buttons
  const tabBtns = document.querySelectorAll('#upload-tabs button');
  tabBtns.forEach(btn => {
    const isActive = btn.dataset.uploadTab === tab;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('bg-[#27272a]', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('text-gray-400', !isActive);
  });

  syncUploadEditorFromState();
  updateUploadPreview();
}

function highlightUploadCode(code, lang) {
  if (lang === 'html') {
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
  } else if (lang === 'css') {
    return escapeHtml(code)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>')
      .replace(/([^{]+)({)/g, '<span class="syntax-selector">$1</span>$2')
      .replace(/([\w-]+)(\s*:)/g, '<span class="syntax-property">$1</span>$2')
      .replace(/(:)([^;]+)(;)/g, '$1<span class="syntax-value">$2</span>$3');
  }
  return escapeHtml(code);
}

function updateUploadLineNumbers(code, gutterEl) {
  if (!gutterEl) return;
  const lineCount = Math.max(1, (code || '').split('\n').length);
  gutterEl.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
}

function syncUploadEditorFromState() {
  const editor = document.getElementById('upload-code-editor');
  const codeEl = document.getElementById('upload-syntax-code');
  const lineGutter = document.getElementById('upload-line-numbers');
  const hiddenHtml = document.getElementById('upload-html');
  const hiddenCss = document.getElementById('upload-css');

  if (hiddenHtml) hiddenHtml.value = UPLOAD_STUDIO.html;
  if (hiddenCss) hiddenCss.value = UPLOAD_STUDIO.css;

  const currentCode = UPLOAD_STUDIO.activeTab === 'html' ? UPLOAD_STUDIO.html : UPLOAD_STUDIO.css;
  const lang = UPLOAD_STUDIO.activeTab === 'html' ? 'html' : 'css';

  if (editor) editor.value = currentCode;
  if (codeEl) codeEl.innerHTML = highlightUploadCode(currentCode, lang);
  if (lineGutter) updateUploadLineNumbers(currentCode, lineGutter);
}

function updateUploadPreview() {
  const iframe = document.getElementById('upload-preview-iframe');
  if (!iframe) return;
  const srcDoc = buildPreviewSrcDoc(
    UPLOAD_STUDIO.html,
    UPLOAD_STUDIO.css,
    UPLOAD_STUDIO.category,
    true,
    UPLOAD_STUDIO.bg
  );
  iframe.srcdoc = srcDoc;
}

function updateUploadBg(newBg) {
  if (!newBg) return;
  UPLOAD_STUDIO.bg = newBg;
  const isLight = newBg.toLowerCase() === '#e8e8e8' || newBg.toLowerCase() === '#ffffff' || (typeof isHexColorDark === 'function' ? !isHexColorDark(newBg) : false);
  const wrapper = document.getElementById('upload-canvas-wrapper');
  if (wrapper) wrapper.style.backgroundColor = newBg;
  const hexLabel = document.getElementById('upload-bg-hex-label');
  if (hexLabel) hexLabel.textContent = newBg.toUpperCase();
  const picker = document.getElementById('upload-bg-picker');
  if (picker && newBg.startsWith('#')) picker.value = newBg;

  const colorBtn = document.getElementById('upload-color-picker-btn');
  if (colorBtn) {
    colorBtn.style.backgroundColor = newBg;
    colorBtn.style.borderColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
  }

  const thumb = document.getElementById('upload-toggle-thumb');
  const track = document.getElementById('upload-toggle-track');
  const toggleIcon = document.querySelector('#upload-theme-toggle i');
  if (thumb) {
    thumb.style.transform = isLight ? 'translateX(14px)' : 'translateX(0px)';
    thumb.style.backgroundColor = isLight ? '#f59e0b' : '#ffffff';
  }
  if (track) {
    track.className = `w-7 h-3.5 rounded-full relative inline-block transition-colors ml-1 mr-0.5 ${isLight ? 'bg-amber-500/40' : 'bg-white/10'}`;
  }
  if (toggleIcon) {
    toggleIcon.className = isLight ? 'fa-regular fa-sun text-[11px] text-amber-400 ml-1' : 'fa-regular fa-moon text-[11px] text-indigo-400 ml-1';
  }

  const iframe = document.getElementById('upload-preview-iframe');
  if (iframe) {
    let directUpdated = false;
    if (iframe.contentDocument) {
      try {
        const doc = iframe.contentDocument;
        if (doc.documentElement) {
          doc.documentElement.style.backgroundColor = newBg;
          doc.documentElement.className = isLight ? 'light' : 'dark';
        }
        if (doc.body) {
          doc.body.style.backgroundColor = newBg;
          directUpdated = true;
        }
      } catch (e) { }
    }
    try {
      iframe.contentWindow?.postMessage({ type: 'UPDATE_BG', bg: newBg, isLight }, '*');
    } catch (e) { }

    // If iframe has no srcdoc loaded yet, load it now
    if (!iframe.srcdoc) {
      updateUploadPreview();
    }
  }
}

function updateUploadStatus(text, isUnsaved = true) {
  const statusText = document.getElementById('upload-status-text');
  const statusDot = document.querySelector('#upload-status-indicator span:first-child');
  const indicator = document.getElementById('upload-status-indicator');
  if (statusText) statusText.textContent = text;
  if (isUnsaved) {
    if (indicator) indicator.className = 'flex items-center gap-1.5 text-amber-400 font-medium text-xs';
    if (statusDot) statusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
  } else {
    if (indicator) indicator.className = 'flex items-center gap-1.5 text-emerald-400 font-medium text-xs';
    if (statusDot) statusDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
  }
}

function openUploadModal(initialData = null) {
  const modal = document.getElementById('upload-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const authorDisplay = document.getElementById('upload-author-display');
  const currentAuthor = STATE.currentUser?.displayName || (STATE.currentUser?.email ? STATE.currentUser.email.split('@')[0] : 'creator');
  if (authorDisplay) authorDisplay.textContent = '@' + currentAuthor;
  const authorInput = document.getElementById('upload-author');
  if (authorInput) authorInput.value = currentAuthor;

  if (initialData) {
    // Loaded from Remix, Edit or existing component
    UPLOAD_STUDIO.isDirty = false;
    UPLOAD_STUDIO.title = initialData.title || 'My Custom Button';
    UPLOAD_STUDIO.category = initialData.category || 'Buttons';
    UPLOAD_STUDIO.html = initialData.html || '';
    UPLOAD_STUDIO.css = initialData.css || '';
    UPLOAD_STUDIO.bg = initialData.bg || '#212121';
    UPLOAD_STUDIO.tech = initialData.tech || ((initialData.css && initialData.css.trim()) ? 'css' : 'tailwind');
    UPLOAD_STUDIO.activeTab = initialData.activeTab || 'html';

    const titleInput = document.getElementById('upload-title');
    if (titleInput) titleInput.value = UPLOAD_STUDIO.title;
    const catBadge = document.getElementById('upload-category-badge');
    const catObj = UIVERSE_CATEGORIES.find(c => c.id === UPLOAD_STUDIO.category);
    if (catBadge) catBadge.textContent = catObj ? catObj.name : UPLOAD_STUDIO.category;
    const hiddenCat = document.getElementById('upload-category');
    if (hiddenCat) hiddenCat.value = UPLOAD_STUDIO.category;

    // Explicitly hide category popup
    const catDialog = document.getElementById('upload-category-dialog');
    if (catDialog) catDialog.classList.add('hidden');

    renderUploadTabs();
    syncUploadEditorFromState();
    updateUploadPreview();
    updateUploadBg(UPLOAD_STUDIO.bg);
  } else {
    // Check for saved draft
    let restored = false;
    try {
      const saved = localStorage.getItem('uiforge_saved_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft && (draft.html || draft.css)) {
          if (confirm(`พบแบบร่างที่คุณเคยบันทึกไว้ ("${draft.title || 'Untitled Draft'}") ต้องการกู้คืนแบบร่างนี้หรือไม่?`)) {
            openUploadModal(draft);
            restored = true;
          }
        }
      }
    } catch (_) { }

    if (!restored) {
      // Fresh upload: Show "What are you making?" dialog!
      UPLOAD_STUDIO.pendingCategory = 'Buttons';
      UPLOAD_STUDIO.pendingTech = 'css';

      updateTechSelectorUI('css');
      renderCategoryDialogGrid();

      // Pre-populate background studio with Buttons + CSS boilerplate
      applySelectedCategory('Buttons', 'css');

      // Show category dialog on top!
      const catDialog = document.getElementById('upload-category-dialog');
      if (catDialog) catDialog.classList.remove('hidden');
    }
  }
}

function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  const catDialog = document.getElementById('upload-category-dialog');
  if (catDialog) catDialog.classList.add('hidden');
}

function setupUploadStudio() {
  // Tabs: HTML / CSS
  renderUploadTabs();

  // Code editor events
  const editor = document.getElementById('upload-code-editor');
  const codeEl = document.getElementById('upload-syntax-code');
  const lineGutter = document.getElementById('upload-line-numbers');
  let uploadPreviewDebounceTimer = null;

  if (editor) {
    editor.addEventListener('input', () => {
      const val = editor.value;
      if (UPLOAD_STUDIO.activeTab === 'html') UPLOAD_STUDIO.html = val;
      else if (UPLOAD_STUDIO.activeTab === 'css') UPLOAD_STUDIO.css = val;
      UPLOAD_STUDIO.isDirty = true;

      const lang = UPLOAD_STUDIO.activeTab === 'html' ? 'html' : 'css';
      if (codeEl) codeEl.innerHTML = highlightUploadCode(val, lang);
      if (lineGutter) updateUploadLineNumbers(val, lineGutter);

      if (uploadPreviewDebounceTimer) clearTimeout(uploadPreviewDebounceTimer);
      uploadPreviewDebounceTimer = setTimeout(() => {
        updateUploadPreview();
      }, 180);

      updateUploadStatus('Unsaved changes', true);
    });

    editor.addEventListener('scroll', () => {
      const { scrollTop, scrollLeft } = editor;
      const highlight = document.getElementById('upload-syntax-highlight');
      if (highlight) highlight.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
      if (lineGutter) lineGutter.style.transform = `translateY(${-scrollTop}px)`;
    });

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
        editor.dispatchEvent(new Event('input'));
      }
    });
  }

  // Title input change
  const titleInput = document.getElementById('upload-title');
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      UPLOAD_STUDIO.title = titleInput.value;
      UPLOAD_STUDIO.isDirty = true;
      updateUploadStatus('Unsaved changes', true);
    });
  }

  // Change type button
  const changeTypeBtn = document.getElementById('upload-change-type-btn');
  if (changeTypeBtn) {
    changeTypeBtn.addEventListener('click', () => {
      UPLOAD_STUDIO.pendingCategory = UPLOAD_STUDIO.category || 'Buttons';
      UPLOAD_STUDIO.pendingTech = UPLOAD_STUDIO.tech || 'css';
      updateTechSelectorUI(UPLOAD_STUDIO.pendingTech);
      renderCategoryDialogGrid();
      const catDialog = document.getElementById('upload-category-dialog');
      if (catDialog) catDialog.classList.remove('hidden');
    });
  }

  // Category dialog close
  const catDialogClose = document.getElementById('category-dialog-close');
  if (catDialogClose) {
    catDialogClose.addEventListener('click', () => {
      const catDialog = document.getElementById('upload-category-dialog');
      if (catDialog) catDialog.classList.add('hidden');
    });
  }

  // Category dialog backdrop close
  const catDialogEl = document.getElementById('upload-category-dialog');
  if (catDialogEl) {
    catDialogEl.addEventListener('click', (e) => {
      if (e.target === catDialogEl) {
        catDialogEl.classList.add('hidden');
      }
    });
  }

  // Category dialog continue button
  const catDialogContinue = document.getElementById('category-dialog-continue');
  if (catDialogContinue) {
    catDialogContinue.addEventListener('click', () => {
      applySelectedCategory(UPLOAD_STUDIO.pendingCategory, UPLOAD_STUDIO.pendingTech);
    });
  }

  // Technology toggle (CSS / Tailwind)
  const techBtns = document.querySelectorAll('#tech-selector button');
  techBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tech = btn.dataset.tech || 'css';
      UPLOAD_STUDIO.pendingTech = tech;
      updateTechSelectorUI(tech);
    });
  });

  // Canvas background controls
  const bgPicker = document.getElementById('upload-bg-picker');
  if (bgPicker) {
    bgPicker.addEventListener('input', (e) => {
      updateUploadBg(e.target.value);
    });
  }

  const themeToggle = document.getElementById('upload-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = UPLOAD_STUDIO.bg.toLowerCase();
      const isLight = current === '#e8e8e8' || current === '#ffffff';
      updateUploadBg(isLight ? '#212121' : '#e8e8e8');
    });
  }

  const uploadColorPickerBtn = document.getElementById('upload-color-picker-btn');
  const uploadBgPicker = document.getElementById('upload-bg-picker');
  if (uploadColorPickerBtn && uploadBgPicker) {
    uploadColorPickerBtn.addEventListener('click', (e) => {
      // <label for="upload-bg-picker"> natively activates the input
      if (e.target === uploadBgPicker) return;
    });
  }

  // Save as a draft button
  const draftBtn = document.getElementById('upload-draft-btn');
  if (draftBtn) {
    draftBtn.addEventListener('click', () => {
      const draft = {
        title: UPLOAD_STUDIO.title,
        category: UPLOAD_STUDIO.category,
        html: UPLOAD_STUDIO.html,
        css: UPLOAD_STUDIO.css,
        bg: UPLOAD_STUDIO.bg,
        date: new Date().toISOString()
      };
      try {
        localStorage.setItem('uiforge_saved_draft', JSON.stringify(draft));
        updateUploadStatus('All changes saved', false);
        showToast('Draft saved successfully to browser storage!', 'success');
      } catch (_) {
        showToast('Unable to save draft', 'error');
      }
    });
  }

  // Close Studio button
  const closeBtn = document.getElementById('upload-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeUploadModal);

  // Submit button
  const submitBtn = document.getElementById('upload-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleUpload);
  }
}


/* ============================================================
   8. DATA LOADING
   ============================================================ */

/**
 * Detects URL hash route (#item-<id>) on startup and opens modal automatically.
 */
function checkInitialHashRoute() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#item-')) return;
  const id = hash.replace('#item-', '');
  const tryOpen = (attempts = 0) => {
    const comp = findComponentAnywhere(id);
    if (comp) {
      window.openModal?.(comp, false);
    } else if (attempts < 20) {
      setTimeout(() => tryOpen(attempts + 1), 150);
    }
  };
  tryOpen();
}

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
      framework: STATE.framework,
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

    // Deep link auto-open on initial load
    if (reset && !window._initialHashChecked) {
      window._initialHashChecked = true;
      checkInitialHashRoute();
    }

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

  // Sync search inputs in real-time
  const searchInputDesktop = document.getElementById('search-input');
  const searchInputMobile = document.getElementById('search-input-mobile');
  if (searchInputDesktop && searchInputMobile) {
    searchInputDesktop.addEventListener('input', (e) => {
      searchInputMobile.value = e.target.value;
    });
    searchInputMobile.addEventListener('input', (e) => {
      searchInputDesktop.value = e.target.value;
    });
  }

  /* --- Navigation Links --- */
  document.getElementById('logo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    STATE.searchQuery = '';
    STATE.activeCategory = 'All';
    STATE.framework = 'all';
    STATE.sort = 'newest';
    updateFrameworkPillsUI('all');
    updateSortPillsUI('newest');
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'newest';
    ['search-input', 'search-input-mobile'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const titleEl = document.getElementById('current-category-title');
    if (titleEl) titleEl.textContent = 'All Components';
    renderCategoryFilters();
    loadComponents(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('explore-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
  });

  /* --- Sidebar Menu UI State --- */
  function updateSidebarMenuUI(activeKey) {
    const homeBtn = document.getElementById('sidebar-home-btn');
    const trendingBtn = document.getElementById('sidebar-trending-btn');
    const favoritesBtn = document.getElementById('sidebar-favorites-btn');

    const baseClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border ';
    const activeClass = baseClass + 'bg-brand-500/15 text-brand-300 font-semibold border-brand-500/20';
    const inactiveClass = baseClass + 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent';

    if (homeBtn) homeBtn.className = activeKey === 'home' ? activeClass : inactiveClass;
    if (trendingBtn) trendingBtn.className = activeKey === 'trending' ? activeClass : inactiveClass;
    if (favoritesBtn) favoritesBtn.className = activeKey === 'favorites' ? activeClass : inactiveClass;
  }
  window._updateSidebarMenuUI = updateSidebarMenuUI;

  /* --- Sidebar Links --- */
  document.getElementById('sidebar-home-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    STATE.searchQuery = '';
    STATE.activeCategory = 'All';
    STATE.framework = 'all';
    STATE.sort = 'newest';
    updateFrameworkPillsUI('all');
    updateSortPillsUI('newest');
    updateSidebarMenuUI('home');
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'newest';
    ['search-input', 'search-input-mobile'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const titleEl = document.getElementById('current-category-title');
    if (titleEl) titleEl.textContent = 'All Components';
    renderCategoryFilters();
    loadComponents(true);
    if (typeof window._closeSidebar === 'function') window._closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('sidebar-trending-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    STATE.sort = 'trending';
    STATE.activeCategory = 'All';
    STATE.searchQuery = '';
    ['search-input', 'search-input-mobile'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    updateSortPillsUI('trending');
    updateSidebarMenuUI('trending');
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'trending';
    const titleEl = document.getElementById('current-category-title');
    if (titleEl) titleEl.textContent = 'Trending Components';
    renderCategoryFilters();
    loadComponents(true);
    if (typeof window._closeSidebar === 'function') window._closeSidebar();
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
  });

  /* --- Sidebar Favorites (Unified directly with Profile Favorites) --- */
  document.getElementById('sidebar-favorites-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window._closeSidebar === 'function') window._closeSidebar();

    // If guest with no favorites, prompt sign in; otherwise open Profile Favorites tab
    if (!STATE.currentUser && (!STATE.likedIds || STATE.likedIds.size === 0)) {
      showToast('Please sign in to view your favorites', 'info');
      if (typeof window.openSigninModal === 'function') {
        window.openSigninModal('signin', 'Sign in to view your favorite components');
      } else if (typeof openSigninModal === 'function') {
        openSigninModal('signin', 'Sign in to view your favorite components');
      }
      return;
    }

    if (typeof window.openProfileModal === 'function') {
      window.openProfileModal('favorites');
    }
  });

  /* --- Sort Select & Framework Filter Pills (Precision Studio Tokens) --- */
  function updateFrameworkPillsUI(activeFw) {
    const pills = document.querySelectorAll('#framework-pills .framework-pill');
    pills.forEach((p) => {
      const isActive = p.dataset.framework === activeFw;
      p.classList.toggle('active', isActive);
      p.setAttribute('aria-pressed', String(isActive));
    });
  }

  function updateSortPillsUI(activeSort) {
    const pills = document.querySelectorAll('#sort-pills .sort-pill');
    pills.forEach((p) => {
      const isActive = p.dataset.sort === activeSort;
      p.classList.toggle('active', isActive);
      p.setAttribute('aria-pressed', String(isActive));
    });
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect && sortSelect.value !== activeSort) {
      sortSelect.value = activeSort;
    }
  }

  document.querySelectorAll('#framework-pills .framework-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const fw = pill.dataset.framework || 'all';
      if (STATE.framework === fw) return;
      STATE.framework = fw;
      updateFrameworkPillsUI(fw);
      loadComponents(true);
    });
  });

  document.querySelectorAll('#sort-pills .sort-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const sort = pill.dataset.sort || 'newest';
      if (STATE.sort === sort) return;
      STATE.sort = sort;
      updateSortPillsUI(sort);
      loadComponents(true);
    });
  });

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    STATE.sort = e.target.value;
    updateSortPillsUI(e.target.value);
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
    STATE.framework = 'all';
    STATE.sort = 'newest';
    updateFrameworkPillsUI('all');
    updateSortPillsUI('newest');
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'newest';
    ['search-input', 'search-input-mobile'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const titleEl = document.getElementById('current-category-title');
    if (titleEl) titleEl.textContent = 'All Components';
    renderCategoryFilters();
    loadComponents(true);
  });

  /* --- View Toggle --- */
  document.getElementById('grid-view-btn')?.addEventListener('click', () => {
    STATE.isGridView = true;
    document.getElementById('main-content')?.classList.remove('list-view');
    document.getElementById('grid-view-btn')?.classList.add('is-active');
    document.getElementById('list-view-btn')?.classList.remove('is-active');
    const grid = document.getElementById('components-grid');
    if (grid) {
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-all duration-200';
    }
  });

  document.getElementById('list-view-btn')?.addEventListener('click', () => {
    STATE.isGridView = false;
    document.getElementById('main-content')?.classList.add('list-view');
    document.getElementById('list-view-btn')?.classList.add('is-active');
    document.getElementById('grid-view-btn')?.classList.remove('is-active');
    const grid = document.getElementById('components-grid');
    if (grid) {
      grid.className = 'grid grid-cols-1 gap-5 transition-all duration-200';
    }
  });

  /* --- Site-Wide Precision Dark / Light Theme Toggle --- */
  (function initSiteThemeToggle() {
    const btn = document.getElementById('site-theme-toggle');
    const icon = document.getElementById('site-theme-icon');
    if (!btn) return;

    function syncThemeIcon() {
      const isLight = document.documentElement.classList.contains('light');
      if (icon) {
        icon.className = isLight ? 'fa-solid fa-moon text-xs' : 'fa-solid fa-sun text-xs';
      }
      btn.setAttribute('aria-pressed', String(isLight));
      btn.title = isLight ? 'Switch to Dark Studio mode' : 'Switch to Light Studio mode';
    }

    syncThemeIcon();

    btn.addEventListener('click', () => {
      const nextIsLight = !document.documentElement.classList.contains('light');
      document.documentElement.classList.toggle('light', nextIsLight);
      document.documentElement.classList.toggle('dark', !nextIsLight);
      try {
        localStorage.setItem('uiforge_site_theme', nextIsLight ? 'light' : 'dark');
      } catch (e) {}
      syncThemeIcon();
    });
  })();

  /* --- Upload Modal & Studio --- */
  ['open-upload-btn', 'hero-upload-btn'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => openUploadModal());
  });
  setupUploadStudio();

  /* --- Sign In / Join Community Modal (Google & GitHub Only) --- */
  function openSigninModal(mode = 'signup', customDesc = '') {
    const modal = document.getElementById('signin-modal');
    if (!modal) return;
    const titleEl = document.getElementById('signin-modal-title');
    const descEl = document.getElementById('signin-modal-desc');
    if (titleEl) titleEl.textContent = 'Join the Community';
    if (descEl) descEl.textContent = customDesc || 'Create beautiful UI elements and share them with 100,000+ developers';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeSigninModal() {
    const modal = document.getElementById('signin-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  window.openSigninModal = openSigninModal;
  window.closeSigninModal = closeSigninModal;

  document.getElementById('signin-close-btn')?.addEventListener('click', closeSigninModal);
  document.getElementById('signin-backdrop')?.addEventListener('click', closeSigninModal);

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
      } else if (!document.getElementById('signin-modal')?.classList.contains('hidden')) {
        document.getElementById('signin-close-btn')?.click();
      } else if (!document.getElementById('profile-modal')?.classList.contains('hidden')) {
        document.getElementById('profile-close-btn')?.click();
      } else if (!document.getElementById('edit-modal')?.classList.contains('hidden')) {
        document.getElementById('edit-close-btn')?.click();
      } else if (!document.getElementById('delete-modal')?.classList.contains('hidden')) {
        document.getElementById('delete-cancel-btn')?.click();
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
  if (!STATE.currentUser && CONFIG.DB_PROVIDER === 'firebase') {
    showToast('Please sign in to submit your component', 'info');
    if (typeof openSigninModal === 'function') {
      openSigninModal('signup', 'Join the Community to submit and share UI elements');
    }
    return;
  }

  const titleEl = document.getElementById('upload-title');
  const errorEl = document.getElementById('upload-error');
  const errorText = document.getElementById('upload-error-text');
  const submitBtn = document.getElementById('upload-submit-btn');
  const btnIcon = document.getElementById('upload-submit-icon');
  const btnText = document.getElementById('upload-submit-text');

  // Clear errors
  if (errorEl) errorEl.classList.add('hidden');
  titleEl?.classList.remove('input-error');

  const settings = typeof getUserSettings === 'function' ? getUserSettings() : {};
  const title = (titleEl?.value || UPLOAD_STUDIO.title || '').trim();
  const html = (UPLOAD_STUDIO.html || document.getElementById('upload-html')?.value || '').trim();
  const css = (UPLOAD_STUDIO.css || document.getElementById('upload-css')?.value || '').trim();
  const category = UPLOAD_STUDIO.category || 'Buttons';
  const author = STATE.currentUser?.displayName || (STATE.currentUser?.email ? STATE.currentUser.email.split('@')[0] : (settings.name || 'creator'));

  // Validate
  if (!title) {
    titleEl?.classList.add('input-error');
    titleEl?.focus();
    if (errorText) errorText.textContent = 'Component title is required.';
    if (errorEl) errorEl.classList.remove('hidden');
    showToast('Component title is required', 'error');
    return;
  }

  if (!html) {
    if (errorText) errorText.textContent = 'HTML code is required.';
    if (errorEl) errorEl.classList.remove('hidden');
    showToast('HTML code is required', 'error');
    return;
  }

  // Loading state
  if (submitBtn) submitBtn.disabled = true;
  if (btnIcon) btnIcon.className = 'fa-solid fa-circle-notch spin text-xs';
  if (btnText) btnText.textContent = 'Submitting...';

  try {
    const editingId = UPLOAD_STUDIO.editingId;
    const newComp = await uploadComponent({
      title,
      html,
      css,
      author,
      category,
    });

    closeUploadModal();

    // If we were fixing an existing rejected component, clean up the old one
    if (editingId && editingId !== newComp.id) {
      removeUserUploadLocally(editingId);
      deleteComponentFromCloud(editingId).catch(() => {});
    }

    if (newComp.status === 'approved') {
      UPLOAD_STUDIO.editingId = null;
      STATE.components.unshift(newComp);
      STATE.total++;
      showToast(typeof t === 'function' ? t('upload_approved_toast') : `"${newComp.title}" published successfully! 🚀`, 'success');
      loadComponents(true);
    } else {
      UPLOAD_STUDIO.editingId = newComp.id;
      showToast(typeof t === 'function' ? t('upload_rejected_toast') : `"${newComp.title}" failed automated security review.`, 'warning');
      openProfileModal('rejected');
    }
    if (typeof updateProfileUserInfo === 'function') {
      updateProfileUserInfo();
    } else if (typeof window.updateProfileUserInfo === 'function') {
      window.updateProfileUserInfo();
    }

  } catch (err) {
    console.error('[UIForge] Upload failed:', err);
    if (errorText) errorText.textContent = 'Upload failed. Please try again.';
    if (errorEl) errorEl.classList.remove('hidden');
    showToast('Failed to publish component. Please try again.', 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnIcon) btnIcon.className = 'fa-solid fa-rocket text-xs';
    if (btnText) btnText.textContent = 'Submit for review';
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

  // Seed the local "database" with stored user uploads + cached community uploads + DUMMY_DATA
  rebuildLocalComponents();

  // Render category filter pills
  renderCategoryFilters();

  // Attach all event handlers
  initEventHandlers();

  // Load initial components (with simulated delay for skeleton effect)
  loadComponents(true);

  // Sync community uploads and likes from Firebase cloud database in background
  syncCommunityUploads();
  syncCloudLikes();

  // Initialize and synchronize 100% REAL hero statistics
  updateHeroStats();

  // Animate hero stat counters (observe when visible)
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10) || 0;
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
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const modalShareBtn = document.getElementById('modal-share-btn');
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
  const modalExportBtn = document.getElementById('modal-export-btn');
  const canvasWrapper = document.getElementById('preview-canvas-wrapper');
  const bgHexLabel = document.getElementById('preview-bg-hex');
  const themeToggleBtn = document.getElementById('preview-theme-toggle');
  const toggleThumb = document.getElementById('preview-toggle-thumb');
  const toggleIcon = document.getElementById('preview-toggle-icon');
  const bgPicker = document.getElementById('preview-bg-picker');
  const colorIndicator = document.getElementById('preview-color-indicator');
  const modalEditorToolbar = document.getElementById('modal-editor-toolbar');
  const modalEditorScroll = document.getElementById('modal-editor-scroll');
  const modalCommentsPanel = document.getElementById('modal-comments-panel');
  const modalCommentsList = document.getElementById('modal-comments-list');
  const modalCommentForm = document.getElementById('modal-comment-form');
  const modalCommentInput = document.getElementById('modal-comment-input');
  const modalCommentsTotal = document.getElementById('modal-comments-total');
  const modalCommentsCountBadge = document.getElementById('modal-comments-count-badge');
  const modalMoreAuthorSection = document.getElementById('modal-more-author-section');
  const modalMoreAuthorName = document.getElementById('modal-more-author-name');
  const modalMoreAuthorGrid = document.getElementById('modal-more-author-grid');
  const modalViewAllAuthorBtn = document.getElementById('modal-view-all-author-btn');
  const previewZoomIn = document.getElementById('preview-zoom-in');
  const previewZoomOut = document.getElementById('preview-zoom-out');
  const previewZoomLabel = document.getElementById('preview-zoom-label');
  const viewportBtns = document.querySelectorAll('#preview-viewport-controls .viewport-btn');

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
      const label = status || 'Live Preview';
      modalStatusText.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5"></span>${escapeHtml(label)}`;
      modalStatusText.className = 'text-emerald-400/90 font-medium select-none';
    }
  }

  function convertToReactJsx(html = '', css = '', title = 'Component') {
    let funcName = (title || 'Component')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    if (!funcName || /^\d/.test(funcName)) funcName = 'UI' + (funcName || 'Component');

    let jsxHtml = html
      .replace(/\bclass=(["'])(.*?)\1/g, 'className=$1$2$1')
      .replace(/\bfor=(["'])(.*?)\1/g, 'htmlFor=$1$2$1')
      .replace(/\btabindex=(["'])(.*?)\1/g, 'tabIndex=$1$2$1')
      .replace(/\bautocomplete=(["'])(.*?)\1/g, 'autoComplete=$1$2$1')
      .replace(/\bautofocus=(["'])(.*?)\1/g, 'autoFocus=$1$2$1')
      .replace(/\breadonly=(["'])(.*?)\1/g, 'readOnly=$1$2$1')
      .replace(/<(input|img|br|hr|source|meta|link)([^>]*?)(?<!\/)>/gi, '<$1$2 />');

    const cleanCss = (css || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
    const hasCss = cleanCss.trim().length > 5;

    if (!hasCss) {
      // Pure Tailwind CSS or HTML component — clean JSX without style tag
      return `import React from 'react';

export default function ${funcName}() {
  return (
${jsxHtml.split('\n').map((line) => '    ' + line).join('\n')}
  );
}
`;
    }

    return `import React from 'react';

export default function ${funcName}() {
  return (
    <>
      <style>{\`
${cleanCss}
      \`}</style>
      <div className="ui-container">
${jsxHtml.split('\n').map((line) => '        ' + line).join('\n')}
      </div>
    </>
  );
}
`;
  }

  function getBundleCode(html = '', css = '', title = 'UI Component') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* Reset & Center Canvas */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #212121;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Component CSS */
${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }

  function getActiveCode() {
    if (activeEditorTab === 'html') return currentRawHtml;
    if (activeEditorTab === 'css') return currentRawCss;
    const comp = findAnyComp(currentModalComponentId);
    const title = comp ? comp.title : 'UIComponent';
    if (activeEditorTab === 'react') return convertToReactJsx(currentRawHtml, currentRawCss, title);
    if (activeEditorTab === 'bundle') return getBundleCode(currentRawHtml, currentRawCss, title);
    return currentRawCss;
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

  function highlightJsx(code) {
    return escapeHtml(code).replace(
      /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(&quot;.*?&quot;|&#39;.*?&#39;|`[\s\S]*?`)|(\b(?:import|export|default|function|return|const|let|var|from)\b)|(&lt;\/?[a-zA-Z0-9_.-]+)|(&gt;)|(\b(?:className|style|onClick|onChange)\b)/g,
      (match, comment, str, kw, tag, gt, prop) => {
        if (comment) return `<span class="syntax-comment">${comment}</span>`;
        if (str) return `<span class="syntax-string">${str}</span>`;
        if (kw) return `<span class="syntax-keyword font-bold text-purple-400">${kw}</span>`;
        if (tag) return `<span class="syntax-tag text-rose-400 font-semibold">${tag}</span>`;
        if (gt) return `<span class="syntax-tag text-gray-400">${gt}</span>`;
        if (prop) return `<span class="syntax-attr text-amber-300">${prop}</span>`;
        return match;
      }
    );
  }

  function renderSyntaxHighlight() {
    if (!modalSyntaxCode) return;
    const code = getActiveCode();
    if (activeEditorTab === 'html') modalSyntaxCode.innerHTML = highlightHtml(code);
    else if (activeEditorTab === 'css') modalSyntaxCode.innerHTML = highlightCss(code);
    else if (activeEditorTab === 'react') modalSyntaxCode.innerHTML = highlightJsx(code);
    else if (activeEditorTab === 'bundle') modalSyntaxCode.innerHTML = highlightHtml(code);
    else modalSyntaxCode.innerHTML = escapeHtml(code);
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
    if (activeEditorTab === 'react') {
      setModalStatus('Generated React JSX', 'saved');
    } else if (activeEditorTab === 'bundle') {
      setModalStatus('All-in-One Standalone File', 'saved');
    }
    modalCodeEditor.focus({ preventScroll: true });
  }

  function updateCanvasBg(color, dark = null, shouldRefresh = true) {
    if (!color) return;
    currentCanvasBg = color;
    if (dark === null) {
      isDarkCanvas = isHexColorDark(color);
    } else {
      isDarkCanvas = dark;
    }

    if (canvasWrapper) {
      canvasWrapper.style.backgroundColor = color;
    }

    const hexLabel = document.getElementById('preview-bg-hex-label') || document.getElementById('preview-bg-hex');
    if (hexLabel) {
      hexLabel.textContent = color.toUpperCase();
    }

    if (bgPicker && color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      bgPicker.value = color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
    }

    const colorPickerBtn = document.getElementById('preview-color-picker-btn');
    if (colorPickerBtn) {
      colorPickerBtn.style.backgroundColor = color;
      colorPickerBtn.style.borderColor = isDarkCanvas ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
    }

    const toggleThumb = document.getElementById('preview-toggle-thumb');
    const toggleIcon = document.querySelector('#preview-theme-toggle i');
    if (toggleThumb) {
      if (isDarkCanvas) {
        toggleThumb.style.transform = 'translateX(14px)';
        toggleThumb.style.backgroundColor = '#ffffff';
      } else {
        toggleThumb.style.transform = 'translateX(0px)';
        toggleThumb.style.backgroundColor = '#f59e0b';
      }
    }
    if (toggleIcon) {
      toggleIcon.className = isDarkCanvas ? 'fa-regular fa-moon text-[11px] text-indigo-400 ml-1' : 'fa-regular fa-sun text-[11px] text-amber-400 ml-1';
    }

    // PostMessage for instant 0ms latency across sandbox boundaries
    try {
      if (modalIframe && modalIframe.contentWindow) {
        modalIframe.contentWindow.postMessage({
          type: 'UPDATE_BG',
          bg: color,
          isLight: !isDarkCanvas
        }, '*');
      }
    } catch (_) { }

    // Fallback direct DOM update inside iframe if same-origin
    if (modalIframe && modalIframe.contentDocument) {
      try {
        const doc = modalIframe.contentDocument;
        if (doc.documentElement) {
          doc.documentElement.style.backgroundColor = color;
          doc.documentElement.className = isDarkCanvas ? 'dark' : 'light';
        }
        if (doc.body) {
          doc.body.style.backgroundColor = color;
        }
      } catch (err) { }
    }

    if (shouldRefresh) {
      refreshModalPreview();
    }
  }

  // --- COMMUNITY COMMENTS SYSTEM (Uiverse Parity) ---
  const DEFAULT_SAMPLE_COMMENTS = [
    { author: 'alex_frontend', text: 'Clean and super smooth animation! Works flawlessly in React and Tailwind.', time: '2 hours ago', avatar: 'A' },
    { author: 'design_ninja', text: 'Loved the hover effect and subtle glow. Adding this to my design system!', time: '1 day ago', avatar: 'D' }
  ];

  function getComponentComments(compId) {
    if (!compId) return [];
    try {
      const stored = localStorage.getItem('uiforge_comments_' + compId);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse comments from localStorage', e);
    }
    return DEFAULT_SAMPLE_COMMENTS;
  }

  function saveComponentComment(compId, comment) {
    if (!compId) return [];
    const comments = getComponentComments(compId);
    comments.unshift(comment);
    try {
      localStorage.setItem('uiforge_comments_' + compId, JSON.stringify(comments));
    } catch (e) { }
    return comments;
  }

  function renderCommentsList() {
    if (!modalCommentsList || !currentModalComponentId) return;
    const comments = getComponentComments(currentModalComponentId);
    if (modalCommentsTotal) modalCommentsTotal.textContent = `${comments.length} comment${comments.length === 1 ? '' : 's'}`;
    if (modalCommentsCountBadge) modalCommentsCountBadge.textContent = comments.length;

    if (!comments.length) {
      modalCommentsList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fa-regular fa-comment-dots text-2xl mb-2 block opacity-40"></i>
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }

    modalCommentsList.innerHTML = comments.map(c => `
      <div class="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#18191d] border border-white/5">
        <div class="flex flex-col items-center justify-center bg-[#23242a] rounded-xl px-2.5 py-1 text-xs text-gray-400 select-none">
          <button type="button" class="hover:text-purple-400 text-xs font-bold transition-colors cursor-pointer">+</button>
          <span class="font-bold text-white text-[11px] my-0.5">${c.upvotes || 1}</span>
          <button type="button" class="hover:text-purple-400 text-xs font-bold transition-colors cursor-pointer">-</button>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                ${escapeHtml(c.avatar || (c.author ? c.author.charAt(0).toUpperCase() : 'U'))}
              </div>
              <span class="font-semibold text-white text-xs">${escapeHtml(c.author || 'anonymous')}</span>
              <span class="text-[11px] text-gray-500">${escapeHtml(c.time || 'just now')}</span>
            </div>
            <button type="button" class="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors">
              <i class="fa-solid fa-reply text-[10px]"></i>
              <span>Reply</span>
            </button>
          </div>
          <p class="text-gray-300 text-xs leading-relaxed mt-1 whitespace-pre-wrap">${escapeHtml(c.text)}</p>
        </div>
      </div>
    `).join('');
  }

  // --- MORE BY CREATOR CAROUSEL (Uiverse Parity) ---
  function renderMoreByAuthor(author, currentId) {
    if (!modalMoreAuthorGrid || !author) return;
    if (modalMoreAuthorName) modalMoreAuthorName.textContent = '@' + author;

    let moreComps = (STATE.components || []).filter(c => c.author === author && c.id !== currentId);
    if (moreComps.length < 3) {
      const currentComp = findAnyComp(currentId);
      const cat = currentComp?.category;
      const catComps = (STATE.components || []).filter(c => c.category === cat && c.id !== currentId && !moreComps.some(m => m.id === c.id));
      moreComps = moreComps.concat(catComps);
    }
    moreComps = moreComps.slice(0, 4);

    if (!moreComps.length) {
      if (modalMoreAuthorSection) modalMoreAuthorSection.classList.add('hidden');
      return;
    }
    if (modalMoreAuthorSection) modalMoreAuthorSection.classList.remove('hidden');

    modalMoreAuthorGrid.innerHTML = moreComps.map(c => {
      const full = findAnyComp(c.id) || c;
      const previewDoc = buildPreviewSrcDoc(full.html || '', full.css || '', full.category || '', false, '#212121');
      return `
        <div class="more-author-item flex-shrink-0 w-36 sm:w-44 bg-[#141416] hover:bg-[#1a1a1f] border border-white/8 hover:border-brand-500/40 rounded-xl p-2 cursor-pointer transition-all flex flex-col gap-1.5 group" data-id="${c.id}">
          <div class="w-full h-16 sm:h-20 bg-[#212121] rounded-lg overflow-hidden relative pointer-events-none flex items-center justify-center">
            <iframe srcdoc="${escapeAttr(previewDoc)}" class="w-full h-full border-none pointer-events-none scale-75 origin-center bg-[#212121]" loading="lazy" sandbox="allow-scripts"></iframe>
          </div>
          <div class="flex items-center justify-between text-[11px] px-0.5">
            <span class="font-medium text-gray-300 truncate group-hover:text-brand-300">${escapeHtml(full.title || full.category || 'Component')}</span>
            <span class="text-gray-500 text-[10px] shrink-0"><i class="fa-solid fa-heart text-[8px] text-pink-500 mr-0.5"></i>${full.likes || 0}</span>
          </div>
        </div>
      `;
    }).join('');

    modalMoreAuthorGrid.querySelectorAll('.more-author-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) openModal(id, true);
      });
    });
  }

  function openModal(idOrComp, pushHash = true) {
    let comp = null;
    let id = null;
    if (typeof idOrComp === 'object' && idOrComp !== null) {
      comp = idOrComp;
      id = idOrComp.id;
    } else {
      id = idOrComp;
      comp = findAnyComp(id);
    }
    if (!comp) {
      console.warn('[UIForge] openModal: component not found for', idOrComp);
      return;
    }
    currentModalComponentId = id;
    STATE.currentModal = id;

    // Deep linking: update URL hash without full reload
    if (pushHash && window.location.hash !== `#item-${id}`) {
      try {
        history.pushState({ componentId: id }, '', `#item-${id}`);
      } catch (e) {
        window.location.hash = `#item-${id}`;
      }
    }

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
    const modalCurrentLikes = getComponentLikesCount(comp);
    comp.likes = modalCurrentLikes;
    if (modalLikesCount) modalLikesCount.textContent = formatNumber(modalCurrentLikes);

    // 4. Set liked state
    const isLiked = STATE.likedIds.has(id);
    if (modalLikeBtn) {
      const icon = modalLikeBtn.querySelector('i');
      if (icon) icon.className = isLiked ? 'fa-solid fa-heart text-pink-500' : 'fa-regular fa-heart';
    }

    // Uiverse Parity: Synchronize "Save to favorites" button
    const saveFavBtn = document.getElementById('modal-save-fav-btn');
    const saveFavText = document.getElementById('modal-save-fav-text');
    if (saveFavBtn) {
      const favIcon = saveFavBtn.querySelector('i');
      if (favIcon) favIcon.className = isLiked ? 'fa-solid fa-bookmark text-brand-400' : 'fa-regular fa-bookmark';
      if (saveFavText) saveFavText.textContent = isLiked ? 'Saved to favorites' : 'Save to favorites';
    }

    // Title & Tags (Uiverse Parity)
    const elementTitleEl = document.getElementById('modal-element-title');
    if (elementTitleEl) elementTitleEl.textContent = comp.title || comp.category || 'Component';

    const tagsContainer = document.getElementById('modal-tags-container');
    if (tagsContainer) {
      let tags = [];
      if (Array.isArray(comp.tags) && comp.tags.length) {
        tags = comp.tags;
      } else {
        const catTag = (comp.category || 'button').toLowerCase();
        const baseTags = [catTag, comp.isTailwind ? 'tailwind' : 'css', 'modern', 'dark', 'animated'];
        if (comp.title) {
          const words = comp.title.toLowerCase().split(/[\s-_]+/).filter(w => w.length > 2);
          baseTags.unshift(...words.slice(0, 3));
        }
        tags = Array.from(new Set(baseTags));
      }
      tagsContainer.innerHTML = tags.map(t => `<span class="px-2.5 py-1 rounded-lg bg-[#18191d] border border-white/5 text-[11px] text-gray-400 hover:text-white cursor-pointer transition-colors">${escapeHtml(t)}</span>`).join('');
    }

    // Author card in sidebar & sub-creator notice
    const authorCardName = document.getElementById('modal-author-card-name');
    const authorCardHandle = document.getElementById('modal-author-card-handle');
    const authorCardAvatar = document.getElementById('modal-author-card-avatar');
    if (authorCardName) authorCardName.textContent = comp.author;
    if (authorCardHandle) authorCardHandle.textContent = '@' + comp.author;
    if (authorCardAvatar) authorCardAvatar.textContent = getInitials(comp.author);

    // Render "More by author" in sidebar (Uiverse Parity)
    const moreByTitle = document.getElementById('modal-more-by-title');
    const moreByGrid = document.getElementById('modal-more-author-grid') || document.getElementById('modal-more-by-grid');
    if (moreByTitle) moreByTitle.textContent = `More by @${comp.author || 'creator'}`;
    if (moreByGrid) {
      let authorComps = (STATE.components || []).filter(c => c.author === comp.author && c.id !== comp.id);
      if (authorComps.length < 2) {
        const others = (STATE.components || []).filter(c => c.id !== comp.id && !authorComps.some(a => a.id === c.id));
        authorComps = authorComps.concat(others);
      }
      authorComps = authorComps.slice(0, 2);
      moreByGrid.innerHTML = authorComps.map(ac => {
        const full = findAnyComp(ac.id) || ac;
        const previewDoc = buildPreviewSrcDoc(full.html || '', full.css || '', full.category || '', false, '#212121');
        return `
          <div class="more-author-item more-by-card bg-[#18191d] rounded-xl border border-white/10 overflow-hidden hover:border-white/25 transition-all cursor-pointer group flex flex-col shadow-sm" data-id="${full.id}">
            <div class="w-full h-24 bg-[#212121] relative flex items-center justify-center overflow-hidden">
              <iframe srcdoc="${escapeAttr(previewDoc)}" class="w-full h-full border-none pointer-events-none scale-50 origin-center bg-[#212121]" loading="lazy" sandbox="allow-scripts"></iframe>
            </div>
            <div class="flex items-center justify-between px-2.5 py-1.5 text-[10px] text-gray-400 border-t border-white/5">
              <span class="truncate group-hover:text-white max-w-[85px]">${escapeHtml(full.title || full.category || 'Component')}</span>
              <span class="flex items-center gap-1 text-gray-500"><i class="fa-solid fa-heart text-[9px] text-pink-500/70"></i> ${full.likes || 0}</span>
            </div>
          </div>
        `;
      }).join('');

      moreByGrid.querySelectorAll('.more-by-card').forEach(card => {
        card.addEventListener('click', () => {
          const mId = card.dataset.id;
          if (mId) openModal(mId, true);
        });
      });
    }

    const moreByViewAll = document.getElementById('modal-more-by-viewall');
    if (moreByViewAll) {
      moreByViewAll.onclick = () => {
        closeModal(true);
        if (typeof showUserPublicProfile === 'function') {
          showUserPublicProfile(comp.author || 'creator');
        }
      };
    }

    const subCreatorName = document.getElementById('modal-sub-creator-name');
    if (subCreatorName) subCreatorName.textContent = '@' + comp.author;
    const visitSourceBtn = document.getElementById('modal-visit-source-btn');
    if (visitSourceBtn) {
      visitSourceBtn.href = `https://github.com/${encodeURIComponent(comp.author)}`;
    }

    // Comments auth status
    const commentsAuthStatus = document.getElementById('modal-comments-auth-status');
    if (commentsAuthStatus) {
      if (STATE.currentUser) {
        commentsAuthStatus.textContent = `Signed in as @${STATE.currentUser.displayName || (STATE.currentUser.email ? STATE.currentUser.email.split('@')[0] : 'user')}`;
        commentsAuthStatus.className = 'text-xs text-brand-400';
      } else {
        commentsAuthStatus.textContent = 'Log in to add comments';
        commentsAuthStatus.className = 'text-xs text-gray-400 cursor-pointer hover:text-white transition-colors';
      }
    }

    // 5. Canvas background (update UI without prematurely refreshing preview)
    updateCanvasBg('#212121', true, false);

    // Reset viewport and zoom state (Uiverse simulator parity)
    STATE.canvasZoom = 100;
    STATE.currentViewport = 'desktop';
    if (canvasWrapper) canvasWrapper.dataset.viewport = 'desktop';
    if (previewZoomLabel) previewZoomLabel.textContent = '100%';
    if (modalIframe) modalIframe.style.transform = '';
    viewportBtns.forEach((b) => {
      const isDesktop = b.dataset.viewport === 'desktop';
      b.classList.toggle('active', isDesktop);
      b.classList.toggle('bg-surface-600', isDesktop);
      b.classList.toggle('text-white', isDesktop);
      b.classList.toggle('text-gray-400', !isDesktop);
    });

    // Render Variations (2x2 grid matching Uiverse Image 2)
    const variationsGrid = document.getElementById('modal-variations-grid');
    const variationsCountEl = document.getElementById('modal-variations-count');
    if (variationsGrid) {
      let variations = (STATE.components || []).filter(c => c.category === comp.category && c.id !== comp.id);
      if (variations.length < 4) {
        const others = (STATE.components || []).filter(c => c.id !== comp.id && !variations.some(v => v.id === c.id));
        variations = variations.concat(others);
      }
      variations = variations.slice(0, 4);
      if (variationsCountEl) variationsCountEl.textContent = variations.length;

      variationsGrid.innerHTML = variations.map(v => {
        const full = findAnyComp(v.id) || v;
        const previewDoc = buildPreviewSrcDoc(full.html || '', full.css || '', full.category || '', false, '#212121');
        return `
          <div class="variation-card bg-[#18191d] rounded-2xl border border-white/10 overflow-hidden hover:border-white/25 transition-all cursor-pointer group flex flex-col shadow-sm" data-id="${full.id}">
            <div class="w-full h-44 bg-[#212121] relative flex items-center justify-center overflow-hidden">
              <iframe srcdoc="${escapeAttr(previewDoc)}" class="w-full h-full border-none pointer-events-none scale-75 origin-center bg-[#212121]" loading="lazy" sandbox="allow-scripts"></iframe>
            </div>
            <div class="flex items-center justify-between px-3.5 py-2.5 text-xs text-gray-400 border-t border-white/5">
              <span class="font-medium text-gray-300 truncate group-hover:text-white">@${escapeHtml(full.author || 'creator')}</span>
              <div class="flex items-center gap-3 text-[11px]">
                <span>${formatNumber(full.views || 0)} views</span>
                <span class="flex items-center gap-1"><i class="fa-regular fa-bookmark text-[10px]"></i> ${full.likes || 0}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      variationsGrid.querySelectorAll('.variation-card').forEach(card => {
        card.addEventListener('click', () => {
          const vId = card.dataset.id;
          if (vId) openModal(vId, true);
        });
      });
    }

    // License author & comment user avatar
    const licenseAuthorEl = document.getElementById('modal-license-author');
    if (licenseAuthorEl) licenseAuthorEl.textContent = `${comp.author} (@${comp.author})`;

    const commentUserAvatar = document.getElementById('modal-comment-user-avatar');
    if (commentUserAvatar) {
      if (STATE.currentUser) {
        commentUserAvatar.textContent = (STATE.currentUser.displayName || STATE.currentUser.email || 'U').charAt(0).toUpperCase();
      } else {
        commentUserAvatar.textContent = 'U';
      }
    }

    // Render "More by Creator" section and comments count
    renderMoreByAuthor(comp.author, comp.id);
    const compComments = getComponentComments(comp.id);
    if (modalCommentsCountBadge) modalCommentsCountBadge.textContent = compComments.length;
    if (modalCommentsTotal) modalCommentsTotal.textContent = `${compComments.length}`;
    renderCommentsList();

    // Check if component has CSS or is Tailwind
    const isTailwind = !!(comp.isTailwind || (!comp.css || !comp.css.trim().length) || /\b(flex|grid|bg-|text-|p-|m-|rounded-|border-)\b/.test(comp.html || ''));
    const hasCss = !isTailwind && !!(comp.css && comp.css.trim().length > 5);
    const cssTabBtn = document.querySelector('#modal-tabs .tab-btn[data-tab="css"]');
    const tailwindBadge = document.getElementById('modal-tailwind-badge');

    if (cssTabBtn) {
      cssTabBtn.style.display = hasCss ? '' : 'none';
    }
    if (tailwindBadge) {
      if (isTailwind) {
        tailwindBadge.classList.remove('hidden');
        tailwindBadge.classList.add('flex');
      } else {
        tailwindBadge.classList.add('hidden');
        tailwindBadge.classList.remove('flex');
      }
    }

    // Default to HTML or CSS tab
    switchTab(hasCss ? 'css' : 'html');

    // 7. Show modal FIRST so iframe is in rendered DOM before loading content
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setModalStatus('', 'saved');
    refreshModalPreview();
    requestAnimationFrame(renderEditor);
  }

  function closeModal(clearHash = true) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (modalIframe) {
      modalIframe.srcdoc = '';
      modalIframe.style.transform = '';
    }
    if (canvasWrapper) canvasWrapper.dataset.viewport = 'desktop';
    if (previewZoomLabel) previewZoomLabel.textContent = '100%';
    currentModalComponentId = null;
    currentRawHtml = '';
    currentRawCss = '';
    savedRawHtml = '';
    savedRawCss = '';
    if (previewUpdateTimer) clearTimeout(previewUpdateTimer);
    STATE.currentModal = null;

    // Clear URL hash when closing modal
    if (clearHash && window.location.hash.startsWith('#item-')) {
      try {
        history.pushState(null, '', window.location.pathname + window.location.search);
      } catch (e) {
        window.location.hash = '';
      }
    }
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  function switchTab(tabId) {
    const allTabBtns = document.querySelectorAll('#modal-tabs .tab-btn');
    if (!allTabBtns.length) return;
    allTabBtns.forEach(b => {
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

    // Update copy button text to reflect active tab (Uiverse Parity)
    const copyText = document.getElementById('modal-copy-text');
    if (copyText) {
      copyText.textContent = 'Copy';
    }

    renderEditor();
  }

  // Gallery Prev / Next Navigation
  function navigateToAdjacentComponent(direction) {
    if (!currentModalComponentId || !STATE.components || !STATE.components.length) return;
    const currentIndex = STATE.components.findIndex((c) => c.id === currentModalComponentId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = STATE.components.length - 1;
    else if (nextIndex >= STATE.components.length) nextIndex = 0;

    const nextComp = STATE.components[nextIndex];
    if (nextComp) {
      openModal(nextComp, true);
    }
  }

  if (modalPrevBtn) modalPrevBtn.addEventListener('click', () => navigateToAdjacentComponent(-1));
  if (modalNextBtn) modalNextBtn.addEventListener('click', () => navigateToAdjacentComponent(1));

  // Modal Share button
  if (modalShareBtn) {
    modalShareBtn.addEventListener('click', async () => {
      if (!currentModalComponentId) return;
      const shareUrl = window.location.origin + window.location.pathname + '#item-' + currentModalComponentId;
      const ok = await copyToClipboard(shareUrl);
      showToast(ok ? 'Direct link copied to clipboard!' : 'Failed to copy link', ok ? 'success' : 'error');
    });
  }

  // Author filter click inside modal
  if (modalAuthor) {
    modalAuthor.addEventListener('click', () => {
      const authorText = modalAuthor.textContent.replace(/^@/, '').trim();
      if (authorText) {
        closeModal(true);
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.value = authorText;
          searchInput.dispatchEvent(new Event('input'));
        }
      }
    });
  }

  // Global Keyboard shortcuts (Uiverse Parity: Ctrl+K, /, R, Esc, Arrows)
  window.addEventListener('keydown', (e) => {
    // If Esc is pressed, close any open modal
    if (e.key === 'Escape') {
      if (modal && !modal.classList.contains('hidden')) {
        closeModal();
        return;
      }
    }

    const targetTag = e.target.tagName?.toLowerCase();
    const isTyping = targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable;

    // Search shortcut: Ctrl+K, Cmd+K, or /
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }
    if (!isTyping && e.key === '/') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // Random component: R key
    if (!isTyping && (e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (typeof openRandomComponent === 'function') openRandomComponent();
      return;
    }

    // In-modal navigation: Left / Right arrows
    if (modal && !modal.classList.contains('hidden') && document.activeElement !== modalCodeEditor && !isTyping) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToAdjacentComponent(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToAdjacentComponent(1);
      }
    }
  });

  // Browser History & Hash Navigation Support (Deep Linking)
  window.addEventListener('popstate', (e) => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#item-')) {
      const id = hash.replace('#item-', '');
      if (currentModalComponentId !== id) {
        const comp = findAnyComp(id);
        if (comp) openModal(comp, false);
      }
    } else {
      if (modal && !modal.classList.contains('hidden')) {
        closeModal(false);
      }
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#item-')) {
      const id = hash.replace('#item-', '');
      if (currentModalComponentId !== id) {
        const comp = findAnyComp(id);
        if (comp) openModal(comp, false);
      }
    } else if (!hash && modal && !modal.classList.contains('hidden')) {
      closeModal(false);
    }
  });

  // Bind close event
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  // Bind theme toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (isDarkCanvas) {
        updateCanvasBg('#e8e8e8', false);
      } else {
        updateCanvasBg('#212121', true);
      }
    });
  }

  // Bind color picker (live input & change)
  if (bgPicker) {
    bgPicker.addEventListener('input', (e) => {
      const val = e.target.value;
      const isDark = isHexColorDark(val);
      updateCanvasBg(val, isDark, false);
    });
    bgPicker.addEventListener('change', (e) => {
      const val = e.target.value;
      const isDark = isHexColorDark(val);
      updateCanvasBg(val, isDark, true);
    });
  }

  // Bind tab events
  const allModalTabs = document.querySelectorAll('#modal-tabs .tab-btn');
  allModalTabs.forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  if (modalCodeEditor) {
    modalCodeEditor.addEventListener('input', () => {
      if (activeEditorTab === 'react' || activeEditorTab === 'bundle') return;
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

  // Bind copy event (copies active tab code - Uiverse Parity)
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const textToCopy = getActiveCode();
      const ok = await copyToClipboard(textToCopy);
      if (ok) {
        const copyText = document.getElementById('modal-copy-text');
        const originalText = copyText ? copyText.textContent : 'Copy code';
        if (copyText) copyText.textContent = 'Copied!';
        const icon = copyBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-check text-emerald-400';
        setTimeout(() => {
          if (copyText) copyText.textContent = originalText;
          if (icon) icon.className = 'fa-regular fa-copy';
        }, 2000);
        showToast(`${activeEditorTab.toUpperCase()} copied to clipboard!`, 'success');
      } else {
        showToast('Failed to copy. Please copy manually.', 'error');
      }
    });
  }

  // --- DOWNLOAD & EXPORT FUNCTIONALITY (Uiverse Parity) ---
  function downloadTextFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- EXPORT DROPDOWN (Uiverse Parity: React, HTML, CSS, All-in-One) ---
  const modalExportWrapper = document.getElementById('modal-export-dropdown-wrapper');
  const modalExportMenu = document.getElementById('modal-export-menu');
  const modalExportFormatLabel = document.getElementById('modal-export-format-label');
  if (modalExportBtn && modalExportMenu) {
    modalExportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modalExportMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (modalExportWrapper && !modalExportWrapper.contains(e.target)) {
        modalExportMenu.classList.add('hidden');
      }
    });

    modalExportMenu.querySelectorAll('.export-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        modalExportMenu.classList.add('hidden');
        const format = opt.dataset.format || 'react';
        if (modalExportFormatLabel) {
          modalExportFormatLabel.textContent = format === 'react' ? 'React' : format.toUpperCase();
        }
        if (!currentModalComponentId) return;
        const comp = findAnyComp(currentModalComponentId);
        const baseName = (comp?.title || 'uiforge-component')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'component';

        let filename = `${baseName}.html`;
        let content = '';
        let mime = 'text/plain';

        if (format === 'react') {
          filename = `${baseName}.jsx`;
          content = convertToReactJsx(comp?.html || '', comp?.css || '', comp?.title || 'Component');
          mime = 'text/javascript';
        } else if (format === 'html') {
          filename = `${baseName}.html`;
          content = comp?.html || '';
          mime = 'text/html';
        } else if (format === 'css') {
          filename = `${baseName}.css`;
          content = comp?.css || '';
          mime = 'text/css';
        } else if (format === 'bundle') {
          filename = `${baseName}-standalone.html`;
          content = buildPreviewSrcDoc(comp?.html || '', comp?.css || '', comp?.category || '', false, '#212121');
          mime = 'text/html';
        }

        downloadTextFile(filename, content, mime);
        showToast(`Exported ${filename}`, 'success');
      });
    });
  }

  // --- SAVE TO FAVORITES BUTTON (Uiverse Parity) ---
  const modalSaveFavBtn = document.getElementById('modal-save-fav-btn');
  const modalSaveFavText = document.getElementById('modal-save-fav-text');
  if (modalSaveFavBtn) {
    modalSaveFavBtn.addEventListener('click', async () => {
      if (!currentModalComponentId) return;
      if (!STATE.currentUser) {
        showToast('Please sign in to save components to favorites', 'info');
        if (typeof openSigninModal === 'function') openSigninModal('signin');
        return;
      }
      await handleLike(currentModalComponentId);
      const isLiked = STATE.likedIds.has(currentModalComponentId);
      const favIcon = modalSaveFavBtn.querySelector('i');
      if (favIcon) favIcon.className = isLiked ? 'fa-solid fa-bookmark text-brand-400' : 'fa-regular fa-bookmark';
      if (modalSaveFavText) modalSaveFavText.textContent = isLiked ? 'Saved to favorites' : 'Save to favorites';
      if (modalLikeBtn) {
        const likeIcon = modalLikeBtn.querySelector('i');
        if (likeIcon) likeIcon.className = isLiked ? 'fa-solid fa-heart text-pink-500' : 'fa-regular fa-heart';
      }
      const comp = findAnyComp(currentModalComponentId);
      if (comp && modalLikesCount) modalLikesCount.textContent = formatNumber(getComponentLikesCount(comp));
      showToast(isLiked ? 'Saved to favorites!' : 'Removed from favorites', 'info');
    });
  }

  // --- COPY TO FIGMA BUTTON (Uiverse Parity) ---
  const modalFigmaBtn = document.getElementById('modal-figma-btn');
  if (modalFigmaBtn) {
    modalFigmaBtn.addEventListener('click', async () => {
      if (!currentModalComponentId) return;
      const comp = findAnyComp(currentModalComponentId);
      const figmaBundle = `<!-- UIForge Component: ${comp?.title || 'Component'} by @${comp?.author || 'creator'} -->\n<!-- Paste directly or import via HTML-to-Figma -->\n<style>\n${comp?.css || ''}\n</style>\n${comp?.html || ''}`;
      const ok = await copyToClipboard(figmaBundle);
      if (ok) {
        showToast('Component copied for Figma!', 'success');
      } else {
        showToast('Failed to copy to clipboard', 'error');
      }
    });
  }

  // --- BACKGROUND COLOR PICKER BUTTON (Uiverse Parity) ---
  const previewColorPickerBtn = document.getElementById('preview-color-picker-btn');
  if (previewColorPickerBtn && bgPicker) {
    previewColorPickerBtn.addEventListener('click', (e) => {
      if (typeof bgPicker.showPicker === 'function') {
        try {
          bgPicker.showPicker();
        } catch (err) { }
      }
    });
  }
  const previewBgHexBadge = document.getElementById('preview-bg-hex-badge');
  if (previewBgHexBadge && bgPicker) {
    previewBgHexBadge.addEventListener('click', () => {
      if (typeof bgPicker.showPicker === 'function') {
        try {
          bgPicker.showPicker();
        } catch (err) {
          bgPicker.click();
        }
      } else {
        bgPicker.click();
      }
    });
  }

  // --- AUTHOR CARD CLICK & REPORT & VARIATIONS ---
  const modalAuthorCard = document.getElementById('modal-author-card');
  if (modalAuthorCard) {
    modalAuthorCard.addEventListener('click', () => {
      if (modalAuthor) modalAuthor.click();
    });
  }

  const modalNewVariationBtn = document.getElementById('modal-new-variation-btn');
  if (modalNewVariationBtn) {
    modalNewVariationBtn.addEventListener('click', () => {
      if (!currentModalComponentId) return;
      const comp = findAnyComp(currentModalComponentId);
      closeModal(true);
      if (typeof openUploadModal === 'function') {
        openUploadModal({
          title: `${comp?.title || 'Component'} (Remix)`,
          category: comp?.category || 'Buttons',
          html: comp?.html || '',
          css: comp?.css || '',
        });
        showToast('Created variation draft in upload modal!', 'info');
      }
    });
  }

  const modalVariationsBox = document.getElementById('modal-variations-box');
  if (modalVariationsBox) {
    modalVariationsBox.addEventListener('click', () => {
      if (!currentModalComponentId) return;
      const comp = findAnyComp(currentModalComponentId);
      closeModal(true);
      if (typeof openUploadModal === 'function') {
        openUploadModal({
          title: `${comp?.title || 'Component'} (Remix)`,
          category: comp?.category || 'Buttons',
          html: comp?.html || '',
          css: comp?.css || '',
        });
        showToast('Created variation draft in upload modal!', 'info');
      }
    });
  }

  const modalReportBtn = document.getElementById('modal-report-btn');
  if (modalReportBtn) {
    modalReportBtn.addEventListener('click', () => {
      showToast('Thank you! Report received for review.', 'info');
    });
  }

  const modalCommentsAuthStatus = document.getElementById('modal-comments-auth-status');
  if (modalCommentsAuthStatus) {
    modalCommentsAuthStatus.addEventListener('click', () => {
      if (!STATE.currentUser && typeof openSigninModal === 'function') {
        openSigninModal('signin', 'Sign in to leave a comment');
      }
    });
  }

  // --- VIEWPORT SIMULATOR & ZOOM CONTROLS (Uiverse Parity) ---
  function updateZoom(newZoom) {
    const clamped = Math.max(50, Math.min(200, newZoom));
    STATE.canvasZoom = clamped;
    if (previewZoomLabel) previewZoomLabel.textContent = `${clamped}%`;
    if (modalIframe) {
      modalIframe.style.transform = clamped === 100 ? '' : `scale(${clamped / 100})`;
      modalIframe.style.transformOrigin = 'center center';
    }
  }

  if (previewZoomIn) {
    previewZoomIn.addEventListener('click', () => updateZoom((STATE.canvasZoom || 100) + 25));
  }
  if (previewZoomOut) {
    previewZoomOut.addEventListener('click', () => updateZoom((STATE.canvasZoom || 100) - 25));
  }

  viewportBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const vp = btn.dataset.viewport || 'desktop';
      STATE.currentViewport = vp;
      if (canvasWrapper) canvasWrapper.dataset.viewport = vp;
      viewportBtns.forEach((b) => {
        const isCurrent = b === btn;
        b.classList.toggle('active', isCurrent);
        b.classList.toggle('bg-surface-600', isCurrent);
        b.classList.toggle('text-white', isCurrent);
        b.classList.toggle('text-gray-400', !isCurrent);
      });
      refreshModalPreview();
    });
  });

  // --- MODAL COMMENTS FORM & AUTHOR VIEW ALL ---
  if (modalCommentForm) {
    modalCommentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentModalComponentId) return;

      if (!STATE.currentUser) {
        showToast('Please sign in to leave a comment', 'info');
        if (typeof openSigninModal === 'function') {
          openSigninModal('signin', 'Sign in to join the conversation and comment');
        }
        return;
      }

      const text = (modalCommentInput?.value || '').trim();
      if (!text) return;

      const author = STATE.currentUser?.displayName || STATE.currentUser?.email?.split('@')[0] || 'CommunityUser';
      const newComment = {
        author: author,
        avatar: author.charAt(0).toUpperCase(),
        text: text,
        time: 'Just now'
      };
      saveComponentComment(currentModalComponentId, newComment);
      if (modalCommentInput) modalCommentInput.value = '';
      renderCommentsList();
      showToast('Comment posted successfully!', 'success');
    });
  }

  if (modalViewAllAuthorBtn) {
    modalViewAllAuthorBtn.addEventListener('click', () => {
      const comp = findAnyComp(currentModalComponentId);
      if (comp?.author) {
        closeModal(true);
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.value = comp.author;
          searchInput.dispatchEvent(new Event('input'));
        }
      }
    });
  }

  // --- RANDOM COMPONENT GENERATOR (Uiverse Parity) ---
  const randomBtn = document.getElementById('random-btn');
  function openRandomComponent() {
    if (!STATE.components || !STATE.components.length) return;
    const randomIndex = Math.floor(Math.random() * STATE.components.length);
    const randomComp = STATE.components[randomIndex];
    if (randomComp) {
      openModal(randomComp, true);
      showToast(`Random Element: ${randomComp.title || randomComp.category}`, 'info');
    }
  }
  window.openRandomComponent = openRandomComponent;

  if (randomBtn) {
    randomBtn.addEventListener('click', openRandomComponent);
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

  // Modal Like button
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
    // Sync hamburger checkboxes WITHOUT triggering change events
    if (sidebarOpenBtn) { const inp = sidebarOpenBtn.querySelector('input'); if (inp) inp.checked = true; }
    if (sidebarCloseBtn) { const inp = sidebarCloseBtn.querySelector('input'); if (inp) inp.checked = true; }
  }

  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarBackdrop.classList.remove('opacity-100');
    sidebarBackdrop.classList.add('pointer-events-none');
    setTimeout(() => {
      if (sidebar.classList.contains('-translate-x-full')) sidebarBackdrop.classList.add('hidden');
    }, 300);
    // Sync hamburger checkboxes WITHOUT triggering change events
    if (sidebarOpenBtn) { const inp = sidebarOpenBtn.querySelector('input'); if (inp) inp.checked = false; }
    if (sidebarCloseBtn) { const inp = sidebarCloseBtn.querySelector('input'); if (inp) inp.checked = false; }
  }

  // Expose closeSidebar globally so category buttons can call it directly
  window._closeSidebar = closeSidebar;

  if (sidebarOpenBtn) {
    sidebarOpenBtn.addEventListener('change', (e) => {
      // Prevent loop: only act when checkbox state actually changed by user interaction
      if (e.target.checked) openSidebar();
      else closeSidebar();
    });
  }
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('change', (e) => {
      if (!e.target.checked) closeSidebar();
      else openSidebar();
    });
  }
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

    function syncUserStateUI() {
      const user = STATE.currentUser;
      const isRealUser = !!user;
      const settings = typeof getUserSettings === 'function' ? getUserSettings() : {};

      if (isRealUser) {
        if (signinBtn) signinBtn.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');

        const displayName = settings.name || (user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'Phitsamay')) : 'Phitsamay');
        if (userNameEl) userNameEl.textContent = displayName;

        if (user && user.photoURL) {
          if (userAvatar) {
            userAvatar.src = user.photoURL;
            userAvatar.classList.remove('hidden');
          }
          if (userAvatarPlaceholder) userAvatarPlaceholder.classList.add('hidden');
        } else {
          if (userAvatarPlaceholder) {
            userAvatarPlaceholder.textContent = displayName.charAt(0).toUpperCase();
            userAvatarPlaceholder.classList.remove('hidden');
          }
          if (userAvatar) userAvatar.classList.add('hidden');
        }
      } else {
        if (signinBtn) signinBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
      }

      if (typeof updateProfileUserInfo === 'function') updateProfileUserInfo();
      if (typeof updateHeroStats === 'function') updateHeroStats();
    }

    // Call initially to render correct user menu immediately
    syncUserStateUI();

    // Auth State Listener
    auth.onAuthStateChanged((user) => {
      const isRealUser = user && !user.isAnonymous;
      if (isRealUser) {
        STATE.currentUser = user;
        try {
          localStorage.setItem('uiforge_user', JSON.stringify({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          }));
          localStorage.removeItem('uiforge_logged_out');
        } catch (e) { }
      } else if (localStorage.getItem('uiforge_logged_out') === 'true') {
        STATE.currentUser = null;
      } else {
        STATE.currentUser = getStoredUser();
      }
      syncUserStateUI();
    });

    // Open Signin Modal
    if (signinBtn) {
      signinBtn.addEventListener('click', () => {
        if (typeof openSigninModal === 'function') {
          openSigninModal('signin');
        } else if (signinModal) {
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

    // Google Login
    if (googleAuthBtn) {
      googleAuthBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then(() => {
            closeSigninModal();
            showToast('Signed in successfully!', 'success');
          })
          .catch((error) => {
            console.error('[UIForge] Google login failed:', error);
            showToast('Login failed: ' + (error.message || 'Unknown error'), 'error');
          });
      });
    }

    // GitHub Login
    const githubAuthBtn = document.getElementById('github-auth-btn');
    if (githubAuthBtn) {
      githubAuthBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GithubAuthProvider();
        auth.signInWithPopup(provider)
          .then(() => {
            closeSigninModal();
            showToast('Signed in with GitHub successfully!', 'success');
          })
          .catch((error) => {
            console.error('[UIForge] GitHub login failed:', error);
            showToast('GitHub login failed: ' + (error.message || 'Unknown error'), 'error');
          });
      });
    }

    // Sign Out
    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        if (userDropdown) {
          userDropdown.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
          userMenuIcon?.classList.remove('rotate-180');
        }
        if (typeof closeProfileModal === 'function') closeProfileModal();
        try {
          localStorage.setItem('uiforge_logged_out', 'true');
          localStorage.removeItem('uiforge_user');
        } catch (e) { }
        STATE.currentUser = null;
        syncUserStateUI();
        if (typeof auth !== 'undefined' && auth.currentUser) {
          auth.signOut().catch(() => { });
        }
        showToast('Signed out successfully.', 'info');
      });
    }
  } else {
    // Firebase not loaded — provide basic UI-only fallback
    console.warn("[UIForge] Firebase SDK not loaded, authentication disabled.");
    const signinBtnEl = document.getElementById('signin-btn');
    const signinModalEl = document.getElementById('signin-modal');
    const signinCloseBtnEl = document.getElementById('signin-close-btn');
    const signinBackdropEl = document.getElementById('signin-backdrop');
    if (signinBtnEl) {
      signinBtnEl.addEventListener('click', () => {
        if (signinModalEl) {
          signinModalEl.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      });
    }
    const closeAuthModal = () => {
      if (signinModalEl) {
        signinModalEl.classList.add('hidden');
        document.body.style.overflow = '';
      }
    };
    signinCloseBtnEl?.addEventListener('click', closeAuthModal);
    signinBackdropEl?.addEventListener('click', closeAuthModal);
    document.getElementById('signin-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Authentication not available in this mode.', 'warning');
    });
    document.getElementById('google-auth-btn')?.addEventListener('click', () => {
      showToast('Google authentication not available in this mode.', 'warning');
    });
  }


  /* ============================================================
     11. PROFILE, EDIT & DELETE CONTROLLER
     ============================================================ */

  const profileModal = document.getElementById('profile-modal');
  const profileBackdrop = document.getElementById('profile-backdrop');
  const profileCloseBtn = document.getElementById('profile-close-btn');
  const profileTabUploadsBtn = document.getElementById('profile-tab-uploads-btn');
  const profileTabFavoritesBtn = document.getElementById('profile-tab-favorites-btn');
  const profileUploadsPanel = document.getElementById('profile-uploads-panel');
  const profileFavoritesPanel = document.getElementById('profile-favorites-panel');

  const editModal = document.getElementById('edit-modal');
  const editBackdrop = document.getElementById('edit-backdrop');
  const editCloseBtn = document.getElementById('edit-close-btn');
  const editCancelBtn = document.getElementById('edit-cancel-btn');
  const editForm = document.getElementById('edit-form');

  const deleteModal = document.getElementById('delete-modal');
  const deleteBackdrop = document.getElementById('delete-backdrop');
  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  const deleteConfirmBtn = document.getElementById('delete-confirm-btn');

  /* ============================================================
     UIVERSE PROFILE & SETTINGS SYSTEM (100% PARITY)
     ============================================================ */
  const SETTINGS_KEY = 'uiforge_user_settings';

  function getUserSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    const user = STATE.currentUser;
    const defaultName = user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'Phitsamay')) : 'Phitsamay';
    const defaultHandle = user ? (user.email ? user.email.split('@')[0] : 'phitsamay_9492') : 'phitsamay_9492';
    return {
      name: defaultName,
      handle: defaultHandle,
      location: '',
      company: '',
      twitter: '',
      website: '',
      bio: ''
    };
  }

  function saveUserSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) { }
  }

  function updateProfileCompletion(settings) {
    const fields = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'location', label: 'Location' },
      { key: 'company', label: 'Company' },
      { key: 'twitter', label: 'Twitter' },
      { key: 'website', label: 'Website' },
      { key: 'bio', label: 'Bio' },
    ];
    const missing = fields.filter((f) => !settings[f.key] || !String(settings[f.key]).trim()).map((f) => f.label);
    const filledCount = fields.length - missing.length;
    const percent = Math.round((filledCount / fields.length) * 100);

    const percentEl = document.getElementById('settings-completion-percent');
    const barEl = document.getElementById('settings-completion-bar');
    const missingEl = document.getElementById('settings-missing-fields');

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (barEl) barEl.style.width = `${percent}%`;
    if (missingEl) {
      if (missing.length === 0) {
        missingEl.textContent = 'All profile fields completed! 🎉';
      } else {
        missingEl.textContent = `Missing: ${missing.join(', ')}`;
      }
    }
  }

  function updateProfileUserInfo() {
    const user = STATE.currentUser;
    const settings = getUserSettings();
    const nameEl = document.getElementById('profile-user-name');
    const handleEl = document.getElementById('profile-user-handle');
    const avatarImg = document.getElementById('profile-user-avatar');
    const avatarPlaceholder = document.getElementById('profile-user-avatar-placeholder');

    const displayName = settings.name || (user ? (user.displayName || user.email.split('@')[0]) : 'Phitsamay');
    const handle = settings.handle || (user ? (user.email ? user.email.split('@')[0] : 'phitsamay_9492') : 'phitsamay_9492');

    if (nameEl) nameEl.textContent = displayName;
    if (handleEl) handleEl.textContent = handle.startsWith('@') ? handle : `@${handle}`;

    const navUserName = document.getElementById('user-name');
    if (navUserName) navUserName.textContent = displayName;

    if (user && user.photoURL && avatarImg) {
      avatarImg.src = user.photoURL;
      avatarImg.classList.remove('hidden');
      if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
    } else {
      if (avatarPlaceholder) {
        avatarPlaceholder.textContent = displayName.charAt(0).toUpperCase();
        avatarPlaceholder.classList.remove('hidden');
      }
      if (avatarImg) avatarImg.classList.add('hidden');
    }

    // Populate Settings form fields
    const nameInput = document.getElementById('settings-name');
    const emailInput = document.getElementById('settings-email');
    const emailDisplayInput = document.getElementById('settings-email-input');
    const locInput = document.getElementById('settings-location');
    const compInput = document.getElementById('settings-company');
    const twInput = document.getElementById('settings-twitter');
    const webInput = document.getElementById('settings-website');
    const bioInput = document.getElementById('settings-bio');
    const notifChk = document.getElementById('settings-notifications-chk');

    const currentEmail = settings.email || (user ? user.email : '') || '';
    if (nameInput) nameInput.value = settings.name || '';
    if (emailInput) emailInput.value = currentEmail;
    if (emailDisplayInput) emailDisplayInput.value = currentEmail;
    if (locInput) locInput.value = settings.location || '';
    if (compInput) compInput.value = settings.company || '';
    if (twInput) twInput.value = settings.twitter || '';
    if (webInput) webInput.value = settings.website || '';
    if (bioInput) bioInput.value = settings.bio || '';
    if (notifChk) notifChk.checked = settings.emailNotifications !== false;

    // Update status badge counts in profile tabs
    const allUploads = getUserUploads();
    const approvedCount = allUploads.filter(c => c.status !== 'rejected' && c.status !== 'in-review').length;
    const inReviewCount = allUploads.filter(c => c.status === 'in-review').length;
    const rejectedCount = allUploads.filter(c => c.status === 'rejected').length;
    const favCount = STATE.likedIds ? STATE.likedIds.size : 0;

    const postsBadge = document.getElementById('profile-posts-count-badge');
    if (postsBadge) {
      postsBadge.textContent = approvedCount;
      postsBadge.classList.toggle('hidden', approvedCount === 0);
    }
    const inReviewBadge = document.getElementById('profile-in-review-count-badge');
    if (inReviewBadge) {
      inReviewBadge.textContent = inReviewCount;
      inReviewBadge.classList.toggle('hidden', inReviewCount === 0);
    }
    const rejectedBadge = document.getElementById('profile-rejected-count-badge');
    if (rejectedBadge) {
      rejectedBadge.textContent = rejectedCount;
      rejectedBadge.classList.toggle('hidden', rejectedCount === 0);
    }
    const favBadge = document.getElementById('profile-favorites-count-badge');
    if (favBadge) {
      favBadge.textContent = favCount;
      favBadge.classList.toggle('hidden', favCount === 0);
    }

    updateProfileCompletion(settings);
    updateProfileStats();
  }
  window.updateProfileUserInfo = updateProfileUserInfo;

  function getUserUploads() {
    const deletedIds = getDeletedComponentIds();
    const myIds = getMyUploadIds();
    const currentUserId = STATE.currentUser?.uid;
    const currentAuthor = STATE.currentUser?.displayName || (STATE.currentUser?.email ? STATE.currentUser.email.split('@')[0] : null);
    const settingsName = typeof getUserSettings === 'function' ? getUserSettings().name : null;

    const pool = [...getStoredUserUploads(), ...getStoredCommunityUploads()];
    const unique = new Map();
    pool.forEach((c) => {
      if (!c || unique.has(c.id)) return;
      if (deletedIds.has(c.id)) return;
      if (String(c.id).startsWith('uiv-')) return;
      const isOwner = (currentUserId && c.userId && c.userId === currentUserId) ||
        myIds.has(c.id) ||
        (currentAuthor && c.author && c.author.toLowerCase() === currentAuthor.toLowerCase()) ||
        (settingsName && c.author && c.author.toLowerCase() === settingsName.toLowerCase()) ||
        c.isUserUpload;
      if (isOwner) {
        unique.set(c.id, c);
      }
    });
    return Array.from(unique.values());
  }
  window.getUserUploads = getUserUploads;

  function updateProfileStats() {
    const myUploads = getUserUploads();
    const totalViews = myUploads.reduce((sum, c) => sum + (getComponentViewsCount(c) || 0), 0);
    const totalFavs = STATE.likedIds ? STATE.likedIds.size : 0;
    const totalUploads = myUploads.length;
    const totalLikesReceived = myUploads.reduce((sum, c) => sum + (getComponentLikesCount(c) || 0), 0);

    const viewsEl = document.getElementById('settings-stat-views');
    const likesEl = document.getElementById('settings-stat-likes');
    const uploadsEl = document.getElementById('settings-stat-uploads');
    const reputationEl = document.getElementById('settings-stat-reputation');

    if (viewsEl) viewsEl.textContent = formatNumber(totalViews);
    if (likesEl) likesEl.textContent = formatNumber(totalFavs);
    if (uploadsEl) uploadsEl.textContent = formatNumber(totalUploads);
    if (reputationEl) reputationEl.textContent = formatNumber(totalLikesReceived);

    // Account ID and Connected Email
    const accountUidEl = document.getElementById('settings-account-uid');
    if (accountUidEl) {
      const handle = getUserSettings().handle;
      accountUidEl.textContent = STATE.currentUser?.uid || (handle ? '@' + handle : 'LOCAL-GUEST');
    }
    const accountEmailEl = document.getElementById('settings-account-email');
    if (accountEmailEl) {
      const email = STATE.currentUser?.email || getUserSettings().email || 'Not connected';
      accountEmailEl.textContent = email;
    }
  }

  // --- PROFILE MODAL & TABS ---
  function openProfileModal(tab = 'posts') {
    if (userDropdown) {
      userDropdown.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
      if (userMenuIcon) userMenuIcon.classList.remove('rotate-180');
    }

    if (typeof updateProfileUserInfo === 'function') {
      updateProfileUserInfo();
    } else if (typeof window.updateProfileUserInfo === 'function') {
      window.updateProfileUserInfo();
    }
    switchProfileTab(tab);

    if (profileModal) {
      profileModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeProfileModal() {
    if (profileModal) {
      profileModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function switchProfileTab(tabName) {
    STATE.activeProfileTab = tabName;
    document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
      const isCurrent = btn.dataset.profileTab === tabName;
      btn.classList.toggle('active', isCurrent);
      btn.setAttribute('aria-selected', String(isCurrent));
    });

    renderProfileContent(tabName);
  }

  function openEditRejectedInStudio(comp) {
    if (!comp) return;
    closeProfileModal();
    UPLOAD_STUDIO.isDirty = false;
    UPLOAD_STUDIO.editingId = comp.id;
    openUploadModal(comp);
    const catDialog = document.getElementById('upload-category-dialog');
    if (catDialog) catDialog.classList.add('hidden');
    showToast(typeof t === 'function' ? t('edit_and_fix_hint') : 'Component loaded in Studio. Fix highlighted issues and re-submit.', 'info');
  }

  async function renderProfileContent(tab = 'posts') {
    const emptyState = document.getElementById('profile-empty-state');
    const emptyTitle = document.getElementById('profile-empty-title');
    const emptyDesc = document.getElementById('profile-empty-desc');
    const emptyBtn = document.getElementById('profile-empty-create-btn');
    const grid = document.getElementById('profile-posts-grid');

    if (!emptyState || !grid) return;

    if (tab === 'posts') {
      let items = getUserUploads().filter((c) => c.status !== 'rejected' && c.status !== 'in-review');
      if (profileSortMode === 'popular') {
        items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else {
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      if (items.length === 0) {
        grid.classList.add('hidden');
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (emptyTitle) emptyTitle.textContent = typeof t === 'function' ? t('no_posts_title') : 'No Public Posts Yet';
        if (emptyDesc) emptyDesc.textContent = typeof t === 'function' ? t('no_posts_desc') : "Looks like you haven't made any posts yet.";
        if (emptyBtn) {
          emptyBtn.innerHTML = '<i class="fa-solid fa-plus text-xs"></i> <span>' + (typeof t === 'function' ? t('btn_create') : 'Create') + '</span>';
          emptyBtn.onclick = () => {
            closeProfileModal();
            openUploadModal();
          };
        }
      } else {
        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = '';

        items.forEach((c) => {
          const card = document.createElement('div');
          card.dataset.id = c.id;
          card.setAttribute('data-id', c.id);
          card.className = 'group flex flex-col rounded-2xl bg-[#141416] border border-white/10 overflow-hidden hover:border-emerald-500/40 transition-all shadow-sm';
          const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently';

          card.innerHTML = `
            <div class="h-44 bg-[#0a0a0c] relative flex items-center justify-center p-3 overflow-hidden cursor-pointer preview-click-area">
              <iframe sandbox="allow-scripts" loading="lazy" class="w-full h-full pointer-events-none" srcdoc="${escapeAttr(buildPreviewSrcDoc(c.html, c.css, c.category || '', false, '#0a0a0c'))}"></iframe>
            </div>
            <div class="p-3.5 flex flex-col gap-2 flex-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="font-bold text-white text-xs truncate hover:text-emerald-400 cursor-pointer card-title" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</h4>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                  <i class="fa-solid fa-circle-check text-[9px]"></i>
                  <span>${escapeHtml(typeof t === 'function' ? t('status_approved') : 'Approved')}</span>
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-gray-400 mt-auto pt-2 border-t border-white/5">
                <div class="flex items-center gap-2">
                  <span><i class="fa-solid fa-heart text-pink-400 mr-1"></i>${getComponentLikesCount(c)}</span>
                  <span><i class="fa-regular fa-clock mr-1"></i>${createdDate}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button type="button" class="btn-card-edit p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-white/5 transition-colors" title="Edit">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                  <button type="button" class="btn-card-del p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors" title="Delete">
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          `;

          card.querySelector('.preview-click-area')?.addEventListener('click', () => {
            closeProfileModal();
            openModal(c.id);
          });
          card.querySelector('.card-title')?.addEventListener('click', () => {
            closeProfileModal();
            openModal(c.id);
          });
          card.querySelector('.btn-card-edit')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(c.id);
          });
          card.querySelector('.btn-card-del')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(c.id);
          });

          grid.appendChild(card);
        });
      }
    } else if (tab === 'in-review') {
      let items = getUserUploads().filter((c) => c.status === 'in-review');

      if (items.length === 0) {
        grid.classList.add('hidden');
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (emptyTitle) emptyTitle.textContent = typeof t === 'function' ? t('no_in_review_title') : 'No Posts In Review';
        if (emptyDesc) emptyDesc.textContent = typeof t === 'function' ? t('no_in_review_desc') : 'All submitted components have been processed by the automated security engine.';
        if (emptyBtn) {
          emptyBtn.innerHTML = '<i class="fa-solid fa-plus text-xs"></i> <span>' + (typeof t === 'function' ? t('btn_create') : 'Create') + '</span>';
          emptyBtn.onclick = () => {
            closeProfileModal();
            openUploadModal();
          };
        }
      } else {
        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = '';

        items.forEach((c) => {
          const card = document.createElement('div');
          card.dataset.id = c.id;
          card.setAttribute('data-id', c.id);
          card.className = 'group flex flex-col rounded-2xl bg-[#141416] border border-amber-500/30 overflow-hidden shadow-sm';
          const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently';

          card.innerHTML = `
            <div class="h-44 bg-[#0a0a0c] relative flex items-center justify-center p-3 overflow-hidden cursor-pointer preview-click-area">
              <iframe sandbox="allow-scripts" loading="lazy" class="w-full h-full pointer-events-none" srcdoc="${escapeAttr(buildPreviewSrcDoc(c.html, c.css, c.category || '', false, '#0a0a0c'))}"></iframe>
            </div>
            <div class="p-3.5 flex flex-col gap-2 flex-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="font-bold text-white text-xs truncate">${escapeHtml(c.title)}</h4>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 flex items-center gap-1">
                  <i class="fa-solid fa-hourglass-half text-[9px]"></i>
                  <span>${escapeHtml(typeof t === 'function' ? t('status_in_review') : 'In Review')}</span>
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-gray-400 mt-auto pt-2 border-t border-white/5">
                <span><i class="fa-regular fa-clock mr-1"></i>${createdDate}</span>
              </div>
            </div>
          `;
          grid.appendChild(card);
        });
      }
    } else if (tab === 'rejected') {
      let items = getUserUploads().filter((c) => c.status === 'rejected');

      if (items.length === 0) {
        grid.classList.add('hidden');
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (emptyTitle) emptyTitle.textContent = typeof t === 'function' ? t('no_rejected_title') : 'No Rejected Posts';
        if (emptyDesc) emptyDesc.textContent = typeof t === 'function' ? t('no_rejected_desc') : 'Great job! None of your components have violated security guidelines.';
        if (emptyBtn) {
          emptyBtn.innerHTML = '<i class="fa-solid fa-plus text-xs"></i> <span>' + (typeof t === 'function' ? t('btn_create') : 'Create') + '</span>';
          emptyBtn.onclick = () => {
            closeProfileModal();
            openUploadModal();
          };
        }
      } else {
        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = '';

        items.forEach((c) => {
          const card = document.createElement('div');
          card.dataset.id = c.id;
          card.setAttribute('data-id', c.id);
          card.className = 'group flex flex-col rounded-2xl bg-[#141416] border border-red-500/30 overflow-hidden shadow-sm hover:border-red-500/50 transition-all';
          const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently';
          const reasonsText = (c.rejectionReasons && c.rejectionReasons.length)
            ? c.rejectionReasons.join(' • ')
            : (typeof t === 'function' ? t('status_rejected') : 'Failed automated security check.');

          card.innerHTML = `
            <div class="h-44 bg-[#0a0a0c] relative flex items-center justify-center p-3 overflow-hidden cursor-pointer preview-click-area">
              <iframe sandbox="allow-scripts" loading="lazy" class="w-full h-full pointer-events-none opacity-80" srcdoc="${escapeAttr(buildPreviewSrcDoc(c.html, c.css, c.category || '', false, '#0a0a0c'))}"></iframe>
            </div>
            <div class="p-3.5 flex flex-col gap-2.5 flex-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="font-bold text-white text-xs truncate text-red-200" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</h4>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 shrink-0 flex items-center gap-1">
                  <i class="fa-solid fa-triangle-exclamation text-[9px]"></i>
                  <span>${escapeHtml(typeof t === 'function' ? t('status_rejected') : 'Rejected')}</span>
                </span>
              </div>

              <!-- Rejection Reason Diagnosis Box -->
              <div class="p-2.5 rounded-xl bg-red-950/40 border border-red-500/25 text-[11px] text-red-300 space-y-1">
                <div class="font-bold flex items-center gap-1.5 text-red-400 text-[10px]">
                  <i class="fa-solid fa-shield-halved text-xs"></i>
                  <span>${escapeHtml(typeof t === 'function' ? t('rejection_reason_label') : 'Rejection Reason:')}</span>
                </div>
                <div class="text-[10px] leading-relaxed text-gray-300">${escapeHtml(reasonsText)}</div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-gray-400 mt-auto pt-2 border-t border-white/5">
                <span><i class="fa-regular fa-clock mr-1"></i>${createdDate}</span>
                <div class="flex items-center gap-1.5">
                  <button type="button" class="btn-card-fix px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                    <i class="fa-solid fa-wrench text-[10px]"></i>
                    <span>${escapeHtml(typeof t === 'function' ? t('btn_edit_fix') : 'Edit & Fix')}</span>
                  </button>
                  <button type="button" class="btn-card-del p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors" title="Delete">
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          `;

          card.querySelector('.btn-card-fix')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditRejectedInStudio(c);
          });
          card.querySelector('.btn-card-del')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(c.id);
          });

          grid.appendChild(card);
        });
      }
    } else if (tab === 'favorites') {
      const items = [];
      const missingCategorySet = new Set();

      if (STATE.likedIds && STATE.likedIds.size > 0) {
        STATE.likedIds.forEach((id) => {
          const comp = findComponentAnywhere(id);
          if (comp) {
            items.push(comp);
          } else if (window.UIVERSE_MANIFEST && window.UIVERSE_MANIFEST.categories) {
            for (const [catName, catMeta] of Object.entries(window.UIVERSE_MANIFEST.categories)) {
              if (catMeta.ids && catMeta.ids.includes(id)) {
                missingCategorySet.add(catName);
                break;
              }
            }
          }
        });

        if (missingCategorySet.size > 0 && typeof loadCategoryData === 'function') {
          await Promise.all([...missingCategorySet].map((cat) => loadCategoryData(cat)));
          STATE.likedIds.forEach((id) => {
            if (!items.some((c) => c.id === id)) {
              const comp = findComponentAnywhere(id);
              if (comp) items.push(comp);
            }
          });
        }
      }

      if (items.length === 0) {
        grid.classList.add('hidden');
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (emptyTitle) emptyTitle.textContent = typeof t === 'function' ? t('profile_no_favorites') : 'No Favorites Yet';
        if (emptyDesc) emptyDesc.textContent = typeof t === 'function' ? t('profile_no_favorites_hint') : "You haven't saved any favorite UI elements yet.";
        if (emptyBtn) {
          emptyBtn.innerHTML = '<i class="fa-regular fa-compass text-xs"></i> <span>' + (typeof t === 'function' ? t('btn_explore') : 'Explore Components') + '</span>';
          emptyBtn.onclick = () => {
            closeProfileModal();
            const exploreEl = document.getElementById('explore-section') || document.getElementById('components-grid');
            if (exploreEl) exploreEl.scrollIntoView({ behavior: 'smooth' });
          };
        }
      } else {
        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = '';

        items.forEach((c) => {
          const card = document.createElement('div');
          card.className = 'group flex flex-col rounded-2xl bg-[#141416] border border-white/10 overflow-hidden hover:border-pink-500/40 transition-all shadow-sm';
          const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently';

          card.innerHTML = `
            <div class="h-44 bg-[#0a0a0c] relative flex items-center justify-center p-3 overflow-hidden cursor-pointer preview-click-area">
              <iframe sandbox="allow-scripts" loading="lazy" class="w-full h-full pointer-events-none" srcdoc="${escapeAttr(buildPreviewSrcDoc(c.html, c.css, c.category || '', false, '#0a0a0c'))}"></iframe>
            </div>
            <div class="p-3.5 flex flex-col gap-2 flex-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="font-bold text-white text-xs truncate hover:text-pink-400 cursor-pointer card-title" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</h4>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-gray-300 border border-white/5 shrink-0">${escapeHtml(c.category || 'Other')}</span>
              </div>
              <div class="text-[11px] text-gray-400">
                by <span class="text-gray-300 font-medium">${escapeHtml(c.author || 'Anonymous')}</span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-gray-400 mt-auto pt-2 border-t border-white/5">
                <div class="flex items-center gap-2">
                  <span><i class="fa-solid fa-heart text-pink-400 mr-1"></i>${getComponentLikesCount(c)}</span>
                  <span><i class="fa-regular fa-clock mr-1"></i>${createdDate}</span>
                </div>
                <button type="button" class="btn-card-unlike px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-pink-500/20" title="Remove from favorites">
                  <i class="fa-solid fa-heart text-[10px]"></i>
                  <span>Liked</span>
                </button>
              </div>
            </div>
          `;

          card.querySelector('.preview-click-area')?.addEventListener('click', () => {
            closeProfileModal();
            openModal(c.id);
          });
          card.querySelector('.card-title')?.addEventListener('click', () => {
            closeProfileModal();
            openModal(c.id);
          });
          card.querySelector('.btn-card-unlike')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleLike(c.id);
            if (typeof updateProfileUserInfo === 'function') {
      updateProfileUserInfo();
    } else if (typeof window.updateProfileUserInfo === 'function') {
      window.updateProfileUserInfo();
    }
            renderProfileContent('favorites');
            showToast('Removed from favorites', 'info');
          });

          grid.appendChild(card);
        });
      }
    }
  }

  function renderProfileUploads() {
    renderProfileContent('posts');
  }

  function renderProfileFavorites() {
    renderProfileContent('favorites');
  }

  // --- SETTINGS MODAL & TABS ---
  const settingsModal = document.getElementById('settings-modal');

  function openSettingsModal(activeTab = 'profile') {
    if (userDropdown) {
      userDropdown.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
      if (userMenuIcon) userMenuIcon.classList.remove('rotate-180');
    }
    if (typeof updateProfileUserInfo === 'function') {
      updateProfileUserInfo();
    } else if (typeof window.updateProfileUserInfo === 'function') {
      window.updateProfileUserInfo();
    }
    switchSettingsTab(activeTab);
    if (settingsModal) {
      settingsModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeSettingsModal() {
    if (settingsModal) {
      settingsModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function switchSettingsTab(tabName) {
    document.querySelectorAll('.settings-nav-btn').forEach((btn) => {
      const isCurrent = btn.dataset.settingsTab === tabName;
      btn.classList.toggle('active', isCurrent);
      btn.setAttribute('aria-selected', String(isCurrent));
    });

    ['profile', 'email', 'account', 'stats'].forEach((tab) => {
      const panel = document.getElementById(`settings-panel-${tab}`);
      if (panel) {
        if (tab === tabName) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }
    });

    if (tabName === 'stats' || tabName === 'account') {
      updateProfileStats();
    }
  }

  // Edit / Delete Modal Logic
  function openEditModal(id) {
    const comp = findComponentAnywhere(id);
    if (!comp) return;

    const idEl = document.getElementById('edit-component-id');
    const titleEl = document.getElementById('edit-component-title');
    const catEl = document.getElementById('edit-component-category');
    const htmlEl = document.getElementById('edit-component-html');
    const cssEl = document.getElementById('edit-component-css');

    if (idEl) idEl.value = comp.id;
    if (titleEl) titleEl.value = comp.title || '';
    if (catEl) catEl.value = comp.category || 'Other';
    if (htmlEl) htmlEl.value = comp.html || '';
    if (cssEl) cssEl.value = comp.css || '';

    if (editModal) editModal.classList.remove('hidden');
  }

  function closeEditModal() {
    if (editModal) editModal.classList.add('hidden');
  }

  function openDeleteModal(id) {
    const idEl = document.getElementById('delete-component-id');
    if (idEl) idEl.value = id;
    if (deleteModal) deleteModal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    if (deleteModal) deleteModal.classList.add('hidden');
  }

  // --- ATTACH EVENT LISTENERS FOR PROFILE & SETTINGS ---
  // Navbar dropdown items
  document.getElementById('user-profile-btn')?.addEventListener('click', () => openProfileModal('posts'));
  document.getElementById('user-favorites-btn')?.addEventListener('click', () => openProfileModal('favorites'));
  document.getElementById('user-settings-btn')?.addEventListener('click', () => openSettingsModal('profile'));

  // Profile modal buttons
  document.getElementById('profile-close-btn')?.addEventListener('click', closeProfileModal);
  document.getElementById('profile-open-settings-btn')?.addEventListener('click', () => {
    closeProfileModal();
    openSettingsModal('profile');
  });
  document.getElementById('profile-empty-create-btn')?.addEventListener('click', () => {
    closeProfileModal();
    openUploadModal();
  });

  // Profile tabs
  document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.profileTab;
      if (tab) switchProfileTab(tab);
    });
  });

  // Profile Sort toggle
  let profileSortMode = 'newest';
  document.getElementById('profile-filter-sort-btn')?.addEventListener('click', () => {
    profileSortMode = profileSortMode === 'newest' ? 'popular' : 'newest';
    const sortText = document.getElementById('profile-filter-sort-text');
    if (sortText) sortText.textContent = profileSortMode === 'newest' ? 'Newest' : 'Popular';
    renderProfileContent(STATE.activeProfileTab || 'posts');
  });

  // Settings modal buttons
  document.getElementById('settings-close-btn')?.addEventListener('click', closeSettingsModal);
  document.getElementById('settings-cancel-btn')?.addEventListener('click', closeSettingsModal);

  // Settings tabs
  document.querySelectorAll('.settings-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.settingsTab;
      if (tab) switchSettingsTab(tab);
    });
  });

  // Settings Profile Form Submit
  const settingsForm = document.getElementById('settings-profile-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = getUserSettings();
      const emailVal = document.getElementById('settings-email')?.value.trim() || current.email || '';
      const updated = {
        ...current,
        name: document.getElementById('settings-name')?.value.trim() || current.name || 'Phitsamay',
        email: emailVal,
        location: document.getElementById('settings-location')?.value.trim() || '',
        company: document.getElementById('settings-company')?.value.trim() || '',
        twitter: document.getElementById('settings-twitter')?.value.trim() || '',
        website: document.getElementById('settings-website')?.value.trim() || '',
        bio: document.getElementById('settings-bio')?.value.trim() || '',
      };
      saveUserSettings(updated);
      if (STATE.currentUser && emailVal) {
        STATE.currentUser.email = emailVal;
        try { localStorage.setItem('uiforge_user', JSON.stringify(STATE.currentUser)); } catch (err) {}
      }
      if (typeof updateProfileUserInfo === 'function') {
      updateProfileUserInfo();
    } else if (typeof window.updateProfileUserInfo === 'function') {
      window.updateProfileUserInfo();
    }
      showToast('Settings saved successfully!', 'success');
    });
  }

  // Settings Email Form Submit
  const settingsEmailForm = document.getElementById('settings-email-form');
  if (settingsEmailForm) {
    settingsEmailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailVal = document.getElementById('settings-email-input')?.value.trim() || '';
      const notifVal = document.getElementById('settings-notifications-chk')?.checked !== false;
      const current = getUserSettings();
      const updated = {
        ...current,
        email: emailVal,
        emailNotifications: notifVal
      };
      saveUserSettings(updated);
      if (STATE.currentUser && emailVal) {
        STATE.currentUser.email = emailVal;
        try { localStorage.setItem('uiforge_user', JSON.stringify(STATE.currentUser)); } catch (err) {}
      }
      if (typeof updateProfileUserInfo === 'function') {
      updateProfileUserInfo();
    } else if (typeof window.updateProfileUserInfo === 'function') {
      window.updateProfileUserInfo();
    }
      showToast('Email preferences saved successfully!', 'success');
    });
  }

  // Settings Sign Out Button
  document.getElementById('settings-signout-btn')?.addEventListener('click', () => {
    closeSettingsModal();
    document.getElementById('signout-btn')?.click();
  });

  // Edit / Delete handlers
  editCloseBtn?.addEventListener('click', closeEditModal);
  editBackdrop?.addEventListener('click', closeEditModal);
  editCancelBtn?.addEventListener('click', closeEditModal);

  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-component-id')?.value;
    const title = document.getElementById('edit-component-title')?.value;
    const category = document.getElementById('edit-component-category')?.value;
    const html = document.getElementById('edit-component-html')?.value;
    const css = document.getElementById('edit-component-css')?.value;

    if (!id || !title.trim() || !html.trim()) {
      showToast('Title and HTML are required.', 'error');
      return;
    }

    try {
      const updated = await updateComponentDetails(id, { title, category, html, css });
      closeEditModal();

      if (typeof updateProfileUserInfo === 'function') {
        updateProfileUserInfo();
      } else if (typeof window.updateProfileUserInfo === 'function') {
        window.updateProfileUserInfo();
      }

      if (updated.status === 'approved') {
        showToast(typeof t === 'function' ? t('edit_success_toast') || 'Component updated successfully!' : 'Component updated successfully!', 'success');
        renderProfileContent(STATE.activeProfileTab || 'posts');
      } else {
        showToast(typeof t === 'function' ? t('upload_rejected_toast') || 'Component rejected by security rules. Moved to Rejected tab.' : 'Component rejected by security rules. Moved to Rejected tab.', 'warning');
        openProfileModal('rejected');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update component.', 'error');
    }
  });

  deleteCancelBtn?.addEventListener('click', closeDeleteModal);
  deleteBackdrop?.addEventListener('click', closeDeleteModal);
  deleteConfirmBtn?.addEventListener('click', async () => {
    const id = document.getElementById('delete-component-id')?.value;
    if (!id) return;
    try {
      await deleteComponent(id);
      closeDeleteModal();
      showToast('Component deleted successfully.', 'info');
      renderProfileContent(STATE.activeProfileTab || 'posts');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete component.', 'error');
    }
  });

  // Handle language change events dynamically
  document.addEventListener('langchange', () => {
    if (typeof updateProfileUserInfo === 'function') {
      updateProfileUserInfo();
    } else if (typeof window.updateProfileUserInfo === 'function') {
      window.updateProfileUserInfo();
    }
    if (STATE.activeProfileTab) {
      renderProfileContent(STATE.activeProfileTab);
    }
    const currentSort = STATE.sort || 'newest';
    const sortLabel = document.getElementById('main-sort-label');
    if (sortLabel) sortLabel.textContent = typeof t === 'function' ? t('main_sort_' + currentSort) : currentSort;
    const sortProfileText = document.getElementById('profile-filter-sort-text');
    if (sortProfileText) sortProfileText.textContent = typeof t === 'function' ? t('profile_filter_' + profileSortMode) : profileSortMode;
  });

  // Expose profile functions on window
  window._renderProfileUploads = renderProfileUploads;
  window._renderProfileFavorites = renderProfileFavorites;
  window._updateProfileStats = updateProfileStats;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.openSettingsModal = openSettingsModal;
  window.closeSettingsModal = closeSettingsModal;

  console.log('[UIForge] Initialised successfully.');
});
