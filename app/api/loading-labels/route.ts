import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT_VI = `Bạn là một copywriter sáng tạo. Hãy tạo 5 cặp label (tiếng Việt) cho các bước loading khi phân tích kênh YouTube. Mỗi bước có label chính và sub-label chi tiết.

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

const PROMPT_EN = `You are a creative copywriter. Create 5 label pairs (in English) for loading steps when analyzing a YouTube channel. Each step has a main label and a detailed sub-label.

Steps:
1. Validate URL - verify link, extract channel ID
2. Load channel info - connect API, get subscribers, views, description
3. Load video list - collect recent videos, gather engagement stats
4. Analyze content - analyze trends, frequency, performance
5. Generate report - compile insights, suggest strategies

Requirements:
- Main label: concise (max 25 characters), use strong action verbs
- Sub-label: more detailed (50-80 characters), describe what's happening
- Creative, professional tone
- Do NOT mention AI, Gemini, machine learning, or any technology

Return JSON in this format:
{
  "steps": [
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." },
    { "label": "...", "subLabel": "..." }
  ]
}`;

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const lang = searchParams.get("lang") || "vi";
        const prompt = lang === "en" ? PROMPT_EN : PROMPT_VI;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            generationConfig: { responseMimeType: "application/json" },
        });

        const result = await model.generateContent(prompt);
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
