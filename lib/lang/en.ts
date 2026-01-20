export const en = {
    metadata: {
        title: "Soi'Brand",
        description:
            "Professional YouTube marketing strategy analysis tool, using AI to generate detailed reports about your YouTube channel.",
        keywords:
            "Soi'Brand, YouTube, marketing, analysis, AI, strategy, insights",
    },

    home: {
        title: "Soi'Brand",
    },

    common: {
        days: {
            0: "Sunday",
            1: "Monday",
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday",
        },
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
            cannotReadJson:
                "Cannot read JSON file. Please check and try again.",
            analysisError: "An error occurred during analysis",
            networkError:
                "Cannot connect to server. Please check your internet connection and try again.",
            unknownError:
                "An error occurred during analysis. Please try again later.",
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
        title: "{channelName}'s Report",
        tabs: {
            data: "Data",
            analysis: "Analysis",
            evaluation: "Evaluation",
        },
        sections: {
            label: "Navigate",
            data: {
                channel: "Channel",
                performance: "Video Performance",
                content: "Channel Content",
            },
            analysis: {
                strategy: "Strategy Analysis",
                contentStructure: "Content Structure",
                funnel: "Marketing Funnel",
                audience: "Audience Analysis",
                personas: "Audience Personas",
                seo: "SEO Analysis",
                growth: "Growth Opportunities",
            },
            evaluation: {
                overall: "Overall Evaluation",
                insights: "Actionable Insights",
                videoIdeas: "Video Ideas",
                actionPlan: "Action Plan",
            },
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
            "Analysis report for {brandName} channel - Created: {reportDate}",
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
        sortBy: "Sort by:",
        sortLatest: "Latest",
        sortRating: "Top Rated",
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
        contentNicheAnalysis: {
            title: "Niche & Category Analysis",
            primaryNiche: "Primary Niche:",
            subNiches: "Sub-niches:",
            contentCategories: "Content Categories",
            category: "Category",
            percentage: "Percentage",
            nichePositioning: "Niche Positioning:",
            competitorLandscape: "Competition:",
            contentUniqueness: "Unique Selling Point:",
        },
        audienceAnalysis: {
            title: "Audience Analysis",
            demographicsTitle: "Demographics (Estimated)",
            ageDistribution: "Age Distribution",
            genderSplit: "Gender Split",
            male: "Male",
            female: "Female",
            other: "Other",
            topCountries: "Top Countries",
            primaryLanguages: "Primary Languages:",
            behaviorTitle: "Audience Behavior",
            estimatedWatchTime: "Avg Watch Time:",
            returningVsNew: "Returning vs New:",
            subscriberGrowth: "Sub Growth:",
            peakViewingDays: "Peak Viewing Days:",
            peakViewingHours: "Peak Viewing Hours:",
            engagementPatterns: "Engagement Patterns:",
            devicePreferences: "Device Preferences:",
            psychographicsTitle: "Psychographics",
            values: "Values:",
            lifestyle: "Lifestyle:",
            purchaseBehavior: "Purchase Behavior:",
        },
        adStrategy: {
            title: "Ad Strategy",
            targetAudience: "Target Audience Clues:",
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
        hashtagStrategy: {
            title: "Hashtag Strategy",
        },
        topContentAnalysis: {
            title: "Top Content Analysis",
            bestPerforming: "Best Performing Content",
            overview: "Overview:",
            reasonsForSuccess: "Reasons for Success:",
            worstPerforming: "Worst Performing Content",
            reasonsForFailure: "Reasons for Low Performance:",
        },
        contentStructureAnalysis: {
            title: "Content Structure Analysis",
            hookTactics: "Hook Tactics:",
            storytelling: "Storytelling:",
            ctaStrategy: "Call-to-Action Strategy:",
            emotionalTriggers: "Emotional Triggers:",
        },
        audiencePersonas: {
            title: "Audience Segments",
            avatarDescription: "Overview:",
            demographics: "Demographics:",
            ageRange: "Age Range:",
            gender: "Gender:",
            location: "Location:",
            occupation: "Occupation:",
            interests: "Interests:",
            painPoints: "Pain Points:",
            goals: "Goals:",
            contentPreferences: "Content Preferences:",
            preferredVideoLength: "Preferred Video Length:",
            viewingFrequency: "Viewing Frequency:",
            socialPlatforms: "Platforms Used:",
            buyingTriggers: "Buying Triggers:",
        },
        contentCalendar: {
            title: "Content Calendar Insights",
            bestDays: "Best Posting Days:",
            bestTimes: "Best Posting Times:",
            recommendedFrequency: "Recommended Frequency:",
            contentMix: "Content Mix",
            contentType: "Content Type:",
            specificTopics: "Specific Topics:",
            exampleVideos: "Example Videos:",
        },
        growthOpportunities: {
            title: "Growth Opportunities",
        },
        seoAnalysis: {
            title: "SEO & Discoverability",
            keywordStrategy: "Keyword Strategy",
            topKeywords: "Top Keywords:",
            keywordDensity: "Keyword Density:",
            missingKeywords: "Missing Keywords:",
            tagAnalysis: "Tag Analysis",
            tagCoverage: "Tag Coverage:",
            topSeoTags: "Top SEO Tags from High-Performing Videos",
            allChannelTags: "All Channel Tags:",
            recommendedTags: "Recommended Tags:",
            tagConsistency: "Tag Consistency:",
            mostUsedTags: "Most Used Tags",
            tagFrequency: "Frequency:",
            performanceImpact: "Performance Impact:",
            tagCategories: "Tag Categories",
            categoryEffectiveness: "Effectiveness:",
            competitorTags: "Competitor Tags (Unused):",
            longTailOpportunities: "Long-tail Opportunities:",
            tagOptimizationScore: "Tag Optimization Score:",
            optimizationOpportunities: "Optimization Opportunities",
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
            learnFrom: "What's Working Well (Keep Doing)",
            avoid: "What to Avoid or Change",
        },
        videoIdeas: {
            title: "Video Ideas",
            estimatedPerformance: "Est. Performance:",
        },
        actionPlan: {
            title: "Action Plan (30/60/90 Days)",
            phase30: "30 Days",
            phase60: "60 Days",
            phase90: "90 Days",
            priority: "Priority:",
            priorityLevels: {
                high: "HIGH",
                medium: "MEDIUM",
                low: "LOW",
            },
            expectedImpact: "Expected Impact:",
            resourcesNeeded: "Resources Needed:",
        },
    },

    language: {
        selector: "Language",
        vietnamese: "Vietnamese",
        english: "English",
    },

    quota: {
        used: "used",
        checking: "checking...",
        noKey: "not configured",
    },

    settings: {
        validating: "Verifying...",
        valid: "Valid",
        invalid: "Invalid",
        apiKeyVerified: "API key verified",
        apiKeyInvalid: "API key invalid",
    },
} as const;

export type EnLanguage = typeof en;
