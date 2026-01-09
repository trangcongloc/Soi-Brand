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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
                    created_at: new Date(video.publishedAt).toLocaleDateString(
                        "vi-VN"
                    ),
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
                    duration: video.contentDetails.duration,
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

        // Handle specific Gemini API errors
        if (
            errorStatus === 401 ||
            errorMessage.includes("401") ||
            errorMessage.includes("Unauthorized")
        ) {
            throw new Error(
                "Authentication failure: Invalid API key or insufficient permissions. " +
                    "Please check your GEMINI_API_KEY in environment variables, regenerate the key if needed, " +
                    "or verify your account eligibility."
            );
        }

        if (
            errorStatus === 429 ||
            errorMessage.includes("429") ||
            errorMessage.includes("Resource Exhausted") ||
            errorMessage.includes("quota")
        ) {
            throw new Error(
                "Quota limit exceeded: You've hit the API rate limit (requests/minute or daily quota). " +
                    "Please wait a few minutes and try again, apply for a quota increase, " +
                    "or consider using a different model."
            );
        }

        if (
            errorStatus === 500 ||
            errorMessage.includes("500") ||
            errorMessage.includes("Internal Server Error")
        ) {
            throw new Error(
                "Internal server error: Unexpected error on Google's side. " +
                    "Try reducing the input size, switching to a different model (e.g., gemini-2.5-flash), " +
                    "or retry in a few moments."
            );
        }

        if (
            errorStatus === 503 ||
            errorMessage.includes("503") ||
            errorMessage.includes("Service Unavailable")
        ) {
            throw new Error(
                "Service temporarily unavailable: Google's servers are experiencing high load. " +
                    "Please wait a few minutes and retry, or try switching to a different model."
            );
        }

        if (
            errorStatus === 504 ||
            errorMessage.includes("504") ||
            errorMessage.includes("Deadline Exceeded") ||
            errorMessage.includes("timeout")
        ) {
            throw new Error(
                "Request timeout: The prompt or context is too large or complex. " +
                    "Try simplifying your request, reducing the number of videos analyzed, " +
                    "or increase the client timeout setting."
            );
        }

        // Handle JSON parsing errors
        if (error instanceof SyntaxError || errorMessage.includes("JSON")) {
            throw new Error(
                "AI response parsing error: The AI returned an invalid response format. " +
                    "This may be due to model overload or an unexpected response. Please try again."
            );
        }

        // Generic fallback error
        throw new Error(
            `Failed to generate marketing analysis: ${
                errorMessage || "Unknown error occurred"
            }. ` + "Please try again or contact support if the issue persists."
        );
    }
}
