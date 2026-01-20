# Soi'Brand - Lộ trình Sản phẩm

## Phiên bản Hiện tại: v1.0

---

## ✅ Tính năng Đã triển khai (v1.0)

### Chức năng Cốt lõi
- ✅ **Phân tích Kênh YouTube**
  - Trích xuất thông tin kênh qua YouTube Data API v3
  - Thu thập dữ liệu video (tối đa 50 video gần đây, lọc trong 30 ngày)
  - Hỗ trợ nhiều định dạng URL kênh (@username, /channel/ID, /c/custom, /user/username)
  - Thống kê kênh (subscribers, lượt xem, số video)

- ✅ **Phân tích Marketing bằng AI** (Gemini 2.5 Flash Lite)
  - Phân tích nhận diện thương hiệu
  - Tổng quan chiến lược quảng cáo
  - Phân tích phễu marketing (TOFU/MOFU/BOFU)
  - Xác định trụ cột nội dung
  - Phân tích thị trường ngách với các danh mục
  - Phân tích cấu trúc nội dung (hooks, storytelling, CTA)
  - Phân tích SEO toàn diện với phân loại tag
  - Ước tính nhân khẩu học khán giả (dựa trên AI)
  - Chân dung khán giả (tối thiểu 2 phân khúc)
  - Phân tích hành vi
  - Hồ sơ tâm lý học
  - Đề xuất lịch nội dung
  - Xác định cơ hội tăng trưởng
  - Tổng hợp chỉ số định lượng
  - Insights hành động được & ý tưởng video
  - Kế hoạch hành động 30/60/90 ngày

### Giao diện Người dùng
- ✅ **Thiết kế Hiện đại, Responsive**
  - Bố cục dạng thẻ gọn gàng
  - Hệ thống màu nhấn (tím, xanh, xanh lá, cam, hồng, xanh ngọc)
  - Các phần có biểu tượng
  - CSS responsive cho mobile

- ✅ **Hiển thị Báo cáo Đa Tab**
  - Tab Bài đăng: Danh sách video với thống kê
  - Tab Phân tích: Phân tích marketing toàn diện
  - Tab Insights: Khuyến nghị và kế hoạch hành động

- ✅ **Tính năng Tương tác**
  - Nhập URL kênh với xác thực
  - Khả năng tải lên/tải xuống báo cáo JSON
  - Phân tích báo cáo offline
  - Trạng thái loading với chỉ báo tiến trình
  - Xử lý lỗi với thông báo thân thiện

### Đa ngôn ngữ
- ✅ **Tiếng Việt** (Mặc định)
  - Dịch UI hoàn chỉnh
  - Đầu ra phân tích bằng tiếng Việt
  - Bản địa hóa định dạng ngày/giờ (Thứ 2-Chủ nhật)

- ✅ **Tiếng Anh**
  - Dịch UI đầy đủ
  - Khả năng chuyển đổi ngôn ngữ

### Tính năng Kỹ thuật
- ✅ **Next.js 14 App Router**
  - Server-side rendering
  - API routes cho logic backend
  - TypeScript toàn bộ

- ✅ **Xử lý Lỗi Mạnh mẽ**
  - Xác thực API key
  - Phát hiện giới hạn tốc độ
  - Xử lý quá tải model
  - Phân tích JSON với tự động sửa lỗi
  - Quản lý lỗi mạng

- ✅ **Xác thực Dữ liệu**
  - Xác thực định dạng URL
  - Xác thực cấu trúc response
  - Kiểm tra các phần bắt buộc

### Phân tích SEO & Nội dung
- ✅ **Phân tích Tag Nâng cao**
  - Trích xuất tất cả tags kênh
  - Tính toán tần suất tag
  - Phân loại tag (8 danh mục chuyên nghiệp):
    - Từ khóa Nội dung Cốt lõi
    - Nhận diện Thương hiệu & Kênh
    - Tags Định dạng Nội dung
    - Từ khóa Đối tượng Mục tiêu
    - Tags Xu hướng & Viral
    - Từ khóa Dài SEO
    - Tags Chuyên ngành
    - Tags Địa lý/Ngôn ngữ
  - Chấm điểm hiệu quả tag
  - Đề xuất tag đối thủ
  - Cơ hội từ khóa dài

- ✅ **Phân tích Thời gian Đăng bài**
  - Ngày xem cao điểm (dữ liệu thực tế từ thời gian đăng)
  - Giờ xem cao điểm (dữ liệu thực tế từ thời gian đăng)
  - Sắp xếp theo thứ tự thời gian (Thứ 2-Chủ nhật, 0:00-23:00)
  - Đề xuất thời gian đăng tốt nhất

---

## 🚧 Đang Phát triển (v1.1)

### Cải tiến UI/UX
- 🚧 **Trực quan hóa Dữ liệu**
  - [ ] Biểu đồ phân bổ tuổi/giới tính
  - [ ] Biểu đồ tròn danh mục nội dung
  - [ ] Bản đồ phân bổ quốc gia
  - [ ] Trực quan hóa đám mây tag
  - [ ] Sơ đồ phễu
  - [ ] Trực quan lịch nội dung
  - [ ] Đồng hồ đo chỉ số tương tác

- 🚧 **Phần tử Tương tác**
  - [ ] Các phần có thể mở rộng/thu gọn
  - [ ] Click để xem video ví dụ
  - [ ] Danh mục tag có thể lọc
  - [ ] Bảng dữ liệu có thể sắp xếp

### Minh bạch Dữ liệu
- 🚧 **Tiết lộ Hạn chế AI**
  - [ ] Thêm lưu ý cho nhân khẩu học ước tính bởi AI
  - [ ] Làm rõ phân tích nội dung dựa trên metadata (không xem video)
  - [ ] Chỉ ra dữ liệu nào là thực vs ước tính
  - [ ] Thêm huy hiệu nguồn dữ liệu (✅ Thực, ⚠️ Tính toán, 🤖 Ước tính AI)

---

## 📋 Tính năng Đã lên Kế hoạch

### Giai đoạn 1: Trực quan hóa Nâng cao (v1.2) - Q1 2026

#### Tích hợp Biểu đồ & Đồ thị
- [ ] **Trực quan hóa Nhân khẩu học**
  - Biểu đồ cột phân bổ tuổi
  - Biểu đồ tròn phân chia giới tính
  - Biểu đồ cột quốc gia hàng đầu với cờ
  - Phân bổ ngôn ngữ

- [ ] **Biểu đồ Phân tích Nội dung**
  - Biểu đồ tròn danh mục nội dung với phần trăm
  - Phân bổ trụ cột nội dung
  - Timeline tần suất đăng bài
  - Đường xu hướng tỷ lệ tương tác

- [ ] **Trực quan hóa SEO**
  - Đám mây tag (kích thước theo tần suất)
  - So sánh hiệu quả danh mục tag
  - Heatmap mật độ từ khóa
  - Đồng hồ đo điểm tối ưu

- [ ] **Chỉ số Hiệu suất**
  - Biểu đồ xu hướng lượt xem/thích/bình luận
  - Tỷ lệ tương tác theo thời gian
  - Dự báo tăng trưởng subscriber
  - Phân bổ hiệu suất video

#### Cải tiến Tương tác
- [ ] Click vào tiêu đề video → mở tab mới
- [ ] Click vào tag → lọc video liên quan
- [ ] Hover lên biểu đồ → tooltip chi tiết
- [ ] Xuất biểu đồ thành hình ảnh

**Thời gian:** 4-6 tuần
**Ưu tiên:** Cao

---

### Giai đoạn 2: Phân tích Sâu (v1.3) - Q2 2026

#### Tính năng Phân tích Nâng cao
- [ ] **So sánh Đối thủ**
  - Lấy dữ liệu cho 2-3 kênh đối thủ
  - So sánh chỉ số song song
  - Phân tích khoảng cách cạnh tranh
  - Ma trận định vị thị trường

- [ ] **Phân tích Xu hướng**
  - Xu hướng hiệu suất video theo thời gian
  - Xác định xu hướng chủ đề
  - Phát hiện mẫu theo mùa
  - Tính toán tốc độ tăng trưởng

- [ ] **Chấm điểm Hiệu suất Nội dung**
  - Dự đoán hiệu suất video
  - Điểm hiệu quả tiêu đề
  - Đánh giá chất lượng thumbnail (nếu có thể)
  - Đề xuất độ dài video tối ưu

- [ ] **Nâng cấp Chiến lược Hashtag**
  - Theo dõi hiệu suất hashtag
  - Đề xuất hashtag xu hướng
  - Khuyến nghị kết hợp hashtag
  - Phân tích hashtag cạnh tranh

#### Tùy chọn Xuất Dữ liệu
- [ ] Tạo báo cáo PDF
- [ ] Xuất Excel/CSV cho chỉ số
- [ ] Xuất bản trình bày PowerPoint
- [ ] Liên kết báo cáo có thể chia sẻ

**Thời gian:** 6-8 tuần
**Ưu tiên:** Trung bình-Cao

---

### Giai đoạn 3: Tính năng Thời gian Thực (v2.0) - Q3 2026

#### Giám sát Trực tiếp
- [ ] **Dashboard Giám sát Kênh**
  - Số subscriber thời gian thực
  - Hiệu suất video gần đây
  - Chỉ số tương tác trực tiếp
  - Hệ thống thông báo cho các mốc quan trọng

- [ ] **Trình Tối ưu Upload Video**
  - Đề xuất thời gian tốt nhất để upload
  - Trình kiểm tra tối ưu tiêu đề/mô tả
  - Đề xuất tag trước khi upload
  - Điểm SEO trước khi đăng

- [ ] **Hệ thống Cảnh báo**
  - Phát hiện video viral
  - Cảnh báo giảm tương tác
  - Thông báo hoạt động đối thủ
  - Cảnh báo cơ hội xu hướng

#### Dữ liệu Lịch sử
- [ ] Lưu lịch sử phân tích
- [ ] So sánh báo cáo theo thời gian
- [ ] Theo dõi chỉ số cải thiện
- [ ] Trực quan hóa quỹ đạo tăng trưởng

**Thời gian:** 8-10 tuần
**Ưu tiên:** Trung bình

---

### Giai đoạn 4: Công cụ Sáng tạo Nội dung (v2.1) - Q4 2026

#### Trợ lý Nội dung AI
- [ ] **Trình Tạo Ý tưởng Video**
  - Đề xuất tiêu đề do AI tạo
  - Template mô tả
  - Đề xuất gói tag
  - Ý tưởng concept thumbnail

- [ ] **Công cụ Lập kế hoạch Lịch Nội dung**
  - Giao diện lịch trực quan
  - Lên lịch kéo-thả
  - Trình theo dõi cân bằng kết hợp nội dung
  - Công cụ lập kế hoạch series

- [ ] **Trình Tạo Outline Script**
  - Đề xuất hook (5 giây đầu)
  - Template cấu trúc câu chuyện
  - Đề xuất vị trí CTA
  - Ý tưởng yếu tố tương tác

- [ ] **Phân tích Thumbnail** (nếu có API)
  - Phân tích bảng màu
  - Kiểm tra độ dễ đọc text
  - Phát hiện yếu tố đáng click
  - Đề xuất A/B testing

**Thời gian:** 6-8 tuần
**Ưu tiên:** Thấp-Trung bình

---

### Giai đoạn 5: Tính năng Cộng tác (v2.2) - Q1 2027

#### Chức năng Nhóm
- [ ] **Tài khoản Người dùng**
  - Hệ thống đăng nhập/xác thực
  - Không gian làm việc nhóm
  - Truy cập dựa trên vai trò (owner, editor, viewer)
  - Theo dõi sử dụng

- [ ] **Chia sẻ Báo cáo**
  - Liên kết có thể chia sẻ có hết hạn
  - Hệ thống bình luận trên báo cáo
  - Ghi chú cộng tác
  - Phiên bản báo cáo

- [ ] **Quản lý Dự án**
  - Gán nhiệm vụ từ kế hoạch hành động
  - Dashboard theo dõi tiến độ
  - Nhắc nhở deadline
  - Theo dõi chỉ số thành công

**Thời gian:** 10-12 tuần
**Ưu tiên:** Thấp

---

## 🔧 Cải tiến Kỹ thuật

### Tối ưu Hiệu suất
- [ ] **Chiến lược Caching**
  - Redis cache cho API responses
  - Report caching cho phân tích lặp lại
  - CDN integration cho assets
  - Lazy loading cho components nặng

- [ ] **Tối ưu API**
  - Batch API requests
  - Quản lý rate limit
  - Hệ thống hàng đợi request
  - Nén response

### Chất lượng Code
- [ ] **Testing**
  - Unit tests cho utilities
  - Integration tests cho API routes
  - E2E tests cho luồng quan trọng
  - Visual regression testing

- [ ] **Tài liệu**
  - Tài liệu API
  - Component storybook
  - Hướng dẫn onboarding developer
  - Architecture decision records

### Hạ tầng
- [ ] **Tích hợp Database**
  - Lưu trữ dữ liệu người dùng
  - Lịch sử phân tích
  - Template báo cáo
  - Phân tích sử dụng

- [ ] **Giám sát**
  - Error tracking (Sentry)
  - Performance monitoring
  - User analytics
  - Dashboard sử dụng API

---

## 🎯 Đơn giản hóa & Loại bỏ Tính năng

### Các Phần cần Đơn giản hóa (Dựa trên Phân tích AnalyzeTab.md)

1. **Phân tích Cấu trúc Nội dung**
   - Thêm lưu ý hạn chế AI
   - Tập trung vào insights dựa trên metadata
   - Loại bỏ phân tích suy đoán về xem video

2. **Phần Danh mục Tag**
   - Làm có thể mở rộng/thu gọn
   - Thêm toggle "Hiện Tất cả" / "Hiện Top 5"
   - Nhóm theo điểm hiệu quả

3. **Chân dung Khán giả**
   - Thêm phân bổ phần trăm
   - Làm tùy chọn cho kênh < 10K subscribers
   - Đơn giản hóa trường cho kênh nhỏ

### Các Phần Có điều kiện

1. **Phần Chiến lược Quảng cáo**
   - Chỉ hiển thị cho kênh có quảng cáo được phát hiện
   - Ẩn cho kênh giáo dục/không thương mại
   - Làm có thể toggle trong settings

2. **Phân tích Đối thủ** (khi triển khai)
   - Tính năng tùy chọn
   - Yêu cầu sự đồng ý rõ ràng của người dùng
   - Triển khai thân thiện với quyền riêng tư

---

## 📊 Chỉ số & Tiêu chí Thành công

### Chỉ số Tương tác Người dùng
- Tỷ lệ tạo báo cáo thành công: > 95%
- Thời gian phân tích trung bình: < 30 giây
- Điểm hài lòng người dùng: > 4.5/5
- Tỷ lệ tải báo cáo: > 60%

### Hiệu suất Kỹ thuật
- Thời gian phản hồi API: < 3 giây (p95)
- Tỷ lệ lỗi: < 1%
- Uptime: > 99.5%
- Tỷ lệ thành công Gemini AI: > 98%

### Áp dụng Tính năng
- Sử dụng đa ngôn ngữ: 30% Tiếng Anh, 70% Tiếng Việt
- Sử dụng tính năng upload báo cáo: > 20%
- Tỷ lệ người dùng quay lại: > 40%

---

## 🐛 Vấn đề Đã biết & Hạn chế

### Hạn chế Hiện tại
1. **Không Xem Video**
   - AI không thể xem video thực tế
   - Phân tích dựa trên tiêu đề, mô tả, tags
   - Insights cấu trúc nội dung dựa trên metadata

2. **Độ chính xác Dữ liệu Nhân khẩu học**
   - Nhân khẩu học là ước tính AI
   - YouTube API không cung cấp dữ liệu khán giả thực tế
   - Dựa trên ngôn ngữ nội dung, chủ đề và phong cách

3. **Phân tích Đối thủ**
   - Hiện tại là suy đoán của AI
   - Không lấy dữ liệu đối thủ thực tế
   - Khuyến nghị được tổng quát hóa

4. **Giới hạn Video**
   - Tối đa 50 video mỗi phân tích
   - Lọc trong 30 ngày qua (hoặc top 10 nếu không có)
   - Các kênh hoạt động lâu có thể thiếu ngữ cảnh lịch sử

5. **Ràng buộc API Quota**
   - YouTube API: 10,000 units/ngày (tier miễn phí)
   - Gemini API: Áp dụng rate limits
   - Có thể yêu cầu API keys người dùng cho sử dụng nhiều

### Sửa lỗi Đã lên Kế hoạch
- [ ] Thêm khả năng xem video (tích hợp API tương lai)
- [ ] Triển khai YouTube Analytics API (yêu cầu xác thực chủ kênh)
- [ ] Thêm lưu trữ dữ liệu lịch sử
- [ ] Triển khai xoay vòng API key
- [ ] Thêm dashboard sử dụng quota

---

## 💡 Ý tưởng Tính năng (Backlog)

### Yêu cầu từ Cộng đồng
- [ ] So sánh đa kênh (tối đa 5 kênh)
- [ ] Dữ liệu benchmark ngành
- [ ] Báo cáo tự động hàng tuần
- [ ] Tích hợp với nền tảng khác (TikTok, Instagram)
- [ ] Tùy chọn white-label cho agency
- [ ] Truy cập API cho developers

### Tính năng Thử nghiệm
- [ ] Trình tạo script video AI
- [ ] Phân tích giọng nói (nếu có transcript)
- [ ] Phân tích cảm xúc của bình luận
- [ ] Đề xuất cộng tác influencer
- [ ] Cố vấn chiến lược kiếm tiền

### Tích hợp Nền tảng
- [ ] Tích hợp Google Ads
- [ ] Tích hợp YouTube Studio
- [ ] Tích hợp lập lịch mạng xã hội
- [ ] Tích hợp nền tảng email marketing
- [ ] Tích hợp CRM cho agency

---

## 🔄 Lịch sử Phiên bản

### v1.0 (Hiện tại) - Tháng 1 năm 2026
- Phát hành chính thức
- Tính năng phân tích cốt lõi
- Hỗ trợ Tiếng Việt/Tiếng Anh
- Phân loại tag SEO
- Import/export JSON

### v0.9 (Beta) - Tháng 12 năm 2025
- Giai đoạn beta testing
- Sửa lỗi và tối ưu hóa
- Tinh chỉnh UI

### v0.5 (Alpha) - Tháng 11 năm 2025
- Phát triển prototype
- Tích hợp API cơ bản
- Kỹ thuật prompt AI ban đầu

---

## 📝 Đóng góp

Lộ trình này có thể thay đổi dựa trên:
- Phản hồi người dùng và yêu cầu tính năng
- Tính khả dụng và hạn chế của API
- Tính khả thi kỹ thuật
- Ràng buộc tài nguyên
- Nhu cầu thị trường

Để đề xuất tính năng hoặc báo cáo vấn đề:
- Mở issue trên GitHub
- Liên hệ qua email
- Gửi form yêu cầu tính năng

---

## 📄 Giấy phép & Ghi nhận

- **Dự án**: Công cụ Phân tích Marketing YouTube Soi'Brand
- **Mô hình AI**: Google Gemini 2.5 Flash Lite
- **APIs**: YouTube Data API v3
- **Framework**: Next.js 14
- **Ngôn ngữ**: TypeScript

---

*Cập nhật Lần cuối: 19 tháng 1, 2026*
*Lộ trình được duy trì bởi: Đội Phát triển Soi'Brand*
