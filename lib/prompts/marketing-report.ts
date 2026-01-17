// Marketing Report Prompt Template for Gemini AI

export interface PromptData {
    channelName: string;
    channelDescription: string;
    subscriberCount: number;
    videoCount: number;
    totalViews: number;
    avgViews: number;
    topVideoViews: number;
    topPostingDays: string[];
    topPostingHours: string[];
    videosData: {
        title: string;
        views: number;
        likes: number;
        comments: number;
        publishedAt: string;
        tags: string[];
        description: string;
    }[];
}

export function buildMarketingReportPrompt(data: PromptData): string {
    const {
        channelName,
        channelDescription,
        subscriberCount,
        videoCount,
        totalViews,
        avgViews,
        topVideoViews,
        topPostingDays,
        topPostingHours,
        videosData,
    } = data;

    const totalLikes = videosData.reduce((sum, v) => sum + v.likes, 0);
    const totalComments = videosData.reduce((sum, v) => sum + v.comments, 0);
    const totalVideoViews = videosData.reduce((sum, v) => sum + v.views, 0);

    return `
Bạn là chuyên gia phân tích marketing YouTube cấp cao. Hãy phân tích kênh YouTube sau và tạo báo cáo marketing chi tiết, chuyên sâu.

THÔNG TIN KÊNH:
- Tên kênh: ${channelName}
- Mô tả: ${channelDescription}
- Số người đăng ký: ${subscriberCount.toLocaleString()}
- Tổng số video: ${videoCount}
- Tổng lượt xem: ${totalViews.toLocaleString()}
- Lượt xem trung bình/video: ${avgViews.toLocaleString()}
- Video hiệu suất cao nhất: ${topVideoViews.toLocaleString()} lượt xem

PHÂN TÍCH THỜI GIAN ĐĂNG:
- Các ngày đăng phổ biến: ${topPostingDays.join(", ")}
- Các giờ đăng phổ biến: ${topPostingHours.join(", ")}

DANH SÁCH VIDEO GẦN ĐÂY (${videosData.length} videos):
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

${JSON_STRUCTURE_TEMPLATE(
    videosData.length,
    totalVideoViews,
    totalLikes,
    subscriberCount,
    videoCount,
    avgViews,
    topVideoViews
)}

QUAN TRỌNG:
- Trả về CHÍNH XÁC object JSON hợp lệ, không có markdown hay text khác
- Phân tích sâu sắc, chi tiết dựa trên dữ liệu thực tế
- Sử dụng tiếng Việt
- Đảm bảo tất cả các trường đều có giá trị hợp lệ
- content_niche_analysis: Phân tích CHÍNH XÁC niche dựa trên nội dung video, xác định thể loại và tỷ lệ phần trăm
- audience_analysis: ƯỚC TÍNH demographics dựa trên nội dung, ngôn ngữ, chủ đề của kênh (global, không giới hạn quốc gia cụ thể)
- Tạo ÍT NHẤT 2 audience segments (NHÓM khán giả, không phải cá nhân) với ĐẦY ĐỦ thông tin
- Tạo ÍT NHẤT 3 growth opportunities với priority khác nhau (high, medium, low)
- Video ideas phải CỤ THỂ cho kênh này, không chung chung
- content_mix trong content_calendar phải RẤT CỤ THỂ:
  * Ví dụ kênh bánh: "Rainbow Cake", "KitKat Cake", "Chocolate Cake" - KHÔNG phải "Baking tutorials"
  * Ví dụ kênh factory: "Car Manufacturing", "Papaya Processing", "Chocolate Factory" - KHÔNG phải "Industrial videos"
  * Liệt kê specific_topics là những CHỦ ĐỀ THỰC SỰ kênh đang làm từ video data
- all_channel_tags: LIỆT KÊ TẤT CẢ tags THỰC TẾ từ video data đã cung cấp (không bỏ sót)
- tag_categories: PHẢI phân loại tags từ all_channel_tags vào 7 nhóm (Core, Sub-Niche, Branded, Topic, SEO/Discovery, Trending, Long-tail) - KHÔNG được tự nghĩ ra tags mới
- tag_analysis: Phân tích THỰC SỰ các tags từ video data, liệt kê most_used_tags với frequency THỰC TẾ
- SEO analysis phải phân tích từ khóa và tags THỰC TẾ từ dữ liệu video
- Optimization opportunities phải CỤ THỂ và THỰC TIỄN, không chung chung
- Action plan phải có ÍT NHẤT 2 hành động cho mỗi giai đoạn (30/60/90 ngày)
- Mỗi hành động trong action plan phải cụ thể, có thể thực hiện được
`;
}

function JSON_STRUCTURE_TEMPLATE(
    videoCount: number,
    totalViews: number,
    totalLikes: number,
    subscriberCount: number,
    totalVideoCount: number,
    avgViews: number,
    topVideoViews: number
): string {
    return `{
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
          {"country": "Quốc gia 1 (ước tính dựa trên ngôn ngữ nội dung)", "percentage": 70},
          {"country": "Quốc gia 2", "percentage": 20},
          {"country": "Khác", "percentage": 10}
        ],
        "primary_languages": ["Ngôn ngữ chính của kênh", "Ngôn ngữ phụ nếu có"],
        "income_level": "Ước tính mức thu nhập chung (VD: 'Low', 'Medium', 'Medium-High', 'High')",
        "education_level": "Ước tính trình độ học vấn (VD: 'High School', 'College', 'University')"
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
        "name": "Tên NHÓM khán giả (VD: 'Young Enthusiasts', 'Parents', 'Professionals')",
        "avatar_description": "Mô tả tổng quan về nhóm khán giả này - họ là ai, chiếm bao nhiêu % khán giả của kênh",
        "demographics": "Đặc điểm nhân khẩu học CHUNG của nhóm",
        "age_range": "Khoảng tuổi của nhóm (VD: '18-30')",
        "gender": "Giới tính chủ yếu của nhóm (VD: 'Mostly male ~70%' hoặc 'Balanced')",
        "location": "Vị trí địa lý phổ biến - dựa trên ngôn ngữ nội dung (VD: 'Urban areas', 'Global')",
        "occupation": "Các nghề nghiệp phổ biến trong nhóm (VD: 'Students, Office workers, Freelancers')",
        "interests": ["Sở thích chung của nhóm 1", "Sở thích 2", "Sở thích 3"],
        "pain_points": ["Vấn đề/nỗi đau chung của nhóm 1", "Vấn đề 2"],
        "goals": ["Mục tiêu chung nhóm muốn đạt được 1", "Mục tiêu 2"],
        "content_preferences": "Loại nội dung nhóm này thích xem nhất",
        "preferred_video_length": "Độ dài video phù hợp với nhóm (VD: '8-15 minutes')",
        "viewing_frequency": "Tần suất xem của nhóm (VD: '3-5 times/week')",
        "social_platforms": ["Các nền tảng nhóm hay sử dụng"],
        "buying_triggers": ["Yếu tố thúc đẩy mua hàng của nhóm 1", "Yếu tố 2"]
      },
      {
        "name": "Nhóm khán giả thứ 2 (phân khúc khác)",
        "avatar_description": "Mô tả tổng quan về nhóm khán giả phụ này",
        "demographics": "Đặc điểm nhân khẩu học của nhóm phụ",
        "age_range": "VD: '30-45'",
        "gender": "VD: 'Mostly female ~60%'",
        "location": "VD: 'Suburban/Rural areas'",
        "occupation": "VD: 'Small business owners, Managers, Homemakers'",
        "interests": ["Sở thích của nhóm 1", "Sở thích 2"],
        "pain_points": ["Vấn đề của nhóm 1", "Vấn đề 2"],
        "goals": ["Mục tiêu 1", "Mục tiêu 2"],
        "content_preferences": "Loại nội dung nhóm này yêu thích",
        "preferred_video_length": "VD: '5-10 minutes'",
        "viewing_frequency": "VD: '1-3 times/week'",
        "social_platforms": ["YouTube", "Facebook", "Instagram"],
        "buying_triggers": ["Yếu tố 1", "Yếu tố 2"]
      }
    ],
    "content_calendar": {
      "best_posting_days": ["Ngày tốt nhất 1", "Ngày tốt nhất 2"],
      "best_posting_times": ["Giờ tốt nhất 1", "Giờ tốt nhất 2"],
      "recommended_frequency": "Tần suất đăng đề xuất (VD: '3-4 video/tuần')",
      "content_mix": [
        {
          "content_type": "Loại nội dung chính (VD: 'Cake Decorating', 'Factory Tours', 'Tech Reviews')",
          "specific_topics": ["Chủ đề CỤ THỂ 1 mà kênh làm (VD: 'Rainbow Cake', 'Car Manufacturing', 'iPhone Reviews')", "Chủ đề cụ thể 2", "Chủ đề cụ thể 3"],
          "percentage": 50,
          "example_videos": ["Tên video ví dụ từ kênh"]
        },
        {
          "content_type": "Loại nội dung phụ 1",
          "specific_topics": ["Chủ đề cụ thể 1", "Chủ đề cụ thể 2"],
          "percentage": 30,
          "example_videos": ["Tên video ví dụ"]
        },
        {
          "content_type": "Loại nội dung phụ 2",
          "specific_topics": ["Chủ đề cụ thể 1"],
          "percentage": 20,
          "example_videos": ["Tên video ví dụ"]
        }
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
        "all_channel_tags": ["LIỆT KÊ TẤT CẢ các tags mà kênh đang sử dụng trong các video - lấy từ dữ liệu video thực tế đã cung cấp", "tag 2", "tag 3", "tag 4", "...tất cả tags"],
        "recommended_tags": ["Tag đề xuất MỚI mà kênh chưa dùng 1", "Tag đề xuất 2", "Tag đề xuất 3"],
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
            "category": "Core Tags (Tags cốt lõi)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags - tags chính định nghĩa niche kênh, dùng cho hầu hết video", "core tag 2", "core tag 3"],
            "effectiveness": "Hiệu quả của nhóm tag này (VD: 'Cao - là foundation của kênh')"
          },
          {
            "category": "Sub-Niche Tags (Tags niche phụ)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags - tags cho các chủ đề phụ trong kênh", "sub tag 2"],
            "effectiveness": "Hiệu quả (VD: 'Tốt - giúp phân loại nội dung chi tiết hơn')"
          },
          {
            "category": "Branded Tags (Tags thương hiệu)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags - tags có tên kênh, thương hiệu", "branded tag 2"],
            "effectiveness": "Hiệu quả (VD: 'Trung bình - tốt cho branding dài hạn')"
          },
          {
            "category": "Topic Tags (Tags chủ đề)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags - tags mô tả topic cụ thể của video", "topic tag 2", "topic tag 3"],
            "effectiveness": "Hiệu quả (VD: 'Cao - giúp tìm kiếm chính xác')"
          },
          {
            "category": "SEO/Discovery Tags (Tags tìm kiếm)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags - tags dùng để SEO và giúp khám phá", "seo tag 2"],
            "effectiveness": "Hiệu quả (VD: 'Cao - tăng reach organically')"
          },
          {
            "category": "Trending/Viral Tags (Tags xu hướng)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags - tags về xu hướng hiện tại nếu có"],
            "effectiveness": "Hiệu quả (VD: 'Cao khi có, không thường xuyên')"
          },
          {
            "category": "Long-tail Tags (Tags dài)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags - tags dạng cụm từ dài, specific hơn"],
            "effectiveness": "Hiệu quả (VD: 'Tốt - ít cạnh tranh, targeted traffic')"
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
        "total_posts": ${videoCount},
        "total_views": ${totalViews},
        "total_likes": ${totalLikes},
        "total_shares": 0,
        "total_saves": 0,
        "total_photos": 0,
        "total_videos": ${videoCount}
      },
      "channel_health": {
        "follower_count": "${subscriberCount.toLocaleString()}",
        "posting_frequency": "Ước tính tần suất đăng bài, trả về kết quả ngắn gọn (VD: '1 video/ngày', '3-4 video/tuần')",
        "er_rate": "Tính tỷ lệ tương tác theo công thức: (Tổng Like + Tổng Bình luận) / Tổng Lượt xem * 100%. CHỈ trả về kết quả cuối cùng dạng 'X.XX%', KHÔNG bao gồm công thức hay giải thích."
      },
      "channel_metrics": {
        "video_count": ${totalVideoCount},
        "follower_count": ${subscriberCount},
        "following_count": 0,
        "heart_count": ${totalLikes}
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
}`;
}
