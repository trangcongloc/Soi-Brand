# OurTube

Website phân tích chiến lược marketing cho kênh YouTube sử dụng AI (Google Gemini).

## Tính năng

-   **Phân tích Kênh**: Tự động nhận diện kênh từ URL và lấy thông tin chi tiết.
-   **Phân tích Marketing sâu**: Sử dụng Gemini AI để phân tích định vị thương hiệu, phễu marketing, và tuyến nội dung.
-   **Báo cáo chuyên nghiệp**: Hiển thị dữ liệu trực quan với giao diện hiện đại, tối ưu cho trải nghiệm người dùng.
-   **Xuất dữ liệu**: Hỗ trợ tải báo cáo dưới dạng JSON để lưu trữ hoặc xử lý tiếp.

## Công nghệ sử dụng

-   **Frontend**: Next.js 14 (App Router), TypeScript, Vanilla CSS.
-   **Backend**: Next.js API Routes, YouTube Data API v3.
-   **AI**: Google Gemini Pro API.
-   **Styling**: Modern UI with Rich Aesthetics.

## Cấu hình

1.  Clone project và di chuyển vào thư mục:

    ```bash
    cd OurTube
    ```

2.  Cài đặt dependencies:

    ```bash
    npm install
    ```

3.  Tạo file `.env.local` và thêm các API keys:
    ```env
    YOUTUBE_API_KEY=your_youtube_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

## Chạy dự án

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để sử dụng.

## Deploy trên Vercel

Dự án đã được tối ưu để deploy trên Vercel. Hãy đảm bảo bạn đã cấu hình các biến môi trường (Environment Variables) trong dashboard của Vercel tương tự như trong file `.env.local`.
