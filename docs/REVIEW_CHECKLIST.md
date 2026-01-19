# Danh Sách Kiểm Tra Website OurTube

Sử dụng danh sách này để đánh giá hệ thống website OurTube về chất lượng, chức năng và trải nghiệm người dùng.

## 1. Kiểm Tra Chức Năng

### Tính Năng Cốt Lõi
- [ ] **Phân Tích URL Kênh YouTube**
  - [ ] Test với URL kênh chuẩn (`youtube.com/channel/UC...`)
  - [ ] Test với định dạng username (`youtube.com/@username`)
  - [ ] Test với custom URL (`youtube.com/c/customname`)
  - [ ] Test với user URL cũ (`youtube.com/user/username`)
  - [ ] Test với URL không hợp lệ (phải hiển thị lỗi phù hợp)
  - [ ] Test với kênh không tồn tại (phải xử lý được)

- [ ] **Tính Năng Upload JSON**
  - [ ] Upload file JSON báo cáo đã tạo trước đó
  - [ ] Upload file JSON không hợp lệ (phải hiển thị lỗi)
  - [ ] Upload file không phải JSON (phải hiển thị lỗi)
  - [ ] Xác minh báo cáo đã upload hiển thị đúng

- [ ] **Tạo Báo Cáo**
  - [ ] Xác minh tất cả phần của báo cáo load đầy đủ
  - [ ] Kiểm tra report_part_1 (thông tin kênh) hiển thị đúng
  - [ ] Kiểm tra report_part_2 (phân tích chiến lược) hiển thị đúng
  - [ ] Kiểm tra report_part_3 (insights & đề xuất) hiển thị đúng
  - [ ] Xác minh dữ liệu video hiển thị trong báo cáo

- [ ] **Tính Năng Download**
  - [ ] Tải xuống báo cáo dưới dạng JSON
  - [ ] Xác minh file tải về mở được
  - [ ] Xác minh file tải về có thể upload lại
  - [ ] Kiểm tra định dạng tên file có tên kênh và ngày tháng

### Tích Hợp API
- [ ] Test với API keys được cấu hình đúng
- [ ] Test khi YouTube API vượt quota
- [ ] Test khi Gemini API bị rate limit
- [ ] Test khi API keys không hợp lệ/thiếu
- [ ] Xác minh thông báo lỗi phù hợp cho từng tình huống lỗi API

## 2. Trải Nghiệm Người Dùng (UX)

### Ấn Tượng Ban Đầu
- [ ] Trang landing rõ ràng và giải thích được công cụ làm gì
- [ ] Giá trị mang lại hiển nhiên ngay lập tức
- [ ] Call-to-action (form nhập liệu) nổi bật
- [ ] Thiết kế trông chuyên nghiệp và đáng tin cậy

### Luồng Người Dùng
- [ ] Hướng dẫn sử dụng công cụ rõ ràng
- [ ] Nhãn form và placeholder hữu ích
- [ ] Trạng thái nút submit rõ ràng (enabled/disabled/loading)
- [ ] Trạng thái loading có thông tin và không gây khó chịu
- [ ] Trạng thái thành công rõ ràng
- [ ] Trạng thái lỗi hữu ích và có hướng dẫn khắc phục

### Khả Năng Đọc Nội Dung
- [ ] Text dễ đọc (cỡ chữ, độ tương phản, line height)
- [ ] Phân cấp thông tin rõ ràng (headings, subheadings)
- [ ] Các phần báo cáo được tổ chức tốt
- [ ] Đoạn text dài được chia nhỏ hợp lý
- [ ] Nội dung tiếng Việt tự nhiên và chính xác

### Các Thành Phần Tương Tác
- [ ] Tất cả nút có nhãn rõ ràng
- [ ] Hover states cung cấp phản hồi
- [ ] Focus states hiển thị rõ cho keyboard navigation
- [ ] Loading indicators mượt mà và chuyên nghiệp
- [ ] Transitions và animations tự nhiên (không quá nhanh/chậm)

## 3. Xử Lý Lỗi & Trường Hợp Đặc Biệt

### Validation Đầu Vào
- [ ] Submit URL trống được ngăn chặn hoặc xử lý
- [ ] Định dạng URL không hợp lệ hiển thị thông báo lỗi hữu ích
- [ ] Ký tự đặc biệt trong URL được xử lý đúng
- [ ] URL rất dài không làm vỡ layout

### Thông Báo Lỗi
- [ ] Tất cả loại lỗi có thông báo thân thiện bằng tiếng Việt
- [ ] Thông báo lỗi giải thích rõ điều gì sai
- [ ] Thông báo lỗi gợi ý cách khắc phục
- [ ] Lỗi kỹ thuật không để lộ thông tin nhạy cảm
- [ ] Lỗi network khác biệt với lỗi API

### Trường Hợp Đặc Biệt
- [ ] Kênh không có video (xử lý được)
- [ ] Kênh chỉ có video cũ (>30 ngày)
- [ ] Kênh có hàng nghìn video (hiệu suất)
- [ ] Kênh có ký tự đặc biệt trong tên
- [ ] Kênh mới với dữ liệu tối thiểu
- [ ] Kênh bị xóa hoặc private

## 4. Thiết Kế Hình Ảnh & Styling

### Layout
- [ ] Layout trang cân đối và không chật chội
- [ ] White space được sử dụng hiệu quả
- [ ] Nội dung căn giữa và dễ đọc trên mọi kích thước màn hình
- [ ] Hành vi scroll mượt mà
- [ ] Không có scroll ngang trên bất kỳ thiết bị nào

### Tính Nhất Quán Hình Ảnh
- [ ] Bảng màu nhất quán trong toàn bộ trang
- [ ] Typography nhất quán (font families, sizes, weights)
- [ ] Spacing nhất quán (margins, padding)
- [ ] Style nút nhất quán
- [ ] Form elements được style nhất quán

### Thương Hiệu
- [ ] Logo/tiêu đề nổi bật
- [ ] Màu sắc thương hiệu phù hợp với mục đích
- [ ] Phong cách hình ảnh phù hợp với chủ đề "phân tích marketing"
- [ ] Giao diện chuyên nghiệp phù hợp cho doanh nghiệp

### Cân Nhắc Dark/Light Mode
- [ ] Text có độ tương phản đủ với backgrounds
- [ ] Links có thể phân biệt với text thường
- [ ] Form inputs rõ ràng
- [ ] Cân nhắc thêm dark mode (tương lai)

## 5. Responsive Design & Mobile

### Thiết Bị Di Động (< 768px)
- [ ] Layout thích ứng mượt mà với màn hình nhỏ
- [ ] Text đọc được mà không cần zoom
- [ ] Nút dễ bấm (tối thiểu 44x44px)
- [ ] Form dễ điền trên mobile
- [ ] Hiển thị báo cáo có thể scroll và đọc được
- [ ] Không có nội dung bị cắt hoặc ẩn

### Tablet (768px - 1024px)
- [ ] Layout sử dụng không gian hiệu quả
- [ ] Không có breakpoint vụng về hoặc layout nhảy
- [ ] Touch targets có kích thước phù hợp

### Desktop (> 1024px)
- [ ] Nội dung không kéo dài quá rộng (max-width)
- [ ] Màn hình lớn không có không gian lãng phí
- [ ] Tương tác chuột tự nhiên

### Thay Đổi Hướng
- [ ] Chuyển portrait sang landscape mượt mà
- [ ] Nội dung reflow phù hợp
- [ ] Không có layout vỡ khi đổi hướng

## 6. Hiệu Suất

### Thời Gian Load
- [ ] Load trang ban đầu dưới 3 giây
- [ ] Tương tác form tức thì (không lag)
- [ ] Thời gian tạo báo cáo hợp lý (hoặc hiển thị progress)
- [ ] Images/assets load nhanh
- [ ] Không có render-blocking resources

### Hiệu Suất Runtime
- [ ] Scroll mượt mà (60fps)
- [ ] Gõ vào input không có lag
- [ ] Không có memory leak khi sử dụng lâu
- [ ] Browser không chậm sau nhiều lần phân tích

### Hiệu Suất API
- [ ] YouTube API calls hoàn thành trong thời gian hợp lý
- [ ] Gemini AI responses đến trong thời gian dự kiến
- [ ] Concurrent API calls không gây vấn đề
- [ ] Timeout handling được implement

### Kích Thước Bundle
- [ ] Kiểm tra kích thước build output (npm run build)
- [ ] Xác minh không có dependencies không cần thiết
- [ ] Cân nhắc code splitting nếu bundle lớn (>500KB)

## 7. Khả Năng Tiếp Cận (A11y)

### Điều Hướng Bằng Bàn Phím
- [ ] Tất cả elements tương tác có thể dùng keyboard
- [ ] Thứ tự tab logic và trực quan
- [ ] Focus indicators rõ ràng
- [ ] Không có keyboard traps
- [ ] Phím Enter submit form đúng cách

### Hỗ Trợ Screen Reader
- [ ] Nhãn form được liên kết đúng với inputs
- [ ] Thông báo lỗi được announce
- [ ] Trạng thái loading được announce
- [ ] Headings tạo document outline đúng
- [ ] Alternative text cho images/icons

### ARIA Attributes
- [ ] Form validation sử dụng aria-invalid
- [ ] Loading states sử dụng aria-busy hoặc aria-live
- [ ] Buttons có aria-labels phù hợp nếu cần
- [ ] Cập nhật nội dung động được announce

### Khả Năng Tiếp Cận Hình Ảnh
- [ ] Độ tương phản màu đạt chuẩn WCAG AA (4.5:1 cho text)
- [ ] Thông tin không chỉ truyền đạt qua màu sắc
- [ ] Text có thể resize 200% mà không vỡ layout
- [ ] Focus indicators không bị loại bỏ

## 8. Bảo Mật & Quyền Riêng Tư

### API Keys
- [ ] API keys được lưu trong environment variables (không trong code)
- [ ] Keys không bị lộ trong client-side code
- [ ] File .env trong .gitignore
- [ ] Documentation cảnh báo về bảo mật keys

### Xử Lý Dữ Liệu
- [ ] Không thu thập dữ liệu nhạy cảm của người dùng
- [ ] Dữ liệu kênh không được lưu trữ mà không có đồng ý
- [ ] Báo cáo tải về chỉ ở client-side
- [ ] Không có tracking hoặc analytics mà không thông báo

### Bảo Mật Input
- [ ] URL inputs được sanitize
- [ ] Không có lỗ hổng XSS trong hiển thị báo cáo
- [ ] API responses được validate trước khi hiển thị
- [ ] Giới hạn kích thước file upload được enforce

### HTTPS & Headers
- [ ] Site được serve qua HTTPS ở production
- [ ] Security headers được cấu hình (nếu có)
- [ ] Không có cảnh báo mixed content

## 9. Nội Dung & Copywriting

### Chất Lượng Ngôn Ngữ
- [ ] Tất cả text tiếng Việt ngữ pháp đúng
- [ ] Thuật ngữ kỹ thuật được dịch phù hợp
- [ ] Tone nhất quán (chuyên nghiệp, hữu ích)
- [ ] Không có lỗi chính tả

### Sự Rõ Ràng
- [ ] Hướng dẫn dễ hiểu
- [ ] Thông báo lỗi rõ ràng và có hướng dẫn
- [ ] Các phần báo cáo có headings rõ ràng
- [ ] Không có thuật ngữ chuyên ngành mà không giải thích

### Tính Đầy Đủ
- [ ] Tất cả UI elements có nhãn
- [ ] Không có text placeholder "Lorem ipsum"
- [ ] Cung cấp help text khi cần
- [ ] Documentation cập nhật

## 10. Chất Lượng Code & Bảo Trì

### TypeScript
- [ ] Chạy `npm run type-check` - không có lỗi
- [ ] Tất cả types được định nghĩa đúng (không có `any` trừ khi cần thiết)
- [ ] lib/types.ts đầy đủ và chính xác

### Linting
- [ ] Chạy `npm run lint` - không có lỗi hoặc cảnh báo
- [ ] Code theo format nhất quán
- [ ] Không có console.log trong production code

### Dependencies
- [ ] Tất cả dependencies cập nhật (kiểm tra lỗ hổng bảo mật)
- [ ] Không có dependencies không dùng trong package.json
- [ ] Lock file (package-lock.json) được commit

### Documentation
- [ ] CLAUDE.md phản ánh đúng kiến trúc hiện tại
- [ ] README.md có hướng dẫn setup
- [ ] Environment variables được document
- [ ] Tích hợp API được document

### Git & Version Control
- [ ] Commit messages mô tả rõ ràng
- [ ] Không có dữ liệu nhạy cảm trong commit history
- [ ] .gitignore được cấu hình đúng
- [ ] Branch strategy rõ ràng (nếu có)

## 11. SEO & Metadata

### Meta Tags
- [ ] Page title mô tả rõ và có keywords
- [ ] Meta description hấp dẫn (150-160 ký tự)
- [ ] Open Graph tags cho chia sẻ mạng xã hội
- [ ] Favicon được set và hiển thị đúng

### Cấu Trúc Nội Dung
- [ ] Phân cấp heading đúng (h1, h2, h3)
- [ ] Sử dụng semantic HTML elements
- [ ] URLs sạch và mô tả (nếu có nhiều trang)

### Hiệu Suất cho SEO
- [ ] Core Web Vitals tốt (dùng PageSpeed Insights)
- [ ] Mobile-friendly test pass
- [ ] Không có broken links

## 12. Tương Thích Trình Duyệt

### Các Trình Duyệt Hiện Đại
- [ ] Chrome/Edge (2 phiên bản mới nhất)
- [ ] Firefox (2 phiên bản mới nhất)
- [ ] Safari (2 phiên bản mới nhất)
- [ ] Opera (phiên bản mới nhất)

### Tính Năng Cần Test
- [ ] CSS Grid/Flexbox layouts render đúng
- [ ] JavaScript features hoạt động (async/await, fetch)
- [ ] Form submission và file upload
- [ ] JSON download functionality

## 13. Deployment & Production

### Build Process
- [ ] `npm run build` hoàn thành không lỗi
- [ ] Build output được optimize (kiểm tra folder .next)
- [ ] Production build chạy được local (`npm start`)

### Cấu Hình Environment
- [ ] Production environment variables được set
- [ ] API keys được cấu hình trong deployment platform
- [ ] Error logging/monitoring được setup (tùy chọn)

### Vercel-Specific (nếu deploy ở đó)
- [ ] Domain được cấu hình đúng
- [ ] HTTPS hoạt động
- [ ] Environment variables được set trong Vercel dashboard
- [ ] Build logs hiển thị deployment thành công
- [ ] Serverless function limits không bị vượt

## 14. Phản Hồi Người Dùng & Analytics

### User Testing
- [ ] Test với các kênh YouTube thực tế với nhiều quy mô khác nhau
- [ ] Nhận phản hồi từ người dùng mục tiêu (marketers, content creators)
- [ ] Quan sát nơi người dùng bị confused hoặc stuck
- [ ] Theo dõi các tình huống lỗi thường gặp nhất

### Cải Tiến Tương Lai
- [ ] Liệt kê các tính năng có thể thêm dựa trên testing
- [ ] Xác định các vấn đề hiệu suất
- [ ] Ghi chú các cải tiến UX cần ưu tiên
- [ ] Cân nhắc mở rộng hỗ trợ đa ngôn ngữ

---

## Mức Độ Ưu Tiên

**Critical (Phải Sửa Trước Khi Launch):**
- Chức năng cốt lõi hoạt động (phân tích kênh, tạo báo cáo)
- API keys được bảo mật
- Xử lý lỗi ngăn crash
- Layout mobile sử dụng được
- Không có lỗ hổng bảo mật

**High (Nên Sửa Sớm):**
- Tất cả thông báo lỗi hữu ích
- Hiệu suất tốt trên kết nối trung bình
- Accessibility cơ bản được cover
- Nội dung tiếng Việt được polish

**Medium (Tốt Nếu Có):**
- Tính năng accessibility nâng cao
- Tương thích hoàn hảo cross-browser
- Tối ưu SEO
- Tối ưu hiệu suất

**Low (Cải Tiến Tương Lai):**
- Dark mode
- Thêm ngôn ngữ
- Advanced analytics
- Progressive Web App features

---

## Quy Trình Testing

1. **Bắt Đầu Mới**: Xóa cache trình duyệt, dùng chế độ ẩn danh
2. **Test Có Hệ Thống**: Đi qua từng phần theo thứ tự
3. **Document Issues**: Ghi chú vấn đề gì, cách reproduce, mức độ nghiêm trọng
4. **Ưu Tiên Sửa**: Dùng mức độ ưu tiên ở trên để quyết định sửa gì trước
5. **Re-test Sau Khi Sửa**: Xác minh vấn đề được giải quyết và không có vấn đề mới
6. **Nhận Phản Hồi Bên Ngoài**: Để người không quen dự án test

## Công Cụ Hỗ Trợ

- **Browser DevTools**: Kiểm tra console lỗi, network tab cho API calls
- **Lighthouse**: Chạy audit cho performance, accessibility, SEO (Chrome DevTools)
- **PageSpeed Insights**: Test thời gian load và Core Web Vitals
- **WAVE**: Kiểm tra accessibility (browser extension)
- **Responsive Design Mode**: Test các kích thước màn hình khác nhau (browser DevTools)
- **BrowserStack/LambdaTest**: Test trên thiết bị và trình duyệt thực (tùy chọn)

---

## Các Điểm Kiểm Tra Bổ Sung Theo Dự Án OurTube

### Kiểm Tra Đặc Thù Chức Năng

#### Phân Tích Dữ Liệu YouTube
- [ ] Kênh với nhiều video trong 30 ngày gần nhất được lọc đúng
- [ ] Kênh không có video 30 ngày gần nhất fallback về 10 video gần nhất
- [ ] Channel statistics hiển thị đầy đủ (subscribers, views, video count)
- [ ] Thông tin video bao gồm title, views, likes, comments, publish date

#### Báo Cáo Marketing AI
- [ ] **Brand Positioning**: Phân tích nhóm tuổi, giới tính, nghề nghiệp, tâm lý
- [ ] **Ad Strategy**: Strategy analysis và ad script examples
- [ ] **Marketing Funnel**:
  - [ ] TOFU (Top of Funnel) - awareness content
  - [ ] MOFU (Middle of Funnel) - consideration content
  - [ ] BOFU (Bottom of Funnel) - conversion content
  - [ ] Tỷ lệ phân bố TOFU/MOFU/BOFU hiển thị đúng
- [ ] **Content Pillars**:
  - [ ] Phân loại video theo pillars
  - [ ] Tỷ lệ % mỗi pillar
  - [ ] Note về chiến lược content
- [ ] **SEO Tags**: Tag categories và ví dụ tags
- [ ] **Posting Time Analysis**: Thời gian đăng tối ưu
- [ ] **Quantitative Metrics**: Tỷ lệ engagement, video performance patterns
- [ ] **Insights**: Strengths, weaknesses, recommendations, video ideas

#### Xử Lý Lỗi Gemini AI
- [ ] Model overload (503) - hiển thị thông báo phù hợp
- [ ] Rate limits (429) - gợi ý thử lại sau
- [ ] Invalid API key (500) - hướng dẫn kiểm tra key
- [ ] JSON parsing errors - hiển thị lỗi rõ ràng
- [ ] Timeout errors - xử lý gracefully

#### Tính Năng Upload/Download JSON
- [ ] File JSON download có cấu trúc đúng MarketingReport type
- [ ] Filename format: `[channel-name]_[timestamp].json`
- [ ] Upload file JSON hiển thị lại đầy đủ tất cả sections
- [ ] Validation JSON structure trước khi hiển thị

### UI/UX Đặc Thù

#### AnalysisForm Component
- [ ] Placeholder text hướng dẫn rõ ràng
- [ ] Submit button disabled khi input trống
- [ ] Loading state hiển thị trong khi phân tích
- [ ] File upload button rõ ràng và dễ sử dụng

#### LoadingState Component
- [ ] Animation loading mượt mà
- [ ] Text thông báo đang xử lý
- [ ] Không block UI hoàn toàn (nếu có thể)

#### ReportDisplay Component
- [ ] Các section được chia nhỏ rõ ràng
- [ ] Heading phân cấp đúng
- [ ] Tables/lists format đẹp và dễ đọc
- [ ] Download button dễ thấy và sử dụng
- [ ] Scrolling trong report mượt mà

### Performance Đặc Thù

#### API Call Optimization
- [ ] YouTube API: Tối đa 50 videos per request
- [ ] Gemini API: Prompt được optimize để giảm tokens
- [ ] Parallel API calls nếu có thể
- [ ] Caching cho repeated requests (nếu implement)

#### Bundle Analysis
- [ ] Axios bundle size hợp lý
- [ ] Gemini SDK size impact
- [ ] Next.js bundle splitting hiệu quả
- [ ] Không import toàn bộ libraries khi chỉ cần một phần

### Bảo Mật Đặc Thù

#### API Key Security
- [ ] YOUTUBE_API_KEY không bị lộ client-side
- [ ] GEMINI_API_KEY không bị lộ client-side
- [ ] API routes kiểm tra API keys tồn tại trước khi call
- [ ] Error messages không lộ API key values

#### Data Privacy
- [ ] Không lưu channel data vào database (client-side only)
- [ ] Không track user behavior mà không thông báo
- [ ] Không share data với third parties

---

**Chúc bạn review thành công! Đánh dấu các mục khi đã xác minh. Tập trung vào các vấn đề critical trước, sau đó làm theo thứ tự ưu tiên.**
