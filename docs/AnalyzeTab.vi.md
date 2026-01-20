# Tài liệu Ánh xạ Component AnalysisTab

Tài liệu này ánh xạ tất cả các phần trong `AnalysisTab.tsx` đến cấu trúc dữ liệu tương ứng trong prompt Gemini AI (`lib/prompts/marketing-report.ts`).

---

## Tổng quan

Component AnalysisTab hiển thị dữ liệu **report_part_2** được tạo bởi Gemini AI. Prompt được cấu trúc để trả về phân tích marketing toàn diện ở định dạng JSON.

**Cấu trúc dữ liệu chính:**
- `report_part_2`: Phân tích chiến lược, khán giả, SEO và định lượng
- `report_part_3`: Insights, khuyến nghị và kế hoạch hành động (hiển thị trong InsightsTab)

---

## Ánh xạ các Phần (AnalysisTab.tsx → Dữ liệu Prompt)

### 1. **Phân tích Chiến lược (Strategy Analysis)**
**Vị trí:** `AnalysisTab.tsx:147-441`
**Đường dẫn Prompt:** `report_part_2.strategy_analysis`

#### Các phần con:
- **Nhận diện Thương hiệu** → `strategy_analysis.brand_identity`
  - Phong cách Hình ảnh → `brand_identity.visual_style`
  - Giọng điệu → `brand_identity.tone_of_voice`
  - Định vị Thương hiệu → `brand_identity.brand_positioning`

- **Tổng quan Chiến lược Quảng cáo** → `report_part_2.ad_strategy`
  - Tổng quan → `ad_strategy.overview`
  - Góc độ Quảng cáo → `ad_strategy.ad_angles[]`
  - Manh mối Đối tượng Mục tiêu → `ad_strategy.target_audience_clues`

**Hướng dẫn Prompt (dòng 147-151):**
```
"ad_strategy": {
  "overview": "Tổng quan về chiến lược quảng cáo (nếu có)",
  "ad_angles": ["Góc độ quảng cáo 1", "Góc độ 2"],
  "target_audience_clues": "Phân tích đối tượng mục tiêu dựa trên nội dung"
}
```

**Phân tích:**
- ✅ **Giữ lại:** Nhận diện thương hiệu là nền tảng cho phân tích marketing
- ⚠️ **Cân nhắc:** Chiến lược quảng cáo có thể tối thiểu cho các kênh không thương mại
- 💡 **Nâng cấp:** Thêm phân tích hình ảnh từ thumbnails (hiện tại chỉ có text)

---

### 2. **Trụ cột Nội dung (Content Pillars)**
**Vị trí:** `AnalysisTab.tsx:442-468`
**Đường dẫn Prompt:** `report_part_2.strategy_analysis.content_pillars[]`

**Hướng dẫn Prompt (dòng 164-170):**
```
"content_pillars": [
  {
    "pillar": "Tên trụ cột nội dung 1",
    "purpose": "Mục đích",
    "description": "Mô tả chi tiết"
  }
]
```

**Phân tích:**
- ✅ **Giữ lại:** Thiết yếu để hiểu chiến lược kênh
- 💡 **Nâng cấp:** Thêm biểu đồ trực quan (hiển thị phân bổ các trụ cột)
- 💡 **Nâng cấp:** Liên kết trụ cột với các video ví dụ thực tế

---

### 3. **Trọng tâm & Chủ đề Nội dung (Content Focus & Topics)**
**Vị trí:** `AnalysisTab.tsx:469-520` (ước tính)
**Đường dẫn Prompt:** `report_part_2.strategy_analysis.content_focus`

**Hướng dẫn Prompt (dòng 171-174):**
```
"content_focus": {
  "overview": "Mô tả tổng quan về các nội dung chính...",
  "topics": ["Chủ đề 1", "Chủ đề 2", "Chủ đề 3"]
}
```

**Phân tích:**
- ✅ **Giữ lại:** Quan trọng cho chiến lược nội dung
- 💡 **Nâng cấp:** Thêm phân tích tần suất chủ đề (chủ đề nào xuất hiện nhiều nhất)

---

### 4. **Phân tích Thị trường Ngách (Content Niche Analysis)**
**Vị trí:** `AnalysisTab.tsx:471-738` (ước tính)
**Đường dẫn Prompt:** `report_part_2.strategy_analysis.content_niche_analysis`

#### Các phần con:
- Thị trường Ngách Chính → `content_niche_analysis.primary_niche`
- Thị trường Ngách Phụ → `content_niche_analysis.sub_niches[]`
- Danh mục Nội dung → `content_niche_analysis.content_categories[]`
  - Tên danh mục, phần trăm, mô tả
- Định vị Thị trường Ngách → `content_niche_analysis.niche_positioning`
- Bối cảnh Cạnh tranh → `content_niche_analysis.competitor_landscape`
- Tính Độc đáo Nội dung → `content_niche_analysis.content_uniqueness`

**Hướng dẫn Prompt (dòng 175-198):**
```
"content_niche_analysis": {
  "primary_niche": "Niche chính của kênh",
  "sub_niches": ["Niche phụ 1", "Niche phụ 2"],
  "content_categories": [
    {
      "category": "Tên thể loại nội dung",
      "percentage": 40,
      "description": "Mô tả chi tiết"
    }
  ],
  ...
}
```

**Phân tích:**
- ✅ **Giữ lại:** Phân tích thị trường ngách toàn diện rất có giá trị
- 💡 **Nâng cấp:** Thêm trực quan hóa phần trăm (biểu đồ tròn)
- 💡 **Nâng cấp:** Thêm liên kết/ví dụ kênh đối thủ
- ⚠️ **Cân nhắc:** Có thể quá chi tiết cho các kênh đơn giản

---

### 5. **Phân tích Cấu trúc Nội dung (Content Structure Analysis)**
**Vị trí:** `AnalysisTab.tsx:741-910` (ước tính)
**Đường dẫn Prompt:** `report_part_2.strategy_analysis.content_structure_analysis`

#### Các phần con:
- Chiến thuật Hook → `content_structure_analysis.hook_tactics`
- Kể chuyện → `content_structure_analysis.storytelling`
- Chiến lược CTA → `content_structure_analysis.cta_strategy`
- Yếu tố Cảm xúc → `content_structure_analysis.emotional_triggers`
- Phân tích Nội dung Hàng đầu → `strategy_analysis.top_content_analysis`
  - Hiệu suất Tốt nhất → `top_content_analysis.best_performing`
  - Hiệu suất Kém nhất → `top_content_analysis.worst_performing`

**Hướng dẫn Prompt (dòng 210-215):**
```
"content_structure_analysis": {
  "hook_tactics": "Chiến thuật thu hút trong 3-5 giây đầu",
  "storytelling": "Cấu trúc kể chuyện",
  "cta_strategy": "Chiến lược Call-to-Action",
  "emotional_triggers": "Các yếu tố cảm xúc"
}
```

**Phân tích:**
- ✅ **Giữ lại:** Có giá trị cho các nhà sáng tạo nội dung
- ⚠️ **Hạn chế:** AI không thể xem video, phân tích chỉ dựa trên tiêu đề/mô tả
- 💡 **Nâng cấp:** Làm rõ đây là phân tích dựa trên metadata, không phải xem video thực tế
- 💡 **Nâng cấp:** Thêm liên kết đến video hiệu suất tốt nhất/kém nhất

---

### 6. **Phân tích Phễu (Funnel Analysis)**
**Vị trí:** `AnalysisTab.tsx:911-1056`
**Đường dẫn Prompt:** `report_part_2.funnel_analysis`

#### Các phần con:
- TOFU (Đỉnh Phễu) → `funnel_analysis.tofu`
- MOFU (Giữa Phễu) → `funnel_analysis.mofu`
- BOFU (Đáy Phễu) → `funnel_analysis.bofu`

**Hướng dẫn Prompt (dòng 153-157):**
```
"funnel_analysis": {
  "tofu": "Phân tích TOFU - cách kênh thu hút người xem mới",
  "mofu": "Phân tích MOFU - cách xây dựng lòng tin",
  "bofu": "Phân tích BOFU - CTA và chuyển đổi"
}
```

**Phân tích:**
- ✅ **Giữ lại:** Phễu marketing là thiết yếu cho chiến lược
- 💡 **Nâng cấp:** Thêm sơ đồ trực quan hóa phễu
- 💡 **Nâng cấp:** Thêm chỉ số cho mỗi giai đoạn phễu (tỷ lệ chuyển đổi)

---

### 7. **Phân tích Khán giả (Audience Analysis)**
**Vị trí:** `AnalysisTab.tsx:1057-1441`
**Đường dẫn Prompt:** `report_part_2.audience_analysis`

#### Các phần con:
- **Nhân khẩu học (Demographics)** → `audience_analysis.demographics`
  - Phân bổ Độ tuổi → `demographics.age_distribution[]` (khoảng, phần trăm)
  - Phân chia Giới tính → `demographics.gender_split` (nam, nữ, khác)
  - Quốc gia Hàng đầu → `demographics.top_countries[]` (quốc gia, phần trăm)
  - Ngôn ngữ Chính → `demographics.primary_languages[]`
  - ~~Mức Thu nhập~~ → ~~`demographics.income_level`~~ *(ĐÃ XÓA)*
  - ~~Trình độ Học vấn~~ → ~~`demographics.education_level`~~ *(ĐÃ XÓA)*

- **Hành vi (Behavior)** → `audience_analysis.behavior`
  - Thời gian Xem Ước tính → `behavior.estimated_watch_time`
  - Tỷ lệ Quay lại vs Mới → `behavior.returning_vs_new_ratio`
  - Xu hướng Tăng trưởng Subscriber → `behavior.subscriber_growth_trend`
  - Ngày Xem Cao điểm → `behavior.peak_viewing_days[]`
  - Giờ Xem Cao điểm → `behavior.peak_viewing_hours[]`
  - Mẫu Tương tác → `behavior.engagement_patterns`
  - Sở thích Thiết bị → `behavior.device_preferences`

- **Tâm lý học (Psychographics)** → `audience_analysis.psychographics`
  - Giá trị → `psychographics.values[]`
  - Lối sống → `psychographics.lifestyle`
  - Hành vi Mua sắm → `psychographics.purchase_behavior`

**Hướng dẫn Prompt (dòng 217-251):**
```
"audience_analysis": {
  "demographics": { ... },
  "behavior": { ... },
  "psychographics": { ... }
}
```

**Phân tích:**
- ✅ **Giữ lại:** Hiểu biết toàn diện về khán giả là quan trọng
- ⚠️ **Hạn chế:** Tất cả dữ liệu nhân khẩu học là ước tính của AI (YouTube API không cung cấp)
- 💡 **Nâng cấp:** Thêm lưu ý rằng nhân khẩu học là ước tính của AI
- ✅ **Tốt:** Ngày/giờ xem cao điểm sử dụng dữ liệu thời gian đăng bài thực tế
- 💡 **Nâng cấp:** Thêm biểu đồ phân bổ tuổi/giới tính
- 💡 **Nâng cấp:** Thêm bản đồ phân bổ quốc gia

---

### 8. **Chân dung Khán giả (Audience Personas)**
**Vị trí:** `AnalysisTab.tsx:1442-1678`
**Đường dẫn Prompt:** `report_part_2.audience_personas[]`

#### Các trường cho mỗi Persona:
- Tên (tên phân khúc, không phải cá nhân)
- Mô tả Avatar
- Nhân khẩu học
- Khoảng Tuổi
- Giới tính
- Vị trí
- Nghề nghiệp
- Sở thích
- Điểm đau
- Mục tiêu
- Sở thích Nội dung
- Độ dài Video Ưa thích
- Tần suất Xem
- Nền tảng Xã hội
- Yếu tố Thúc đẩy Mua hàng

**Hướng dẫn Prompt (dòng 253-288):**
```
"audience_personas": [
  {
    "name": "Tên NHÓM khán giả (VD: 'Young Enthusiasts', 'Parents')",
    "avatar_description": "Mô tả tổng quan về nhóm khán giả",
    ...
    "buying_triggers": ["Yếu tố 1", "Yếu tố 2"]
  }
]
```

**Yêu cầu Đặc biệt:**
- Tối thiểu 2 personas (PHÂN KHÚC khán giả, không phải cá nhân)
- Phải bao gồm đầy đủ thông tin cho mỗi persona

**Phân tích:**
- ✅ **Giữ lại:** Personas có giá trị cho chiến lược nhắm mục tiêu
- ⚠️ **Hạn chế:** Hoàn toàn là ước tính của AI
- 💡 **Nâng cấp:** Thêm thẻ persona trực quan với biểu tượng
- 💡 **Nâng cấp:** Thêm phân bổ phần trăm (bao nhiêu % khán giả là mỗi persona)
- ⚠️ **Cân nhắc:** Có thể quá tải cho các kênh nhỏ

---

### 9. **Lịch Nội dung (Content Calendar)**
**Vị trí:** Có thể trong AnalysisTab (cần xác minh dòng chính xác)
**Đường dẫn Prompt:** `report_part_2.content_calendar`

#### Các phần con:
- Ngày Đăng Tốt nhất → `content_calendar.best_posting_days[]`
- Giờ Đăng Tốt nhất → `content_calendar.best_posting_times[]`
- Tần suất Đề xuất → `content_calendar.recommended_frequency`
- Kết hợp Nội dung → `content_calendar.content_mix[]`
  - Loại Nội dung
  - Chủ đề Cụ thể
  - Phần trăm
  - Video Ví dụ

**Hướng dẫn Prompt (dòng 289-313):**
```
"content_calendar": {
  "best_posting_days": ["Thứ 2", "Thứ 4", ...],
  "best_posting_times": ["8:00", "14:00", ...],
  "recommended_frequency": "3-4 video/tuần",
  "content_mix": [...]
}
```

**Yêu cầu Đặc biệt:**
- Ngày phải được sắp xếp từ Thứ 2 đến Chủ nhật
- Giờ phải được sắp xếp từ 0:00 đến 23:00
- Loại nội dung phải CỤ THỂ (VD: "Rainbow Cake", KHÔNG phải "Baking tutorials")

**Phân tích:**
- ✅ **Giữ lại:** Insights hành động được cho chiến lược nội dung
- ✅ **Tốt:** Sử dụng dữ liệu thời gian đăng bài thực tế từ video
- 💡 **Nâng cấp:** Thêm trực quan hóa lịch
- 💡 **Nâng cấp:** Thêm biểu đồ tròn kết hợp nội dung
- 💡 **Nâng cấp:** Liên kết video ví dụ trực tiếp

---

### 10. **Phân tích SEO (SEO Analysis)**
**Vị trí:** `AnalysisTab.tsx:1679-2108`
**Đường dẫn Prompt:** `report_part_2.seo_analysis`

#### Các phần con:
- **Chiến lược Từ khóa** → `seo_analysis.keyword_strategy`
  - Từ khóa Hàng đầu → `keyword_strategy.top_keywords[]`
  - Mật độ Từ khóa → `keyword_strategy.keyword_density`
  - Từ khóa Thiếu → `keyword_strategy.missing_keywords[]`

- **Phân tích Tag** → `seo_analysis.tag_analysis`
  - Độ Bao phủ Tag → `tag_analysis.tag_coverage`
  - Tất cả Tags của Kênh → `tag_analysis.all_channel_tags[]` *(TẤT CẢ tags thực tế)*
  - Tags Đề xuất → `tag_analysis.recommended_tags[]` *(Gợi ý mới)*
  - Tính Nhất quán Tag → `tag_analysis.tag_consistency`
  - Tags Được Sử dụng Nhiều nhất → `tag_analysis.most_used_tags[]`
    - Tên tag
    - Tần suất (đếm thực tế)
    - Tác động Hiệu suất
  - **Danh mục Tag** → `tag_analysis.tag_categories[]` *(QUAN TRỌNG)*
    - Tên danh mục (danh mục SEO chuyên nghiệp)
    - Mục đích (tại sao danh mục này quan trọng cho SEO)
    - Tags (chỉ từ all_channel_tags)
    - Hiệu quả (đánh giá hiệu quả SEO)
  - Tags Đối thủ → `tag_analysis.competitor_tags[]`
  - Cơ hội Long-tail → `tag_analysis.long_tail_opportunities[]`
  - Điểm Tối ưu Tag → `tag_analysis.tag_optimization_score`

- **Cơ hội Tối ưu hóa** → `seo_analysis.optimization_opportunities[]`
  - Khu vực (VD: "Tiêu đề video", "Mô tả video")
  - Vấn đề
  - Khuyến nghị
  - Ưu tiên (cao/trung bình/thấp)

**Hướng dẫn Prompt (dòng 322-388):**
```
"seo_analysis": {
  "keyword_strategy": { ... },
  "tag_analysis": {
    "all_channel_tags": ["TẤT CẢ tags từ dữ liệu video"],
    "tag_categories": [
      {
        "category": "Core Content Keywords / Brand Identity / ...",
        "purpose": "Tại sao điều này quan trọng cho SEO",
        "tags": ["Chỉ từ all_channel_tags"],
        "effectiveness": "Cao/Trung bình/Thấp với chỉ số cụ thể"
      }
    ],
    ...
  },
  "optimization_opportunities": [...]
}
```

**Yêu cầu Đặc biệt:**
- `all_channel_tags`: PHẢI liệt kê TẤT CẢ tags thực tế từ dữ liệu video
- `tag_categories`: Tên danh mục phải là thuật ngữ SEO chuyên nghiệp:
  - "Core Content Keywords" (Từ khóa nội dung cốt lõi)
  - "Brand & Channel Identity" (Nhận diện thương hiệu)
  - "Content Format Tags" (Thẻ định dạng nội dung)
  - "Audience Target Keywords" (Từ khóa đối tượng mục tiêu)
  - "Trending & Viral Tags" (Thẻ xu hướng)
  - "SEO Long-tail Keywords" (Từ khóa dài SEO)
  - "Niche-Specific Tags" (Thẻ chuyên ngành)
  - "Geographic/Language Tags" (Thẻ địa lý/ngôn ngữ)
- Mỗi danh mục PHẢI có MỤC ĐÍCH giải thích tầm quan trọng SEO
- Chỉ phân loại tags từ `all_channel_tags` (không có tags mới)

**Phân tích:**
- ✅ **Giữ lại:** SEO là quan trọng cho tăng trưởng YouTube
- ✅ **Tốt:** Sử dụng dữ liệu tag thực tế từ video
- 💡 **Nâng cấp:** Thêm trực quan hóa đám mây tag
- 💡 **Nâng cấp:** Thêm biểu đồ mật độ từ khóa
- 💡 **Nâng cấp:** Thêm biểu đồ so sánh hiệu quả danh mục tag
- 💡 **Nâng cấp:** Làm danh mục tag có thể mở rộng/thu gọn (hiện tại có thể quá tải)
- ⚠️ **Cân nhắc:** Phần danh mục tag rất chi tiết - có thể cần đơn giản hóa

---

### 11. **Phân tích Sâu Danh mục Tag (Tag Categories Deep Dive)**
**Vị trí:** `AnalysisTab.tsx:2109-2212` (ước tính)
**Đường dẫn Prompt:** `report_part_2.seo_analysis.tag_analysis.tag_categories[]`

Đây dường là một phần riêng cho trực quan hóa danh mục tag.

**Phân tích:**
- ✅ **Giữ lại:** Insight SEO độc đáo
- 💡 **Nâng cấp:** Thêm nhóm danh mục trực quan
- 💡 **Nâng cấp:** Thêm trực quan hóa điểm hiệu quả
- ⚠️ **Cân nhắc:** Có thể trùng lặp với phần Phân tích SEO

---

### 12. **Cơ hội Tăng trưởng (Growth Opportunities)**
**Vị trí:** `AnalysisTab.tsx:2213-end`
**Đường dẫn Prompt:** `report_part_2.growth_opportunities[]`

#### Các trường cho mỗi Cơ hội:
- Tên Cơ hội
- Mô tả
- Ưu tiên (cao/trung bình/thấp)
- Tác động Dự kiến

**Hướng dẫn Prompt (dòng 314-321):**
```
"growth_opportunities": [
  {
    "opportunity": "Tên cơ hội tăng trưởng",
    "description": "Mô tả chi tiết",
    "priority": "high",
    "expected_impact": "+20% subscriber trong 3 tháng"
  }
]
```

**Yêu cầu Đặc biệt:**
- Tối thiểu 3 cơ hội với các mức ưu tiên khác nhau

**Phân tích:**
- ✅ **Giữ lại:** Khuyến nghị tăng trưởng hành động được
- 💡 **Nâng cấp:** Thêm huy hiệu ưu tiên (cao/trung bình/thấp với màu sắc)
- 💡 **Nâng cấp:** Thêm trực quan hóa tác động (chỉ số)
- 💡 **Nâng cấp:** Thêm đánh giá độ khó triển khai

---

### 13. **Tổng hợp Định lượng (Quantitative Synthesis)**
**Vị trí:** Có thể được hiển thị dưới dạng thẻ tóm tắt trong toàn bộ tab
**Đường dẫn Prompt:** `report_part_2.quantitative_synthesis`

#### Các phần con:
- **Thống kê Tóm tắt** → `quantitative_synthesis.summary_stats`
  - Tổng Bài đăng, Lượt xem, Lượt thích, Chia sẻ, Lưu, Ảnh, Video

- **Sức khỏe Kênh** → `quantitative_synthesis.channel_health`
  - Số Người theo dõi
  - Tần suất Đăng bài
  - Tỷ lệ Tương tác (ER)

- **Chỉ số Kênh** → `quantitative_synthesis.channel_metrics`
  - Số Video, Số Người theo dõi, Số Đang theo dõi, Số Tim

- **Hiệu suất Nội dung** → `quantitative_synthesis.content_performance`
  - Lượt xem Trung bình
  - Điểm Viral
  - Điểm Giá trị
  - Tỷ lệ Quảng cáo

**Hướng dẫn Prompt (dòng 389-416):**
```
"quantitative_synthesis": {
  "summary_stats": { ... },
  "channel_health": {
    "er_rate": "Tính theo: (Tổng Like + Tổng Bình luận) / Tổng Lượt xem * 100%"
  },
  "content_performance": { ... }
}
```

**Phân tích:**
- ✅ **Giữ lại:** Tổng quan chỉ số thiết yếu
- 💡 **Nâng cấp:** Thêm chỉ báo xu hướng (mũi tên lên/xuống)
- 💡 **Nâng cấp:** Thêm so sánh với trung bình ngành
- 💡 **Nâng cấp:** Thêm trực quan hóa chỉ số (đồng hồ đo, thanh tiến trình)

---

## Các Phần KHÔNG có trong AnalysisTab (trong InsightsTab thay vào đó)

Đây là một phần của `report_part_3` và được hiển thị trong tab riêng:

### 14. **Điểm mạnh (Strengths)**
**Đường dẫn Prompt:** `report_part_3.strengths[]`

### 15. **Tóm tắt Điều hành (Executive Summary)**
**Đường dẫn Prompt:** `report_part_3.executive_summary`

### 16. **Insights Hành động được (Actionable Insights)**
**Đường dẫn Prompt:** `report_part_3.actionable_insights`
- Học hỏi từ → `actionable_insights.learn_from`
- Tránh → `actionable_insights.avoid`
- Ý tưởng Video → `actionable_insights.video_ideas[]`

### 17. **Điểm yếu & Cơ hội (Weaknesses & Opportunities)**
**Đường dẫn Prompt:** `report_part_3.weaknesses_opportunities[]`

### 18. **Kế hoạch Hành động (Action Plan)**
**Đường dẫn Prompt:** `report_part_3.action_plan`
- Giai đoạn 30 Ngày → `action_plan.phase_30_days[]`
- Giai đoạn 60 Ngày → `action_plan.phase_60_days[]`
- Giai đoạn 90 Ngày → `action_plan.phase_90_days[]`

---

## Tóm tắt Luồng Dữ liệu

```
YouTube API (lib/youtube.ts)
  ↓
Thông tin Kênh + Dữ liệu Video
  ↓
Gemini AI (lib/gemini.ts + lib/prompts/marketing-report.ts)
  ↓
MarketingReport JSON (report_part_2 + report_part_3)
  ↓
AnalysisTab.tsx (hiển thị report_part_2)
InsightsTab.tsx (hiển thị report_part_3)
```

---

## Khuyến nghị

### Các Phần cần GIỮ LẠI (Thiết yếu)
1. ✅ Phân tích Chiến lược (Nhận diện Thương hiệu)
2. ✅ Trụ cột Nội dung
3. ✅ Phân tích Thị trường Ngách (có thể đơn giản hóa)
4. ✅ Phân tích Phễu
5. ✅ Phân tích Khán giả (với lưu ý)
6. ✅ Chân dung Khán giả (tối thiểu 2)
7. ✅ Lịch Nội dung
8. ✅ Phân tích SEO
9. ✅ Cơ hội Tăng trưởng
10. ✅ Tổng hợp Định lượng

### Các Phần cần ĐƠN GIẢN HÓA/CẢI THIỆN
1. ⚠️ **Phân tích Cấu trúc Nội dung** - Làm rõ hạn chế của AI (không xem video)
2. ⚠️ **Danh mục Tag** - Cân nhắc UI có thể thu gọn/mở rộng (rất chi tiết)
3. ⚠️ **Chân dung Khán giả** - Thêm phân bổ phần trăm, có thể quá tải cho kênh nhỏ

### Các Phần cần XÓA/GỘP
1. ❌ **Mức Thu nhập** (ĐÃ XÓA) - Không được cung cấp bởi API, hoàn toàn suy đoán
2. ❌ **Trình độ Học vấn** (ĐÃ XÓA) - Không được cung cấp bởi API, hoàn toàn suy đoán
3. ⚠️ **Chiến lược Quảng cáo** - Cân nhắc xóa cho các kênh không có quảng cáo (hoặc làm có điều kiện)

### CẢI TIẾN Lớn cần Cân nhắc
1. 💡 Thêm trực quan hóa dữ liệu:
   - Biểu đồ phân bổ tuổi/giới tính
   - Biểu đồ tròn danh mục nội dung
   - Đám mây tag
   - Trực quan hóa lịch nội dung
   - Sơ đồ phễu
   - Bản đồ phân bổ quốc gia

2. 💡 Thêm lưu ý ước tính của AI:
   - Nhân khẩu học là ước tính của AI (không từ YouTube API)
   - Phân tích nội dung chỉ dựa trên metadata (AI không xem video)

3. 💡 Thêm tính tương tác:
   - Các phần có thể mở rộng/thu gọn
   - Click để xem video ví dụ
   - Lọc/sắp xếp danh mục tag
   - So sánh chỉ số với chuẩn mực

4. 💡 Thêm liên kết:
   - Liên kết đến video hiệu suất tốt nhất/kém nhất
   - Liên kết đến kênh đối thủ (nếu được đề cập)
   - Liên kết video ví dụ trong kết hợp nội dung

5. 💡 Chỉ số hiệu suất:
   - Thêm chỉ báo xu hướng
   - Thêm so sánh với trung bình kênh
   - Thêm so sánh chuẩn mực

---

## Ghi chú Kỹ thuật

### Hạn chế Hiện tại
1. **Không Xem Video**: AI không thể xem video - phân tích dựa trên:
   - Tiêu đề video
   - Mô tả (200 ký tự đầu)
   - Tags
   - Thống kê (lượt xem, thích, bình luận)
   - Ngày đăng

2. **Không Có Nhân khẩu học Thực**: YouTube API không cung cấp dữ liệu nhân khẩu học:
   - Tuổi, giới tính, vị trí là ước tính của AI
   - Dựa trên ngôn ngữ nội dung, chủ đề, phong cách

3. **Dữ liệu Đối thủ Hạn chế**: Không tìm nạp dữ liệu kênh đối thủ:
   - Phân tích đối thủ là suy đoán của AI

### Nguồn Dữ liệu
- ✅ **Dữ liệu Thực**: Số video, lượt xem, lượt thích, bình luận, thời gian đăng, tags
- ⚠️ **Được Tính toán**: Tỷ lệ tương tác, tần suất đăng bài, thời gian cao điểm
- 🤖 **Ước tính AI**: Nhân khẩu học, personas, cấu trúc nội dung, đối thủ

---

## Tham chiếu Tệp

- **Component**: `/components/report/AnalysisTab.tsx`
- **Template Prompt**: `/lib/prompts/marketing-report.ts`
- **Tích hợp Gemini**: `/lib/gemini.ts`
- **Định nghĩa Kiểu**: `/lib/types.ts`
- **Tệp Ngôn ngữ**: `/lib/lang/vi.ts`, `/lib/lang/en.ts`

---

*Cập nhật Lần cuối: 2026-01-19*
*Được tạo cho Công cụ Phân tích Marketing YouTube Soi'Brand*
