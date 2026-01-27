// Zod schemas for API request/response validation
import { z } from "zod";

// Valid Gemini model IDs (matching GeminiModel type in types.ts)
const VALID_GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
] as const;

// Request validation schema for /api/analyze
export const AnalyzeRequestSchema = z.object({
    channelUrl: z.string().min(1, "Channel URL is required"),
    youtubeApiKey: z.string().optional(),
    geminiApiKey: z.string().optional(),
    geminiModel: z.enum(VALID_GEMINI_MODELS).optional(),
    apiKeyTier: z.enum(["free", "paid"]).optional(),
    language: z.enum(["vi", "en"]).optional().default("vi"),
});

export type ValidatedAnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// Report Part 2 schemas
const AdCreativeSchema = z.object({
    type: z.string(),
    description: z.string(),
    hook: z.string(),
}).passthrough();

const AdStrategySchema = z.object({
    overview: z.string(),
    ad_angles: z.array(z.string()),
    ad_creatives: z.array(AdCreativeSchema).nullable(),
    target_audience_clues: z.string(),
}).passthrough();

const FunnelAnalysisSchema = z.object({
    tofu: z.string(),
    mofu: z.string(),
    bofu: z.string(),
}).passthrough();

const BrandIdentitySchema = z.object({
    visual_style: z.string(),
    tone_of_voice: z.string(),
    brand_positioning: z.string(),
}).passthrough();

const ContentStructureAnalysisSchema = z.object({
    hook_tactics: z.string(),
    storytelling: z.string(),
    cta_strategy: z.string(),
    emotional_triggers: z.string(),
}).passthrough();

const ContentFocusSchema = z.object({
    overview: z.string(),
    topics: z.array(z.string()),
}).passthrough();

const StrategyAnalysisSchema = z.object({
    brand_identity: BrandIdentitySchema,
    content_focus: ContentFocusSchema,
    content_structure_analysis: ContentStructureAnalysisSchema,
}).passthrough();

export const ReportPart2Schema = z.object({
    ad_strategy: AdStrategySchema,
    funnel_analysis: FunnelAnalysisSchema,
    strategy_analysis: StrategyAnalysisSchema,
}).passthrough();

// Report Part 3 schemas
const VideoIdeaSchema = z.object({
    title: z.string(),
    concept: z.string(),
    estimated_views: z.string().optional(),
    content_type: z.string().optional(),
}).passthrough();

const ActionableInsightsSchema = z.object({
    learn_from: z.string(),
    avoid: z.string(),
    video_ideas: z.array(VideoIdeaSchema),
}).passthrough();

export const ReportPart3Schema = z.object({
    strengths: z.array(z.string()),
    executive_summary: z.string(),
    actionable_insights: ActionableInsightsSchema,
    weaknesses_opportunities: z.array(z.string()),
}).passthrough();

// Full AI response schema
export const AIResponseSchema = z.object({
    report_part_2: ReportPart2Schema,
    report_part_3: ReportPart3Schema,
}).passthrough();

export type AIResponse = z.infer<typeof AIResponseSchema>;

/**
 * Validate AI response against schema
 * Returns validated data or throws with detailed error message
 */
export function validateAIResponseSchema(data: unknown): AIResponse {
    const result = AIResponseSchema.safeParse(data);

    if (!result.success) {
        const errors = result.error.issues.map((issue) =>
            `${issue.path.join(".")}: ${issue.message}`
        ).join("; ");
        throw new Error(`AI response validation failed: ${errors}`);
    }

    return result.data;
}
