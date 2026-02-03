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
        title: "{channelName}",
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
            // Additional keys for ContentStructureSection
            currentStats: "Current Channel Stats",
            postingFrequencyLabel: "POSTING FREQUENCY",
            mostActiveDays: "MOST ACTIVE DAYS",
            mostActiveTimes: "MOST ACTIVE TIMES",
            videosOverDays: "{count} videos over {days} days",
            recommendedSchedule: "Recommended Schedule",
            optimalFrequency: "OPTIMAL FREQUENCY",
            bestDaysToPost: "BEST DAYS TO POST",
            bestTimesToPost: "BEST TIMES TO POST",
            performanceOverview: "Content Performance Overview",
            strategicPurpose: "Strategic Purpose:",
            performanceInsight: "Performance Insight:",
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
        title: "Settings",
        aiModel: "AI Model",
        imageModel: "Image Model",
        language: "Language",
        footerNote: "API keys are stored locally in your browser.",
        validating: "Verifying...",
        invalid: "Invalid",
        apiKeyVerified: "API key verified",
        apiKeyInvalid: "API key invalid",
        // Badge states
        verifying: "verifying",
        notConfigured: "not configured",
        configured: "configured",
        free: "free",
        paid: "paid",
        // Database key
        databaseKey: "Database Key",
        databaseKeyPlaceholder: "Enter your database key...",
        databaseKeyHint: "Enter key for cloud sync, or leave empty for local-only",
        cloudStorage: "Cloud Storage",
        localStorage: "Local Storage",
        synced: "Synced",
        error: "ERROR",
    },

    loadingState: {
        retrying: "Retrying...",
        retryCount: "Retry {current}/{max} in {seconds}s...",
        maxRetriesReached:
            "Retried {max} times. Please try again in a few minutes.",
        retryNow: "Retry now",
        cancel: "Cancel",
        dismiss: "Dismiss",
    },

    history: {
        title: "Analysis History",
        savedReports: "Saved Reports",
        noReports: "No reports",
        latest: "Latest",
        clearAll: "Clear all",
        confirmDelete: "Confirm delete",
        cancelAction: "Cancel",
        viewReport: "View report",
        deleteReport: "Delete",
    },

    errorBoundary: {
        title: "An error occurred",
        description:
            "The app encountered an unexpected error. Please try again.",
        details: "Error details (Development)",
        retry: "Retry",
        reload: "Reload page",
    },

    timeAgo: {
        yearsAgo: "{n} year(s) ago",
        monthsAgo: "{n} month(s) ago",
        daysAgo: "{n} day(s) ago",
        hoursAgo: "{n} hour(s) ago",
        minutesAgo: "{n} minute(s) ago",
        secondsAgo: "{n} second(s) ago",
    },

    dataTab: {
        videoPerformance: "Video Performance",
        loadingChart: "Loading chart...",
        postFallback: "Post {n}",
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
        back: "Back",
        analyze: "Analyze",
        skipToContent: "Skip to content",
        notAvailable: "N/A",
    },

    veo: {
        title: "VEO - Workflow",
        subtitle:
            "Analyze YouTube videos and generate scenes for video generation",

        form: {
            placeholder: "Paste YouTube video link...",
            scriptPlaceholder:
                "Paste your script text here or upload a file...",
            submitButton: "Generate Scenes",
            submitButtonLoading: "Processing...",
            uploadScript: "Upload File",
            generateScenes: "Generate Scenes",
            generateFromUrl: "Generate from URL",
            extractScript: "Extract Script",
            processing: "Processing...",
            duration: "Video Duration",
            durationAuto: "Entire Video",
            durationCustom: "Custom Range",
            durationAutoHint: "AI will analyze the entire video automatically",
            durationCustomHint:
                "Specify start and end time for a specific segment",
            from: "From",
            to: "To",
            noApiKey: "Configure your Gemini API key in Settings to use VEO",
            usingModel: "Using model",
            errors: {
                emptyUrl: "Please enter a YouTube video link",
                invalidUrl:
                    "Invalid YouTube link. Please enter a video link (e.g., youtube.com/watch?v=xxx)",
                apiKeyRequired:
                    "Gemini API key is required to use this feature",
                emptyScript: "Please enter or upload a script",
                invalidFileType:
                    "Invalid file type. Please upload a .txt or .json file",
                cannotReadFile: "Cannot read file. Please try again.",
            },
        },

        workflow: {
            urlToScenes: "Full Pipeline",
            urlToScenesDesc: "URL to Script to Scenes (all-in-one)",
            urlToScript: "URL to Script",
            urlToScriptDesc: "Extract script from video",
            scriptToScenes: "Script to Scenes",
            scriptToScenesDesc: "Generate scenes from script",
            urlHint:
                "Enter a YouTube URL to extract the script/transcript from the video",
            urlToScenesHint:
                "Enter a YouTube URL to extract script and generate scenes automatically",
            scriptHint:
                "Paste your script or upload a text file to generate visual scenes",
        },

        script: {
            title: "Generated Script",
            newScript: "New Script",
            videoTitle: "Video Title",
            duration: "Duration",
            language: "Language",
            characters: "Characters",
            noCharacters: "No characters identified",
            summary: "Summary",
            transcript: "Transcript",
            copy: "Copy",
            download: "Download",
            nextStepHint:
                "Copy the script and use Step 2 to generate visual scenes from it",
        },

        modes: {
            title: "Processing Mode",
            direct: "Direct",
            directDesc: "Video → Scenes (faster, no script)",
            hybrid: "Hybrid",
            hybridDesc:
                "Video → Script → Scenes (script cached, can regenerate)",
        },

        settings: {
            title: "Settings",
            // Section titles
            generationTitle: "Generation",
            outputTitle: "Output",
            audioTitle: "Audio",
            analysisTitle: "Analysis",
            shotTypeTitle: "Shot Type",
            contentTitle: "Content Analysis",
            qualityTitle: "Quality & Filtering",
            // Settings
            sceneCount: "Scene Count",
            sceneCountDesc: "Target number of scenes to generate",
            sceneCountAutoDesc:
                "Auto-calculated based on video duration (~8s/scene)",
            gemini: "AI",
            geminiDesc: "Let Gemini analyze content and decide scene count based on visual transitions",
            auto: "Auto",
            manual: "Manual",
            batchSize: "Batch Size",
            batchSizeDesc: "Scenes per batch (hybrid mode only)",
            voice: "Voice",
            voiceDesc: "Narration language for video",
            dialogueLanguageDesc: "Language for voice narration and dialogue",
            audioMusic: "Music",
            audioMusicDesc: "Background music (mood, genre, tempo)",
            audioSFX: "SFX",
            audioSFXDesc: "Sound effects synchronized to actions",
            audioAmbient: "Ambient",
            audioAmbientDesc: "Environmental sounds (room tone, atmosphere)",
            voiceOptions: {
                "no-voice": "No voice (silent)",
                english: "English",
                vietnamese: "Vietnamese",
                spanish: "Spanish",
                french: "French",
                german: "German",
                japanese: "Japanese",
                korean: "Korean",
                chinese: "Chinese",
            },
            useVideoTitle: "Video Title",
            useVideoTitleDesc:
                "Include the video title for context about the video's topic and purpose",
            useVideoDescription: "Video Description",
            useVideoDescriptionDesc:
                "Include the full description text for additional context about the video content",
            useVideoChapters: "Description Chapters",
            useVideoChaptersDesc:
                "Use chapter timestamps from video description to structure transcript segments",
            useVideoCaptions: "On-Screen Captions",
            useVideoCaptionsDesc:
                "Extract on-screen text, subtitles, and captions visible in the video frames",
            negativePrompt: "Negative Prompt",
            negativePromptPlaceholder:
                "Enter unwanted elements (comma-separated)",
            negativePromptDesc:
                "Elements to exclude from generation (text overlays, quality issues, continuity problems). Edit to customize (max 500 characters)",
            extractColorProfile: "Extract Color Profile",
            extractColorProfileDesc:
                "Analyze video to extract exact color palette, temperature, contrast, and film stock characteristics (Phase 0)",
            mediaType: "Output Type",
            imageMode: "Image",
            videoMode: "Video",
            imageModeHint:
                "Optimized for Midjourney, DALL-E, Flux (still images)",
            videoModeHint:
                "Optimized for VEO, Sora, Runway Gen-3 (motion video)",
            // VEO 3 Advanced Features
            veo3Title: "VEO 3 Advanced Features",
            veo3Audio: "Audio System",
            veo3AudioDesc:
                "Generate environmental audio, music, and sound effects with hallucination prevention",
            veo3Dialogue: "Dialogue System",
            veo3DialogueDesc:
                "Use colon format for dialogue (prevents subtitles, 8-second rule)",
            veo3Camera: "Camera Positioning",
            veo3CameraDesc:
                "Use '(thats where the camera is)' syntax for precise positioning",
            veo3Expression: "Expression Control",
            veo3ExpressionDesc:
                "Anti-model-face technique with micro-expressions and emotional arcs",
            veo3Selfie: "Selfie/POV Mode",
            veo3SelfieDesc:
                "Generate authentic selfie-style footage with visible arm and film-like quality",
            veo3Composition: "Advanced Composition",
            veo3CompositionDesc:
                "Lens effects, color grading, and professional lighting setups",
            veo3ColorPalette: "Color Palette",
            veo3ColorAuto: "Auto (from video)",
            veo3ColorTealOrange: "Teal-Orange (Hollywood)",
            veo3ColorWarm: "Warm Orange",
            veo3ColorCool: "Cool Blue",
            veo3ColorDesaturated: "Desaturated",
            veo3ColorVibrant: "Vibrant",
            veo3ColorPastel: "Pastel",
            veo3ColorNoir: "Noir (B&W)",
            veo3Lighting: "Lighting Setup",
            veo3LightingAuto: "Auto (from video)",
            veo3LightingThreePoint: "Three-Point",
            veo3LightingRembrandt: "Rembrandt",
            veo3LightingGoldenHour: "Golden Hour",
            veo3LightingBlueHour: "Blue Hour",
            veo3LightingChiaroscuro: "Chiaroscuro",
            veo3LightingNeon: "Neon",
            veo3LightingNatural: "Natural",
        },

        loading: {
            title: "Generating scenes...",
            steps: {
                validating: "Validating URL...",
                initializing: "Initializing...",
                processing: "Processing video...",
                generating: "Generating scenes...",
                parsing: "Parsing results...",
                complete: "Complete!",
            },
            batchProgress: "Batch {current}/{total}",
            scenesGenerated: "{count} scenes generated",
            estimatedTime: "Estimated time: {time}",
            showScript: "Show",
            hideScript: "Hide",
        },

        result: {
            title: "Results",
            summary: "Summary",
            scenes: "Scenes",
            characters: "Characters",
            color: "Color",
            download: "Download",
            jobFailed: "Job failed",
            jobPartial: "Job partially completed",
            retryJob: "Retry from last batch",

            summaryStats: {
                totalScenes: "Total Scenes",
                characters: "Characters",
                mode: "Mode",
                voice: "Voice",
                processingTime: "Processing Time",
            },

            sceneCard: {
                description: "Description",
                object: "Object",
                character: "Character",
                style: "Style",
                visualSpecs: "Visual Specs",
                lighting: "Lighting",
                composition: "Composition",
                technical: "Technical",
                prompt: "Prompt",
                copyPrompt: "Copy Prompt",
                copied: "Copied!",
                // Additional keys for VeoSceneCard
                expand: "Expand",
                collapse: "Collapse",
                primarySubject: "Primary Subject",
                environment: "Environment",
                keyDetails: "Key Details",
                mood: "Mood",
                source: "Source",
                shadows: "Shadows",
                angle: "Angle",
                framing: "Framing",
                focus: "Focus",
                // Video-specific fields
                duration: "Duration",
                cameraMovement: "Camera Movement",
                subjectMotion: "Subject Motion",
                transitions: "Transitions",
                audioCues: "Audio Cues",
                // VEO 3 fields
                audio: "Audio",
                audioAmbient: "Ambient",
                audioMusic: "Music",
                audioSFX: "Sound FX",
                audioNegations: "Prevent",
                dialogue: "Dialogue",
                cameraPosition: "Camera Position",
                expression: "Expression",
                emotionalArc: "Emotional Arc",
                advancedComposition: "Advanced Composition",
                shotSize: "Shot Size",
                movementQuality: "Movement",
                qualityScore: "Quality Score",
            },

            characterCard: {
                appearances: "Appearances",
                description: "Full Description",
                noCharacters: "No characters detected in this video",
            },

            colorProfile: {
                title: "Cinematic Color Profile",
                confidence: "confidence",
                dominantColors: "Dominant Colors",
                temperature: "Color Temperature",
                contrast: "Contrast",
                filmStock: "Film Stock",
                shadowsHighlights: "Shadows & Highlights",
                mood: "Mood & Atmosphere",
                grain: "Film Grain",
                postProcessing: "Post-Processing",
                colorPsychology: "Color Psychology",
                technicalReference: "Technical Reference",
                moodTags: "Mood Tags",
                matchConfidence: "Match Confidence",
            },

            downloadOptions: {
                title: "Download",
                scenesJson: "All Scenes (JSON)",
                scenesTxt: "All Scenes (TXT)",
                script: "Script (JSON)",
                characters: "Characters (JSON)",
                // Description keys
                scenesJsonDesc: "{count} scenes with all metadata",
                scenesTxtDesc: "{count} scenes, JSON separated by blank lines",
                scriptDesc: "Video transcript and script data",
                charactersDesc: "{count} characters with all variations",
            },
        },

        history: {
            title: "History",
            noJobs: "No jobs yet",
            searchPlaceholder: "Search by video ID or job ID...",
            viewResult: "View Result",
            deleteJob: "Delete",
            clearAll: "Clear All",
            confirmDelete: "Confirm Delete",
            cancelAction: "Cancel",
            scriptCached: "Script cached",
            regenerate: "Regenerate",
            retryFromBatch: "Retry from failed batch",
            // Sort options
            sortJobs: "Sort jobs",
            sortNewest: "Newest first",
            sortOldest: "Oldest first",
            sortStatus: "Status",
            sortMostScenes: "Most scenes",
            sortLeastScenes: "Least scenes",
            // Status labels
            statusCompleted: "Completed",
            statusPartial: "Partial",
            statusFailed: "Failed",
            generationFailed: "Generation failed",
            failedAtBatch: "Failed at batch {current}/{total}",
            retryable: "Retryable",
            cancelled: "Cancelled",
            jobCancelled: "Job cancelled by user",
            // Show more/less
            showMore: "Show more",
            showLess: "Show less",
            // Storage indicator
            cloudStorage: "Cloud",
            localStorage: "Local",
            both: "Both",
            syncToCloud: "Sync",
            syncing: "Syncing...",
            syncSuccess: "Synced to cloud",
            syncFailed: "Sync failed",
        },

        leftToRetry: "left to retry",
        expired: "Expired",
        jobExpiredCannotRetry: "This job has expired and cannot be retried.",

        resume: {
            title: "Incomplete Job Found",
            message:
                "Previous job was interrupted at batch {batch}/{total}. Would you like to continue?",
            continueButton: "Continue",
            startNew: "Start New",
        },

        errors: {
            INVALID_URL: "Invalid video URL",
            GEMINI_API_ERROR: "Gemini API error",
            GEMINI_QUOTA: "Gemini API quota exceeded",
            GEMINI_RATE_LIMIT: "Rate limit exceeded. Please try again later.",
            NETWORK_ERROR: "Network connection error",
            PARSE_ERROR: "Failed to parse AI response",
            TIMEOUT: "Request timed out",
            UNKNOWN_ERROR: "An error occurred. Please try again.",
        },
    },
} as const;

export type EnLanguage = typeof en;
