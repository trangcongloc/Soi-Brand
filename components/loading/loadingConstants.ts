export interface StepLabel {
    label: string;
    subLabels: string[];
}

export const DEFAULT_STEPS_VI: StepLabel[] = [
    {
        label: "Xác thực đường dẫn kênh",
        subLabels: [
            "Phân tích cấu trúc và định dạng URL",
            "Giải mã định danh kênh YouTube",
            "Xác minh trạng thái hoạt động kênh",
        ],
    },
    {
        label: "Thu thập thông tin kênh",
        subLabels: [
            "Thiết lập kết nối đến YouTube API",
            "Thu thập dữ liệu người đăng ký",
            "Tổng hợp số liệu lượt xem tổng",
            "Phân tích thông tin hồ sơ kênh",
        ],
    },
    {
        label: "Quét toàn bộ kho video",
        subLabels: [
            "Duyệt qua 50 video được đăng gần nhất",
            "Trích xuất metadata và thông tin chi tiết",
            "Ghi nhận số liệu lượt xem từng video",
            "Tổng hợp lượt thích và bình luận",
            "Thu thập toàn bộ SEO tags",
        ],
    },
    {
        label: "Phân tích chiến lược nội dung",
        subLabels: [
            "Phát hiện xu hướng nội dung chủ đạo",
            "Đánh giá tần suất và nhịp đăng bài",
            "Đo lường chỉ số hiệu suất video",
            "Phân loại chủ đề theo danh mục",
            "Xây dựng bản đồ content pillars",
            "Vẽ chân dung đối tượng khán giả",
            "Chấm điểm chiến lược SEO tổng thể",
        ],
    },
    {
        label: "Tổng hợp báo cáo chi tiết",
        subLabels: [
            "Tổng hợp insight và dữ liệu kênh",
            "Phân tích và làm nổi bật thế mạnh",
            "Khoanh vùng các cơ hội tăng trưởng",
            "Thiết kế chiến lược marketing tổng thể",
            "Đề xuất ý tưởng video tiềm năng",
            "Xây dựng roadmap hành động chi tiết",
            "Hoàn thiện và định dạng báo cáo",
        ],
    },
];

export const DEFAULT_STEPS_EN: StepLabel[] = [
    {
        label: "Validating channel URL",
        subLabels: [
            "Analyzing URL structure and format",
            "Decoding YouTube channel identifier",
            "Verifying channel operational status",
        ],
    },
    {
        label: "Retrieving channel information",
        subLabels: [
            "Establishing connection to YouTube API",
            "Retrieving subscriber count and metrics",
            "Aggregating total view statistics",
            "Analyzing channel profile information",
        ],
    },
    {
        label: "Scanning complete video library",
        subLabels: [
            "Browsing through 50 most recent videos",
            "Extracting metadata and detailed information",
            "Recording view counts for each video",
            "Compiling likes and comment statistics",
            "Harvesting all available SEO tags",
        ],
    },
    {
        label: "Analyzing content strategy",
        subLabels: [
            "Identifying dominant content trends and patterns",
            "Evaluating posting frequency and consistency",
            "Measuring video performance indicators",
            "Categorizing content by topic clusters",
            "Mapping comprehensive content pillars",
            "Building detailed audience persona profiles",
            "Scoring overall SEO strategy effectiveness",
        ],
    },
    {
        label: "Generating comprehensive report",
        subLabels: [
            "Synthesizing channel insights and data points",
            "Analyzing and highlighting key strengths",
            "Identifying growth opportunities and gaps",
            "Designing comprehensive marketing strategy",
            "Generating potential video content ideas",
            "Building detailed action roadmap plan",
            "Finalizing and formatting complete report",
        ],
    },
];

export const STEP_DURATIONS = [5000, 5000, 5000, 12000, 25000];

export const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const LABELS_CACHE_KEY = "soibrand_loading_labels";

export interface CachedLabels {
    labels: StepLabel[];
    lang: string;
}

export const ERROR_TITLES_VI: Record<string, string> = {
    MODEL_OVERLOAD: "Mô hình AI quá tải",
    NETWORK_ERROR: "Lỗi kết nối",
    RATE_LIMIT: "Giới hạn tần suất",
    GEMINI_QUOTA: "Hết hạn mức API",
    YOUTUBE_QUOTA: "Hết hạn mức YouTube",
    API_CONFIG: "Lỗi cấu hình",
    CHANNEL_NOT_FOUND: "Không tìm thấy kênh",
    AI_PARSE_ERROR: "Lỗi phân tích AI",
    YOUTUBE_API_ERROR: "Lỗi YouTube API",
    GEMINI_API_ERROR: "Lỗi Gemini API",
    UNKNOWN: "Phân tích thất bại",
};

export const ERROR_TITLES_EN: Record<string, string> = {
    MODEL_OVERLOAD: "AI Model Overloaded",
    NETWORK_ERROR: "Network Error",
    RATE_LIMIT: "Rate Limited",
    GEMINI_QUOTA: "API Quota Exceeded",
    YOUTUBE_QUOTA: "YouTube Quota Exceeded",
    API_CONFIG: "Configuration Error",
    CHANNEL_NOT_FOUND: "Channel Not Found",
    AI_PARSE_ERROR: "AI Parse Error",
    YOUTUBE_API_ERROR: "YouTube API Error",
    GEMINI_API_ERROR: "Gemini API Error",
    UNKNOWN: "Analysis Failed",
};

export const RETRYABLE_ERRORS = [
    "MODEL_OVERLOAD",
    "NETWORK_ERROR",
    "RATE_LIMIT",
    "GEMINI_QUOTA",
    "AI_PARSE_ERROR",
];

export const MAX_AUTO_RETRIES = 3;
export const RETRY_INTERVAL_SECONDS = 30;

export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};
