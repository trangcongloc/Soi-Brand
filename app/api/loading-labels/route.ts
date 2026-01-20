import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `Bạn là một copywriter sáng tạo. Hãy tạo 5 cặp label ngắn gọn (tiếng Việt) cho các bước loading khi phân tích kênh YouTube. Mỗi bước có label chính và sub-label.

Các bước:
1. Kiểm tra URL
2. Tải thông tin kênh
3. Tải danh sách video
4. Phân tích nội dung
5. Tạo báo cáo

Yêu cầu:
- Sáng tạo, không nhàm chán
- Ngắn gọn (tối đa 25 ký tự mỗi label)
- Dùng động từ mạnh
- KHÔNG đề cập đến AI, Gemini, machine learning, hoặc bất kỳ công nghệ nào

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
