// TypeScript types for YouTube Marketing Analysis

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
    signature: string;
}

export interface AdStrategy {
    overview: string;
    ad_angles: string[];
    ad_creatives: any;
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

export interface ContentPillar {
    pillar: string;
    purpose: string;
    description: string;
}

export interface TopContentAnalysis {
    best_performing: {
        overview: string;
        reasons_for_success: string;
    };
    worst_performing: {
        overview: string;
        reasons_for_failure: string;
    };
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

export interface StrategyAnalysis {
    brand_identity: BrandIdentity;
    content_pillars: ContentPillar[];
    content_focus: ContentFocus;
    hashtag_strategy: string;
    top_content_analysis: TopContentAnalysis;
    content_structure_analysis: ContentStructureAnalysis;
}

export interface QuantitativeSynthesis {
    summary_stats: {
        total_posts: number;
        total_views: number;
        total_likes: number;
        total_shares: number;
        total_saves: number;
        total_photos: number;
        total_videos: number;
    };
    channel_health: {
        follower_count: string;
        posting_frequency: string;
        er_rate: string;
    };
    channel_metrics: {
        video_count: number;
        follower_count: number;
        following_count: number;
        heart_count: number;
    };
    content_performance: {
        avg_view: string;
        viral_score: string;
        value_score: string;
        ad_ratio: string;
    };
}

export interface VideoIdea {
    title: string;
    concept: string;
}

export interface ActionableInsights {
    learn_from: string;
    avoid: string;
    video_ideas: VideoIdea[];
}

export interface MarketingReport {
    report_id: string;
    job_id: string;
    brand_name: string;
    report_part_1: {
        posts: Post[];
        channel_info: ChannelInfo;
    };
    report_part_2: {
        ad_strategy: AdStrategy;
        funnel_analysis: FunnelAnalysis;
        strategy_analysis: StrategyAnalysis;
        quantitative_synthesis: QuantitativeSynthesis;
    };
    report_part_3: {
        strengths: string[];
        executive_summary: string;
        actionable_insights: ActionableInsights;
        weaknesses_opportunities: string[];
    };
    created_at: string;
}

export interface AnalyzeRequest {
    channelUrl: string;
}

export interface AnalyzeResponse {
    success: boolean;
    data?: MarketingReport;
    error?: string;
    errorType?:
        | "MODEL_OVERLOAD"
        | "RATE_LIMIT"
        | "YOUTUBE_QUOTA"
        | "API_CONFIG"
        | "NETWORK_ERROR"
        | "AI_PARSE_ERROR"
        | "CHANNEL_NOT_FOUND"
        | "UNKNOWN";
}
