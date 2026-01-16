export const en = {
    metadata: {
        title: "'Soi' Brand",
        description:
            "Professional YouTube marketing strategy analysis tool, using AI to generate detailed reports about your YouTube channel.",
        keywords:
            "OurTube, YouTube, marketing, analysis, AI, strategy, insights",
    },

    home: {
        title: "'Soi' Brand",
    },

    form: {
        placeholder: "Paste YouTube channel link...",
        submitButton: "Analyze Now",
        submitButtonLoading: "Processing...",
        uploadButtonTitle: "Upload existing JSON report",
        errors: {
            emptyUrl: "Please enter a YouTube channel link",
            invalidUrl:
                "Invalid YouTube link. Please enter a channel link (e.g., youtube.com/@username)",
            invalidJson: "Invalid JSON report format.",
            cannotReadJson: "Cannot read JSON file. Please check and try again.",
            analysisError: "An error occurred during analysis",
            networkError:
                "Cannot connect to server. Please check your internet connection and try again.",
            unknownError: "An error occurred during analysis. Please try again later.",
        },
    },

    loading: {
        title: "Analyzing YouTube channel...",
        steps: {
            validating: "Validating URL...",
            fetchingChannel: "Fetching channel information",
            fetchingVideos: "Retrieving videos",
            analyzingContent: "Analyzing content",
            generatingReport: "Generating AI report",
        },
        note: "This process may take 30-60 seconds...",
    },

    sidebar: {
        backButton: "Analyze another channel",
        title: "Report",
        tabs: {
            data: "Data",
            analysis: "Analysis",
            evaluation: "Evaluation",
        },
        downloadBox: {
            text: "This report was analyzed using advanced AI models.",
            button: "Download Report",
        },
    },

    report: {
        headers: {
            data: "Data",
            analysis: "Analysis",
            evaluation: "Evaluation",
        },
        description:
            "Raw YouTube data from {brandName} channel with recent posts.",
    },

    channel: {
        sectionTitle: "Channel",
        createdDate: "Channel created:",
        notUpdated: "Not available",
        stats: {
            videos: "Videos",
            views: "Views",
            subs: "Subs",
            likes: "Likes",
        },
    },

    heatmap: {
        title: "Posting Frequency (Last 30 days)",
        videoCount: "{count} video(s)",
    },

    posts: {
        sectionTitle: "Channel Content",
        postNumber: "Post {number}",
        viewCount: "Views:",
        likeCount: "Likes:",
        commentCount: "Comments:",
        publishDate: "Published:",
        seoTags: "SEO Tags",
        copyTags: "Copy Tags",
        copied: "Copied!",
        description: "Video Description",
        noDescription: "No description",
        videoUrl: "Video URL",
        openLink: "Open Link",
    },

    analysis: {
        strategyTitle: "Strategy Analysis",
        brandIdentity: {
            title: "Brand Identity",
            style: "Style:",
            tone: "Tone:",
            positioning: "Positioning:",
        },
        contentFocus: {
            title: "Content Focus",
            noData: "No data available",
        },
        adStrategy: {
            title: "Ad Strategy",
        },
        funnelAnalysis: {
            title: "Marketing Funnel Analysis",
            tofu: "Top of Funnel - Awareness",
            mofu: "Middle of Funnel - Consideration",
            bofu: "Bottom of Funnel - Conversion",
        },
        quantitativeSynthesis: {
            title: "Quantitative Synthesis",
            summaryStats: {
                title: "Summary Statistics",
                totalViews: "Total Views:",
                totalLikes: "Total Likes:",
                totalVideos: "Total Videos:",
            },
            channelHealth: {
                title: "Channel Engagement",
                followerCount: "Subscribers:",
                postingFrequency: "Posting Frequency:",
                erRate: "Engagement Rate (ER):",
                erTooltip:
                    "(Total Likes + Total Comments) / Total Views x 100%",
            },
            channelMetrics: {
                title: "Channel Metrics",
                videoCount: "Video Count:",
                followerCount: "Followers:",
                followingCount: "Following:",
                heartCount: "Total Likes:",
            },
            contentPerformance: {
                title: "Content Performance",
                avgView: "Avg Views:",
                avgViewTooltip: "Total Views / Number of Videos",
                viralScore: "Viral Score:",
                valueScore: "Value Score:",
                adRatio: "Ad Ratio:",
            },
        },
        contentPillars: {
            title: "Content Pillars",
        },
        audiencePersonas: {
            title: "Audience Personas",
            demographics: "Demographics:",
            interests: "Interests:",
            painPoints: "Pain Points:",
            contentPreferences: "Content Preferences:",
        },
        contentCalendar: {
            title: "Content Calendar Insights",
            bestDays: "Best Posting Days:",
            bestTimes: "Best Posting Times:",
            recommendedFrequency: "Recommended Frequency:",
        },
        growthOpportunities: {
            title: "Growth Opportunities",
        },
    },

    evaluation: {
        overallTitle: "Overall Evaluation",
        executiveSummary: "Executive Summary",
        strengths: {
            title: "Strengths",
        },
        weaknesses: {
            title: "Weaknesses & Opportunities",
        },
        insights: {
            title: "Actionable Insights",
        },
        videoIdeas: {
            title: "Video Ideas",
            estimatedPerformance: "Est. Performance:",
        },
    },

    language: {
        selector: "Language",
        vietnamese: "Vietnamese",
        english: "English",
    },
} as const;

export type EnLanguage = typeof en;
