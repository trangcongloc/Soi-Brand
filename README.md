# Soi'Brand

Công cụ phân tích chiến lược marketing cho kênh YouTube sử dụng AI (Google Gemini).

## Tính năng

- **Phân tích Kênh**: Tự động nhận diện kênh từ URL và lấy thông tin chi tiết
- **Phân tích Marketing**: Sử dụng Gemini AI để phân tích định vị thương hiệu, phễu marketing, và chiến lược nội dung
- **Báo cáo chuyên nghiệp**: Hiển thị dữ liệu trực quan với giao diện hiện đại
- **Xuất dữ liệu**: Hỗ trợ tải báo cáo dưới dạng JSON

## Công nghệ

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes
- **AI**: Google Gemini API
- **APIs**: YouTube Data API v3

## Cài đặt

```bash
# Clone và di chuyển vào thư mục
cd Soi-Brand

# Cài đặt dependencies
npm install

# Tạo file .env.local
cp .env.example .env.local
# Thêm API keys vào .env.local
```

## Chạy dự án

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Build production
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm run test         # Run tests
npm run validate     # Run all checks (type-check + lint + test)
```

## Testing Status

![Tests](https://img.shields.io/badge/tests-307%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen)
![ESLint](https://img.shields.io/badge/eslint-0%20warnings-brightgreen)

**Current Status:**
- ✅ 307 tests passing
- ✅ 0 ESLint warnings
- ✅ TypeScript strict mode
- ✅ All validation checks passing

See [CHANGELOG.md](./CHANGELOG.md) for recent fixes and updates.

## Deploy

Tối ưu cho Vercel. Cấu hình environment variables trong Vercel dashboard.
