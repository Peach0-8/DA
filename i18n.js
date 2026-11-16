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
    hero_badge: 'โอเพ่นซอร์ส · ใช้งานฟรี · แรงบันดาลใจจาก UIverse & NameThatUI',
    hero_title_1: 'UI สวยงาม', hero_title_2: 'คอมโพเนนต์', hero_title_3: 'สำหรับทุกคน',
    hero_description: 'ค้นพบ แบ่งปัน และรีมิกซ์คอมโพเนนต์ UI โอเพ่นซอร์สนับพัน — ปุ่ม, การ์ด, โหลดเดอร์ และอื่นๆ',
    hero_explore_btn: 'สำรวจคอมโพเนนต์', hero_share_btn: 'แบ่งปันคอมโพเนนต์',
    hero_stat_components: 'คอมโพเนนต์', hero_stat_developers: 'นักพัฒนา',
    hero_stat_likes: 'ยอดถูกใจทั้งหมด', hero_stat_categories: 'หมวดหมู่',
    main_all_components: 'คอมโพเนนต์ทั้งหมด', main_sort_by: 'เรียงตาม:',
    main_sort_newest: 'ใหม่ล่าสุด', main_sort_popular: 'ยอดนิยม', main_sort_trending: 'กำลังมาแรง',
    main_showing: 'กำลังแสดง', main_components: 'คอมโพเนนต์',
    main_no_found: 'ไม่พบคอมโพเนนต์', main_no_found_hint: 'ลองใช้คำค้นหาหรือหมวดหมู่อื่น',
    main_clear_search: 'ล้างการค้นหา', main_loading: 'กำลังโหลดคอมโพเนนต์เพิ่มเติม...',
    main_viewed_all: 'คุณดูคอมโพเนนต์ทั้งหมดแล้ว',
    sidebar_menu: 'เมนู', sidebar_home: 'หน้าหลัก', sidebar_trending: 'กำลังมาแรง',
    sidebar_favorites: 'รายการที่ถูกใจ', sidebar_upload: 'อัปโหลด UI', sidebar_categories: 'หมวดหมู่',
    upload_title: 'อัปโหลดคอมโพเนนต์', upload_subtitle: 'แบ่งปันผลงานของคุณกับชุมชน',
    upload_close: 'ปิดหน้าต่างอัปโหลด', upload_component_title: 'ชื่อคอมโพเนนต์',
    upload_component_title_ph: 'เช่น Neon Glow Button', upload_category: 'หมวดหมู่',
    upload_author: 'ชื่อผู้เขียน', upload_author_ph: 'เช่น somchai_dev',
    upload_html: 'โค้ด HTML', upload_css: 'โค้ด CSS', upload_submit: 'เผยแพร่คอมโพเนนต์',
    auth_signin: 'เข้าสู่ระบบ', auth_signup: 'สมัครสมาชิก',
    auth_with_google: 'ดำเนินการต่อด้วย Google', auth_with_github: 'ดำเนินการต่อด้วย GitHub',
    auth_or: 'หรือดำเนินการต่อด้วยอีเมล', auth_email: 'อีเมล', auth_password: 'รหัสผ่าน',
    auth_submit_signin: 'เข้าสู่ระบบ', auth_cancel: 'ยกเลิก',
    preview_go_back: 'ย้อนกลับ', preview_by: 'โดย', preview_views: 'ยอดเข้าชม',
    preview_like: 'ถูกใจคอมโพเนนต์นี้', preview_toggle_theme: 'สลับพื้นหลังสว่าง/มืด',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'คืนค่าโค้ด',
    preview_copy: 'คัดลอก', preview_live: 'ดูตัวอย่างสด',
    footer_built: 'สร้างด้วยใจสำหรับชุมชนโอเพ่นซอร์ส - 2026 UIForge',
    empty_title: 'ไม่พบคอมโพเนนต์', empty_hint: 'ลองใช้คำค้นหาหรือหมวดหมู่อื่น',
    lang_label: 'ภาษา',
    nav_profile: 'โปรไฟล์ของฉัน', nav_favorites: 'รายการที่ถูกใจ',
    profile_title: 'ข้อมูลโปรไฟล์', profile_tab_uploads: 'คอมโพเนนต์ของฉัน', profile_tab_favorites: 'รายการที่ถูกใจ',
    profile_uploads_count: 'อัปโหลดแล้ว', profile_likes_count: 'ถูกใจ',
    profile_no_uploads: 'ยังไม่มีคอมโพเนนต์ที่อัปโหลด', profile_no_uploads_hint: 'เริ่มแบ่งปันผลงาน UI ชิ้นแรกของคุณสู่ชุมชนเลย!',
    profile_no_favorites: 'ยังไม่มีรายการที่ถูกใจ', profile_no_favorites_hint: 'กดที่ไอคอนหัวใจในการ์ดใดก็ได้เพื่อบันทึกไว้ที่นี่',
    profile_btn_upload: 'อัปโหลดตอนนี้',
    btn_edit: 'แก้ไข', btn_delete: 'ลบ', btn_save: 'บันทึกการเปลี่ยนแปลง', btn_cancel: 'ยกเลิก',
    edit_title: 'แก้ไขคอมโพเนนต์', edit_subtitle: 'ปรับปรุงข้อมูลและโค้ดของคอมโพเนนต์',
    delete_confirm_title: 'ยืนยันการลบคอมโพเนนต์', delete_confirm_msg: 'คุณแน่ใจหรือไม่ว่าต้องการลบคอมโพเนนต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
    delete_confirm_yes: 'ใช่ ลบทันที',
  },
  vi: {
    nav_explore: 'Khám phá', nav_upload: 'Tải lên', nav_signin: 'Đăng nhập', nav_signout: 'Đăng xuất',
    nav_search_placeholder: 'Tìm kiếm thành phần, danh mục, tác giả...',
    nav_search_mobile_placeholder: 'Tìm kiếm thành phần...',
    nav_open_menu: 'Mở menu', nav_close_menu: 'Đóng menu',
    hero_badge: 'Mã nguồn mở · Miễn phí · Lấy cảm hứng từ UIverse & NameThatUI',
    hero_title_1: 'Giao diện UI đẹp', hero_title_2: 'Thành phần', hero_title_3: 'Dành cho mọi người',
    hero_description: 'Khám phá, chia sẻ và sáng tạo hàng nghìn thành phần UI mã nguồn mở tuyệt đẹp.',
    hero_explore_btn: 'Khám phá thành phần', hero_share_btn: 'Chia sẻ thành phần',
    hero_stat_components: 'Thành phần', hero_stat_developers: 'Nhà phát triển',
    hero_stat_likes: 'Tổng lượt thích', hero_stat_categories: 'Danh mục',
    main_all_components: 'Tất cả thành phần', main_sort_by: 'Sắp xếp theo:',
    main_sort_newest: 'Mới nhất', main_sort_popular: 'Phổ biến nhất', main_sort_trending: 'Thịnh hành',
    main_showing: 'Đang hiển thị', main_components: 'thành phần',
    main_no_found: 'Không tìm thấy thành phần nào', main_no_found_hint: 'Hãy thử từ khóa tìm kiếm hoặc danh mục khác.',
    main_clear_search: 'Xóa tìm kiếm', main_loading: 'Đang tải thêm thành phần...',
    main_viewed_all: 'Bạn đã xem hết tất cả thành phần',
    sidebar_menu: 'Menu', sidebar_home: 'Trang chủ', sidebar_trending: 'Thịnh hành',
    sidebar_favorites: 'Yêu thích', sidebar_upload: 'Tải lên UI', sidebar_categories: 'Danh mục',
    upload_title: 'Tải lên thành phần', upload_subtitle: 'Chia sẻ tác phẩm của bạn với cộng đồng',
    upload_close: 'Đóng cửa sổ tải lên', upload_component_title: 'Tên thành phần',
    upload_component_title_ph: 'Ví dụ: Nút Neon phát sáng', upload_category: 'Danh mục',
    upload_author: 'Tên tác giả', upload_author_ph: 'Ví dụ: nguyen_van_a',
    upload_html: 'Mã nguồn HTML', upload_css: 'Mã nguồn CSS', upload_submit: 'Đăng thành phần',
    auth_signin: 'Đăng nhập', auth_signup: 'Đăng ký',
    auth_with_google: 'Tiếp tục với Google', auth_with_github: 'Tiếp tục với GitHub',
    auth_or: 'Hoặc tiếp tục bằng email', auth_email: 'Email', auth_password: 'Mật khẩu',
    auth_submit_signin: 'Đăng nhập', auth_cancel: 'Hủy',
    preview_go_back: 'Quay lại', preview_by: 'bởi', preview_views: 'Lượt xem',
    preview_like: 'Thích thành phần này', preview_toggle_theme: 'Chuyển đổi nền sáng/tối',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'Khôi phục mã',
    preview_copy: 'Sao chép', preview_live: 'Xem trước trực tiếp',
    footer_built: 'Được xây dựng với niềm đam mê dành cho cộng đồng mã nguồn mở - 2026 UIForge',
    empty_title: 'Không tìm thấy thành phần nào', empty_hint: 'Hãy thử từ khóa tìm kiếm hoặc danh mục khác.',
    lang_label: 'Ngôn ngữ',
    nav_profile: 'Hồ sơ của tôi', nav_favorites: 'Mục yêu thích',
    profile_title: 'Thông tin hồ sơ', profile_tab_uploads: 'Bài đăng của tôi', profile_tab_favorites: 'Mục yêu thích',
    profile_uploads_count: 'Đã tải lên', profile_likes_count: 'Lượt thích',
    profile_no_uploads: 'Chưa có thành phần nào được tải lên', profile_no_uploads_hint: 'Hãy bắt đầu chia sẻ tác phẩm UI đầu tiên của bạn với cộng đồng!',
    profile_no_favorites: 'Chưa có mục yêu thích nào', profile_no_favorites_hint: 'Nhấp vào biểu tượng trái tim trên bất kỳ thẻ nào để lưu vào đây.',
    profile_btn_upload: 'Tải lên ngay',
    btn_edit: 'Chỉnh sửa', btn_delete: 'Xóa', btn_save: 'Lưu thay đổi', btn_cancel: 'Hủy',
    edit_title: 'Chỉnh sửa thành phần', edit_subtitle: 'Cập nhật chi tiết và mã nguồn của thành phần',
    delete_confirm_title: 'Xác nhận xóa thành phần', delete_confirm_msg: 'Bạn có chắc chắn muốn xóa thành phần này không? Thao tác này không thể hoàn tác.',
    delete_confirm_yes: 'Đồng ý, xóa ngay',
  },
  lo: {
    nav_explore: 'ສຳຫຼວດ', nav_upload: 'ອັບໂຫຼດ', nav_signin: 'ເຂົ້າສູ່ລະບົບ', nav_signout: 'ອອກຈາກລະບົບ',
    nav_search_placeholder: 'ຄົ້ນຫາຄອມໂພເນນຕ໌, ໝວດໝູ່, ຜູ້ສ້າງ...',
    nav_search_mobile_placeholder: 'ຄົ້ນຫາຄອມໂພເນນຕ໌...',
    nav_open_menu: 'ເປີດເມນູ', nav_close_menu: 'ປິດເມນູ',
    hero_badge: 'ໂອເພນຊອດ · ໃຊ້ງານຟຣີ · ໄດ້ຮັບແຮງບັນດານໃຈຈາກ UIverse & NameThatUI',
    hero_title_1: 'UI ທີ່ສວຍງາມ', hero_title_2: 'ຄອມໂພເນນຕ໌', hero_title_3: 'ສຳລັບທຸກຄົນ',
    hero_description: 'ຄົ້ນພົບ, ແບ່ງປັນ ແລະ ນຳໃຊ້ຄອມໂພເນນຕ໌ UI ໂອເພນຊອດ ຫຼາຍພັນລາຍການ.',
    hero_explore_btn: 'ສຳຫຼວດຄອມໂພເນນຕ໌', hero_share_btn: 'ແບ່ງປັນຄອມໂພເນນຕ໌',
    hero_stat_components: 'ຄອມໂພເນນຕ໌', hero_stat_developers: 'ນັກພັດທະນາ',
    hero_stat_likes: 'ຍອດຖືກໃຈທັງໝົດ', hero_stat_categories: 'ໝວດໝູ່',
    main_all_components: 'ຄອມໂພເນນຕ໌ທັງໝົດ', main_sort_by: 'ຈັດຮຽງຕາມ:',
    main_sort_newest: 'ໃໝ່ລ່າສຸດ', main_sort_popular: 'ຍອດນິຍົມທີ່ສຸດ', main_sort_trending: 'ກຳລັງມາແຮງ',
    main_showing: 'ກຳລັງສະແດງ', main_components: 'ຄອມໂພເນນຕ໌',
    main_no_found: 'ບໍ່ພົບຄອມໂພເນນຕ໌', main_no_found_hint: 'ລອງໃຊ້ຄຳຄົ້ນຫາ ຫຼື ໝວດໝູ່ອື່ນ',
    main_clear_search: 'ລ້າງການຄົ້ນຫາ', main_loading: 'ກຳລັງໂຫຼດຄອມໂພເນນຕ໌ເພີ່ມເຕີມ...',
    main_viewed_all: 'ທ່ານໄດ້ເບິ່ງຄອມໂພເນນຕ໌ທັງໝົດແລ້ວ',
    sidebar_menu: 'ເມນູ', sidebar_home: 'ໜ້າຫຼັກ', sidebar_trending: 'ກຳລັງມາແຮງ',
    sidebar_favorites: 'ລາຍການທີ່ຖືກໃຈ', sidebar_upload: 'ອັບໂຫຼດ UI', sidebar_categories: 'ໝວດໝູ່',
    upload_title: 'ອັບໂຫຼດຄອມໂພເນນຕ໌', upload_subtitle: 'ແບ່ງປັນຜົນງານຂອງທ່ານສູ່ຊຸມຊົນ',
    upload_close: 'ປິດໜ້າຕ່າງ', upload_component_title: 'ຊື່ຄອມໂພເນນຕ໌',
    upload_component_title_ph: 'ເຊັ່ນ: ປຸ່ມແສງນີອອນ (Neon Glow Button)', upload_category: 'ໝວດໝູ່',
    upload_author: 'ຊື່ຜູ້ສ້າງ', upload_author_ph: 'ເຊັ່ນ: somxay_99',
    upload_html: 'ໂຄ້ດ HTML', upload_css: 'ໂຄ້ດ CSS', upload_submit: 'ເຜີຍແຜ່ຄອມໂພເນນຕ໌',
    auth_signin: 'ເຂົ້າສູ່ລະບົບ', auth_signup: 'ສະໝັກສະມາຊິກ',
    auth_with_google: 'ດຳເນີນການຕໍ່ດ້ວຍ Google', auth_with_github: 'ດຳເນີນການຕໍ່ດ້ວຍ GitHub',
    auth_or: 'ຫຼື ດຳເນີນການຕໍ່ດ້ວຍອີເມວ', auth_email: 'ອີເມວ', auth_password: 'ລະຫັດຜ່ານ',
    auth_submit_signin: 'ເຂົ້າສູ່ລະບົບ', auth_cancel: 'ຍົກເລີກ',
    preview_go_back: 'ກັບຄືນ', preview_by: 'ໂດຍ', preview_views: 'ຍອດເບິ່ງ',
    preview_like: 'ຖືກໃຈຄອມໂພເນນຕ໌ນີ້', preview_toggle_theme: 'ສະຫຼັບພື້ນຫຼັງສະຫວ່າງ/ມືດ',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'ຄືນຄ່າໂຄ້ດ',
    preview_copy: 'ສຳເນົາ', preview_live: 'ເບິ່ງຕົວຢ່າງສົດ',
    footer_built: 'ສ້າງຂຶ້ນດ້ວຍໃຈເພື່ອຊຸມຊົນໂອເພນຊອດ - 2026 UIForge',
    empty_title: 'ບໍ່ພົບຄອມໂພເນນຕ໌', empty_hint: 'ລອງໃຊ້ຄຳຄົ້ນຫາ ຫຼື ໝວດໝູ່ອື່ນ',
    lang_label: 'ພາສາ',
    nav_profile: 'ໂປຣໄຟລ໌ຂອງຂ້ອຍ', nav_favorites: 'ລາຍການທີ່ຖືກໃຈ',
    profile_title: 'ຂໍ້ມູນໂປຣໄຟລ໌', profile_tab_uploads: 'ຄອມໂພເນນຕ໌ຂອງຂ້ອຍ', profile_tab_favorites: 'ລາຍການທີ່ຖືກໃຈ',
    profile_uploads_count: 'ອັບໂຫຼດແລ້ວ', profile_likes_count: 'ຖືກໃຈ',
    profile_no_uploads: 'ຍັງບໍ່ມີຄອມໂພເນນຕ໌ທີ່ອັບໂຫຼດ', profile_no_uploads_hint: 'ເລີ່ມຕົ້ນແບ່ງປັນຜົນງານ UI ທຳອິດຂອງທ່ານສູ່ຊຸມຊົນ!',
    profile_no_favorites: 'ຍັງບໍ່ມີລາຍການທີ່ຖືກໃຈ', profile_no_favorites_hint: 'ກົດໄອຄອນຮູບຫົວໃຈໃນກາດໃດກໍໄດ້ເພື່ອບັນທຶກໄວ້ທີ່ນີ້.',
    profile_btn_upload: 'ອັບໂຫຼດຕອນນີ້',
    btn_edit: 'ແກ້ໄຂ', btn_delete: 'ລຶບ', btn_save: 'ບັນທຶກການປ່ຽນແປງ', btn_cancel: 'ຍົກເລີກ',
    edit_title: 'ແກ້ໄຂຄອມໂພເນນຕ໌', edit_subtitle: 'ປັບປຸງຂໍ້ມູນ ແລະ ໂຄ້ດຂອງຄອມໂພເນນຕ໌',
    delete_confirm_title: 'ຢືນຢັນການລຶບຄອມໂພເນນຕ໌', delete_confirm_msg: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຄອມໂພເນນຕ໌ນີ້? ການດຳເນີນການນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.',
    delete_confirm_yes: 'ແມ່ນແລ້ວ, ລຶບເລີຍ',
  }
};

const LANGUAGE_META = {
  en: { label: 'English',            flag: String.fromCodePoint(0x1F1EC,0x1F1E7), htmlLang: 'en' },
  th: { label: 'ไทย (Thai)',         flag: String.fromCodePoint(0x1F1F9,0x1F1ED), htmlLang: 'th' },
  vi: { label: 'Tiếng Việt',        flag: String.fromCodePoint(0x1F1FB,0x1F1F3), htmlLang: 'vi' },
  lo: { label: 'ພາສາລາວ (Lao)',      flag: String.fromCodePoint(0x1F1F1,0x1F1E6), htmlLang: 'lo' },
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
    if (meta) {
      document.documentElement.setAttribute('lang', meta.htmlLang);
      if (document.body) document.body.setAttribute('lang', meta.htmlLang);
    }
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