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

export function buildMarketingReportPrompt(
    data: PromptData,
    language: "vi" | "en" = "vi"
): string {
    return language === "en"
        ? buildEnglishPrompt(data)
        : buildVietnamesePrompt(data);
}

function buildVietnamesePrompt(data: PromptData): string {
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

PHÂN TÍCH THỜI GIAN ĐĂNG (ĐÃ SẮP XẾP THEO THỨ TỰ THỜI GIAN):
- Các ngày đã đăng bài (từ Thứ 2 đến Chủ nhật): ${topPostingDays.join(", ")}
- Các giờ đã đăng bài (từ sớm đến muộn): ${topPostingHours.join(", ")}

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
    avgViews,
    topVideoViews
)}

QUAN TRỌNG:
- Trả về CHÍNH XÁC object JSON hợp lệ, không có markdown hay text khác
- Phân tích sâu sắc, chi tiết dựa trên dữ liệu thực tế
- Sử dụng tiếng Việt
- Đảm bảo tất cả các trường đều có giá trị hợp lệ
- FORMAT NGÀY: Chuyển đổi tên ngày từ tiếng Anh sang tiếng Việt theo bảng sau:
  * Monday → Thứ 2
  * Tuesday → Thứ 3
  * Wednesday → Thứ 4
  * Thursday → Thứ 5
  * Friday → Thứ 6
  * Saturday → Thứ 7
  * Sunday → Chủ nhật
- THỨ TỰ NGÀY/GIỜ: Dữ liệu "Các ngày đã đăng bài" và "Các giờ đã đăng bài" đã được sắp xếp theo thứ tự thời gian (Thứ 2→Chủ nhật, 0:00→23:00).
  Khi điền vào peak_viewing_days, peak_viewing_hours, best_posting_days, best_posting_times:
  - Sắp xếp các ngày theo thứ tự từ Thứ 2 đến Chủ nhật
  - Sắp xếp các giờ theo thứ tự từ 0:00 đến 23:00
  - Chuyển đổi tên ngày từ tiếng Anh sang tiếng Việt
- content_niche_analysis: Phân tích CHÍNH XÁC niche dựa trên nội dung video, xác định thể loại và tỷ lệ phần trăm
- audience_analysis: ƯỚC TÍNH demographics dựa trên nội dung, ngôn ngữ, chủ đề của kênh (toàn cầu, không giới hạn quốc gia cụ thể)
  * top_countries PHẢI là tên quốc gia CỤ THỂ BẰNG TIẾNG VIỆT (VD: "Hoa Kỳ", "Việt Nam", "Nhật Bản", "Ấn Độ", "Brasil"), KHÔNG được dùng "Quốc gia 1", "Quốc gia 2"
- Tạo ÍT NHẤT 2 audience segments (NHÓM khán giả, không phải cá nhân) với ĐẦY ĐỦ thông tin
- Tạo ÍT NHẤT 3 growth opportunities với priority khác nhau (cao, trung bình, thấp)
- Video ideas phải CỤ THỂ cho kênh này, không chung chung
- content_mix trong content_calendar phải RẤT CỤ THỂ:
  * QUAN TRỌNG: content_type và specific_topics PHẢI sử dụng ngôn ngữ CHÍNH của kênh (dựa trên tiêu đề và mô tả video)
  * Nếu kênh tiếng Anh: content_type = "Cake Decorating", specific_topics = ["Rainbow Cake", "KitKat Cake"]
  * Nếu kênh tiếng Việt: content_type = "Trang trí bánh", specific_topics = ["Bánh cầu vồng", "Bánh KitKat"]
  * Ví dụ kênh bánh: "Bánh cầu vồng", "Bánh KitKat", "Bánh Socola" - KHÔNG phải "Hướng dẫn làm bánh"
  * Ví dụ kênh nhà máy: "Sản xuất ô tô", "Chế biến đu đủ", "Nhà máy chocolate" - KHÔNG phải "Video công nghiệp"
  * Liệt kê specific_topics là những CHỦ ĐỀ THỰC SỰ kênh đang làm từ video data
- all_channel_tags: LIỆT KÊ TẤT CẢ tags THỰC TẾ từ video data đã cung cấp (không bỏ sót, không thêm tags mới)
- tag_categories: CỰC KỲ QUAN TRỌNG - PHÂN TÍCH CHUYÊN NGHIỆP:
  * CHỈ được phân loại tags từ all_channel_tags. TUYỆT ĐỐI KHÔNG được tự nghĩ ra hay thêm tags mới.
  * Tạo TÊN CATEGORY CHUYÊN NGHIỆP dựa trên phân tích SEO thực tế:
    - "Từ khóa nội dung cốt lõi" - Tags mô tả chủ đề chính của kênh
    - "Nhận diện thương hiệu" - Tags về tên kênh, thương hiệu
    - "Định dạng nội dung" - Tags về loại video (hướng dẫn, đánh giá, vlog...)
    - "Từ khóa đối tượng mục tiêu" - Tags thu hút đối tượng cụ thể
    - "Thẻ xu hướng" - Tags theo trend, hashtag phổ biến
    - "Từ khóa dài SEO" - Tags cụ thể, chi tiết để tối ưu tìm kiếm
    - "Thẻ chuyên ngành" - Tags đặc thù của lĩnh vực
    - "Thẻ địa lý/ngôn ngữ" - Tags về vị trí, ngôn ngữ
  * Mỗi category PHẢI có PURPOSE (mục đích) giải thích TẠI SAO nhóm tags này quan trọng cho SEO
  * Phân loại TẤT CẢ tags vào các category phù hợp (1 tag có thể thuộc nhiều category nếu hợp lý)
- tag_analysis: Phân tích THỰC SỰ các tags từ video data, liệt kê most_used_tags với frequency THỰC TẾ (đếm số lần xuất hiện)
- SEO analysis phải phân tích từ khóa và tags THỰC TẾ từ dữ liệu video
- Optimization opportunities phải CỤ THỂ và THỰC TIỄN, không chung chung
- Action plan phải có ÍT NHẤT 2 hành động cho mỗi giai đoạn (30/60/90 ngày)
- Mỗi hành động trong action plan phải cụ thể, có thể thực hiện được
`;
}

function buildEnglishPrompt(data: PromptData): string {
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

    return `
You are a senior YouTube marketing analyst. Analyze the following YouTube channel and create a detailed, in-depth marketing report.

CHANNEL INFORMATION:
- Channel Name: ${channelName}
- Description: ${channelDescription}
- Subscriber Count: ${subscriberCount.toLocaleString()}
- Total Videos: ${videoCount}
- Total Views: ${totalViews.toLocaleString()}
- Average Views/Video: ${avgViews.toLocaleString()}
- Highest Performing Video: ${topVideoViews.toLocaleString()} views

POSTING TIME ANALYSIS (SORTED CHRONOLOGICALLY):
- Days Posted (Monday to Sunday): ${topPostingDays.join(", ")}
- Hours Posted (Early to Late): ${topPostingHours.join(", ")}

RECENT VIDEO LIST (${videosData.length} videos):
${videosData
    .map(
        (v, i) => `
${i + 1}. ${v.title}
   - Views: ${v.views.toLocaleString()}
   - Likes: ${v.likes.toLocaleString()}
   - Comments: ${v.comments.toLocaleString()}
   - Published: ${new Date(v.publishedAt).toLocaleDateString(
       "en-US"
   )} at ${new Date(v.publishedAt).getHours()}:00
   - Tags: ${v.tags.slice(0, 5).join(", ") || "None"}
   - Description: ${v.description.substring(0, 200)}...
`
    )
    .join("\n")}

REQUIREMENTS:
Analyze and return a complete JSON object with the following structure:

${JSON_STRUCTURE_TEMPLATE_EN(
    avgViews,
    topVideoViews
)}

IMPORTANT:
- Return EXACTLY a valid JSON object, no markdown or other text
- Deep, detailed analysis based on actual data
- Use English language
- Ensure all fields have valid values
- DAY FORMAT: Keep day names in English (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
- DAY/HOUR ORDER: The "Days Posted" and "Hours Posted" data is already sorted chronologically (Monday→Sunday, 0:00→23:00).
  When filling in peak_viewing_days, peak_viewing_hours, best_posting_days, best_posting_times:
  - Sort days from Monday to Sunday
  - Sort hours from 0:00 to 23:00
  - Keep day names in English
- content_niche_analysis: Analyze EXACT niche based on video content, identify categories and percentages
- audience_analysis: ESTIMATE demographics based on content, language, channel topics (global, not limited to specific countries)
  * top_countries MUST be SPECIFIC country names (e.g., "United States", "Vietnam", "Japan", "India"), DO NOT use "Country 1", "Country 2"
- Create AT LEAST 2 audience segments (GROUPS, not individuals) with COMPLETE information
- Create AT LEAST 3 growth opportunities with different priorities (high, medium, low)
- Video ideas must be SPECIFIC to this channel, not generic
- content_mix in content_calendar must be VERY SPECIFIC:
  * IMPORTANT: content_type and specific_topics MUST use the channel's PRIMARY language (based on video titles and descriptions)
  * If English channel: content_type = "Cake Decorating", specific_topics = ["Rainbow Cake", "KitKat Cake"]
  * If Vietnamese channel: content_type = "Trang trí bánh", specific_topics = ["Bánh cầu vồng", "Bánh KitKat"]
  * Example for baking channel: "Rainbow Cake", "KitKat Cake", "Chocolate Cake" - NOT "Baking tutorials"
  * Example for factory channel: "Car Manufacturing", "Papaya Processing", "Chocolate Factory" - NOT "Industrial videos"
  * List specific_topics as ACTUAL TOPICS the channel is making from video data
- all_channel_tags: LIST ALL ACTUAL tags from video data provided (don't miss any, don't add new ones)
- tag_categories: EXTREMELY IMPORTANT - PROFESSIONAL ANALYSIS:
  * ONLY categorize tags from all_channel_tags. ABSOLUTELY DO NOT make up or add new tags.
  * Create PROFESSIONAL CATEGORY NAMES based on actual SEO analysis:
    - "Core Content Keywords" - Tags describing the main topics of the channel
    - "Brand & Channel Identity" - Tags about channel name, brand
    - "Content Format Tags" - Tags about video type (tutorial, review, vlog...)
    - "Audience Target Keywords" - Tags attracting specific audiences
    - "Trending & Viral Tags" - Trend tags, popular hashtags
    - "SEO Long-tail Keywords" - Specific, detailed tags for search optimization
    - "Niche-Specific Tags" - Industry-specific tags
    - "Geographic/Language Tags" - Location, language tags
  * Each category MUST have PURPOSE explaining WHY this group of tags is important for SEO
  * Categorize ALL tags into appropriate categories (1 tag can belong to multiple categories if logical)
- tag_analysis: Analyze ACTUAL tags from video data, list most_used_tags with ACTUAL frequency (count occurrences)
- SEO analysis must analyze ACTUAL keywords and tags from video data
- Optimization opportunities must be SPECIFIC and PRACTICAL, not generic
- Action plan must have AT LEAST 2 actions for each phase (30/60/90 days)
- Each action in action plan must be specific and actionable
`;
}

function JSON_STRUCTURE_TEMPLATE(
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
      "content_focus": {
        "overview": "Mô tả tổng quan về các nội dung chính mà kênh đang tập trung thực hiện (ví dụ: các loại bánh, review công nghệ...)",
        "topics": ["Chủ đề 1", "Chủ đề 2", "Chủ đề 3"]
      },
      "content_niche_analysis": {
        "primary_niche": "Niche chính của kênh (VD: 'Game', 'Làm đẹp', 'Review công nghệ', 'Giáo dục')",
        "sub_niches": ["Niche phụ 1", "Niche phụ 2"],
        "content_categories": [
          {
            "category": "Tên thể loại nội dung (VD: 'Hướng dẫn', 'Đánh giá', 'Vlog')",
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
      "content_structure_analysis": {
        "hook_tactics": "Chiến thuật thu hút trong 3-5 giây đầu",
        "storytelling": "Cấu trúc kể chuyện",
        "cta_strategy": "Chiến lược kêu gọi hành động (CTA)",
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
          {"country": "TÊN QUỐC GIA CỤ THỂ BẰNG TIẾNG VIỆT (ước tính dựa trên ngôn ngữ nội dung - VD: 'Hoa Kỳ', 'Việt Nam', 'Nhật Bản', 'Ấn Độ', 'Brasil')", "percentage": 70},
          {"country": "Quốc gia cụ thể thứ 2 bằng tiếng Việt (VD: 'Philippines', 'Thái Lan', 'Indonesia')", "percentage": 20},
          {"country": "Khác", "percentage": 10}
        ],
        "primary_languages": ["Ngôn ngữ chính của kênh", "Ngôn ngữ phụ nếu có"]
      },
      "behavior": {
        "estimated_watch_time": "Ước tính thời gian xem trung bình (VD: '5-8 phút/video')",
        "returning_vs_new_ratio": "Tỷ lệ người xem quay lại vs mới (VD: '60% quay lại, 40% mới')",
        "subscriber_growth_trend": "Xu hướng tăng trưởng subscriber (VD: 'Tăng đều 2-3%/tháng', 'Đang chậm lại')",
        "peak_viewing_days": ["Sử dụng dữ liệu từ 'Các ngày đã đăng bài' ở trên, sắp xếp theo thứ tự từ Thứ 2 đến Chủ nhật (VD: 'Thứ 2', 'Thứ 4', 'Thứ 7', 'Chủ nhật')"],
        "peak_viewing_hours": ["Sử dụng dữ liệu từ 'Các giờ đã đăng bài' ở trên, sắp xếp theo thứ tự từ 0:00 đến 23:00 (VD: '8:00', '14:00', '20:00')"],
        "engagement_patterns": "Mô tả cách khán giả tương tác (VD: 'Comment nhiều ở video hướng dẫn', 'Like cao ở video giải trí')",
        "device_preferences": "Thiết bị xem chủ yếu (VD: '70% Di động, 25% Máy tính, 5% TV')"
      },
      "psychographics": {
        "values": ["Giá trị quan trọng với khán giả 1", "Giá trị 2"],
        "lifestyle": "Mô tả lối sống của khán giả mục tiêu",
        "purchase_behavior": "Hành vi mua sắm liên quan đến nội dung kênh"
      }
    },
    "audience_personas": [
      {
        "name": "Tên NHÓM khán giả (VD: 'Giới trẻ năng động', 'Phụ huynh', 'Chuyên gia nghề nghiệp')",
        "avatar_description": "Mô tả tổng quan về nhóm khán giả này - họ là ai, chiếm bao nhiêu % khán giả của kênh",
        "demographics": "Đặc điểm nhân khẩu học CHUNG của nhóm",
        "age_range": "Khoảng tuổi của nhóm (VD: '18-30')",
        "gender": "Giới tính chủ yếu của nhóm (VD: 'Chủ yếu nam ~70%' hoặc 'Cân bằng')",
        "location": "Vị trí địa lý phổ biến - dựa trên ngôn ngữ nội dung (VD: 'Khu vực thành thị', 'Toàn cầu')",
        "occupation": "Các nghề nghiệp phổ biến trong nhóm (VD: 'Học sinh sinh viên, Nhân viên văn phòng, Freelancer')",
        "interests": ["Sở thích chung của nhóm 1", "Sở thích 2", "Sở thích 3"],
        "pain_points": ["Vấn đề/nỗi đau chung của nhóm 1", "Vấn đề 2"],
        "goals": ["Mục tiêu chung nhóm muốn đạt được 1", "Mục tiêu 2"],
        "content_preferences": "Loại nội dung nhóm này thích xem nhất",
        "preferred_video_length": "Độ dài video phù hợp với nhóm (VD: '8-15 phút')",
        "viewing_frequency": "Tần suất xem của nhóm (VD: '3-5 lần/tuần')",
        "social_platforms": ["Các nền tảng nhóm hay sử dụng"],
        "buying_triggers": ["Yếu tố thúc đẩy mua hàng của nhóm 1", "Yếu tố 2"]
      },
      {
        "name": "Nhóm khán giả thứ 2 (phân khúc khác)",
        "avatar_description": "Mô tả tổng quan về nhóm khán giả phụ này",
        "demographics": "Đặc điểm nhân khẩu học của nhóm phụ",
        "age_range": "VD: '30-45'",
        "gender": "VD: 'Chủ yếu nữ ~60%'",
        "location": "VD: 'Khu vực ngoại ô/Nông thôn'",
        "occupation": "VD: 'Chủ doanh nghiệp nhỏ, Quản lý, Nội trợ'",
        "interests": ["Sở thích của nhóm 1", "Sở thích 2"],
        "pain_points": ["Vấn đề của nhóm 1", "Vấn đề 2"],
        "goals": ["Mục tiêu 1", "Mục tiêu 2"],
        "content_preferences": "Loại nội dung nhóm này yêu thích",
        "preferred_video_length": "VD: '5-10 phút'",
        "viewing_frequency": "VD: '1-3 lần/tuần'",
        "social_platforms": ["YouTube", "Facebook", "Instagram"],
        "buying_triggers": ["Yếu tố 1", "Yếu tố 2"]
      }
    ],
    "content_calendar": {
      "best_posting_days": ["Sử dụng dữ liệu từ 'Các ngày đã đăng bài' ở trên, sắp xếp theo thứ tự từ Thứ 2 đến Chủ nhật (VD: 'Thứ 2', 'Thứ 4', 'Thứ 7', 'Chủ nhật')"],
      "best_posting_times": ["Sử dụng dữ liệu từ 'Các giờ đã đăng bài' ở trên, sắp xếp theo thứ tự từ 0:00 đến 23:00 (VD: '8:00', '14:00', '20:00')"],
      "recommended_frequency": "Tần suất đăng đề xuất (VD: '3-4 video/tuần')",
      "best_performing_overview": "Tổng quan về các video hiệu suất tốt nhất - phân tích lý do thành công và bài học rút ra",
      "worst_performing_overview": "Tổng quan về các video hiệu suất thấp - phân tích lý do kém hiệu quả và cách khắc phục",
      "content_mix": [
        {
          "content_type": "Loại nội dung chính - SỬ DỤNG NGÔN NGỮ CỦA KÊNH (VD: 'Cake Decorating' nếu kênh tiếng Anh, 'Trang trí bánh' nếu kênh tiếng Việt)",
          "pillar_purpose": "Mục đích chiến lược của trụ cột nội dung này (VD: 'Thu hút khán giả mới', 'Xây dựng chuyên môn', 'Tạo viral', 'Giữ chân khán giả cũ')",
          "specific_topics": ["Chủ đề CỤ THỂ 1 - SỬ DỤNG NGÔN NGỮ CỦA KÊNH (VD: 'Rainbow Cake' nếu kênh tiếng Anh, 'Bánh cầu vồng' nếu kênh tiếng Việt)", "Chủ đề cụ thể 2", "Chủ đề cụ thể 3"],
          "percentage": 50,
          "example_videos": ["Tên video ví dụ từ kênh"],
          "performance_insight": "Phân tích hiệu suất của loại nội dung này - lượt xem trung bình, tỷ lệ tương tác, và xu hướng (VD: 'Hiệu suất cao - View trung bình 200K, engagement 5%')"
        },
        {
          "content_type": "Loại nội dung phụ 1",
          "pillar_purpose": "Mục đích của trụ cột này",
          "specific_topics": ["Chủ đề cụ thể 1", "Chủ đề cụ thể 2"],
          "percentage": 30,
          "example_videos": ["Tên video ví dụ"],
          "performance_insight": "Phân tích hiệu suất loại nội dung này"
        },
        {
          "content_type": "Loại nội dung phụ 2",
          "pillar_purpose": "Mục đích của trụ cột này",
          "specific_topics": ["Chủ đề cụ thể 1"],
          "percentage": 20,
          "example_videos": ["Tên video ví dụ"],
          "performance_insight": "Phân tích hiệu suất loại nội dung này"
        }
      ]
    },
    "growth_opportunities": [
      {
        "opportunity": "Tên cơ hội tăng trưởng",
        "description": "Mô tả chi tiết cơ hội",
        "priority": "cao",
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
            "category": "TÊN CATEGORY CHUYÊN NGHIỆP (VD: 'Từ khóa nội dung cốt lõi', 'Nhận diện thương hiệu', 'Định dạng nội dung', 'Từ khóa đối tượng mục tiêu', 'Thẻ xu hướng', 'Từ khóa dài SEO'...)",
            "purpose": "MỤC ĐÍCH CỤ THỂ của category này trong chiến lược SEO (VD: 'Giúp video xuất hiện trong tìm kiếm chủ đề chính, tăng khả năng phát hiện bởi đối tượng mục tiêu', 'Xây dựng nhận diện thương hiệu và tăng tỷ lệ người xem quay lại kênh'...)",
            "tags": ["CHỈ sử dụng tags THỰC TẾ từ all_channel_tags thuộc category này", "tag 2", "tag 3"],
            "effectiveness": "Đánh giá hiệu quả SEO của nhóm tag này dựa trên hiệu suất video (VD: 'Cao - Video có tags này có view trung bình cao hơn 35%', 'Trung bình - Đang hoạt động tốt nhưng cần tối ưu thêm', 'Thấp - Cần xem xét lại hoặc thay thế')"
          },
          {
            "category": "Category thứ 2 - Tên chuyên nghiệp phản ánh đúng nhóm tags",
            "purpose": "Giải thích rõ ràng vai trò của nhóm tags này trong việc thu hút và giữ chân khán giả",
            "tags": ["Tags từ all_channel_tags thuộc category này"],
            "effectiveness": "Đánh giá hiệu quả với số liệu cụ thể nếu có"
          },
          {
            "category": "Category thứ 3 - Tên phản ánh mục đích SEO cụ thể",
            "purpose": "Mô tả tác động của nhóm tags này lên khả năng tìm kiếm và tương tác",
            "tags": ["Tags từ all_channel_tags"],
            "effectiveness": "Đánh giá dựa trên phân tích thực tế"
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
          "priority": "cao",
          "expected_impact": "Tác động dự kiến (VD: '+15% lượt xem từ tìm kiếm')",
          "resources_needed": "Nguồn lực cần thiết (VD: 'Editor, 5 giờ/tuần')"
        },
        {
          "action": "Hành động 2 cho 30 ngày",
          "priority": "cao",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        }
      ],
      "phase_60_days": [
        {
          "action": "Hành động cho giai đoạn 31-60 ngày (VD: 'Thử nghiệm 3 format nội dung mới')",
          "priority": "trung bình",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        },
        {
          "action": "Hành động 2 cho 60 ngày",
          "priority": "trung bình",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        }
      ],
      "phase_90_days": [
        {
          "action": "Hành động dài hạn cho giai đoạn 61-90 ngày (VD: 'Xây dựng series nội dung mới')",
          "priority": "thấp",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        },
        {
          "action": "Hành động 2 cho 90 ngày",
          "priority": "thấp",
          "expected_impact": "Tác động dự kiến",
          "resources_needed": "Nguồn lực"
        }
      ]
    }
  }
}`;
}

function JSON_STRUCTURE_TEMPLATE_EN(
    avgViews: number,
    topVideoViews: number
): string {
    return `{
  "report_part_2": {
    "ad_strategy": {
      "overview": "Overview of advertising strategy (if any)",
      "ad_angles": ["Ad angle 1", "Angle 2"],
      "ad_creatives": null,
      "target_audience_clues": "Target audience analysis based on content"
    },
    "funnel_analysis": {
      "tofu": "TOFU (Top of Funnel) analysis - how the channel attracts new viewers",
      "mofu": "MOFU (Middle of Funnel) analysis - how trust is built",
      "bofu": "BOFU (Bottom of Funnel) analysis - CTA and conversion"
    },
    "strategy_analysis": {
      "brand_identity": {
        "visual_style": "Description of the channel's visual style",
        "tone_of_voice": "Tone and core messaging",
        "brand_positioning": "Brand positioning"
      },
      "content_focus": {
        "overview": "Overall description of main content areas the channel focuses on (e.g., cake types, tech reviews...)",
        "topics": ["Topic 1", "Topic 2", "Topic 3"]
      },
      "content_niche_analysis": {
        "primary_niche": "Channel's main niche (e.g., 'Gaming', 'Beauty', 'Tech Review', 'Education')",
        "sub_niches": ["Sub-niche 1", "Sub-niche 2"],
        "content_categories": [
          {
            "category": "Content category name (e.g., 'Tutorial', 'Review', 'Vlog')",
            "percentage": 40,
            "description": "Detailed description of this category on the channel"
          },
          {
            "category": "Category 2",
            "percentage": 35,
            "description": "Description"
          },
          {
            "category": "Category 3",
            "percentage": 25,
            "description": "Description"
          }
        ],
        "niche_positioning": "Channel's position in the niche - leading, developing, or newcomer",
        "competitor_landscape": "Competitive analysis - similar channels, differentiating factors",
        "content_uniqueness": "What makes this channel's content unique compared to competitors"
      },
      "content_structure_analysis": {
        "hook_tactics": "Hook tactics in the first 3-5 seconds",
        "storytelling": "Storytelling structure",
        "cta_strategy": "Call-to-Action strategy",
        "emotional_triggers": "Emotional triggers exploited"
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
          {"country": "SPECIFIC COUNTRY NAME (estimated based on content language - e.g., 'United States', 'Vietnam', 'Japan', 'India', 'Brazil')", "percentage": 70},
          {"country": "Specific country 2 (e.g., 'Philippines', 'Thailand', 'Indonesia')", "percentage": 20},
          {"country": "Other", "percentage": 10}
        ],
        "primary_languages": ["Channel's main language", "Secondary language if any"]
      },
      "behavior": {
        "estimated_watch_time": "Estimated average watch time (e.g., '5-8 minutes/video')",
        "returning_vs_new_ratio": "Returning vs new viewers ratio (e.g., '60% returning, 40% new')",
        "subscriber_growth_trend": "Subscriber growth trend (e.g., 'Steady growth 2-3%/month', 'Slowing down')",
        "peak_viewing_days": ["Use data from 'Days Posted' above, sort from Monday to Sunday (e.g., 'Monday', 'Wednesday', 'Saturday', 'Sunday')"],
        "peak_viewing_hours": ["Use data from 'Hours Posted' above, sort from 0:00 to 23:00 (e.g., '8:00', '14:00', '20:00')"],
        "engagement_patterns": "Describe how audience interacts (e.g., 'High comments on tutorial videos', 'High likes on entertainment videos')",
        "device_preferences": "Primary viewing devices (e.g., '70% Mobile, 25% Desktop, 5% TV')"
      },
      "psychographics": {
        "values": ["Important value to audience 1", "Value 2"],
        "lifestyle": "Description of target audience lifestyle",
        "purchase_behavior": "Purchasing behavior related to channel content"
      }
    },
    "audience_personas": [
      {
        "name": "Audience GROUP name (e.g., 'Young Enthusiasts', 'Parents', 'Professionals')",
        "avatar_description": "Overview description of this audience group - who they are, what percentage of channel audience",
        "demographics": "GENERAL demographic characteristics of the group",
        "age_range": "Age range of the group (e.g., '18-30')",
        "gender": "Predominant gender of the group (e.g., 'Mostly male ~70%' or 'Balanced')",
        "location": "Common geographic locations - based on content language (e.g., 'Urban areas', 'Global')",
        "occupation": "Common occupations in the group (e.g., 'Students, Office workers, Freelancers')",
        "interests": ["Common interest of group 1", "Interest 2", "Interest 3"],
        "pain_points": ["Common problem/pain point of group 1", "Problem 2"],
        "goals": ["Common goal the group wants to achieve 1", "Goal 2"],
        "content_preferences": "Type of content this group prefers to watch",
        "preferred_video_length": "Video length suitable for the group (e.g., '8-15 minutes')",
        "viewing_frequency": "Group's viewing frequency (e.g., '3-5 times/week')",
        "social_platforms": ["Platforms the group commonly uses"],
        "buying_triggers": ["Purchasing trigger for the group 1", "Trigger 2"]
      },
      {
        "name": "Second audience group (different segment)",
        "avatar_description": "Overview description of this secondary audience group",
        "demographics": "Demographic characteristics of the secondary group",
        "age_range": "e.g., '30-45'",
        "gender": "e.g., 'Mostly female ~60%'",
        "location": "e.g., 'Suburban/Rural areas'",
        "occupation": "e.g., 'Small business owners, Managers, Homemakers'",
        "interests": ["Group interest 1", "Interest 2"],
        "pain_points": ["Group problem 1", "Problem 2"],
        "goals": ["Goal 1", "Goal 2"],
        "content_preferences": "Type of content this group loves",
        "preferred_video_length": "e.g., '5-10 minutes'",
        "viewing_frequency": "e.g., '1-3 times/week'",
        "social_platforms": ["YouTube", "Facebook", "Instagram"],
        "buying_triggers": ["Trigger 1", "Trigger 2"]
      }
    ],
    "content_calendar": {
      "best_posting_days": ["Use data from 'Days Posted' above, sort from Monday to Sunday (e.g., 'Monday', 'Wednesday', 'Saturday', 'Sunday')"],
      "best_posting_times": ["Use data from 'Hours Posted' above, sort from 0:00 to 23:00 (e.g., '8:00', '14:00', '20:00')"],
      "recommended_frequency": "Recommended posting frequency (e.g., '3-4 videos/week')",
      "best_performing_overview": "Overview of best performing videos - analyze reasons for success and key takeaways",
      "worst_performing_overview": "Overview of underperforming videos - analyze reasons for poor performance and how to improve",
      "content_mix": [
        {
          "content_type": "Main content type - USE CHANNEL'S LANGUAGE (e.g., 'Cake Decorating' for English channel, 'Trang trí bánh' for Vietnamese channel)",
          "pillar_purpose": "Strategic purpose of this content pillar (e.g., 'Attract new audience', 'Build expertise', 'Create viral moments', 'Retain existing audience')",
          "specific_topics": ["SPECIFIC topic 1 - USE CHANNEL'S LANGUAGE (e.g., 'Rainbow Cake' for English channel, 'Bánh cầu vồng' for Vietnamese channel)", "Specific topic 2", "Specific topic 3"],
          "percentage": 50,
          "example_videos": ["Example video title from the channel"],
          "performance_insight": "Performance analysis of this content type - average views, engagement rate, and trends (e.g., 'High performance - 200K avg views, 5% engagement')"
        },
        {
          "content_type": "Secondary content type 1",
          "pillar_purpose": "Purpose of this pillar",
          "specific_topics": ["Specific topic 1", "Specific topic 2"],
          "percentage": 30,
          "example_videos": ["Example video title"],
          "performance_insight": "Performance analysis of this content type"
        },
        {
          "content_type": "Secondary content type 2",
          "pillar_purpose": "Purpose of this pillar",
          "specific_topics": ["Specific topic 1"],
          "percentage": 20,
          "example_videos": ["Example video title"],
          "performance_insight": "Performance analysis of this content type"
        }
      ]
    },
    "growth_opportunities": [
      {
        "opportunity": "Growth opportunity name",
        "description": "Detailed description of the opportunity",
        "priority": "high",
        "expected_impact": "Expected impact (e.g., '+20% subscribers in 3 months')"
      }
    ],
    "seo_analysis": {
      "keyword_strategy": {
        "top_keywords": ["Most popular keyword 1", "Keyword 2", "Keyword 3"],
        "keyword_density": "Analysis of keyword density in video titles and descriptions. Evaluate whether the channel optimizes keywords well.",
        "missing_keywords": ["Potential untapped keyword 1", "Potential keyword 2"]
      },
      "tag_analysis": {
        "tag_coverage": "Assessment of tag coverage (Good/Average/Poor). Analyze whether the channel uses tags fully and effectively.",
        "all_channel_tags": ["LIST ALL tags the channel is using in videos - taken from actual video data provided", "tag 2", "tag 3", "tag 4", "...all tags"],
        "recommended_tags": ["NEW recommended tag the channel hasn't used 1", "Recommended tag 2", "Recommended tag 3"],
        "tag_consistency": "Assessment of tag consistency across videos. Is there a clear tag strategy?",
        "most_used_tags": [
          {
            "tag": "Most used tag",
            "frequency": 15,
            "performance_impact": "Performance impact (e.g., 'High - videos with this tag have 20% higher views')"
          },
          {
            "tag": "2nd most popular tag",
            "frequency": 12,
            "performance_impact": "Performance impact"
          },
          {
            "tag": "3rd most popular tag",
            "frequency": 10,
            "performance_impact": "Performance impact"
          }
        ],
        "tag_categories": [
          {
            "category": "PROFESSIONAL CATEGORY NAME (e.g., 'Core Content Keywords', 'Brand & Channel Identity', 'Content Format Tags', 'Audience Target Keywords', 'Trending & Viral Tags', 'SEO Long-tail Keywords'...)",
            "purpose": "SPECIFIC PURPOSE of this category in SEO strategy (e.g., 'Helps videos appear in main topic searches, increases discoverability by target audience', 'Builds brand recognition and increases viewer return rate to channel'...)",
            "tags": ["ONLY use ACTUAL tags from all_channel_tags belonging to this category", "tag 2", "tag 3"],
            "effectiveness": "SEO effectiveness assessment of this tag group based on video performance (e.g., 'High - Videos with these tags have 35% higher average views', 'Medium - Working well but needs more optimization', 'Low - Needs review or replacement')"
          },
          {
            "category": "Category 2 - Professional name reflecting tag group correctly",
            "purpose": "Clear explanation of this tag group's role in attracting and retaining audience",
            "tags": ["Tags from all_channel_tags belonging to this category"],
            "effectiveness": "Effectiveness assessment with specific metrics if available"
          },
          {
            "category": "Category 3 - Name reflecting specific SEO purpose",
            "purpose": "Description of this tag group's impact on search and engagement capabilities",
            "tags": ["Tags from all_channel_tags"],
            "effectiveness": "Assessment based on actual analysis"
          }
        ],
        "competitor_tags": ["Tag that competitors use but this channel doesn't 1", "Competitor tag 2", "Competitor tag 3"],
        "long_tail_opportunities": ["Potential long-tail keyword 1", "Long-tail keyword 2", "Long-tail keyword 3"],
        "tag_optimization_score": "Overall tag optimization score (e.g., '7/10 - Need to improve trending tags')"
      },
      "optimization_opportunities": [
        {
          "area": "Video titles",
          "issue": "Current issue with titles (e.g., 'Missing main keyword', 'Too long')",
          "recommendation": "Specific improvement recommendation",
          "priority": "high"
        },
        {
          "area": "Video descriptions",
          "issue": "Issue with descriptions",
          "recommendation": "Improvement recommendation",
          "priority": "medium"
        }
      ]
    }
  },
  "report_part_3": {
    "strengths": [
      "Strength 1",
      "Strength 2",
      "Strength 3"
    ],
    "executive_summary": "Overall summary of the channel and marketing strategy",
    "actionable_insights": {
      "learn_from": "What can be learned from this channel",
      "avoid": "What to avoid",
      "video_ideas": [
        {
          "title": "Engaging, specific video title for this channel",
          "concept": "Detailed concept description, implementation approach",
          "estimated_views": "View estimate based on channel performance (e.g., '${Math.round(
              avgViews * 0.8
          ).toLocaleString()} - ${Math.round(
        avgViews * 1.5
    ).toLocaleString()}')",
          "content_type": "Content type (tutorial/review/vlog/entertainment...)"
        },
        {
          "title": "Video title 2 - viral potential",
          "concept": "Concept description with viral potential based on channel's highest performing video",
          "estimated_views": "View estimate (e.g., '${Math.round(
              topVideoViews * 0.5
          ).toLocaleString()} - ${Math.round(
        topVideoViews * 0.8
    ).toLocaleString()}')",
          "content_type": "Content type"
        },
        {
          "title": "Video title 3 - safe bet",
          "concept": "Safe concept description, suitable for current audience",
          "estimated_views": "View estimate",
          "content_type": "Content type"
        }
      ]
    },
    "weaknesses_opportunities": [
      "Weakness/Opportunity 1",
      "Weakness/Opportunity 2",
      "Weakness/Opportunity 3"
    ],
    "action_plan": {
      "phase_30_days": [
        {
          "action": "Specific action to take in first 30 days (e.g., 'Optimize top 10 performing videos')",
          "priority": "high",
          "expected_impact": "Expected impact (e.g., '+15% views from search')",
          "resources_needed": "Resources needed (e.g., 'Editor, 5 hours/week')"
        },
        {
          "action": "Action 2 for 30 days",
          "priority": "high",
          "expected_impact": "Expected impact",
          "resources_needed": "Resources"
        }
      ],
      "phase_60_days": [
        {
          "action": "Action for 31-60 day period (e.g., 'Experiment with 3 new content formats')",
          "priority": "medium",
          "expected_impact": "Expected impact",
          "resources_needed": "Resources"
        },
        {
          "action": "Action 2 for 60 days",
          "priority": "medium",
          "expected_impact": "Expected impact",
          "resources_needed": "Resources"
        }
      ],
      "phase_90_days": [
        {
          "action": "Long-term action for 61-90 day period (e.g., 'Build new content series')",
          "priority": "low",
          "expected_impact": "Expected impact",
          "resources_needed": "Resources"
        },
        {
          "action": "Action 2 for 90 days",
          "priority": "low",
          "expected_impact": "Expected impact",
          "resources_needed": "Resources"
        }
      ]
    }
  }
}`;
}
