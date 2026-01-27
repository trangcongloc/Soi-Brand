/**
 * Gemini AI Model Configuration
 */

import { GeminiModel, GeminiModelInfo } from "./types";

export const GEMINI_MODELS: GeminiModelInfo[] = [
    // Gemini 2.5 Series (Free + Paid)
    {
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash Lite",
        description: "Fastest and most cost-effective. Higher free tier limits.",
        descriptionVi: "Nhanh nhất và hiệu quả về chi phí. Giới hạn miễn phí cao hơn.",
        speed: "fastest",
        cost: "lowest",
        quality: "good",
        tier: "free",
        rpmFree: 10,
        rpmPaid: 4000,
        rpdFree: 20,
        rpdPaid: undefined,
    },
    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Balanced speed and quality. Free tier (5 RPM).",
        descriptionVi: "Cân bằng giữa tốc độ và chất lượng. Giới hạn miễn phí (5 RPM).",
        speed: "fast",
        cost: "low",
        quality: "better",
        tier: "free",
        rpmFree: 5,
        rpmPaid: 1000,
        rpdFree: 20,
        rpdPaid: 10000,
    },
    {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Advanced reasoning. Paid tier only.",
        descriptionVi: "Suy luận nâng cao. Chỉ dành cho gói trả phí.",
        speed: "balanced",
        cost: "high",
        quality: "best",
        tier: "paid",
        rpmFree: undefined,
        rpmPaid: 150,
        rpdFree: undefined,
        rpdPaid: 10000,
    },
    // Gemini 3 Series (Paid Preview)
    {
        id: "gemini-3-flash-preview",
        name: "Gemini 3 Flash",
        description: "Latest generation. Paid tier only.",
        descriptionVi: "Thế hệ mới nhất. Chỉ dành cho gói trả phí.",
        speed: "fast",
        cost: "medium",
        quality: "best",
        tier: "paid",
        rpmFree: undefined,
        rpmPaid: 1000,
        rpdFree: undefined,
        rpdPaid: 10000,
    },
    {
        id: "gemini-3-pro-preview",
        name: "Gemini 3 Pro",
        description: "Most intelligent model. Paid tier only.",
        descriptionVi: "Mô hình thông minh nhất. Chỉ dành cho gói trả phí.",
        speed: "slow",
        cost: "high",
        quality: "best",
        tier: "paid",
        rpmFree: undefined,
        rpmPaid: 25,
        rpdFree: undefined,
        rpdPaid: 250,
    },
];

export const DEFAULT_MODEL: GeminiModel = "gemini-2.5-flash-lite";

export function getModelInfo(modelId: GeminiModel): GeminiModelInfo | undefined {
    return GEMINI_MODELS.find((m) => m.id === modelId);
}
