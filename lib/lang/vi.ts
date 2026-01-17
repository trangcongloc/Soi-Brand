export const vi = {
    metadata: {
        title: "'Soi' Brand",
        description:
            "Công cụ phân tích chiến lược marketing YouTube chuyên nghiệp, sử dụng AI để tạo báo cáo chi tiết về kênh YouTube của bạn.",
        keywords:
            "OurTube, YouTube, marketing, analysis, AI, phân tích, chiến lược",
    },

    home: {
        title: "'Soi' Brand",
    },

    common: {
        days: {
            0: "Chủ nhật",
            1: "Thứ 2",
            2: "Thứ 3",
            3: "Thứ 4",
            4: "Thứ 5",
            5: "Thứ 6",
            6: "Thứ 7",
        },
    },

    form: {
        placeholder: "Dán link kênh YouTube...",
        submitButton: "Phân tích ngay",
        submitButtonLoading: "Đang xử lý...",
        uploadButtonTitle: "Tải lên báo cáo JSON đã có",
        errors: {
            emptyUrl: "Vui lòng nhập link kênh YouTube",
            invalidUrl:
                "Link YouTube không hợp lệ. Hãy nhập link kênh (ví dụ: youtube.com/@username)",
            invalidJson: "File JSON không đúng định dạng báo cáo.",
            cannotReadJson: "Không thể đọc file JSON. Vui lòng kiểm tra lại.",
            analysisError: "Có lỗi xảy ra khi phân tích",
            networkError:
                "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.",
            unknownError: "Có lỗi xảy ra khi phân tích. Vui lòng thử lại sau.",
        },
    },

    loading: {
        title: "Đang phân tích kênh YouTube...",
        steps: {
            validating: "Kiểm tra URL...",
            fetchingChannel: "lấy thông tin kênh...",
            fetchingVideos: "Tải danh sách video...",
            analyzingContent: "Phân tích nội dung...",
            generatingReport: "Tạo báo cáo...",
        },
        note: "Quá trình này có thể mất 30-60 giây...",
    },

    sidebar: {
        backButton: "← Phân tích kênh khác",
        title: "Báo cáo",
        tabs: {
            data: "Dữ liệu",
            analysis: "Phân tích",
            evaluation: "Đánh giá",
        },
        downloadBox: {
            text: "Báo cáo này được phân tích bằng mô hình AI siêu cấp víp pờ rồ.",
            button: "Tải báo cáo",
        },
    },

    report: {
        headers: {
            data: "Dữ liệu",
            analysis: "Phân tích",
            evaluation: "Đánh giá",
        },
        description: "Báo cáo kênh {brandName} - Ngày tạo: {reportDate}",
    },

    channel: {
        sectionTitle: "Kênh",
        createdDate: "Ngày tạo kênh:",
        notUpdated: "Chưa cập nhật",
        stats: {
            videos: "Videos",
            views: "Views",
            subs: "Subs",
            likes: "Likes",
        },
    },

    heatmap: {
        title: "Tần suất đăng (30 ngày qua)",
        videoCount: "{count} video",
    },

    posts: {
        sectionTitle: "Nội dung trên kênh",
        postNumber: "Bài đăng {number}",
        viewCount: "Lượt xem:",
        likeCount: "Lượt thích:",
        commentCount: "Bình luận:",
        publishDate: "Ngày đăng:",
        seoTags: "SEO Tags",
        copyTags: "Copy Tags",
        copied: "Copied!",
        description: "Mô tả video",
        noDescription: "Không có mô tả",
        videoUrl: "Video URL",
        openLink: "Mở link",
    },

    analysis: {
        strategyTitle: "Phân tích Chiến lược",
        brandIdentity: {
            title: "Tính cách thương hiệu",
            style: "Style:",
            tone: "Tone:",
            positioning: "Định vị:",
        },
        contentFocus: {
            title: "Nội dung đăng trên kênh",
            noData: "Chưa có dữ liệu",
        },
        contentNicheAnalysis: {
            title: "Phân tích Niche & Thể loại",
            primaryNiche: "Niche chính:",
            subNiches: "Niche phụ:",
            contentCategories: "Phân loại nội dung",
            category: "Thể loại",
            percentage: "Tỷ lệ",
            nichePositioning: "Vị thế trong Niche:",
            competitorLandscape: "Cạnh tranh:",
            contentUniqueness: "Điểm độc đáo:",
        },
        audienceAnalysis: {
            title: "Phân tích Khán giả",
            demographicsTitle: "Nhân khẩu học (Ước tính)",
            ageDistribution: "Phân bố độ tuổi",
            genderSplit: "Tỷ lệ giới tính",
            male: "Nam",
            female: "Nữ",
            other: "Khác",
            topCountries: "Quốc gia hàng đầu",
            primaryLanguages: "Ngôn ngữ chính:",
            incomeLevel: "Mức thu nhập:",
            educationLevel: "Trình độ học vấn:",
            behaviorTitle: "Hành vi Khán giả",
            estimatedWatchTime: "Thời gian xem TB:",
            returningVsNew: "Quay lại vs Mới:",
            subscriberGrowth: "Tăng trưởng Sub:",
            peakViewingDays: "Ngày xem cao điểm:",
            peakViewingHours: "Giờ xem cao điểm:",
            engagementPatterns: "Mẫu tương tác:",
            devicePreferences: "Thiết bị xem:",
            psychographicsTitle: "Tâm lý học",
            values: "Giá trị:",
            lifestyle: "Lối sống:",
            purchaseBehavior: "Hành vi mua sắm:",
        },
        adStrategy: {
            title: "Chiến lược Quảng cáo",
        },
        funnelAnalysis: {
            title: "Phân tích Phễu Marketing",
            tofu: "Top of Funnel - Thu hút",
            mofu: "Middle of Funnel - Nuôi dưỡng",
            bofu: "Bottom of Funnel - Chuyển đổi",
        },
        quantitativeSynthesis: {
            title: "Tổng Hợp Định Lượng",
            summaryStats: {
                title: "Tổng Quan Số Liệu",
                totalViews: "Tổng lượt xem:",
                totalLikes: "Tổng lượt thích:",
                totalVideos: "Tổng video:",
            },
            channelHealth: {
                title: "Tương Tác Kênh",
                followerCount: "Người đăng ký:",
                postingFrequency: "Tần suất đăng:",
                erRate: "Tỷ lệ tương tác (ER):",
                erTooltip:
                    "(Tổng Like + Tổng Bình luận) / Tổng Lượt xem × 100%",
            },
            channelMetrics: {
                title: "Chỉ Số Kênh",
                videoCount: "Số video:",
                followerCount: "Người theo dõi:",
                followingCount: "Đang theo dõi:",
                heartCount: "Lượt thích:",
            },
            contentPerformance: {
                title: "Hiệu Suất Nội Dung",
                avgView: "Lượt xem TB:",
                avgViewTooltip: "Tổng lượt xem / Số lượng video",
                viralScore: "Điểm Viral:",
                valueScore: "Điểm Giá Trị:",
                adRatio: "Tỷ lệ Quảng Cáo:",
            },
        },
        contentPillars: {
            title: "Trụ cột nội dung (Content Pillars)",
        },
        audiencePersonas: {
            title: "Phân khúc Khán giả",
            avatarDescription: "Tổng quan:",
            demographics: "Nhân khẩu học:",
            ageRange: "Độ tuổi:",
            gender: "Giới tính:",
            location: "Vị trí:",
            occupation: "Nghề nghiệp:",
            interests: "Sở thích:",
            painPoints: "Vấn đề/Nỗi đau:",
            goals: "Mục tiêu:",
            contentPreferences: "Nội dung yêu thích:",
            preferredVideoLength: "Độ dài video phù hợp:",
            viewingFrequency: "Tần suất xem:",
            socialPlatforms: "Nền tảng sử dụng:",
            buyingTriggers: "Yếu tố mua hàng:",
        },
        contentCalendar: {
            title: "Lịch đăng nội dung",
            bestDays: "Ngày đăng tốt nhất:",
            bestTimes: "Giờ đăng tốt nhất:",
            recommendedFrequency: "Tần suất đề xuất:",
            contentMix: "Cấu trúc Nội dung",
            contentType: "Loại nội dung:",
            specificTopics: "Chủ đề cụ thể:",
            exampleVideos: "Video ví dụ:",
        },
        growthOpportunities: {
            title: "Cơ hội tăng trưởng",
        },
        seoAnalysis: {
            title: "SEO & Khả năng Tìm kiếm",
            keywordStrategy: "Chiến lược Từ khóa",
            topKeywords: "Từ khóa hàng đầu:",
            keywordDensity: "Mật độ từ khóa:",
            missingKeywords: "Từ khóa thiếu:",
            tagAnalysis: "Phân tích Tag",
            tagCoverage: "Độ bao phủ tag:",
            allChannelTags: "Tất cả Tags của kênh:",
            recommendedTags: "Tag đề xuất:",
            tagConsistency: "Tính nhất quán tag:",
            mostUsedTags: "Tags sử dụng nhiều nhất",
            tagFrequency: "Tần suất:",
            performanceImpact: "Tác động hiệu suất:",
            tagCategories: "Phân loại Tags",
            categoryEffectiveness: "Hiệu quả:",
            competitorTags: "Tags đối thủ chưa dùng:",
            longTailOpportunities: "Cơ hội Long-tail:",
            tagOptimizationScore: "Điểm tối ưu Tag:",
            optimizationOpportunities: "Cơ hội Tối ưu hóa",
        },
    },

    evaluation: {
        overallTitle: "Đánh giá chung",
        executiveSummary: "Executive Summary",
        strengths: {
            title: "Điểm mạnh",
        },
        weaknesses: {
            title: "Điểm yếu & Cơ hội",
        },
        insights: {
            title: "Đề xuất hành động",
        },
        videoIdeas: {
            title: "Ý tưởng Video",
            estimatedPerformance: "Hiệu suất dự kiến:",
        },
        actionPlan: {
            title: "Kế hoạch Hành động (30/60/90 Ngày)",
            phase30: "30 Ngày",
            phase60: "60 Ngày",
            phase90: "90 Ngày",
            priority: "Ưu tiên:",
            expectedImpact: "Tác động dự kiến:",
            resourcesNeeded: "Nguồn lực cần thiết:",
        },
    },

    language: {
        selector: "Ngôn ngữ",
        vietnamese: "Tiếng Việt",
        english: "Tiếng Anh",
    },
} as const;

export type ViLanguage = typeof vi;
