import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

const PROMPT_VI = `Tạo 5 cặp label tiếng Việt cho các bước loading khi phân tích kênh YouTube. Mỗi bước gồm label chính và nhiều sub-labels chi tiết.

Các bước:
1. Kiểm tra URL (3 sub-labels) - xác thực link, trích xuất ID, kiểm tra tồn tại
2. Tải thông tin kênh (4 sub-labels) - kết nối API, subscriber, view, mô tả
3. Tải danh sách video (5 sub-labels) - thu thập video, tiêu đề, view, like, tags
4. Phân tích nội dung (7 sub-labels) - xu hướng, tần suất, hiệu suất, chủ đề, pillars, khán giả, SEO
5. Tạo báo cáo (7 sub-labels) - tổng hợp, điểm mạnh, cơ hội, chiến lược, ý tưởng, kế hoạch, hoàn thiện

Yêu cầu:
- Label chính: ngắn gọn tối đa 25 ký tự, dùng động từ mạnh
- Sub-labels: số lượng theo yêu cầu trên, mỗi mục 20-40 ký tự
- Hài hước, tự nhiên, hơi mỉa mai nhưng không quá cringe
- Phong cách casual dành cho độ tuổi 18-35, dùng internet slang Việt khi hợp lý
- Tránh format "A: B" hoặc "Đang [động từ]..."
- Không dùng emoji
- Không đề cập AI, Gemini, machine learning
- Không sexual content

Ví dụ tone phù hợp:
- "Lục tung kho video của kênh"
- "Soi từng con số như thám tử"
- "Bắt trend nhanh hơn gen Z"
- "Đếm view như đếm tiền lương"
- "Phân tích sâu hơn cả drama"

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

const PROMPT_EN = `Create 5 label pairs in English for loading steps when analyzing a YouTube channel. Each step has a main label and multiple detailed sub-labels.

Steps:
1. Validate URL (3 sub-labels) - verify link, extract ID, check exists
2. Load channel info (4 sub-labels) - connect API, subscribers, views, description
3. Load video list (5 sub-labels) - collect videos, titles, views, likes, tags
4. Analyze content (7 sub-labels) - trends, frequency, performance, topics, pillars, audience, SEO
5. Generate report (7 sub-labels) - compile, strengths, opportunities, strategy, ideas, plan, finalize

Requirements:
- Main label: concise max 25 characters, use strong action verbs
- Sub-labels: count as specified above, each 20-40 characters
- Funny, natural, slightly sarcastic but not too cringe
- Casual style for 18-35 age group, use internet slang when appropriate
- Avoid "A: B" format or "Currently [verb]ing..." patterns
- No emojis
- Do NOT mention AI, Gemini, machine learning
- No sexual content

Example tone that works:
- "Stalking this channel like a detective"
- "Counting views like it's my paycheck"
- "Digging through the video archive"
- "Hunting for viral patterns"
- "Going deeper than YouTube drama"

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
