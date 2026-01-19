/**
 * Gemini AI Model Configuration
 */

import { GeminiModel, GeminiModelInfo } from "./types";

export const GEMINI_MODELS: GeminiModelInfo[] = [
    // Gemini 2.5 Series (Free + Paid)
    {
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash Lite",
        description: "Fastest and most cost-effective. Very low free tier limits.",
        descriptionVi: "Nhanh nhất và hiệu quả về chi phí. Giới hạn miễn phí rất thấp.",
        speed: "fastest",
        cost: "lowest",
        quality: "good",
        tier: "free",
        rpmFree: 2,
        rpmPaid: 10,
        rpdFree: 22,
        rpdPaid: 20000,
    },
    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Balanced speed and quality. Limited free tier (1 RPM).",
        descriptionVi: "Cân bằng giữa tốc độ và chất lượng. Giới hạn miễn phí (1 RPM).",
        speed: "fast",
        cost: "low",
        quality: "better",
        tier: "free",
        rpmFree: 1,
        rpmPaid: 5,
        rpdFree: 10,
        rpdPaid: 20000,
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
        rpmPaid: 5,
        rpdFree: undefined,
        rpdPaid: 20000,
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
        rpmPaid: 5,
        rpdFree: undefined,
        rpdPaid: undefined,
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
        rpmPaid: 5,
        rpdFree: undefined,
        rpdPaid: undefined,
    },
];

export const DEFAULT_MODEL: GeminiModel = "gemini-2.5-flash-lite";

export function getModelInfo(modelId: GeminiModel): GeminiModelInfo | undefined {
    return GEMINI_MODELS.find((m) => m.id === modelId);
}

export function getModelName(modelId: GeminiModel): string {
    const model = getModelInfo(modelId);
    return model ? model.name : modelId;
}
