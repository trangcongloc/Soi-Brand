import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

const PROMPT_VI = `Bạn là một copywriter sáng tạo. Hãy tạo 5 cặp label (tiếng Việt) cho các bước loading khi phân tích kênh YouTube. Mỗi bước có label chính và nhiều sub-labels chi tiết.

Các bước:
1. Kiểm tra URL (3 sub-labels) - xác thực link, trích xuất ID, kiểm tra tồn tại
2. Tải thông tin kênh (4 sub-labels) - kết nối API, subscriber, view, mô tả
3. Tải danh sách video (5 sub-labels) - thu thập video, tiêu đề, view, like, tags
4. Phân tích nội dung (7 sub-labels) - xu hướng, tần suất, hiệu suất, chủ đề, pillars, khán giả, SEO
5. Tạo báo cáo (7 sub-labels) - tổng hợp, điểm mạnh, cơ hội, chiến lược, ý tưởng, kế hoạch, hoàn thiện

Yêu cầu:
- Label chính: ngắn gọn (tối đa 25 ký tự), dùng động từ mạnh
- Sub-labels: số lượng theo yêu cầu trên, mỗi mục 20-40 ký tự
- Sáng tạo, chuyên nghiệp
- KHÔNG đề cập đến AI, Gemini, machine learning

Trả về JSON theo format:
{
  "steps": [
    { "label": "...", "subLabels": ["...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "...", "...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "...", "...", "...", "..."] }
  ]
}`;

const PROMPT_EN = `You are a creative copywriter. Create 5 label pairs (in English) for loading steps when analyzing a YouTube channel. Each step has a main label and multiple detailed sub-labels.

Steps:
1. Validate URL (3 sub-labels) - verify link, extract ID, check exists
2. Load channel info (4 sub-labels) - connect API, subscribers, views, description
3. Load video list (5 sub-labels) - collect videos, titles, views, likes, tags
4. Analyze content (7 sub-labels) - trends, frequency, performance, topics, pillars, audience, SEO
5. Generate report (7 sub-labels) - compile, strengths, opportunities, strategy, ideas, plan, finalize

Requirements:
- Main label: concise (max 25 characters), use strong action verbs
- Sub-labels: count as specified above, each 20-40 characters
- Creative, professional tone
- Do NOT mention AI, Gemini, machine learning

Return JSON in this format:
{
  "steps": [
    { "label": "...", "subLabels": ["...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "...", "...", "...", "..."] },
    { "label": "...", "subLabels": ["...", "...", "...", "...", "...", "...", "..."] }
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
        logger.error("Error generating loading labels", error);
        return NextResponse.json(
            { error: "Failed to generate labels" },
            { status: 500 }
        );
    }
}
