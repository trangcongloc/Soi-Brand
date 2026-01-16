// Gemini AI Service for Marketing Analysis
import { GoogleGenerativeAI } from "@google/generative-ai";
import { YouTubeChannel, YouTubeVideo, MarketingReport, APIError } from "./types";
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

    // Analyze posting patterns for content calendar insights
    const postingDays: { [key: string]: number } = {};
    const postingHours: { [key: string]: number } = {};
    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    videosData.forEach((v) => {
        const date = new Date(v.publishedAt);
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        postingDays[dayName] = (postingDays[dayName] || 0) + 1;
        postingHours[hour] = (postingHours[hour] || 0) + 1;
    });

    const topPostingDays = Object.entries(postingDays)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day);

    const topPostingHours = Object.entries(postingHours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

    // Calculate average engagement for video idea estimates
    const avgViews = Math.round(
        videosData.reduce((sum, v) => sum + v.views, 0) / videosData.length
    );
    const topVideoViews = Math.max(...videosData.map((v) => v.views));

    // Create comprehensive prompt for Gemini
    const prompt = `
Bạn là chuyên gia phân tích marketing YouTube cấp cao. Hãy phân tích kênh YouTube sau và tạo báo cáo marketing chi tiết, chuyên sâu.

THÔNG TIN KÊNH:
- Tên kênh: ${channelData.name}
- Mô tả: ${channelData.description}
- Số người đăng ký: ${channelData.subscriberCount.toLocaleString()}
- Tổng số video: ${channelData.videoCount}
- Tổng lượt xem: ${channelData.totalViews.toLocaleString()}
- Lượt xem trung bình/video: ${avgViews.toLocaleString()}
- Video hiệu suất cao nhất: ${topVideoViews.toLocaleString()} lượt xem

PHÂN TÍCH THỜI GIAN ĐĂNG:
- Các ngày đăng phổ biến: ${topPostingDays.join(", ")}
- Các giờ đăng phổ biến: ${topPostingHours.join(", ")}

DANH SÁCH VIDEO GẦN ĐÂY (${videos.length} videos):
${videosData
    .map(
        (v, i) => `
${i + 1}. ${v.title}
   - Lượt xem: ${v.views.toLocaleString()}
   - Lượt thích: ${v.likes.toLocaleString()}
   - Bình luận: ${v.comments.toLocaleString()}
   - Ngày đăng: ${new Date(v.publishedAt).toLocaleDateString(
       "vi-VN"
   )} lúc ${new Date(v.publishedAt).getHours()}:00
   - Tags: ${v.tags.slice(0, 5).join(", ") || "Không có"}
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
      "content_niche_analysis": {
        "primary_niche": "Niche chính của kênh (VD: 'Gaming', 'Beauty', 'Tech Review', 'Education')",
        "sub_niches": ["Niche phụ 1", "Niche phụ 2"],
        "content_categories": [
          {
            "category": "Tên thể loại nội dung (VD: 'Tutorial', 'Review', 'Vlog')",
            "percentage": 40,
            "description": "Mô tả chi tiết về thể loại này trong kênh"
          },
          {
            "category": "Thể loại 2",
            "percentage": 35,
            "description": "Mô tả"
          },
          {
            "category": "Thể loại 3",
            "percentage": 25,
            "description": "Mô tả"
          }
        ],
        "niche_positioning": "Vị thế của kênh trong niche - đang dẫn đầu, đang phát triển, hay mới gia nhập",
        "competitor_landscape": "Phân tích cạnh tranh - các kênh tương tự, điểm khác biệt",
        "content_uniqueness": "Điều gì làm nội dung kênh này độc đáo so với đối thủ"
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
    "audience_analysis": {
      "demographics": {
        "age_distribution": [
          {"range": "13-17", "percentage": 10},
          {"range": "18-24", "percentage": 35},
          {"range": "25-34", "percentage": 30},
          {"range": "35-44", "percentage": 15},
          {"range": "45+", "percentage": 10}
        ],
        "gender_split": {
          "male": 60,
          "female": 38,
          "other": 2
        },
        "top_countries": [
          {"country": "Việt Nam", "percentage": 70},
          {"country": "Hoa Kỳ", "percentage": 15},
          {"country": "Khác", "percentage": 15}
        ],
        "primary_languages": ["Tiếng Việt", "Tiếng Anh"],
        "income_level": "Ước tính mức thu nhập của khán giả (VD: 'Trung bình', 'Trung bình-Cao')",
        "education_level": "Ước tính trình độ học vấn (VD: 'Đại học', 'THPT')"
      },
      "behavior": {
        "estimated_watch_time": "Ước tính thời gian xem trung bình (VD: '5-8 phút/video')",
        "returning_vs_new_ratio": "Tỷ lệ người xem quay lại vs mới (VD: '60% quay lại, 40% mới')",
        "subscriber_growth_trend": "Xu hướng tăng trưởng subscriber (VD: 'Tăng đều 2-3%/tháng', 'Đang chậm lại')",
        "peak_viewing_days": ["Thứ 7", "Chủ nhật"],
        "peak_viewing_hours": ["20:00", "21:00", "22:00"],
        "engagement_patterns": "Mô tả cách khán giả tương tác (VD: 'Comment nhiều ở video hướng dẫn', 'Like cao ở video giải trí')",
        "device_preferences": "Thiết bị xem chủ yếu (VD: '70% Mobile, 25% Desktop, 5% TV')"
      },
      "psychographics": {
        "values": ["Giá trị quan trọng với khán giả 1", "Giá trị 2"],
        "lifestyle": "Mô tả lối sống của khán giả mục tiêu",
        "purchase_behavior": "Hành vi mua sắm liên quan đến nội dung kênh"
      }
    },
    "audience_personas": [
      {
        "name": "Tên persona đại diện (VD: 'Sinh viên đam mê công nghệ')",
        "avatar_description": "Mô tả ngắn về persona này (1-2 câu)",
        "demographics": "Nhân khẩu học tổng quan",
        "age_range": "VD: '18-25 tuổi'",
        "gender": "VD: 'Nam' hoặc 'Nữ' hoặc 'Cả hai'",
        "location": "VD: 'Thành phố lớn Việt Nam'",
        "occupation": "VD: 'Sinh viên, Nhân viên văn phòng'",
        "income_level": "VD: '5-10 triệu/tháng'",
        "interests": ["Sở thích 1", "Sở thích 2", "Sở thích 3"],
        "pain_points": ["Nỗi đau/vấn đề 1", "Nỗi đau/vấn đề 2"],
        "goals": ["Mục tiêu họ muốn đạt được 1", "Mục tiêu 2"],
        "content_preferences": "Loại nội dung họ thích xem",
        "preferred_video_length": "VD: '10-15 phút'",
        "viewing_frequency": "VD: '3-4 lần/tuần'",
        "social_platforms": ["YouTube", "Facebook", "TikTok"],
        "buying_triggers": ["Trigger mua hàng 1", "Trigger 2"]
      },
      {
        "name": "Persona 2 - đối tượng khác",
        "avatar_description": "Mô tả persona thứ 2",
        "demographics": "Nhân khẩu học",
        "age_range": "VD: '30-40 tuổi'",
        "gender": "VD: 'Nữ'",
        "location": "VD: 'Tỉnh/thành phố vừa'",
        "occupation": "VD: 'Chủ doanh nghiệp nhỏ'",
        "income_level": "VD: '15-30 triệu/tháng'",
        "interests": ["Sở thích 1", "Sở thích 2"],
        "pain_points": ["Nỗi đau 1", "Nỗi đau 2"],
        "goals": ["Mục tiêu 1", "Mục tiêu 2"],
        "content_preferences": "Loại nội dung yêu thích",
        "preferred_video_length": "VD: '5-10 phút'",
        "viewing_frequency": "VD: '1-2 lần/tuần'",
        "social_platforms": ["YouTube", "Zalo"],
        "buying_triggers": ["Trigger 1", "Trigger 2"]
      }
    ],
    "content_calendar": {
      "best_posting_days": ["Ngày tốt nhất 1", "Ngày tốt nhất 2"],
      "best_posting_times": ["Giờ tốt nhất 1", "Giờ tốt nhất 2"],
      "recommended_frequency": "Tần suất đăng đề xuất (VD: '3-4 video/tuần')",
      "content_mix": [
        {"pillar": "Loại nội dung 1", "percentage": 40},
        {"pillar": "Loại nội dung 2", "percentage": 30},
        {"pillar": "Loại nội dung 3", "percentage": 30}
      ]
    },
    "growth_opportunities": [
      {
        "opportunity": "Tên cơ hội tăng trưởng",
        "description": "Mô tả chi tiết cơ hội",
        "priority": "high",
        "expected_impact": "Tác động dự kiến (VD: '+20% subscriber trong 3 tháng')"
      }
    ],
    "seo_analysis": {
      "keyword_strategy": {
        "top_keywords": ["Từ khóa phổ biến nhất 1", "Từ khóa 2", "Từ khóa 3"],
        "keyword_density": "Phân tích mật độ từ khóa trong tiêu đề và mô tả video. Đánh giá xem kênh có tối ưu hóa từ khóa tốt không.",
        "missing_keywords": ["Từ khóa tiềm năng chưa khai thác 1", "Từ khóa tiềm năng 2"]
      },
      "tag_analysis": {
        "tag_coverage": "Đánh giá độ bao phủ của tags (Tốt/Trung bình/Kém). Phân tích xem kênh có sử dụng tags đầy đủ và hiệu quả không.",
        "recommended_tags": ["Tag đề xuất 1", "Tag đề xuất 2", "Tag đề xuất 3"],
        "tag_consistency": "Đánh giá tính nhất quán của tags giữa các video. Có chiến lược tags rõ ràng không?",
        "most_used_tags": [
          {
            "tag": "Tag được sử dụng nhiều nhất",
            "frequency": 15,
            "performance_impact": "Tác động đến hiệu suất (VD: 'Cao - video có tag này có view cao hơn 20%')"
          },
          {
            "tag": "Tag phổ biến thứ 2",
            "frequency": 12,
            "performance_impact": "Tác động đến hiệu suất"
          },
          {
            "tag": "Tag phổ biến thứ 3",
            "frequency": 10,
            "performance_impact": "Tác động đến hiệu suất"
          }
        ],
        "tag_categories": [
          {
            "category": "Branded tags",
            "tags": ["Tag thương hiệu 1", "Tag thương hiệu 2"],
            "effectiveness": "Hiệu quả của nhóm tag này (VD: 'Tốt - giúp tăng nhận diện')"
          },
          {
            "category": "Topic tags",
            "tags": ["Tag chủ đề 1", "Tag chủ đề 2"],
            "effectiveness": "Hiệu quả"
          },
          {
            "category": "Trending tags",
            "tags": ["Tag trending 1"],
            "effectiveness": "Hiệu quả"
          }
        ],
        "competitor_tags": ["Tag mà đối thủ sử dụng nhưng kênh này chưa dùng 1", "Competitor tag 2", "Competitor tag 3"],
        "long_tail_opportunities": ["Từ khóa dài tiềm năng 1", "Long-tail keyword 2", "Long-tail keyword 3"],
        "tag_optimization_score": "Điểm tối ưu tag tổng thể (VD: '7/10 - Cần cải thiện tags trending')"
      },
      "optimization_opportunities": [
        {
          "area": "Tiêu đề video",
          "issue": "Vấn đề hiện tại với tiêu đề (VD: 'Thiếu từ khóa chính', 'Quá dài')",
          "recommendation": "Đề xuất cải thiện cụ thể",
          "priority": "high"
        },
        {
          "area": "Mô tả video",
          "issue": "Vấn đề với mô tả",
          "recommendation": "Đề xuất cải thiện",
          "priority": "medium"
        }
      ]
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
          "title": "Tiêu đề video hấp dẫn, cụ thể cho kênh này",
          "concept": "Mô tả chi tiết concept, cách triển khai",
          "estimated_views": "Ước tính lượt xem dựa trên hiệu suất kênh (VD: '${Math.round(
              avgViews * 0.8
          ).toLocaleString()} - ${Math.round(
        avgViews * 1.5
    ).toLocaleString()}')",
          "content_type": "Loại nội dung (hướng dẫn/review/vlog/giải trí...)"
        },
        {
          "title": "Tiêu đề video 2 - viral potential",
          "concept": "Mô tả concept có tiềm năng viral dựa trên video hiệu suất cao nhất của kênh",
          "estimated_views": "Ước tính lượt xem (VD: '${Math.round(
              topVideoViews * 0.5
          ).toLocaleString()} - ${Math.round(
        topVideoViews * 0.8
    ).toLocaleString()}')",
          "content_type": "Loại nội dung"
        },
        {
          "title": "Tiêu đề video 3 - safe bet",
          "concept": "Mô tả concept an toàn, phù hợp với khán giả hiện tại",
          "estimated_views": "Ước tính lượt xem",
          "content_type": "Loại nội dung"
        }
      ]
    },
    "weaknesses_opportunities": [
      "Điểm yếu/Cơ hội 1",
      "Điểm yếu/Cơ hội 2",
      "Điểm yếu/Cơ hội 3"
    ],
    "action_plan": {
      "phase_30_days": [
        {
          "action": "Hành động cụ thể cần thực hiện trong 30 ngày đầu (VD: 'Tối ưu hóa 10 video có hiệu suất cao nhất')",
          "priority": "high",
          "expected_impact": "Tác động dự kiến (VD: '+15% lượt xem từ tìm kiếm')",
          "resources_needed": "Nguồn lực cần thiết (VD: 'Editor, 5 giờ/tuần')"
        },
        {
          "action": "Hành động 2 cho 30 ngày",
          "priority": "high",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        }
      ],
      "phase_60_days": [
        {
          "action": "Hành động cho giai đoạn 31-60 ngày (VD: 'Thử nghiệm 3 format nội dung mới')",
          "priority": "medium",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        },
        {
          "action": "Hành động 2 cho 60 ngày",
          "priority": "medium",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        }
      ],
      "phase_90_days": [
        {
          "action": "Hành động dài hạn cho giai đoạn 61-90 ngày (VD: 'Xây dựng series nội dung mới')",
          "priority": "low",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        },
        {
          "action": "Hành động 2 cho 90 ngày",
          "priority": "low",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        }
      ]
    }
  }
}

QUAN TRỌNG:
- Trả về CHÍNH XÁC object JSON hợp lệ, không có markdown hay text khác
- Phân tích sâu sắc, chi tiết dựa trên dữ liệu thực tế
- Sử dụng tiếng Việt
- Đảm bảo tất cả các trường đều có giá trị hợp lệ
- content_niche_analysis: Phân tích CHÍNH XÁC niche dựa trên nội dung video, xác định thể loại và tỷ lệ phần trăm
- audience_analysis: ƯỚC TÍNH demographics dựa trên nội dung, ngôn ngữ, chủ đề của kênh (đây là ước tính, không phải data thực)
- Tạo ÍT NHẤT 2 audience personas khác nhau với ĐẦY ĐỦ thông tin chi tiết
- Tạo ÍT NHẤT 3 growth opportunities với priority khác nhau (high, medium, low)
- Video ideas phải CỤ THỂ cho kênh này, không chung chung
- Content calendar phải dựa trên phân tích thời gian đăng thực tế đã cung cấp
- SEO analysis phải phân tích từ khóa và tags THỰC TẾ từ dữ liệu video
- tag_analysis: Phân tích THỰC SỰ các tags từ video data, liệt kê most_used_tags với frequency THỰC TẾ
- Optimization opportunities phải CỤ THỂ và THỰC TIỄN, không chung chung
- Action plan phải có ÍT NHẤT 2 hành động cho mỗi giai đoạn (30/60/90 ngày)
- Mỗi hành động trong action plan phải cụ thể, có thể thực hiện được
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
            throw new APIError(
                "Invalid request parameters: The model parameters or request format is incorrect.",
                "GEMINI_API_ERROR",
                400
            );
        }

        // 401 Unauthorized - Authentication failure
        if (
            errorStatus === 401 ||
            errorMessage.includes("401") ||
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("API key")
        ) {
            throw new APIError(
                "Gemini API authentication failed: Invalid or missing API key.",
                "API_CONFIG",
                401
            );
        }

        // 403 Forbidden - Permission denied
        if (
            errorStatus === 403 ||
            errorMessage.includes("403") ||
            errorMessage.includes("Forbidden") ||
            errorMessage.includes("Permission denied")
        ) {
            throw new APIError(
                "Permission denied: Your Gemini API key doesn't have access to this model.",
                "API_CONFIG",
                403
            );
        }

        // 404 Not Found - Resource not found
        if (
            errorStatus === 404 ||
            errorMessage.includes("404") ||
            errorMessage.includes("Not Found")
        ) {
            throw new APIError(
                "Gemini model not found. The requested model may not exist or be unavailable.",
                "GEMINI_API_ERROR",
                404
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
            throw new APIError(
                "Gemini API quota exceeded. Please wait a few minutes before retrying.",
                "GEMINI_QUOTA",
                429
            );
        }

        // 500 Internal Server Error
        if (
            errorStatus === 500 ||
            errorMessage.includes("500") ||
            errorMessage.includes("Internal Server Error")
        ) {
            throw new APIError(
                "Gemini API internal server error. Please try again in a moment.",
                "GEMINI_API_ERROR",
                500
            );
        }

        // 503 Service Unavailable / Model Overload
        if (
            errorStatus === 503 ||
            errorMessage.includes("503") ||
            errorMessage.includes("Service Unavailable") ||
            errorMessage.includes("overloaded") ||
            errorMessage.includes("RESOURCE_EXHAUSTED")
        ) {
            throw new APIError(
                "Gemini AI model is currently overloaded. Please try again in 1-2 minutes.",
                "MODEL_OVERLOAD",
                503
            );
        }

        // 504 Gateway Timeout / Deadline Exceeded
        if (
            errorStatus === 504 ||
            errorMessage.includes("504") ||
            errorMessage.includes("Deadline Exceeded") ||
            errorMessage.includes("timeout")
        ) {
            throw new APIError(
                "Request timeout: The analysis took too long. Try with fewer videos.",
                "NETWORK_ERROR",
                504
            );
        }

        // Safety/Content filtering
        if (
            errorMessage.includes("SAFETY") ||
            errorMessage.includes("blocked") ||
            errorMessage.includes("BlockedReason")
        ) {
            throw new APIError(
                "Content blocked by Gemini safety filters.",
                "GEMINI_API_ERROR",
                400
            );
        }

        // Recitation issue
        if (
            errorMessage.includes("RECITATION") ||
            errorMessage.includes("recitation")
        ) {
            throw new APIError(
                "AI response issue detected. Please try again.",
                "AI_PARSE_ERROR",
                500
            );
        }

        // JSON parsing errors
        if (error instanceof SyntaxError || errorMessage.includes("JSON")) {
            throw new APIError(
                "AI returned invalid response format. Please try again.",
                "AI_PARSE_ERROR",
                500
            );
        }

        // Generic fallback error
        throw new APIError(
            `Failed to generate marketing analysis: ${errorMessage || "Unknown error occurred"}`,
            "UNKNOWN",
            500
        );
    }
}
