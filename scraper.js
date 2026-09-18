/**
 * UIverse.io Web Scraper for UIForge — Upgraded Edition
 * 
 * คุณสมบัติหลักตามข้อกำหนด:
 * 1. Resume Scraping: อ่านไฟล์ .js ใน data/ เพื่อเช็คว่ามี Component ไหนที่ดึงมาแล้ว (เช็ค Title, Author, FriendlyId, Slug)
 *    หากดึงมาแล้วให้ข้ามไป (Skip) ทันที ป้องกันข้อมูลซ้ำซ้อน 100%
 * 2. Deep Infinite Scroll & Pagination: เลื่อนหน้าจอลงลึก ดักจับปุ่ม "Load More" และดึงหน้าถัดไปอัตโนมัติ
 *    จนกว่าจะได้ข้อมูลใหม่อย่างน้อยหมวดหมู่ละ 200 - 300 ชิ้น (หรือจนกว่าจะหมดหน้าบนเว็บ)
 * 3. Anti-Bot Delay: ระบบหน่วงเวลาสุ่ม (Random Delay 2-4 วินาที) ตอนโหลดหน้าเว็บและการ Scroll เพื่อหลบ Cloudflare
 * 4. Data Formatting: จัดรูปแบบ Object ตามมาตรฐาน UIForge:
 *    { id: "uiv-" + Math.floor(100000 + Math.random() * 900000), title, author, category, likes: 0, views: 0, liked: false, createdAt: "2026-09-11T00:00:00Z", html, css }
 * 5. Save/Append Data: บันทึกข้อมูลเพิ่ม (Append) ต่อจากเดิมใน data/<category>.js โดยรักษาโครงสร้างตัวแปร:
 *    window.UIVERSE_DATA = window.UIVERSE_DATA || {};
 *    window.UIVERSE_DATA['ชื่อหมวดหมู่'] = [ ...ข้อมูลเดิม + ข้อมูลใหม่... ];
 *    พร้อมระบบ Auto-Save ทุกๆ 10 ชิ้นใหม่ ป้องกันข้อมูลสูญหาย
 * 6. Real-time Logging: แสดงสถานะแบบเรียลไทม์ (กำลังดึงหมวดหมู่ไหน, ได้กี่ชิ้นแล้ว, ข้ามของซ้ำกี่ชิ้น)
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// ==============================================================================
// CONFIGURATION
// ==============================================================================
const CHROME_PATH          = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DATA_DIR             = path.join(__dirname, 'data');

// ค่าเป้าหมายชิ้นใหม่เริ่มต้นต่อหมวดหมู่ (200 - 300 ชิ้น)
const DEFAULT_TARGET_NEW   = 250; 

// ขีดจำกัดสูงสุดของแต่ละหมวดหมู่ (ตั้งไว้สูงเพื่อไม่ให้ตัดก่อนกำหนด)
const DEFAULT_MAX_TOTAL    = 10000;

// หน่วงเวลา Anti-Bot ระหว่างหน้า / การ Scroll (2 - 4 วินาที)
const PAGE_DELAY_MIN       = 2000;
const PAGE_DELAY_MAX       = 4000;

// หน่วงเวลาระหว่างดึงรายละเอียดแต่ละ Component (ms)
const DETAIL_DELAY_MS      = 350;

// บันทึกไฟล์ลงดิสก์ทุกๆ N ชิ้นใหม่ เพื่อความปลอดภัย
const SAVE_INTERVAL        = 10;

// วันที่ตามฟอร์แมตที่ผู้ใช้ระบุ
const CREATED_AT_VALUE     = '2026-09-11T00:00:00Z';

// ==============================================================================
// CATEGORY DEFINITIONS
// ==============================================================================
const ALL_CATEGORIES = [
  { slug: 'loaders',       name: 'Loaders',       file: 'loaders.js'       },
  { slug: 'buttons',       name: 'Buttons',        file: 'buttons.js'       },
  { slug: 'cards',         name: 'Cards',          file: 'cards.js'         },
  { slug: 'inputs',        name: 'Inputs',         file: 'inputs.js'        },
  { slug: 'checkboxes',    name: 'Checkboxes',     file: 'checkboxes.js'    },
  { slug: 'switches',      name: 'Toggles',        file: 'toggles.js'       },
  { slug: 'forms',         name: 'Forms',          file: 'forms.js'         },
  { slug: 'patterns',      name: 'Patterns',       file: 'patterns.js'      },
  { slug: 'tooltips',      name: 'Tooltips',       file: 'tooltips.js'      },
  { slug: 'radio-buttons', name: 'Radio Buttons',  file: 'radio_buttons.js' },
  { slug: 'steps',         name: 'Steps',          file: 'steps.js'         },
  { slug: 'avatar-group',  name: 'Avatar Group',   file: 'avatar_group.js'  },
  { slug: 'multi-select',  name: 'Multi-select',   file: 'multi_select.js'  },
  { slug: 'scrollspy',     name: 'Scrollspy',      file: 'scrollspy.js'     },
  { slug: 'alerts',        name: 'Alerts',         file: 'alerts.js'        },
  { slug: 'navigation',    name: 'Navigation',     file: 'navigation.js'    },
  { slug: 'animations',    name: 'Animations',     file: 'animations.js'    },
  { slug: 'other',         name: 'Other',          file: 'other.js'         },
];

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = (min = PAGE_DELAY_MIN, max = PAGE_DELAY_MAX) => {
  const ms = min + Math.floor(Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function generateRandomId() {
  return 'uiv-' + Math.floor(100000 + Math.random() * 900000);
}

/**
 * โหลดข้อมูลเดิมจาก data/<file> เพื่อทำ Resume Scraping
 * ตรวจสอบ Title, Author, FriendlyId เพื่อข้าม Component เดิมที่เคยดึงแล้ว
 */
function loadExistingCategoryData(cat) {
  const filePath = path.join(DATA_DIR, cat.file);
  if (!fs.existsSync(filePath)) {
    return { items: [], seenKeys: new Set() };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const marker = content.indexOf('window.UIVERSE_DATA');
    if (marker === -1) {
      return { items: [], seenKeys: new Set() };
    }

    const eqIdx = content.indexOf('=', marker);
    const nextEq = content.indexOf('=', eqIdx + 1);
    const startIdx = content.indexOf('[', nextEq !== -1 ? nextEq : eqIdx);
    const endIdx = content.lastIndexOf(']');

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return { items: [], seenKeys: new Set() };
    }

    const jsonStr = content.slice(startIdx, endIdx + 1);
    const items = JSON.parse(jsonStr);

    const seenKeys = new Set();
    for (const item of items) {
      const author = (item.author || '').trim().toLowerCase();
      const title = (item.title || '').trim().toLowerCase();
      const titleSlug = title.replace(/\s+/g, '-');

      if (author && title) {
        seenKeys.add(`${author}/${title}`);
        seenKeys.add(`${author}/${titleSlug}`);
      }
      if (title) {
        seenKeys.add(title);
        seenKeys.add(titleSlug);
      }
      if (item.html) {
        const cleanHtml = item.html.replace(/\s+/g, ' ').trim().slice(0, 100);
        seenKeys.add(`html:${cleanHtml}`);
      }
    }

    return { items, seenKeys };
  } catch (err) {
    console.warn(`  [คำเตือน] ไม่สามารถอ่านไฟล์ ${cat.file}: ${err.message}`);
    return { items: [], seenKeys: new Set() };
  }
}

/**
 * เช็คว่า Component ซ้ำกับที่มีอยู่แล้วหรือไม่
 */
function isItemDuplicate(seenKeys, author, friendlyId, title = null, html = null) {
  const a = (author || '').trim().toLowerCase();
  const fid = (friendlyId || '').trim().toLowerCase();
  const t = (title || '').trim().toLowerCase();
  const tSlug = t.replace(/\s+/g, '-');

  if (fid) {
    if (seenKeys.has(fid)) return true;
    if (a && seenKeys.has(`${a}/${fid}`)) return true;
  }
  if (t) {
    if (seenKeys.has(t)) return true;
    if (seenKeys.has(tSlug)) return true;
    if (a && (seenKeys.has(`${a}/${t}`) || seenKeys.has(`${a}/${tSlug}`))) return true;
  }
  if (html) {
    const cleanHtml = html.replace(/\s+/g, ' ').trim().slice(0, 100);
    if (seenKeys.has(`html:${cleanHtml}`)) return true;
  }
  return false;
}

/**
 * บันทึกคีย์ของ Component ที่ดึงใหม่เพื่อกันซ้ำในรอบเดียวกัน
 */
function markItemSeen(seenKeys, author, friendlyId, title, html = null) {
  const a = (author || '').trim().toLowerCase();
  const fid = (friendlyId || '').trim().toLowerCase();
  const t = (title || '').trim().toLowerCase();
  const tSlug = t.replace(/\s+/g, '-');

  if (fid) {
    seenKeys.add(fid);
    if (a) seenKeys.add(`${a}/${fid}`);
  }
  if (t) {
    seenKeys.add(t);
    seenKeys.add(tSlug);
    if (a) {
      seenKeys.add(`${a}/${t}`);
      seenKeys.add(`${a}/${tSlug}`);
    }
  }
  if (html) {
    const cleanHtml = html.replace(/\s+/g, ' ').trim().slice(0, 100);
    seenKeys.add(`html:${cleanHtml}`);
  }
}

/**
 * บันทึกข้อมูล Component ลงไฟล์หมวดหมู่ในโฟลเดอร์ data/
 * โครงสร้าง: window.UIVERSE_DATA['ชื่อหมวดหมู่'] = [ ... ];
 */
function saveCategoryData(cat, items) {
  const now = new Date().toISOString();
  const filePath = path.join(DATA_DIR, cat.file);
  const content =
`/**
 * UIverse.io Scraped Data - ${cat.name}
 * Updated: ${now}
 * Total: ${items.length}
 */

window.UIVERSE_DATA = window.UIVERSE_DATA || {};
window.UIVERSE_DATA['${cat.name}'] = ${JSON.stringify(items, null, 2)};
`;
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * อัปเดต Manifest สรุปจำนวน component ทุกหมวดหมู่
 */
function updateAndSaveManifest() {
  const manifest = {
    total: 0,
    updatedAt: new Date().toISOString(),
    categories: {}
  };
  for (const cat of ALL_CATEGORIES) {
    const { items } = loadExistingCategoryData(cat);
    manifest.categories[cat.name] = {
      count: items.length,
      file: cat.file
    };
    manifest.total += items.length;
  }
  const filePath = path.join(DATA_DIR, 'manifest.js');
  const content =
`/**
 * UIverse Components Manifest Metadata
 * Updated: ${new Date().toISOString()}
 */
window.UIVERSE_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;
  fs.writeFileSync(filePath, content, 'utf-8');
  return manifest;
}

/**
 * อัปเดต initial_components.js สำหรับหน้า Home Page เริ่มต้น
 */
function updateInitialSeed() {
  const allItems = [];
  for (const cat of ALL_CATEGORIES) {
    const { items } = loadExistingCategoryData(cat);
    if (items.length > 0) {
      allItems.push(...items.slice(0, 3));
    }
  }
  const filePath = path.join(DATA_DIR, 'initial_components.js');
  const content =
`/**
 * UIverse Initial Components Seed
 * Updated: ${new Date().toISOString()}
 */
window.INITIAL_COMPONENTS = ${JSON.stringify(allItems, null, 2)};
`;
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[Manifest] อัปเดต data/initial_components.js เรียบร้อย (${allItems.length} ชิ้น)`);
}

// ตัวแปรสำหรับ Graceful Exit เมื่อกด Ctrl+C
let activeCategoryState = null;

process.on('SIGINT', async () => {
  console.log('\n\n⚠️ ตรวจพบการยกเลิก (SIGINT) -> กำลังบันทึกข้อมูลล่าสุดเพื่อความปลอดภัย...');
  if (activeCategoryState && activeCategoryState.items) {
    saveCategoryData(activeCategoryState.cat, activeCategoryState.items);
    console.log(`💾 บันทึกข้อมูลหมวดหมู่ [${activeCategoryState.cat.name}] สำเร็จ (${activeCategoryState.items.length} ชิ้น)`);
  }
  updateAndSaveManifest();
  updateInitialSeed();
  console.log('🔒 บันทึกไฟล์เรียบร้อย สามารถปิดโปรแกรมได้อย่างปลอดภัย');
  process.exit(0);
});

// ==============================================================================
// SCRAPER CORE
// ==============================================================================

/**
 * ดึงข้อมูลในหนึ่งหมวดหมู่ พร้อม Infinite Scroll & Deep Pagination
 */
async function scrapeCategory(page, cat, targetNew = DEFAULT_TARGET_NEW, maxTotal = DEFAULT_MAX_TOTAL) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 เริ่มต้นดึงหมวดหมู่: [${cat.name}]`);
  console.log(`🔗 URL: https://uiverse.io/${cat.slug}`);
  console.log(`🎯 เป้าหมาย: ดึงเพิ่มใหม่อย่างน้อย ${targetNew} ชิ้น | สูงสุดไม่เกิน ${maxTotal} ชิ้น`);
  console.log(`${'='.repeat(70)}`);

  // 1. โหลดข้อมูลเดิมเพื่อทำ Resume
  const { items: existingItems, seenKeys } = loadExistingCategoryData(cat);
  const categoryItems = [...existingItems];
  activeCategoryState = { cat, items: categoryItems };
  
  console.log(`📦 ข้อมูลเดิมที่มีอยู่ใน data/${cat.file}: ${existingItems.length} ชิ้น`);

  if (categoryItems.length >= maxTotal) {
    console.log(`✅ หมวดหมู่นี้มีข้อมูลครบโควตาสูงสุดแล้ว (${categoryItems.length}/${maxTotal} ชิ้น) -> ข้ามไป`);
    return categoryItems;
  }

  // 2. นำทางไปยังหน้าหมวดหมู่
  try {
    await page.goto(`https://uiverse.io/${cat.slug}`, { waitUntil: 'networkidle2', timeout: 45000 });
  } catch (err) {
    console.warn(`⚠️ การโหลดหน้าเว็บแจ้งเตือน: ${err.message}`);
  }

  console.log(`⏳ รอหน้าเว็บโหลดและเตรียมพร้อม...`);
  await randomDelay(2000, 3000);

  let pageNum               = 1;
  let hasNextPage           = true;
  let newAddedCount         = 0;
  let skippedCount          = 0;
  let sinceLastSave         = 0;
  let consecutiveEmptyPages = 0;
  let totalAvailableOnWeb   = null;

  while (hasNextPage && newAddedCount < targetNew && categoryItems.length < maxTotal) {
    console.log(`\n${'-'.repeat(60)}`);
    console.log(`📄 [${cat.name}] กำลังตรวจสอบหน้า (Page ${pageNum})...`);
    console.log(`📊 สถานะเรียลไทม์: ได้ใหม่ ${newAddedCount}/${targetNew} ชิ้น | รวมในไฟล์ ${categoryItems.length} ชิ้น | ข้ามของซ้ำแล้ว ${skippedCount} ชิ้น` + (totalAvailableOnWeb ? ` | มีบนเว็บ ${totalAvailableOnWeb} ชิ้น` : ''));
    console.log(`${'-'.repeat(60)}`);

    // 3. จำลองการเลื่อนหน้าจอ (Smooth Scroll) ลงลึก เพื่อกระตุ้น Lazy Load
    await page.evaluate(() => {
      window.scrollBy({ top: 900, behavior: 'smooth' });
    });
    await sleep(600);

    // ตรวจสอบและคลิกปุ่ม "Load More" หากมีปรากฏบนหน้าจอ
    const clickedLoadMore = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const loadBtn = buttons.find((b) => {
        const txt = (b.innerText || '').trim().toLowerCase();
        return (
          txt === 'load more' ||
          txt === 'view more' ||
          txt === 'show more' ||
          txt.includes('load more')
        );
      });
      if (loadBtn && loadBtn.offsetParent !== null) {
        loadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        loadBtn.click();
        return true;
      }
      return false;
    });

    if (clickedLoadMore) {
      console.log(`  👉 พบปุ่ม "Load More" และทำการคลิกเรียบร้อย`);
      await sleep(1500);
    }

    // 4. ดึงรายชื่อ Posts จาก Remix Data Endpoint ภายในเบราว์เซอร์จริง
    const result = await page.evaluate(async (slug, pNum) => {
      try {
        const url = `/${slug}?_data=routes%2F%24category` + (pNum > 1 ? `&page=${pNum}` : '');
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || !Array.isArray(data.posts)) return null;
        return {
          hasNextPage: data.hasNextPage !== undefined ? !!data.hasNextPage : (data.posts.length > 0),
          totalAvailable: data.postsCount || null,
          posts: data.posts.map((p) => ({
            friendlyId: p.friendlyId,
            username: p.user ? p.user.username : null,
            title: p.title || p.friendlyId,
          })),
        };
      } catch (_) {
        return null;
      }
    }, cat.slug, pageNum);

    let postList = result ? result.posts : null;
    hasNextPage  = result ? result.hasNextPage : false;
    if (result && result.totalAvailable) {
      totalAvailableOnWeb = result.totalAvailable;
    }

    // หาก Remix Endpoint ไม่ตอบกลับ ให้ใช้ DOM Fallback
    if (!postList || postList.length === 0) {
      console.log(`  ⚠️ ไม่พบข้อมูลจาก API -> ดึงผ่าน DOM Fallback...`);
      postList = await page.evaluate(() => {
        const SKIP = new Set([
          'elements', 'profile', 'categories', 'spotlight', 'challenges',
          'blog', 'design', 'ui-kits', 'guidelines', 'feedback', 'bug', 'ui'
        ]);
        const links = Array.from(document.querySelectorAll('a[href*="/"]'));
        const postsFound = [];
        const seenHrefs = new Set();

        for (const a of links) {
          const href = a.getAttribute('href') || '';
          if (seenHrefs.has(href)) continue;
          const parts = href.split('?')[0].split('/').filter(Boolean);
          if (parts.length === 2 && !SKIP.has(parts[0])) {
            seenHrefs.add(href);
            postsFound.push({
              username: parts[0],
              friendlyId: parts[1],
              title: a.innerText.trim() || parts[1],
            });
          }
        }
        return postsFound;
      });
    }

    if (!postList || postList.length === 0) {
      consecutiveEmptyPages++;
      console.log(`  ❌ หน้า ${pageNum} ไม่พบข้อมูล Component (รอบที่ ${consecutiveEmptyPages})`);
      if (consecutiveEmptyPages >= 2) {
        console.log(`  🏁 สิ้นสุดข้อมูลทั้งหมดที่ดึงได้ในหมวดหมู่นี้`);
        break;
      }
      pageNum++;
      await randomDelay();
      continue;
    }

    consecutiveEmptyPages = 0;
    console.log(`  📥 พบ Component ในหน้านี้: ${postList.length} ชิ้น (ยังมีหน้าถัดไป: ${hasNextPage ? 'มี' : 'ไม่มี'})`);

    // 5. สกัดข้อมูลรายละเอียด Component ทีละชิ้น
    for (const item of postList) {
      if (!item.username || !item.friendlyId) continue;
      if (newAddedCount >= targetNew || categoryItems.length >= maxTotal) {
        break;
      }

      // ตรวจสอบของซ้ำระดับรายการก่อนยิง Request (Resume Check)
      if (isItemDuplicate(seenKeys, item.username, item.friendlyId, item.title)) {
        skippedCount++;
        process.stdout.write(` [ข้ามซ้ำ: ${item.friendlyId}]`);
        continue;
      }

      // ดึงโค้ด HTML / CSS จาก Detail Endpoint
      try {
        let detail = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          detail = await page.evaluate(async (user, fid) => {
            try {
              const res = await fetch(`/${user}/${fid}?_data=routes%2F%24username.%24friendlyId`);
              if (!res.ok) return null;
              const data = await res.json();
              if (data && data.post && data.post.html) {
                return {
                  title: data.post.title || fid,
                  html: data.post.html || '',
                  css: data.post.css || '',
                };
              }
            } catch (_) {}
            return null;
          }, item.username, item.friendlyId);

          if (detail && detail.html) break;
          if (attempt === 0) await sleep(400);
        }

        if (detail && detail.html) {
          const finalTitle = (detail.title || item.title || item.friendlyId || 'Untitled').trim();
          
          // ตรวจสอบของซ้ำอีกชั้นด้วย Title จริง และ HTML
          if (isItemDuplicate(seenKeys, item.username, item.friendlyId, finalTitle, detail.html)) {
            skippedCount++;
            process.stdout.write(` [ข้ามซ้ำ: ${item.friendlyId}]`);
            continue;
          }

          // Data Formatting ตามข้อกำหนดของโปรเจกต์ UIForge
          const component = {
            id:        generateRandomId(),
            title:     finalTitle,
            author:    item.username,
            category:  cat.name,
            likes:     0,
            views:     0,
            liked:     false,
            createdAt: CREATED_AT_VALUE,
            html:      detail.html,
            css:       detail.css || '',
          };

          categoryItems.push(component);
          newAddedCount++;
          sinceLastSave++;

          // บันทึก Keys ลงใน Set เพื่อกันซ้ำ
          markItemSeen(seenKeys, item.username, item.friendlyId, finalTitle, detail.html);

          console.log(`\n  ✨ [+] [${cat.name}] #${categoryItems.length} (ได้ใหม่: ${newAddedCount}/${targetNew}) -> "${component.title}" (@${component.author}) | ข้ามของซ้ำแล้ว: ${skippedCount} ชิ้น`);

          // Incremental Auto-Save ทุกๆ SAVE_INTERVAL ชิ้น
          if (sinceLastSave >= SAVE_INTERVAL) {
            saveCategoryData(cat, categoryItems);
            console.log(`  💾 [Auto-Saved] บันทึกไฟล์ data/${cat.file} สำเร็จ (${categoryItems.length} ชิ้น)`);
            sinceLastSave = 0;
          }
        }
      } catch (err) {
        console.warn(`\n  ⚠️ ข้อผิดพลาดขณะดึง ${item.username}/${item.friendlyId}: ${err.message}`);
      }

      // หน่วงเวลาเล็กน้อยระหว่างแต่ละ Component เพื่อความสุภาพ
      await sleep(DETAIL_DELAY_MS);
    }

    // 6. Anti-Bot Delay ระหว่างการเปลี่ยนหน้า / การ Scroll (สุ่ม 2 - 4 วินาที)
    const delayTime = PAGE_DELAY_MIN + Math.floor(Math.random() * (PAGE_DELAY_MAX - PAGE_DELAY_MIN));
    console.log(`\n  🕒 พักหน่วงเวลา ${(delayTime / 1000).toFixed(1)} วินาที ก่อนไปหน้าถัดไป...`);
    await sleep(delayTime);

    pageNum++;
  }

  // บันทึกข้อมูลหมวดหมู่นี้ครั้งสุดท้าย
  saveCategoryData(cat, categoryItems);
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎉 [เสร็จสิ้นหมวดหมู่: ${cat.name}]`);
  console.log(`   - ชิ้นใหม่ที่ดึงได้ในรอบนี้ : +${newAddedCount} ชิ้น`);
  console.log(`   - ข้าม Component ที่ซ้ำแล้ว : ${skippedCount} ชิ้น`);
  console.log(`   - ข้อมูลรวมทั้งหมดในไฟล์  : ${categoryItems.length} ชิ้น (data/${cat.file})`);
  console.log(`${'='.repeat(70)}\n`);

  activeCategoryState = null;
  return categoryItems;
}

// ==============================================================================
// MAIN RUNNER
// ==============================================================================

async function main() {
  const args = process.argv.slice(2);
  let targetNew = DEFAULT_TARGET_NEW;
  let maxTotal = DEFAULT_MAX_TOTAL;
  let categoriesToScrape = ALL_CATEGORIES;
  let isHeadless = false;

  // ตรวจสอบ Command Line Arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i].toLowerCase();
    if (arg === '--help' || arg === '-h') {
      console.log(`
======================================================================
  UIverse.io Enhanced Scraper for UIForge — วิธีการใช้งาน
======================================================================
  node scraper.js                      ดึงข้อมูลทุกหมวดหมู่ (เป้าหมายหมวดละ 250 ชิ้นใหม่)
  node scraper.js buttons              ดึงเฉพาะหมวดหมู่ Buttons
  node scraper.js loaders              ดึงเฉพาะหมวดหมู่ Loaders
  node scraper.js --target 300         กำหนดเป้าหมายชิ้นใหม่ต่อหมวด (เช่น 300 ชิ้น)
  node scraper.js --max 3000           กำหนดจำนวนรวมสูงสุดต่อหมวด (เช่น 3000 ชิ้น)
  node scraper.js buttons --target 100 ดึงเฉพาะ Buttons จำนวน 100 ชิ้นใหม่
  node scraper.js --headless           รันแบบไม่แสดงหน้าต่างเบราว์เซอร์
======================================================================
`);
      return;
    } else if (arg === '--target' && args[i + 1]) {
      targetNew = parseInt(args[i + 1], 10) || DEFAULT_TARGET_NEW;
      i++;
    } else if (arg === '--max' && args[i + 1]) {
      maxTotal = parseInt(args[i + 1], 10) || DEFAULT_MAX_TOTAL;
      i++;
    } else if (arg === '--headless') {
      isHeadless = true;
    } else if (!arg.startsWith('--')) {
      const exactMatch = ALL_CATEGORIES.filter(
        (c) => c.slug.toLowerCase() === arg || c.name.toLowerCase() === arg
      );
      if (exactMatch.length > 0) {
        categoriesToScrape = exactMatch;
      } else {
        const partialMatch = ALL_CATEGORIES.filter(
          (c) => c.slug.toLowerCase().includes(arg) || c.name.toLowerCase().includes(arg)
        );
        if (partialMatch.length > 0) {
          categoriesToScrape = partialMatch;
        }
      }
    }
  }

  console.log(`\n${'#'.repeat(70)}`);
  console.log(`#  UIverse.io Enhanced Scraper for UIForge`);
  console.log(`#  เวลาเริ่มทำงาน: ${new Date().toLocaleString('th-TH')}`);
  console.log(`#  หมวดหมู่ที่จะดึง: ${categoriesToScrape.map((c) => c.name).join(', ')}`);
  console.log(`#  เป้าหมายชิ้นใหม่ต่อหมวด: ${targetNew} ชิ้น  |  ขีดจำกัดสูงสุด: ${maxTotal} ชิ้น`);
  console.log(`#  หน่วงเวลา Anti-Bot: ${PAGE_DELAY_MIN / 1000} - ${PAGE_DELAY_MAX / 1000} วินาที`);
  console.log(`#  โหมดการแสดงผล: ${isHeadless ? 'Headless (เบื้องหลัง)' : 'Visible Chrome (จำลองผู้ใช้จริง)'}`);
  console.log(`${'#'.repeat(70)}\n`);

  console.log(`🌐 กำลังเปิด Google Chrome...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: isHeadless,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  // ป้องกัน Bot Detection ด้วย User-Agent และ navigator.webdriver override
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  console.log(`🔍 กำลังเข้าสู่เว็บไซต์ https://uiverse.io/ เพื่อเตรียมพร้อม...`);
  try {
    await page.goto('https://uiverse.io/', { waitUntil: 'networkidle2', timeout: 45000 });
  } catch (err) {
    console.warn(`  เตือนการเชื่อมต่อเริ่มต้น: ${err.message}`);
  }
  await randomDelay(2000, 3000);

  for (const cat of categoriesToScrape) {
    try {
      await scrapeCategory(page, cat, targetNew, maxTotal);
      updateAndSaveManifest();
      await randomDelay(2000, 3500);
    } catch (catErr) {
      console.error(`❌ เกิดข้อผิดพลาดในหมวดหมู่ ${cat.name}:`, catErr.message);
    }
  }

  // อัปเดต Manifest และ Seed Components ท้ายการทำงาน
  const finalManifest = updateAndSaveManifest();
  updateInitialSeed();

  console.log(`\n${'#'.repeat(70)}`);
  console.log(`🎉 ทำงานเสร็จสมบูรณ์เรียบร้อย!`);
  console.log(`📊 ยอดรวม Component ทั้งหมดในระบบ: ${finalManifest.total} ชิ้น`);
  for (const [cName, cData] of Object.entries(finalManifest.categories)) {
    console.log(`   - [${cName}]: ${cData.count} ชิ้น (${cData.file})`);
  }
  console.log(`${'#'.repeat(70)}\n`);

  await sleep(1500);
  await browser.close();
  console.log(`🔒 ปิดเบราว์เซอร์ Chrome เรียบร้อยแล้ว`);
}

module.exports = {
  ALL_CATEGORIES,
  updateAndSaveManifest,
  updateInitialSeed
};

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ ข้อผิดพลาดร้ายแรง (Fatal Scraper Error):', err);
    process.exit(1);
  });
}