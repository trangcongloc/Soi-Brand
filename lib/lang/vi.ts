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
            fetchingChannel: "Đang lấy thông tin kênh",
            analyzingContent: "Đang phân tích nội dung",
            generatingReport: "Đang tạo báo cáo",
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
        description:
            "Dữ liệu thô từ YouTube của kênh {brandName} với các bài đăng gần nhất.",
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
    },
} as const;

export type ViLanguage = typeof vi;
