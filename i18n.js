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
    drawer_home: 'Home', drawer_trending: 'Trending', drawer_favorites: 'Favorites', drawer_upload: 'Upload UI',
    upload_title: 'Upload Component', upload_subtitle: 'Share your work with the community',
    upload_close: 'Close upload modal', upload_component_title: 'Component Title',
    upload_component_title_ph: 'e.g. Neon Glow Button', upload_category: 'Category',
    upload_author: 'Author Name', upload_author_ph: 'e.g. john_doe',
    upload_html: 'HTML Code', upload_css: 'CSS Code', upload_submit: 'Submit for review',
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
    profile_title: 'User Profile',
    profile_tab_posts: 'Posts',
    profile_tab_in_review: 'In Review',
    profile_tab_rejected: 'Rejected',
    profile_tab_favorites: 'Favorites',
    status_approved: 'Verified & Approved',
    status_in_review: 'In Review',
    status_rejected: 'Security Check Failed',
    btn_edit_fix: 'Edit & Fix',
    rejection_reason_label: 'Rejection Reason:',
    upload_approved_toast: 'Component passed automated security review & published! 🚀',
    upload_rejected_toast: 'Component rejected by security rules. See Profile > Rejected to fix.',
    edit_and_fix_hint: 'Fix the highlighted code and re-submit for review.',
    no_posts_title: 'No Public Posts Yet',
    no_posts_desc: "Looks like you haven't made any posts yet. Click Create to share with the universe.",
    no_in_review_title: 'No Posts In Review',
    no_in_review_desc: 'All submitted components have been processed by the automated security engine.',
    no_rejected_title: 'No Rejected Posts',
    no_rejected_desc: 'Great job! None of your components have violated security guidelines.',
    profile_uploads_count: 'Uploads', profile_likes_count: 'Favorites',
    profile_no_favorites: 'No favorites yet', profile_no_favorites_hint: 'Click the heart icon on any component to save it here.',
    profile_btn_upload: 'Upload Now',
    btn_edit: 'Edit', btn_delete: 'Delete', btn_save: 'Save Changes', btn_cancel: 'Cancel',
    btn_create: 'Create', btn_explore: 'Explore Components',
    edit_title: 'Edit Component', edit_subtitle: 'Modify your component details and code',
    delete_confirm_title: 'Delete Component', delete_confirm_msg: 'Are you sure you want to delete this component? This action cannot be undone.',
    delete_confirm_yes: 'Yes, Delete',
    sec_err_script_tag: 'Forbidden <script> tag detected. UI components must be pure HTML & CSS.',
    sec_err_javascript_uri: 'Forbidden "javascript:" URI detected.',
    sec_err_js_execution: 'Forbidden JavaScript execution keyword detected.',
    sec_err_event_handler: 'Forbidden inline event handler "{attr}" detected.',
    sec_err_download_attr: 'File download triggers are prohibited.',
    sec_err_executable_file: 'Suspicious executable or archive file link detected.',
    sec_err_embed_tags: 'Embedded frames (<iframe, <object, <embed) are prohibited.',
    sec_err_meta_refresh: 'Meta page redirects are prohibited.',
    sec_err_empty_html: 'Component must contain at least one valid HTML element.',
    sec_err_global_css: 'Global body/html styling overrides are prohibited. Use scoped classes.',
    settings_title: 'Settings', settings_profile: 'Profile', settings_email: 'Email', settings_account: 'Account', settings_stats: 'Stats',
    stats_total_views: 'Total Views', stats_favorites_saved: 'Favorites Saved', stats_your_elements: 'Your Elements', stats_likes_received: 'Likes Received',
    settings_save_btn: 'Save changes', settings_email_save_btn: 'Save Email', settings_cancel_btn: 'Cancel',
    profile_filter_newest: 'Newest', profile_filter_popular: 'Popular', profile_filter_any_theme: 'Any Theme',
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
    sidebar_favorites: 'รายการโปรด', sidebar_upload: 'อัปโหลด UI', sidebar_categories: 'หมวดหมู่',
    drawer_home: 'หน้าหลัก', drawer_trending: 'กำลังมาแรง', drawer_favorites: 'รายการโปรด', drawer_upload: 'อัปโหลด UI',
    upload_title: 'อัปโหลดคอมโพเนนต์', upload_subtitle: 'แบ่งปันผลงานของคุณกับชุมชน',
    upload_close: 'ปิดหน้าต่างอัปโหลด', upload_component_title: 'ชื่อคอมโพเนนต์',
    upload_component_title_ph: 'เช่น ปุ่มเรืองแสงนีออน', upload_category: 'หมวดหมู่',
    upload_author: 'ชื่อผู้เขียน', upload_author_ph: 'เช่น somchai_dev',
    upload_html: 'โค้ด HTML', upload_css: 'โค้ด CSS', upload_submit: 'ส่งเพื่อตรวจสอบ',
    auth_signin: 'เข้าสู่ระบบ', auth_signup: 'สมัครสมาชิก',
    auth_with_google: 'ดำเนินการต่อด้วย Google', auth_with_github: 'ดำเนินการต่อด้วย GitHub',
    auth_or: 'หรือดำเนินการต่อด้วยอีเมล', auth_email: 'อีเมล', auth_password: 'รหัสผ่าน',
    auth_submit_signin: 'เข้าสู่ระบบ', auth_cancel: 'ยกเลิก',
    preview_go_back: 'ย้อนกลับ', preview_by: 'โดย', preview_views: 'ยอดเข้าชม',
    preview_like: 'ถูกใจคอมโพเนนต์นี้', preview_toggle_theme: 'สลับพื้นหลังผ้าใบมืด/สว่าง',
    preview_html_tab: 'HTML', preview_css_tab: 'CSS', preview_reset: 'กู้คืนโค้ด',
    preview_copy: 'คัดลอก', preview_live: 'ดูตัวอย่างสด',
    footer_built: 'สร้างด้วยความรักเพื่อชุมชนโอเพ่นซอร์ส - 2026 UIForge',
    empty_title: 'ไม่พบคอมโพเนนต์', empty_hint: 'ลองใช้คำค้นหาหรือหมวดหมู่อื่น',
    lang_label: 'ภาษา',
    nav_profile: 'โปรไฟล์ของฉัน', nav_favorites: 'รายการโปรดของฉัน',
    profile_title: 'ข้อมูลโปรไฟล์',
    profile_tab_posts: 'ผลงานที่เผยแพร่',
    profile_tab_in_review: 'กำลังตรวจสอบ',
    profile_tab_rejected: 'ไม่ผ่านการตรวจ',
    profile_tab_favorites: 'รายการโปรด',
    status_approved: 'ตรวจสอบผ่านแล้ว',
    status_in_review: 'กำลังตรวจสอบ',
    status_rejected: 'ไม่ผ่านเกณฑ์ความปลอดภัย',
    btn_edit_fix: 'แก้ไขโค้ด',
    rejection_reason_label: 'สาเหตุที่ไม่ผ่าน:',
    upload_approved_toast: 'คอมโพเนนต์ผ่านการตรวจสอบความปลอดภัยและเผยแพร่แล้ว! 🚀',
    upload_rejected_toast: 'คอมโพเนนต์ไม่ผ่านเกณฑ์ความปลอดภัย ดูสาเหตุและแก้ไขได้ใน โปรไฟล์ > ไม่ผ่านการตรวจ',
    edit_and_fix_hint: 'แก้ไขโค้ดที่มีปัญหาแล้วกดส่งเพื่อตรวจใหม่อีกครั้ง',
    no_posts_title: 'ยังไม่มีผลงานที่เผยแพร่',
    no_posts_desc: 'ดูเหมือนว่าคุณยังไม่ได้โพสต์ผลงานใดๆ คลิกสร้างเพื่อเริ่มแชร์ผลงานกับทุกคน',
    no_in_review_title: 'ไม่มีผลงานที่กำลังตรวจสอบ',
    no_in_review_desc: 'ผลงานทั้งหมดที่ส่งเข้ามาได้รับการตรวจสอบจากระบบอัตโนมัติเรียบร้อยแล้ว',
    no_rejected_title: 'ไม่มีผลงานที่ไม่ผ่านการตรวจ',
    no_rejected_desc: 'ยอดเยี่ยมมาก! ไม่มีผลงานใดของคุณที่ละเมิดเกณฑ์ความปลอดภัย',
    profile_uploads_count: 'อัปโหลดแล้ว', profile_likes_count: 'รายการโปรด',
    profile_no_favorites: 'ยังไม่มีรายการโปรด', profile_no_favorites_hint: 'คลิกไอคอนรูปหัวใจบนการ์ดใดก็ได้เพื่อบันทึกไว้ที่นี่',
    profile_btn_upload: 'อัปโหลดเลย',
    btn_edit: 'แก้ไข', btn_delete: 'ลบ', btn_save: 'บันทึกการเปลี่ยนแปลง', btn_cancel: 'ยกเลิก',
    btn_create: 'สร้างผลงาน', btn_explore: 'สำรวจคอมโพเนนต์',
    edit_title: 'แก้ไขคอมโพเนนต์', edit_subtitle: 'แก้ไขรายละเอียดและโค้ดของคอมโพเนนต์ของคุณ',
    delete_confirm_title: 'ลบคอมโพเนนต์', delete_confirm_msg: 'คุณแน่ใจหรือไม่ว่าต้องการลบคอมโพเนนต์นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
    delete_confirm_yes: 'ใช่ ลบเลย',
    sec_err_script_tag: 'ตรวจพบแท็ก <script> ต้องห้าม คอมโพเนนต์ UI ต้องเป็น Pure HTML และ CSS เท่านั้น',
    sec_err_javascript_uri: 'ตรวจพบลิงก์ "javascript:" ต้องห้าม',
    sec_err_js_execution: 'ตรวจพบคำสั่งรันสคริปต์ต้องห้าม',
    sec_err_event_handler: 'ตรวจพบ Event Handler "{attr}" ต้องห้าม',
    sec_err_download_attr: 'ไม่อนุญาตให้ใส่คำสั่งหรือลิงก์ดาวน์โหลดไฟล์',
    sec_err_executable_file: 'ตรวจพบลิงก์ไฟล์โปรแกรมหรือไฟล์บีบอัดที่น่าสงสัย',
    sec_err_embed_tags: 'ไม่อนุญาตให้ฝังเฟรมภายนอก (<iframe, <object, <embed)',
    sec_err_meta_refresh: 'ไม่อนุญาตให้ใช้ Meta Redirect เปลี่ยนหน้า',
    sec_err_empty_html: 'คอมโพเนนต์ต้องมีแท็ก HTML อย่างน้อยหนึ่งแท็ก',
    sec_err_global_css: 'ห้ามเขียน CSS ทับแท็ก body หรือ html ส่วนกลาง ให้ใช้ Class แบบเจาะจง',
    settings_title: 'การตั้งค่า', settings_profile: 'โปรไฟล์', settings_email: 'อีเมล', settings_account: 'บัญชี', settings_stats: 'สถิติ',
    stats_total_views: 'ยอดเข้าชมทั้งหมด', stats_favorites_saved: 'รายการโปรดที่บันทึก', stats_your_elements: 'ผลงานของคุณ', stats_likes_received: 'ยอดถูกใจที่ได้รับ',
    settings_save_btn: 'บันทึกการเปลี่ยนแปลง', settings_email_save_btn: 'บันทึกอีเมล', settings_cancel_btn: 'ยกเลิก',
    profile_filter_newest: 'ใหม่ล่าสุด', profile_filter_popular: 'ยอดนิยม', profile_filter_any_theme: 'ทุกธีม',
  },
  vi: {
    nav_explore: 'Khám phá', nav_upload: 'Tải lên', nav_signin: 'Đăng nhập', nav_signout: 'Đăng xuất',
    nav_search_placeholder: 'Tìm kiếm thành phần, danh mục, tác giả...',
    nav_search_mobile_placeholder: 'Tìm kiếm thành phần...',
    nav_open_menu: 'Mở menu', nav_close_menu: 'Đóng menu',
    hero_badge: 'Mã nguồn mở · Miễn phí sử dụng · Lấy cảm hứng từ UIverse & NameThatUI',
    hero_title_1: 'Giao diện UI đẹp mắt', hero_title_2: 'Thành phần', hero_title_3: 'cho tất cả mọi người',
    hero_description: 'Khám phá, chia sẻ và tái sử dụng hàng ngàn thành phần UI mã nguồn mở — nút bấm, thẻ bài, hiệu ứng tải và nhiều hơn nữa.',
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
    drawer_home: 'Trang chủ', drawer_trending: 'Thịnh hành', drawer_favorites: 'Yêu thích', drawer_upload: 'Tải lên UI',
    upload_title: 'Tải lên thành phần', upload_subtitle: 'Chia sẻ tác phẩm của bạn với cộng đồng',
    upload_close: 'Đóng cửa sổ tải lên', upload_component_title: 'Tên thành phần',
    upload_component_title_ph: 'Ví dụ: Nút Neon phát sáng', upload_category: 'Danh mục',
    upload_author: 'Tên tác giả', upload_author_ph: 'Ví dụ: nguyen_van_a',
    upload_html: 'Mã nguồn HTML', upload_css: 'Mã nguồn CSS', upload_submit: 'Gửi để xét duyệt',
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
    profile_title: 'Thông tin hồ sơ',
    profile_tab_posts: 'Bài đăng đã duyệt',
    profile_tab_in_review: 'Đang xét duyệt',
    profile_tab_rejected: 'Bị từ chối',
    profile_tab_favorites: 'Mục yêu thích',
    status_approved: 'Đã kiểm duyệt & Phê duyệt',
    status_in_review: 'Đang kiểm duyệt',
    status_rejected: 'Không đạt chuẩn bảo mật',
    btn_edit_fix: 'Chỉnh sửa & Khắc phục',
    rejection_reason_label: 'Lý do bị từ chối:',
    upload_approved_toast: 'Thành phần đã vượt qua kiểm duyệt bảo mật và được xuất bản! 🚀',
    upload_rejected_toast: 'Thành phần bị từ chối do vi phạm bảo mật. Xem Hồ sơ > Bị từ chối để sửa.',
    edit_and_fix_hint: 'Khắc phục mã bị lỗi và gửi lại để kiểm duyệt.',
    no_posts_title: 'Chưa có bài đăng nào',
    no_posts_desc: 'Có vẻ như bạn chưa đăng bài nào. Hãy bấm Tạo để chia sẻ với cộng đồng.',
    no_in_review_title: 'Không có mục nào đang xét duyệt',
    no_in_review_desc: 'Tất cả các thành phần gửi lên đã được xử lý bởi hệ thống bảo mật tự động.',
    no_rejected_title: 'Không có mục nào bị từ chối',
    no_rejected_desc: 'Tuyệt vời! Không có thành phần nào vi phạm tiêu chuẩn an toàn.',
    profile_uploads_count: 'Đã tải lên', profile_likes_count: 'Lượt thích',
    profile_no_favorites: 'Chưa có mục yêu thích nào', profile_no_favorites_hint: 'Nhấp vào biểu tượng trái tim trên bất kỳ thẻ nào để lưu vào đây.',
    profile_btn_upload: 'Tải lên ngay',
    btn_edit: 'Chỉnh sửa', btn_delete: 'Xóa', btn_save: 'Lưu thay đổi', btn_cancel: 'Hủy',
    btn_create: 'Tạo thành phần', btn_explore: 'Khám phá thành phần',
    edit_title: 'Chỉnh sửa thành phần', edit_subtitle: 'Cập nhật chi tiết và mã nguồn của thành phần',
    delete_confirm_title: 'Xác nhận xóa thành phần', delete_confirm_msg: 'Bạn có chắc chắn muốn xóa thành phần này không? Thao tác này không thể hoàn tác.',
    delete_confirm_yes: 'Đồng ý, xóa ngay',
    sec_err_script_tag: 'Phát hiện thẻ <script> bị cấm. Thành phần giao diện phải là HTML và CSS thuần.',
    sec_err_javascript_uri: 'Phát hiện liên kết "javascript:" bị cấm.',
    sec_err_js_execution: 'Phát hiện từ khóa thực thi JavaScript bị cấm.',
    sec_err_event_handler: 'Phát hiện trình xử lý sự kiện "{attr}" bị cấm.',
    sec_err_download_attr: 'Nghiêm cấm các lệnh hoặc thuộc tính tải tệp.',
    sec_err_executable_file: 'Phát hiện liên kết tệp thực thi hoặc tệp nén đáng ngờ.',
    sec_err_embed_tags: 'Nghiêm cấm nhúng khung ngoài (<iframe, <object, <embed).',
    sec_err_meta_refresh: 'Nghiêm cấm thẻ chuyển hướng Meta.',
    sec_err_empty_html: 'Thành phần phải chứa ít nhất một phần tử HTML hợp lệ.',
    sec_err_global_css: 'Nghiêm cấm ghi đè kiểu lên body hoặc html toàn cục. Hãy sử dụng class cục bộ.',
    settings_title: 'Cài đặt', settings_profile: 'Hồ sơ', settings_email: 'Email', settings_account: 'Tài khoản', settings_stats: 'Thống kê',
    stats_total_views: 'Tổng lượt xem', stats_favorites_saved: 'Mục yêu thích đã lưu', stats_your_elements: 'Thành phần của bạn', stats_likes_received: 'Lượt thích nhận được',
    settings_save_btn: 'Lưu thay đổi', settings_email_save_btn: 'Lưu Email', settings_cancel_btn: 'Hủy',
    profile_filter_newest: 'Mới nhất', profile_filter_popular: 'Phổ biến', profile_filter_any_theme: 'Mọi chủ đề',
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
    drawer_home: 'ໜ້າຫຼັກ', drawer_trending: 'ກຳລັງມາແຮງ', drawer_favorites: 'ລາຍການທີ່ຖືກໃຈ', drawer_upload: 'ອັບໂຫຼດ UI',
    upload_title: 'ອັບໂຫຼດຄອມໂພເນນຕ໌', upload_subtitle: 'ແບ່ງປັນຜົນງານຂອງທ່ານສູ່ຊຸມຊົນ',
    upload_close: 'ປິດໜ້າຕ່າງ', upload_component_title: 'ຊື່ຄອມໂພເນນຕ໌',
    upload_component_title_ph: 'ເຊັ່ນ: ປຸ່ມແສງນີອອນ (Neon Glow Button)', upload_category: 'ໝວດໝູ່',
    upload_author: 'ຊື່ຜູ້ສ້າງ', upload_author_ph: 'ເຊັ່ນ: somxay_99',
    upload_html: 'ໂຄ້ດ HTML', upload_css: 'ໂຄ້ດ CSS', upload_submit: 'ສົ່ງເພື່ອກວດສອບ',
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
    profile_title: 'ຂໍ້ມູນໂປຣໄຟລ໌',
    profile_tab_posts: 'ຜົນງານທີ່ເຜີຍແຜ່',
    profile_tab_in_review: 'ກຳລັງກວດສອບ',
    profile_tab_rejected: 'ບໍ່ຜ່ານການກວດສອບ',
    profile_tab_favorites: 'ລາຍການທີ່ຖືກໃຈ',
    status_approved: 'ກວດສອບຜ່ານແລ້ວ',
    status_in_review: 'ກຳລັງກວດສອບ',
    status_rejected: 'ບໍ່ຜ່ານມາດຕະຖານຄວາມປອດໄພ',
    btn_edit_fix: 'ແກ້ໄຂໂຄ້ດ',
    rejection_reason_label: 'ສາເຫດທີ່ບໍ່ຜ່ານ:',
    upload_approved_toast: 'ຄອມໂພເນນຜ່ານການກວດສອບຄວາມປອດໄພ ແລະ ເຜີຍແຜ່ແລ້ວ! 🚀',
    upload_rejected_toast: 'ຄອມໂພເນນບໍ່ຜ່ານມາດຕະຖານຄວາມປອດໄພ ເບິ່ງສາເຫດແລະແກ້ໄຂໄດ້ທີ່ ໂປຣໄຟລ໌ > ບໍ່ຜ່ານ',
    edit_and_fix_hint: 'ແກ້ໄຂໂຄ້ດທີ່ມີບັນຫາ ແລ້ວກົດສົ່ງເພື່ອກວດສອບໃໝ່',
    no_posts_title: 'ຍັງບໍ່ມີຜົນງານທີ່ເຜີຍແຜ່',
    no_posts_desc: 'ເບິ່ງຄືວ່າທ່ານຍັງບໍ່ໄດ້ໂພສຜົນງານໃດໆ ກົດສ້າງເພື່ອເລີ່ມແບ່ງປັນຜົນງານກັບທຸກຄົນ.',
    no_in_review_title: 'ບໍ່ມີຜົນງານທີ່ກຳລັງກວດສອບ',
    no_in_review_desc: 'ຜົນງານທັງໝົດທີ່ສົ່ງເຂົ້າມາໄດ້ຮັບການກວດສອບຈາກລະບົບອັດຕະໂນມັດຮຽບຮ້ອຍແລ້ວ.',
    no_rejected_title: 'ບໍ່ມີຜົນງານທີ່ບໍ່ຜ່ານການກວດສອບ',
    no_rejected_desc: 'ດີຫຼາຍ! ບໍ່ມີຜົນງານໃດຂອງທ່ານທີ່ລະເມີດມາດຕະຖານຄວາມປອດໄພ.',
    profile_uploads_count: 'ອັບໂຫຼດແລ້ວ', profile_likes_count: 'ຖືກໃຈ',
    profile_no_favorites: 'ຍັງບໍ່ມີລາຍການທີ່ຖືກໃຈ', profile_no_favorites_hint: 'ກົດໄອຄອນຮູບຫົວໃຈໃນກາດໃດກໍໄດ້ເພື່ອບັນທຶກໄວ້ທີ່ນີ້.',
    profile_btn_upload: 'ອັບໂຫຼດຕອນນີ້',
    btn_edit: 'ແກ້ໄຂ', btn_delete: 'ລຶບ', btn_save: 'ບັນທຶກການປ່ຽນແປງ', btn_cancel: 'ຍົກເລີກ',
    btn_create: 'ສ້າງຜົນງານ', btn_explore: 'ສຳຫຼວດຄອມໂພເນນຕ໌',
    edit_title: 'ແກ້ໄຂຄອມໂພເນນຕ໌', edit_subtitle: 'ປັບປຸງຂໍ້ມູນ ແລະ ໂຄ້ດຂອງຄອມໂພເນນຕ໌',
    delete_confirm_title: 'ຢືນຢັນການລຶບຄອມໂພເນນຕ໌', delete_confirm_msg: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຄອມໂພເນນຕ໌ນີ້? ການດຳເນີນການນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.',
    delete_confirm_yes: 'ແມ່ນແລ້ວ, ລຶບເລີຍ',
    sec_err_script_tag: 'ກວດພົບແທັກ <script> ທີ່ບໍ່ອະນຸຍາດ ຄອມໂພເນນຕ້ອງເປັນ Pure HTML ແລະ CSS ເທົ່ານັ້ນ',
    sec_err_javascript_uri: 'ກວດພົບລິ້ງ "javascript:" ທີ່ບໍ່ອະນຸຍາດ',
    sec_err_js_execution: 'ກວດພົບຄຳສັ່ງ JavaScript ທີ່ບໍ່ອະນຸຍາດ',
    sec_err_event_handler: 'ກວດພົບ Event Handler "{attr}" ທີ່ບໍ່ອະນຸຍາດ',
    sec_err_download_attr: 'ບໍ່ອະນຸຍາດໃຫ້ໃສ່ຄຳສັ່ງດາວໂຫຼດໄຟລ໌',
    sec_err_executable_file: 'ກວດພົບລິ້ງໄຟລ໌ຕິດຕັ້ງ ຫຼື ໄຟລ໌ບີບອັດທີ່ໜ້າສົງໄສ',
    sec_err_embed_tags: 'ບໍ່ອະນຸຍາດໃຫ້ຝັງເຟຣມພາຍນອກ (<iframe, <object, <embed)',
    sec_err_meta_refresh: 'ບໍ່ອະນຸຍາດໃຫ້ໃຊ້ Meta Redirect',
    sec_err_empty_html: 'ຄອມໂພເນນຕ້ອງມີແທັກ HTML ຢ່າງໜ້ອຍໜຶ່ງແທັກ',
    sec_err_global_css: 'ຫ້າມຂຽນ CSS ທັບແທັກ body ຫຼື html ສ່ວນກາງ ໃຫ້ໃຊ້ Class ສະເພາະ',
    settings_title: 'ການຕັ້ງຄ່າ', settings_profile: 'ໂປຣໄຟລ໌', settings_email: 'ອີເມວ', settings_account: 'ບັນຊີ', settings_stats: 'ສະຖິຕິ',
    stats_total_views: 'ຍອດເຂົ້າຊົມທັງໝົດ', stats_favorites_saved: 'ລາຍການທີ່ມັກທີ່ບັນທຶກ', stats_your_elements: 'ຜົນງານຂອງທ່ານ', stats_likes_received: 'ຍອດຖືກໃຈທີ່ໄດ້ຮັບ',
    settings_save_btn: 'ບັນທຶກການປ່ຽນແປງ', settings_email_save_btn: 'ບັນທຶກອີເມວ', settings_cancel_btn: 'ຍົກເລີກ',
    profile_filter_newest: 'ໃໝ່ລ່າສຸດ', profile_filter_popular: 'ຍອດນິຍົມ', profile_filter_any_theme: 'ທຸກຮູບແບບ',
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
      var k = els[i].getAttribute('data-i18n');
      if (k) els[i].textContent = t(k);
    }
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var i = 0; i < phEls.length; i++) {
      var k = phEls[i].getAttribute('data-i18n-placeholder');
      if (k) phEls[i].setAttribute('placeholder', t(k));
    }
    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var i = 0; i < ariaEls.length; i++) {
      var k = ariaEls[i].getAttribute('data-i18n-aria');
      if (k) ariaEls[i].setAttribute('aria-label', t(k));
    }
    var titleEls = document.querySelectorAll('[data-i18n-title]');
    for (var i = 0; i < titleEls.length; i++) {
      var k = titleEls[i].getAttribute('data-i18n-title');
      if (k) titleEls[i].setAttribute('title', t(k));
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
    try {
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
    } catch(e) {}
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
  window.t = function(key) { return I18n.t(key); };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { I18n.init(); });
} else {
  I18n.init();
}
