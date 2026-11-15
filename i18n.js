/**
 * i18n.js - UIForge Multilingual Support
 * Languages: English (en), Thai (th), Vietnamese (vi), Lao (lo)
 */

const TRANSLATIONS = {
  en: {
    nav_explore: 'Explore', nav_upload: 'Upload', nav_signin: 'Sign In', nav_signout: 'Sign Out',
    nav_search_placeholder: 'Search components, categories, authors...',
    nav_search_mobile_placeholder: 'Search components...',
    nav_open_menu: 'Open menu', nav_close_menu: 'Close menu',
    hero_badge: 'Open Source - Free to Use - Inspired by UIverse & NameThatUI',
    hero_title_1: 'Beautiful UI', hero_title_2: 'Components', hero_title_3: 'for Everyone',
    hero_description: 'Discover, share, and remix thousands of open-source UI components.',
    hero_explore_btn: 'Explore Components', hero_share_btn: 'Share a Component',
    hero_stat_components: 'Components', hero_stat_developers: 'Developers',
    hero_stat_likes: 'Total Likes', hero_stat_categories: 'Categories',
    main_all_components: 'All Components', main_sort_by: 'Sort by:',
    main_sort_newest: 'Newest', main_sort_popular: 'Most Liked', main_sort_trending: 'Trending',
    main_showing: 'Showing', main_components: 'components',
    main_no_found: 'No components found', main_no_found_hint: 'Try a different search term or category.',
    main_clear_search: 'Clear search', main_loading: 'Loading more components...',
    main_viewed_all: 'You have viewed all components',
    sidebar_menu: 'Menu', sidebar_home: 'Home', sidebar_trending: 'Trending',
    sidebar_favorites: 'Favorites', sidebar_upload: 'Upload UI', sidebar_categories: 'Categories',
    upload_title: 'Upload Component', upload_subtitle: 'Share your work with the community',
    upload_close: 'Close upload modal', upload_component_title: 'Component Title',
    upload_component_title_ph: 'e.g. Neon Glow Button', upload_category: 'Category',
    upload_author: 'Author Name', upload_author_ph: 'e.g. john_doe',
    upload_html: 'HTML Code', upload_css: 'CSS Code', upload_submit: 'Publish Component',
    auth_signin: 'Sign In', auth_signup: 'Sign Up',
    auth_with_google: 'Continue with Google', auth_with_github: 'Continue with GitHub',
    auth_or: 'Or continue with email', auth_email: 'Email', auth_password: 'Password',
    auth_submit_signin: 'Sign In', auth_cancel: 'Cancel',
    preview_go_back: 'Go back', preview_by: 'by', preview_views: 'Views',
    preview_like: 'Like component', preview_toggle_theme: 'Toggle dark or light canvas background',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'Restore code',
    preview_copy: 'Copy', preview_live: 'Live Preview',
    footer_built: 'Built with love for the open-source community - 2026 UIForge',
    empty_title: 'No components found', empty_hint: 'Try a different search term or category.',
    lang_label: 'Language',
    nav_profile: 'My Profile', nav_favorites: 'My Favorites',
    profile_title: 'User Profile', profile_tab_uploads: 'My Uploads', profile_tab_favorites: 'My Favorites',
    profile_uploads_count: 'Uploads', profile_likes_count: 'Favorites',
    profile_no_uploads: 'No uploaded components yet', profile_no_uploads_hint: 'Share your first UI component with the community!',
    profile_no_favorites: 'No favorites yet', profile_no_favorites_hint: 'Click the heart icon on any component to save it here.',
    profile_btn_upload: 'Upload Now',
    btn_edit: 'Edit', btn_delete: 'Delete', btn_save: 'Save Changes', btn_cancel: 'Cancel',
    edit_title: 'Edit Component', edit_subtitle: 'Modify your component details and code',
    delete_confirm_title: 'Delete Component', delete_confirm_msg: 'Are you sure you want to delete this component? This action cannot be undone.',
    delete_confirm_yes: 'Yes, Delete',
  },
  th: {
    nav_explore: 'สำรวจ', nav_upload: 'อัปโหลด', nav_signin: 'เข้าสู่ระบบ', nav_signout: 'ออกจากระบบ',
    nav_search_placeholder: 'ค้นหาคอมโพเนนต์, หมวดหมู่, ผู้เขียน...',
    nav_search_mobile_placeholder: 'ค้นหาคอมโพเนนต์...',
    nav_open_menu: 'เปิดเมนู', nav_close_menu: 'ปิดเมนู',
    hero_badge: 'โอเพ่นซอร์ส - ใช้งานฟรี - แรงบันดาลใจจาก UIverse & NameThatUI',
    hero_title_1: 'UI สวยงาม', hero_title_2: 'คอมโพเนนต์', hero_title_3: 'สำหรับทุกคน',
    hero_description: 'ค้นพบ แบ่งปัน และรีมิกซ์คอมโพเนนต์ UI โอเพ่นซอร์สนับพัน - ปุ่ม, การ์ด, โหลดเดอร์ และอื่นๆ',
    hero_explore_btn: 'สำรวจคอมโพเนนต์', hero_share_btn: 'แบ่งปันคอมโพเนนต์',
    hero_stat_components: 'คอมโพเนนต์', hero_stat_developers: 'นักพัฒนา',
    hero_stat_likes: 'ยอดไลก์ทั้งหมด', hero_stat_categories: 'หมวดหมู่',
    main_all_components: 'คอมโพเนนต์ทั้งหมด', main_sort_by: 'เรียงตาม:',
    main_sort_newest: 'ใหม่ล่าสุด', main_sort_popular: 'ยอดนิยม', main_sort_trending: 'กำลังมาแรง',
    main_showing: 'แสดง', main_components: 'คอมโพเนนต์',
    main_no_found: 'ไม่พบคอมโพเนนต์', main_no_found_hint: 'ลองใช้คำค้นหาหรือหมวดหมู่อื่น',
    main_clear_search: 'ล้างการค้นหา', main_loading: 'กำลังโหลดคอมโพเนนต์เพิ่มเติม...',
    main_viewed_all: 'คุณดูคอมโพเนนต์ทั้งหมดแล้ว',
    sidebar_menu: 'เมนู', sidebar_home: 'หน้าหลัก', sidebar_trending: 'กำลังมาแรง',
    sidebar_favorites: 'รายการโปรด', sidebar_upload: 'อัปโหลด UI', sidebar_categories: 'หมวดหมู่',
    upload_title: 'อัปโหลดคอมโพเนนต์', upload_subtitle: 'แบ่งปันผลงานของคุณกับชุมชน',
    upload_close: 'ปิดหน้าต่างอัปโหลด', upload_component_title: 'ชื่อคอมโพเนนต์',
    upload_component_title_ph: 'เช่น Neon Glow Button', upload_category: 'หมวดหมู่',
    upload_author: 'ชื่อผู้เขียน', upload_author_ph: 'เช่น john_doe',
    upload_html: 'โค้ด HTML', upload_css: 'โค้ด CSS', upload_submit: 'เผยแพร่คอมโพเนนต์',
    auth_signin: 'เข้าสู่ระบบ', auth_signup: 'สมัครสมาชิก',
    auth_with_google: 'ดำเนินการต่อด้วย Google', auth_with_github: 'ดำเนินการต่อด้วย GitHub',
    auth_or: 'หรือดำเนินการต่อด้วยอีเมล', auth_email: 'อีเมล', auth_password: 'รหัสผ่าน',
    auth_submit_signin: 'เข้าสู่ระบบ', auth_cancel: 'ยกเลิก',
    preview_go_back: 'ย้อนกลับ', preview_by: 'โดย', preview_views: 'การดู',
    preview_like: 'ถูกใจคอมโพเนนต์นี้', preview_toggle_theme: 'สลับพื้นหลังสว่าง/มืด',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'คืนค่าโค้ด',
    preview_copy: 'คัดลอก', preview_live: 'ดูตัวอย่างสด',
    footer_built: 'สร้างด้วยใจสำหรับชุมชนโอเพ่นซอร์ส - 2026 UIForge',
    empty_title: 'ไม่พบคอมโพเนนต์', empty_hint: 'ลองใช้คำค้นหาหรือหมวดหมู่อื่น',
    lang_label: 'ภาษา',
    nav_profile: 'โปรไฟล์ของฉัน', nav_favorites: 'รายการที่ถูกใจ',
    profile_title: 'ข้อมูลโปรไฟล์', profile_tab_uploads: 'คอมโพเนนต์ของฉัน', profile_tab_favorites: 'รายการที่ชอบ',
    profile_uploads_count: 'อัปโหลด', profile_likes_count: 'ถูกใจ',
    profile_no_uploads: 'ยังไม่มีคอมโพเนนต์ที่อัปโหลด', profile_no_uploads_hint: 'เริ่มแบ่งปันผลงาน UI ชิ้นแรกของคุณสู่ชุมชนเลย!',
    profile_no_favorites: 'ยังไม่มีรายการที่ถูกใจ', profile_no_favorites_hint: 'กดที่ไอคอนหัวใจในการ์ดใดก็ได้เพื่อบันทึกไว้ที่นี่',
    profile_btn_upload: 'อัปโหลดเดี๋ยวนี้',
    btn_edit: 'แก้ไข', btn_delete: 'ลบ', btn_save: 'บันทึกการเปลี่ยนแปลง', btn_cancel: 'ยกเลิก',
    edit_title: 'แก้ไขคอมโพเนนต์', edit_subtitle: 'ปรับปรุงข้อมูลและโค้ดของคอมโพเนนต์',
    delete_confirm_title: 'ยืนยันการลบคอมโพเนนต์', delete_confirm_msg: 'คุณแน่ใจหรือไม่ว่าต้องการลบคอมโพเนนต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
    delete_confirm_yes: 'ใช่ ลบทันที',
  },
  vi: {
    nav_explore: 'Kham pha', nav_upload: 'Tai len', nav_signin: 'Dang nhap', nav_signout: 'Dang xuat',
    nav_search_placeholder: 'Tim kiem component, danh muc, tac gia...',
    nav_search_mobile_placeholder: 'Tim kiem component...',
    nav_open_menu: 'Mo menu', nav_close_menu: 'Dong menu',
    hero_badge: 'Ma nguon mo - Mien phi - Cam hung tu UIverse & NameThatUI',
    hero_title_1: 'UI Dep', hero_title_2: 'Component', hero_title_3: 'Cho Moi Nguoi',
    hero_description: 'Kham pha, chia se va tai su dung hang nghin UI component ma nguon mo.',
    hero_explore_btn: 'Kham pha Component', hero_share_btn: 'Chia se Component',
    hero_stat_components: 'Component', hero_stat_developers: 'Lap trinh vien',
    hero_stat_likes: 'Tong luot thich', hero_stat_categories: 'Danh muc',
    main_all_components: 'Tat ca Component', main_sort_by: 'Sap xep:',
    main_sort_newest: 'Moi nhat', main_sort_popular: 'Pho bien nhat', main_sort_trending: 'Xu huong',
    main_showing: 'Hien thi', main_components: 'component',
    main_no_found: 'Khong tim thay component', main_no_found_hint: 'Thu tu khoa hoac danh muc khac.',
    main_clear_search: 'Xoa tim kiem', main_loading: 'Dang tai them component...',
    main_viewed_all: 'Ban da xem tat ca component',
    sidebar_menu: 'Menu', sidebar_home: 'Trang chu', sidebar_trending: 'Xu huong',
    sidebar_favorites: 'Yeu thich', sidebar_upload: 'Tai len UI', sidebar_categories: 'Danh muc',
    upload_title: 'Tai len Component', upload_subtitle: 'Chia se tac pham cua ban',
    upload_close: 'Dong cua so', upload_component_title: 'Ten Component',
    upload_component_title_ph: 'Vi du: Neon Glow Button', upload_category: 'Danh muc',
    upload_author: 'Ten tac gia', upload_author_ph: 'Vi du: john_doe',
    upload_html: 'Ma HTML', upload_css: 'Ma CSS', upload_submit: 'Dang Component',
    auth_signin: 'Dang nhap', auth_signup: 'Dang ky',
    auth_with_google: 'Tiep tuc voi Google', auth_with_github: 'Tiep tuc voi GitHub',
    auth_or: 'Hoac tiep tuc voi email', auth_email: 'Email', auth_password: 'Mat khau',
    auth_submit_signin: 'Dang nhap', auth_cancel: 'Huy',
    preview_go_back: 'Quay lai', preview_by: 'boi', preview_views: 'Luot xem',
    preview_like: 'Thich component nay', preview_toggle_theme: 'Chuyen doi nen sang/toi',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'Khoi phuc ma',
    preview_copy: 'Sao chep', preview_live: 'Xem truoc truc tiep',
    footer_built: 'Duoc xay dung voi tinh yeu cho cong dong ma nguon mo - 2026 UIForge',
    empty_title: 'Khong tim thay component', empty_hint: 'Thu tu khoa hoac danh muc khac.',
    lang_label: 'Ngon ngu',
    nav_profile: 'Hồ sơ của tôi', nav_favorites: 'Yêu thích của tôi',
    profile_title: 'Hồ sơ người dùng', profile_tab_uploads: 'Tải lên của tôi', profile_tab_favorites: 'Đã thích',
    profile_uploads_count: 'Đã tải lên', profile_likes_count: 'Yêu thích',
    profile_no_uploads: 'Chưa có thành phần nào được tải lên', profile_no_uploads_hint: 'Hãy chia sẻ thành phần UI đầu tiên của bạn!',
    profile_no_favorites: 'Chưa có mục yêu thích nào', profile_no_favorites_hint: 'Nhấp vào biểu tượng trái tim để lưu vào đây.',
    profile_btn_upload: 'Tải lên ngay',
    btn_edit: 'Chỉnh sửa', btn_delete: 'Xóa', btn_save: 'Lưu thay đổi', btn_cancel: 'Hủy',
    edit_title: 'Chỉnh sửa thành phần', edit_subtitle: 'Cập nhật chi tiết và mã nguồn thành phần',
    delete_confirm_title: 'Xóa thành phần', delete_confirm_msg: 'Bạn có chắc chắn muốn xóa thành phần này không? Hành động này không thể hoàn tác.',
    delete_confirm_yes: 'Đồng ý xóa',
  },
  lo: {
    nav_explore: 'ຄົ້ນຫາ', nav_upload: 'ອັບໂຫຼດ', nav_signin: 'ເຂົ້າສູ່ລະບົບ', nav_signout: 'ອອກຈາກລະບົບ',
    nav_search_placeholder: 'ຄົ້ນຫາ component, ໝວດໝູ່, ຜູ້ສ້າງ...',
    nav_search_mobile_placeholder: 'ຄົ້ນຫາ component...',
    nav_open_menu: 'ເປີດເມນູ', nav_close_menu: 'ປິດເມນູ',
    hero_badge: 'ໂອເພ່ນຊອດ - ໃຊ້ງານຟຣີ - UIverse & NameThatUI',
    hero_title_1: 'UI ສວຍງາມ', hero_title_2: 'Component', hero_title_3: 'ສໍາລັບທຸກຄົນ',
    hero_description: 'ຄົ້ນພົບ, ແບ່ງປັນ component UI ໂອເພ່ນຊອດ ຫຼາຍພັນ.',
    hero_explore_btn: 'ຄົ້ນຫາ Component', hero_share_btn: 'ແບ່ງປັນ Component',
    hero_stat_components: 'Component', hero_stat_developers: 'ນັກພັດທະນາ',
    hero_stat_likes: 'ຍອດໄລ້ທັງໝົດ', hero_stat_categories: 'ໝວດໝູ່',
    main_all_components: 'Component ທັງໝົດ', main_sort_by: 'ຈັດລຽງ:',
    main_sort_newest: 'ໃໝ່ທີ່ສຸດ', main_sort_popular: 'ນິຍົມທີ່ສຸດ', main_sort_trending: 'ກໍາລັງມາແຮງ',
    main_showing: 'ສະແດງ', main_components: 'component',
    main_no_found: 'ບໍ່ພົບ component', main_no_found_hint: 'ລອງໃຊ້ຄໍາຄົ້ນຫາ ຫຼື ໝວດໝູ່ອື່ນ',
    main_clear_search: 'ລ້າງການຄົ້ນຫາ', main_loading: 'ກໍາລັງໂຫຼດ component ເພີ່ມເຕີມ...',
    main_viewed_all: 'ທ່ານໄດ້ເບິ່ງ component ທັງໝົດແລ້ວ',
    sidebar_menu: 'ເມນູ', sidebar_home: 'ໜ້າຫຼັກ', sidebar_trending: 'ກໍາລັງມາແຮງ',
    sidebar_favorites: 'ລາຍການໂປດ', sidebar_upload: 'ອັບໂຫຼດ UI', sidebar_categories: 'ໝວດໝູ່',
    upload_title: 'ອັບໂຫຼດ Component', upload_subtitle: 'ແບ່ງປັນຜົນງານຂອງທ່ານ',
    upload_close: 'ປິດໜ້າຕ່າງ', upload_component_title: 'ຊື່ Component',
    upload_component_title_ph: 'ເຊັ່ນ: Neon Glow Button', upload_category: 'ໝວດໝູ່',
    upload_author: 'ຊື່ຜູ້ສ້າງ', upload_author_ph: 'ເຊັ່ນ: john_doe',
    upload_html: 'ໂຄ໊ດ HTML', upload_css: 'ໂຄ໊ດ CSS', upload_submit: 'ເຜີຍແຜ່ Component',
    auth_signin: 'ເຂົ້າສູ່ລະບົບ', auth_signup: 'ສະໝັກສະມາຊິກ',
    auth_with_google: 'ດໍາເນີນການດ້ວຍ Google', auth_with_github: 'ດໍາເນີນການດ້ວຍ GitHub',
    auth_or: 'ຫຼື ດໍາເນີນການດ້ວຍອີເມວ', auth_email: 'ອີເມວ', auth_password: 'ລະຫັດຜ່ານ',
    auth_submit_signin: 'ເຂົ້າສູ່ລະບົບ', auth_cancel: 'ຍົກເລີກ',
    preview_go_back: 'ກັບຄືນ', preview_by: 'ໂດຍ', preview_views: 'ການເບິ່ງ',
    preview_like: 'ຖືກໃຈ component ນີ້', preview_toggle_theme: 'ສະຫຼັບພື້ນຫຼັງສວ່າງ/ມືດ',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'ຄືນຄ່າໂຄ໊ດ',
    preview_copy: 'ສໍາເນົາ', preview_live: 'ເບິ່ງຕົວຢ່າງສົດ',
    footer_built: 'ສ້າງດ້ວຍຄວາມຮັກສໍາລັບຊຸມຊົນໂອເພ່ນຊອດ - 2026 UIForge',
    empty_title: 'ບໍ່ພົບ component', empty_hint: 'ລອງໃຊ້ຄໍາຄົ້ນຫາ ຫຼື ໝວດໝູ່ອື່ນ',
    lang_label: 'ພາສາ',
    nav_profile: 'ໂປຣໄຟລ໌ຂອງຂ້ອຍ', nav_favorites: 'ລາຍການທີ່ຖືກໃຈ',
    profile_title: 'ຂໍ້ມູນໂປຣໄຟລ໌', profile_tab_uploads: 'Component ຂອງຂ້ອຍ', profile_tab_favorites: 'ລາຍການທີ່ມັກ',
    profile_uploads_count: 'ອັບໂຫຼດແລ້ວ', profile_likes_count: 'ຖືກໃຈ',
    profile_no_uploads: 'ຍັງບໍ່ມີ Component ທີ່ອັບໂຫຼດ', profile_no_uploads_hint: 'ເລີ່ມແບ່ງປັນຜົນງານ UI ທຳອິດຂອງທ່ານສູ່ຊຸມຊົນ!',
    profile_no_favorites: 'ຍັງບໍ່ມີລາຍການທີ່ຖືກໃຈ', profile_no_favorites_hint: 'ກົດໄອຄອນຫົວໃຈໃນກາດໃດກໍ່ໄດ້ເພື່ອບັນທຶກໄວ້ທີ່ນີ້.',
    profile_btn_upload: 'ອັບໂຫຼດຕອນນີ້',
    btn_edit: 'ແກ້ໄຂ', btn_delete: 'ລຶບ', btn_save: 'ບັນທຶກການປ່ຽນແປງ', btn_cancel: 'ຍົກເລີກ',
    edit_title: 'ແກ້ໄຂ Component', edit_subtitle: 'ປັບປຸງຂໍ້ມູນ ແລະ ໂຄ້ດຂອງ Component',
    delete_confirm_title: 'ຢືນຢັນການລຶບ Component', delete_confirm_msg: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ Component ນີ້? ການດຳເນີນການນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.',
    delete_confirm_yes: 'ແມ່ນແລ້ວ, ລຶບເລີຍ',
  }
};

const LANGUAGE_META = {
  en: { label: 'English',    flag: String.fromCodePoint(0x1F1EC,0x1F1E7), htmlLang: 'en' },
  th: { label: 'Thai',       flag: String.fromCodePoint(0x1F1F9,0x1F1ED), htmlLang: 'th' },
  vi: { label: 'Viet',       flag: String.fromCodePoint(0x1F1FB,0x1F1F3), htmlLang: 'vi' },
  lo: { label: 'Lao',        flag: String.fromCodePoint(0x1F1F1,0x1F1E6), htmlLang: 'lo' },
};

var I18n = (function() {
  var STORAGE_KEY = 'uiforge_lang';
  var currentLang = 'en';

  function t(key) {
    var lang = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    return lang[key] || TRANSLATIONS['en'][key] || key;
  }

  function applyTranslations() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = t(els[i].getAttribute('data-i18n'));
    }
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var i = 0; i < phEls.length; i++) {
      phEls[i].setAttribute('placeholder', t(phEls[i].getAttribute('data-i18n-placeholder')));
    }
    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var i = 0; i < ariaEls.length; i++) {
      ariaEls[i].setAttribute('aria-label', t(ariaEls[i].getAttribute('data-i18n-aria')));
    }
    var meta = LANGUAGE_META[currentLang];
    if (meta) document.documentElement.setAttribute('lang', meta.htmlLang);
  }

  function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch(e) {}
    applyTranslations();
    renderLangSwitcher();
    try { document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } })); } catch(e) {}
  }

  function getCurrentLang() { return currentLang; }

  function closeLangDropdown() {
    var dropdown = document.getElementById('lang-dropdown');
    var chevron = document.getElementById('lang-chevron');
    if (dropdown) dropdown.classList.remove('open');
    if (chevron) chevron.classList.remove('open');
  }

  function renderLangSwitcher() {
    var btn = document.getElementById('lang-switcher-btn');
    var dropdown = document.getElementById('lang-dropdown');
    if (!btn || !dropdown) return;

    var meta = LANGUAGE_META[currentLang];
    var isDropdownOpen = dropdown.classList.contains('open');
    btn.innerHTML =
      '<span class="lang-flag">' + meta.flag + '</span>' +
      '<span class="lang-code">' + meta.htmlLang.toUpperCase() + '</span>' +
      '<i class="fa-solid fa-chevron-down lang-chevron' + (isDropdownOpen ? ' open' : '') + '" id="lang-chevron"></i>';

    var html = '';
    var langs = Object.keys(LANGUAGE_META);
    for (var i = 0; i < langs.length; i++) {
      var code = langs[i];
      var info = LANGUAGE_META[code];
      var isActive = code === currentLang;
      html += '<button type="button" class="lang-option w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ' +
        (isActive ? 'text-white font-semibold lang-option-active' : 'text-gray-400 hover:text-white hover:bg-white/5') +
        '" data-lang="' + code + '">' +
        '<span class="lang-flag">' + info.flag + '</span>' +
        '<span>' + info.label + '</span>' +
        (isActive ? '<i class="fa-solid fa-check ml-auto lang-check-icon"></i>' : '') +
        '</button>';
    }
    dropdown.innerHTML = html;

    var optBtns = dropdown.querySelectorAll('.lang-option');
    for (var j = 0; j < optBtns.length; j++) {
      (function(b) {
        b.addEventListener('click', function(e) {
          e.stopPropagation();
          setLanguage(b.getAttribute('data-lang'));
          closeLangDropdown();
        });
      })(optBtns[j]);
    }
  }

  function initLangSwitcher() {
    var btn = document.getElementById('lang-switcher-btn');
    var dropdown = document.getElementById('lang-dropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.contains('open');
      var chevron = document.getElementById('lang-chevron');
      if (isOpen) {
        closeLangDropdown();
      } else {
        dropdown.classList.add('open');
        if (chevron) chevron.classList.add('open');
      }
    });

    document.addEventListener('click', function(e) {
      if (!btn.contains(e.target)) {
        closeLangDropdown();
      }
    });
  }

  function init() {
    var saved = '';
    try { saved = localStorage.getItem(STORAGE_KEY) || ''; } catch(e) {}
    var browserLang = (navigator.language || 'en').slice(0, 2);
    var detected = saved || (TRANSLATIONS[browserLang] ? browserLang : 'en');
    currentLang = TRANSLATIONS[detected] ? detected : 'en';
    initLangSwitcher();
    renderLangSwitcher();
    applyTranslations();
  }

  return { init: init, t: t, setLanguage: setLanguage, getCurrentLang: getCurrentLang, applyTranslations: applyTranslations };
})();

if (typeof window !== 'undefined') {
  window.I18n = I18n;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { I18n.init(); });
} else {
  I18n.init();
}