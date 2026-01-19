// TypeScript types for YouTube Marketing Analysis

// AI Model Types
export type GeminiModel =
    | "gemini-2.5-flash-lite"
    | "gemini-2.5-flash"
    | "gemini-2.5-pro"
    | "gemini-3-flash-preview"
    | "gemini-3-pro-preview";

export interface GeminiModelInfo {
    id: GeminiModel;
    name: string;
    description: string;
    descriptionVi: string;
    speed: "fastest" | "fast" | "balanced" | "slow";
    cost: "lowest" | "low" | "medium" | "high";
    quality: "good" | "better" | "best";
    tier: "free" | "paid";
    rpmFree?: number; // Requests per minute (free tier)
    rpmPaid?: number; // Requests per minute (paid tier)
    rpdFree?: number; // Requests per day (free tier)
    rpdPaid?: number; // Requests per day (paid tier)
}

// API Quota Usage Types
export interface ApiQuotaUsage {
    youtube: {
        used: number; // Units used today
        total: number; // 10,000 daily quota
        lastReset: string; // ISO timestamp
    };
    gemini: {
        requestsUsed: number; // Requests in current minute
        requestsTotal: number; // RPM limit (model-specific)
        requestsUsedDaily?: number; // Requests today (optional for backward compatibility)
        requestsTotalDaily?: number; // RPD limit (model-specific)
        lastReset: string; // ISO timestamp (for RPM)
        lastResetDaily?: string; // ISO timestamp (for RPD)
        model?: GeminiModel; // Currently selected model
        tier?: "free" | "paid"; // API key tier
    };
    lastUpdated: string;
}

export interface YouTubeChannel {
    id: string;
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
    };
    statistics: {
        viewCount: string;
        subscriberCount: string;
        videoCount: string;
    };
}

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
        maxres?: { url: string };
    };
    statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
    };
    tags?: string[];
    contentDetails: {
        duration: string;
    };
}

export interface Post {
    url: string;
    desc: string;
    is_ad: boolean;
    title: string;
    gallery: string[];
    post_id: string;
    is_pinned: boolean;
    post_type: string;
    thumbnail: string;
    created_at: string;
    statistics: {
        digg_count: number;
        play_count: number;
        share_count: number;
        collect_count: number;
        comment_count: number;
    };
    transcript: string;
    tags: string[];
    raw_content_for_ai: string | null;
    published_at: string;
    duration: string;
}

export interface ChannelInfo {
    stats: {
        heartCount: number;
        videoCount: number;
        followerCount: number;
        followingCount: number;
        viewCount: number;
    };
    avatar: string;
    bioLink: string;
    nickname: string;
    uniqueId: string;
    channelId: string;
    signature: string;
    joinedAt?: string;
}

export interface AdCreative {
    type: string;
    description: string;
    hook: string;
}

export interface AdStrategy {
    overview: string;
    ad_angles: string[];
    ad_creatives: AdCreative[] | null;
    target_audience_clues: string;
}

export interface FunnelAnalysis {
    tofu: string;
    mofu: string;
    bofu: string;
}

export interface BrandIdentity {
    visual_style: string;
    tone_of_voice: string;
    brand_positioning: string;
}

export interface ContentStructureAnalysis {
    hook_tactics: string;
    storytelling: string;
    cta_strategy: string;
    emotional_triggers: string;
}

export interface ContentFocus {
    overview: string;
    topics: string[];
}

export interface ContentNicheAnalysis {
    primary_niche: string;
    sub_niches: string[];
    content_categories: {
        category: string;
        percentage: number;
        description: string;
    }[];
    niche_positioning: string;
    competitor_landscape: string;
    content_uniqueness: string;
}

export interface AudienceDemographics {
    age_distribution: {
        range: string;
        percentage: number;
    }[];
    gender_split: {
        male: number;
        female: number;
        other: number;
    };
    top_countries: {
        country: string;
        percentage: number;
    }[];
    primary_languages: string[];
}

export interface AudienceBehavior {
    estimated_watch_time: string;
    returning_vs_new_ratio: string;
    subscriber_growth_trend: string;
    peak_viewing_days: string[];
    peak_viewing_hours: string[];
    engagement_patterns: string;
    device_preferences: string;
}

export interface AudienceAnalysis {
    demographics: AudienceDemographics;
    behavior: AudienceBehavior;
    psychographics: {
        values: string[];
        lifestyle: string;
        purchase_behavior: string;
    };
}

export interface StrategyAnalysis {
    brand_identity: BrandIdentity;
    content_focus: ContentFocus;
    content_structure_analysis: ContentStructureAnalysis;
}


export interface VideoIdea {
    title: string;
    concept: string;
    estimated_views?: string;
    content_type?: string;
}

export interface AudiencePersona {
    name: string;
    avatar_description: string;
    demographics: string;
    age_range: string;
    gender: string;
    location: string;
    occupation: string;
    interests: string[];
    pain_points: string[];
    goals: string[];
    content_preferences: string;
    preferred_video_length: string;
    viewing_frequency: string;
    social_platforms: string[];
    buying_triggers: string[];
}

export interface ContentCalendar {
    best_posting_days: string[];
    best_posting_times: string[];
    recommended_frequency: string;
    best_performing_overview: string;
    worst_performing_overview: string;
    content_mix: {
        content_type: string;
        pillar_purpose: string;
        specific_topics: string[];
        percentage: number;
        example_videos?: string[];
        performance_insight: string;
    }[];
}

export interface GrowthOpportunity {
    opportunity: string;
    description: string;
    priority: "high" | "medium" | "low";
    expected_impact: string;
}

export interface KeywordStrategy {
    top_keywords: string[];
    keyword_density: string;
    missing_keywords: string[];
}

export interface TagAnalysis {
    tag_coverage: string;
    all_channel_tags: string[];
    recommended_tags: string[];
    tag_consistency: string;
    most_used_tags: {
        tag: string;
        frequency: number;
        performance_impact: string;
    }[];
    tag_categories: {
        category: string;
        purpose: string;
        tags: string[];
        effectiveness: string;
    }[];
    competitor_tags: string[];
    long_tail_opportunities: string[];
    tag_optimization_score: string;
}

export interface OptimizationOpportunity {
    area: string;
    issue: string;
    recommendation: string;
    priority: "high" | "medium" | "low";
}

export interface SEOAnalysis {
    keyword_strategy: KeywordStrategy;
    tag_analysis: TagAnalysis;
    optimization_opportunities: OptimizationOpportunity[];
}

export interface ActionableInsights {
    learn_from: string;
    avoid: string;
    video_ideas: VideoIdea[];
}

export interface ActionPlanTask {
    action: string;
    priority: "high" | "medium" | "low";
    expected_impact: string;
    resources_needed: string;
}

export interface ActionPlan {
    phase_30_days: ActionPlanTask[];
    phase_60_days: ActionPlanTask[];
    phase_90_days: ActionPlanTask[];
}

export interface ReportPart1 {
    posts: Post[];
    channel_info: ChannelInfo;
}

export interface ReportPart2 {
    ad_strategy: AdStrategy;
    funnel_analysis: FunnelAnalysis;
    strategy_analysis: StrategyAnalysis;
    // New enhanced fields (optional for backward compatibility)
    content_niche_analysis?: ContentNicheAnalysis;
    audience_analysis?: AudienceAnalysis;
    audience_personas?: AudiencePersona[];
    content_calendar?: ContentCalendar;
    growth_opportunities?: GrowthOpportunity[];
    seo_analysis?: SEOAnalysis;
}

export interface ReportPart3 {
    strengths: string[];
    executive_summary: string;
    actionable_insights: ActionableInsights;
    weaknesses_opportunities: string[];
    action_plan?: ActionPlan;
}

export interface MarketingReport {
    report_id: string;
    job_id: string;
    brand_name: string;
    report_part_1: ReportPart1;
    report_part_2: ReportPart2;
    report_part_3: ReportPart3;
    created_at: string;
}

export interface AnalyzeRequest {
    channelUrl: string;
    youtubeApiKey?: string;
    geminiApiKey?: string;
    geminiModel?: GeminiModel;
    language?: "vi" | "en";
}

export interface AnalyzeResponse {
    success: boolean;
    data?: MarketingReport;
    error?: string;
    errorType?:
        | "MODEL_OVERLOAD"
        | "RATE_LIMIT"
        | "YOUTUBE_QUOTA"
        | "GEMINI_QUOTA"
        | "API_CONFIG"
        | "YOUTUBE_API_ERROR"
        | "GEMINI_API_ERROR"
        | "NETWORK_ERROR"
        | "AI_PARSE_ERROR"
        | "CHANNEL_NOT_FOUND"
        | "UNKNOWN";
}

// Custom error class for API errors with type information
export class APIError extends Error {
    constructor(
        message: string,
        public errorType: AnalyzeResponse["errorType"],
        public statusCode?: number
    ) {
        super(message);
        this.name = "APIError";
    }
}
