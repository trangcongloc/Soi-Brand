import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `Bạn là một copywriter sáng tạo. Hãy tạo 5 cặp label (tiếng Việt) cho các bước loading khi phân tích kênh YouTube. Mỗi bước có label chính và sub-label chi tiết.

Các bước:
1. Kiểm tra URL - xác thực link, trích xuất ID kênh
2. Tải thông tin kênh - kết nối API, lấy subscriber, view, mô tả
3. Tải danh sách video - thu thập video gần nhất, thống kê engagement
4. Phân tích nội dung - phân tích xu hướng, tần suất, hiệu suất
5. Tạo báo cáo - tổng hợp insight, đề xuất chiến lược

Yêu cầu:
- Label chính: ngắn gọn (tối đa 25 ký tự), dùng động từ mạnh
- Sub-label: chi tiết hơn (50-80 ký tự), mô tả cụ thể đang làm gì
- Sáng tạo, chuyên nghiệp
- KHÔNG đề cập đến AI, Gemini, machine learning, hoặc công nghệ nào

Trả về JSON theo format:
{
  "steps": [
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." }
  ]
}`;

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            generationConfig: { responseMimeType: "application/json" },
        });

        const result = await model.generateContent(PROMPT);
        const response = await result.response;
        const text = response.text();

        const data = JSON.parse(text);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error generating loading labels:", error);
        return NextResponse.json(
            { error: "Failed to generate labels" },
            { status: 500 }
        );
    }
}
