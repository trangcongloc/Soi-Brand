// Gemini AI Service for Marketing Analysis
import { GoogleGenerativeAI } from "@google/generative-ai";
import { YouTubeChannel, YouTubeVideo, MarketingReport } from "./types";
import { generateUUID } from "./utils";

/**
 * Initialize Gemini AI
 */
function initGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key not configured");
    }
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate marketing analysis report using Gemini AI
 */
export async function generateMarketingReport(
    channelInfo: YouTubeChannel,
    videos: YouTubeVideo[]
): Promise<MarketingReport> {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Prepare data for analysis
    const channelData = {
        name: channelInfo.title,
        description: channelInfo.description,
        subscriberCount: parseInt(channelInfo.statistics.subscriberCount),
        videoCount: parseInt(channelInfo.statistics.videoCount),
        totalViews: parseInt(channelInfo.statistics.viewCount),
    };

    const videosData = videos.map((video) => ({
        title: video.title,
        description: video.description,
        views: parseInt(video.statistics.viewCount),
        likes: parseInt(video.statistics.likeCount),
        comments: parseInt(video.statistics.commentCount),
        publishedAt: video.publishedAt,
        tags: video.tags || [],
    }));

    // Create comprehensive prompt for Gemini
    const prompt = `
Bạn là chuyên gia phân tích marketing YouTube. Hãy phân tích kênh YouTube sau và tạo báo cáo marketing chi tiết.

THÔNG TIN KÊNH:
- Tên kênh: ${channelData.name}
- Mô tả: ${channelData.description}
- Số người đăng ký: ${channelData.subscriberCount.toLocaleString()}
- Tổng số video: ${channelData.videoCount}
- Tổng lượt xem: ${channelData.totalViews.toLocaleString()}

DANH SÁCH VIDEO GẦN ĐÂY (${videos.length} videos):
${videosData
    .map(
        (v, i) => `
${i + 1}. ${v.title}
   - Lượt xem: ${v.views.toLocaleString()}
   - Lượt thích: ${v.likes.toLocaleString()}
   - Bình luận: ${v.comments.toLocaleString()}
   - Ngày đăng: ${new Date(v.publishedAt).toLocaleDateString("vi-VN")}
   - Mô tả: ${v.description.substring(0, 200)}...
`
    )
    .join("\n")}

YÊU CẦU:
Hãy phân tích và trả về một object JSON hoàn chỉnh với cấu trúc sau:

{
  "report_part_2": {
    "ad_strategy": {
      "overview": "Tổng quan về chiến lược quảng cáo (nếu có)",
      "ad_angles": ["Góc độ quảng cáo 1", "Góc độ 2"],
      "ad_creatives": null,
      "target_audience_clues": "Phân tích đối tượng mục tiêu dựa trên nội dung"
    },
    "funnel_analysis": {
      "tofu": "Phân tích TOFU (Top of Funnel) - cách kênh thu hút người xem mới",
      "mofu": "Phân tích MOFU (Middle of Funnel) - cách xây dựng lòng tin",
      "bofu": "Phân tích BOFU (Bottom of Funnel) - CTA và chuyển đổi"
    },
    "strategy_analysis": {
      "brand_identity": {
        "visual_style": "Mô tả phong cách hình ảnh của kênh",
        "tone_of_voice": "Giọng điệu và thông điệp cốt lõi",
        "brand_positioning": "Định vị thương hiệu"
      },
      "content_pillars": [
        {
          "pillar": "Tên trụ cột nội dung 1",
          "purpose": "Mục đích",
          "description": "Mô tả chi tiết"
        }
      ],
      "content_focus": {
        "overview": "Mô tả tổng quan về các nội dung chính mà kênh đang tập trung thực hiện (ví dụ: các loại bánh, review công nghệ...)",
        "topics": ["Chủ đề 1", "Chủ đề 2", "Chủ đề 3"]
      },
      "hashtag_strategy": "Phân tích chiến lược hashtag/tags",
      "top_content_analysis": {
        "best_performing": {
          "overview": "Tổng quan về video hiệu suất tốt nhất",
          "reasons_for_success": "Lý do thành công"
        },
        "worst_performing": {
          "overview": "Tổng quan về video hiệu suất thấp",
          "reasons_for_failure": "Lý do kém hiệu quả"
        }
      },
      "content_structure_analysis": {
        "hook_tactics": "Chiến thuật thu hút trong 3-5 giây đầu",
        "storytelling": "Cấu trúc kể chuyện",
        "cta_strategy": "Chiến lược Call-to-Action",
        "emotional_triggers": "Các yếu tố cảm xúc được khai thác"
      }
    },
    "quantitative_synthesis": {
      "summary_stats": {
        "total_posts": ${videos.length},
        "total_views": ${videosData.reduce((sum, v) => sum + v.views, 0)},
        "total_likes": ${videosData.reduce((sum, v) => sum + v.likes, 0)},
        "total_shares": 0,
        "total_saves": 0,
        "total_photos": 0,
        "total_videos": ${videos.length}
      },
      "channel_health": {
        "follower_count": "${channelData.subscriberCount.toLocaleString()}",
        "posting_frequency": "Ước tính tần suất đăng bài, trả về kết quả ngắn gọn (VD: '1 video/ngày', '3-4 video/tuần')",
        "er_rate": "Tính tỷ lệ tương tác theo công thức: (Tổng Like + Tổng Bình luận) / Tổng Lượt xem * 100%. CHỈ trả về kết quả cuối cùng dạng 'X.XX%', KHÔNG bao gồm công thức hay giải thích."
      },
      "channel_metrics": {
        "video_count": ${channelData.videoCount},
        "follower_count": ${channelData.subscriberCount},
        "following_count": 0,
        "heart_count": ${videosData.reduce((sum, v) => sum + v.likes, 0)}
      },
      "content_performance": {
        "avg_view": "Trung bình lượt xem, chỉ trả về số (VD: '134,769 lượt xem/video')",
        "viral_score": "Điểm viral, trả về đánh giá ngắn gọn (VD: 'Cao', 'Trung bình', 'Thấp')",
        "value_score": "Điểm giá trị, trả về đánh giá ngắn gọn (VD: 'Cao', 'Trung bình', 'Thấp')",
        "ad_ratio": "Tỷ lệ quảng cáo, trả về kết quả ngắn gọn (VD: 'Không xác định', '5%')"
      }
    }
  },
  "report_part_3": {
    "strengths": [
      "Điểm mạnh 1",
      "Điểm mạnh 2",
      "Điểm mạnh 3"
    ],
    "executive_summary": "Tóm tắt tổng quan về kênh và chiến lược marketing",
    "actionable_insights": {
      "learn_from": "Những gì có thể học hỏi từ kênh này",
      "avoid": "Những gì nên tránh",
      "video_ideas": [
        {
          "title": "Ý tưởng video 1",
          "concept": "Mô tả concept"
        },
        {
          "title": "Ý tưởng video 2",
          "concept": "Mô tả concept"
        },
        {
          "title": "Ý tưởng video 3",
          "concept": "Mô tả concept"
        }
      ]
    },
    "weaknesses_opportunities": [
      "Điểm yếu/Cơ hội 1",
      "Điểm yếu/Cơ hội 2",
      "Điểm yếu/Cơ hội 3"
    ]
  }
}

QUAN TRỌNG:
- Trả về CHÍNH XÁC object JSON hợp lệ, không có markdown hay text khác
- Phân tích sâu sắc, chi tiết dựa trên dữ liệu thực tế
- Sử dụng tiếng Việt
- Đảm bảo tất cả các trường đều có giá trị hợp lệ
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (remove markdown code blocks if present)
        let jsonText = text.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, "");
        }

        const aiAnalysis = JSON.parse(jsonText);

        // Construct full report
        const report: MarketingReport = {
            report_id: generateUUID(),
            job_id: generateUUID(),
            brand_name: channelInfo.title,
            report_part_1: {
                posts: videos.map((video) => ({
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    desc: video.description.substring(0, 200),
                    is_ad: false,
                    title: video.title,
                    gallery: [
                        video.thumbnails.maxres?.url ||
                            video.thumbnails.high?.url ||
                            "",
                    ],
                    post_id: video.id,
                    is_pinned: false,
                    post_type: "Video",
                    thumbnail: video.thumbnails.medium?.url || "",
                    created_at: video.publishedAt,
                    statistics: {
                        digg_count: parseInt(video.statistics.likeCount),
                        play_count: parseInt(video.statistics.viewCount),
                        share_count: 0,
                        collect_count: 0,
                        comment_count: parseInt(video.statistics.commentCount),
                    },
                    tags: video.tags || [],
                    transcript: "",
                    raw_content_for_ai: null,
                    published_at: video.publishedAt,
                    duration: video.contentDetails?.duration || "PT0S",
                })),
                channel_info: {
                    stats: {
                        heartCount: videos.reduce(
                            (sum, v) =>
                                sum + parseInt(v.statistics.likeCount || "0"),
                            0
                        ),
                        videoCount: parseInt(channelInfo.statistics.videoCount),
                        followerCount: parseInt(
                            channelInfo.statistics.subscriberCount
                        ),
                        followingCount: 0,
                        viewCount: parseInt(channelInfo.statistics.viewCount),
                    },
                    avatar: channelInfo.thumbnails.high?.url || "",
                    bioLink: "",
                    nickname: channelInfo.title,
                    uniqueId: channelInfo.customUrl || channelInfo.id,
                    channelId: channelInfo.id,
                    signature: channelInfo.description,
                    joinedAt: channelInfo.publishedAt,
                },
            },
            report_part_2: aiAnalysis.report_part_2,
            report_part_3: aiAnalysis.report_part_3,
            created_at: new Date().toISOString(),
        };

        return report;
    } catch (error: any) {
        console.error("Error generating marketing report:", error);

        // Extract error details
        const errorMessage = error?.message || "";
        const errorStatus = error?.status || error?.response?.status;

        // Handle specific Gemini API errors based on official documentation
        // Reference: https://ai.google.dev/gemini-api/docs/troubleshooting

        // 400 Bad Request - Invalid parameters
        if (
            errorStatus === 400 ||
            errorMessage.includes("400") ||
            errorMessage.includes("Bad Request") ||
            errorMessage.includes("invalid")
        ) {
            throw new Error(
                "Invalid request parameters: The model parameters or request format is incorrect. " +
                    "Please verify your API call parameters are within valid ranges. " +
                    "Check the model supports the features you're using and you're using the correct API version."
            );
        }

        // 401 Unauthorized - Authentication failure
        if (
            errorStatus === 401 ||
            errorMessage.includes("401") ||
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("API key")
        ) {
            throw new Error(
                "Authentication failed: Invalid or missing API key. " +
                    "Please check your GEMINI_API_KEY in environment variables. " +
                    "If the key was leaked, generate a new one at Google AI Studio. " +
                    "Ensure proper authentication is set up."
            );
        }

        // 403 Forbidden - Permission denied
        if (
            errorStatus === 403 ||
            errorMessage.includes("403") ||
            errorMessage.includes("Forbidden") ||
            errorMessage.includes("Permission denied")
        ) {
            throw new Error(
                "Permission denied: Your API key doesn't have access to this resource or model. " +
                    "Verify you have the necessary permissions and are using a supported model. " +
                    "Check if your key is blocked due to security concerns."
            );
        }

        // 404 Not Found - Resource not found
        if (
            errorStatus === 404 ||
            errorMessage.includes("404") ||
            errorMessage.includes("Not Found")
        ) {
            throw new Error(
                "Resource not found: The requested model or endpoint doesn't exist. " +
                    "Verify you're using a supported model name (e.g., gemini-2.5-flash-lite). " +
                    "Check the models page for available models."
            );
        }

        // 429 Resource Exhausted - Rate limit or quota exceeded
        if (
            errorStatus === 429 ||
            errorMessage.includes("429") ||
            errorMessage.includes("Resource Exhausted") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("rate limit")
        ) {
            throw new Error(
                "Rate limit exceeded: You've hit the API quota (requests per minute or daily limit). " +
                    "Wait a few minutes before retrying. " +
                    "Consider requesting a quota increase or using a different model. " +
                    "Check your usage at Google AI Studio."
            );
        }

        // 500 Internal Server Error
        if (
            errorStatus === 500 ||
            errorMessage.includes("500") ||
            errorMessage.includes("Internal Server Error")
        ) {
            throw new Error(
                "Internal server error: Unexpected error on Google's servers. " +
                    "Try reducing input size, using a different model (e.g., gemini-2.5-flash), " +
                    "or retry in a few moments. If the issue persists, check Google AI status."
            );
        }

        // 503 Service Unavailable
        if (
            errorStatus === 503 ||
            errorMessage.includes("503") ||
            errorMessage.includes("Service Unavailable") ||
            errorMessage.includes("overloaded")
        ) {
            throw new Error(
                "Service temporarily unavailable: The Gemini API is experiencing high load. " +
                    "Wait a few minutes and retry. " +
                    "Consider using a different model or try during off-peak hours."
            );
        }

        // 504 Gateway Timeout / Deadline Exceeded
        if (
            errorStatus === 504 ||
            errorMessage.includes("504") ||
            errorMessage.includes("Deadline Exceeded") ||
            errorMessage.includes("timeout")
        ) {
            throw new Error(
                "Request timeout: The request took too long to process. " +
                    "Try reducing the number of videos analyzed, simplifying your prompt, " +
                    "or using a faster model. Consider breaking large requests into smaller batches."
            );
        }

        // Safety/Content filtering
        if (
            errorMessage.includes("SAFETY") ||
            errorMessage.includes("blocked") ||
            errorMessage.includes("BlockedReason")
        ) {
            throw new Error(
                "Content blocked: The request or response was blocked by safety filters. " +
                    "Review your content against safety settings. " +
                    "If you see BlockedReason.OTHER, the content may violate terms of service."
            );
        }

        // Recitation issue
        if (
            errorMessage.includes("RECITATION") ||
            errorMessage.includes("recitation")
        ) {
            throw new Error(
                "Recitation detected: The model output may resemble training data. " +
                    "Try making your prompt more unique and specific. " +
                    "Consider using a higher temperature setting to increase output diversity."
            );
        }

        // JSON parsing errors
        if (error instanceof SyntaxError || errorMessage.includes("JSON")) {
            throw new Error(
                "Response parsing error: The AI returned an invalid JSON format. " +
                    "This may be due to model overload or unexpected output. " +
                    "Try again or adjust your prompt to request more structured output."
            );
        }

        // Generic fallback error
        throw new Error(
            `Failed to generate marketing analysis: ${
                errorMessage || "Unknown error occurred"
            }. ` +
                "Please try again. If the issue persists, check your API key status at Google AI Studio " +
                "or contact support with the error details."
        );
    }
}
