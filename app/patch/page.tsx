"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLang, useLanguage } from "@/lib/lang";
import styles from "./patch.module.css";

interface PatchNote {
    version: string;
    date: string;
    changes: {
        type: "feature" | "fix" | "improvement" | "breaking";
        descriptionEn: string;
        descriptionVi: string;
    }[];
}

const patchNotes: PatchNote[] = [
    {
        version: "1.2.0",
        date: "2026-01-21",
        changes: [
            {
                type: "feature",
                descriptionEn: "Improved video fetch logic - fetches all videos from last 30 days, minimum 50 videos if fewer",
                descriptionVi: "Cải thiện logic lấy video - lấy tất cả video từ 30 ngày gần nhất, tối thiểu 50 video nếu ít hơn",
            },
            {
                type: "improvement",
                descriptionEn: "Made loading labels funnier and more engaging for 18-35 age group",
                descriptionVi: "Làm cho loading labels vui hơn và hấp dẫn hơn cho độ tuổi 18-35",
            },
            {
                type: "improvement",
                descriptionEn: "Removed overly professional tone from loading states",
                descriptionVi: "Loại bỏ giọng điệu quá chuyên nghiệp khỏi trạng thái loading",
            },
        ],
    },
    {
        version: "1.1.0",
        date: "2026-01-21",
        changes: [
            {
                type: "feature",
                descriptionEn: "Added patch notes page at /patch with version history",
                descriptionVi: "Thêm trang ghi chú cập nhật tại /patch với lịch sử phiên bản",
            },
            {
                type: "feature",
                descriptionEn: "Added version indicator at bottom right of main page",
                descriptionVi: "Thêm chỉ báo phiên bản ở góc dưới bên phải trang chính",
            },
            {
                type: "improvement",
                descriptionEn: "Clean up dead code and improve logging system",
                descriptionVi: "Dọn dẹp code không dùng và cải thiện hệ thống logging",
            },
            {
                type: "improvement",
                descriptionEn: "Added Claude Code setup documentation",
                descriptionVi: "Thêm tài liệu hướng dẫn cấu hình Claude Code",
            },
        ],
    },
    {
        version: "1.0.0",
        date: "2026-01-20",
        changes: [
            {
                type: "feature",
                descriptionEn: "Initial release of Soi'Brand - YouTube marketing analysis tool",
                descriptionVi: "Phát hành phiên bản đầu tiên của Soi'Brand - công cụ phân tích marketing YouTube",
            },
            {
                type: "feature",
                descriptionEn: "YouTube channel analysis powered by Google Gemini AI",
                descriptionVi: "Phân tích kênh YouTube với Google Gemini AI",
            },
            {
                type: "feature",
                descriptionEn: "Marketing report generation with brand positioning, funnel analysis, and content strategy",
                descriptionVi: "Tạo báo cáo marketing với định vị thương hiệu, phân tích funnel và chiến lược nội dung",
            },
            {
                type: "feature",
                descriptionEn: "Multi-language support (Vietnamese and English)",
                descriptionVi: "Hỗ trợ đa ngôn ngữ (Tiếng Việt và Tiếng Anh)",
            },
        ],
    },
    {
        version: "0.9.0",
        date: "2026-01-20",
        changes: [
            {
                type: "improvement",
                descriptionEn: "Extract inline styles to CSS modules and add i18n support",
                descriptionVi: "Tách inline styles sang CSS modules và thêm hỗ trợ i18n",
            },
            {
                type: "improvement",
                descriptionEn: "Optimize API validation and fix settings persistence",
                descriptionVi: "Tối ưu hóa validation API và sửa lưu trữ cài đặt",
            },
            {
                type: "feature",
                descriptionEn: "Add retry button and improve error handling",
                descriptionVi: "Thêm nút thử lại và cải thiện xử lý lỗi",
            },
        ],
    },
    {
        version: "0.8.0",
        date: "2026-01-20",
        changes: [
            {
                type: "improvement",
                descriptionEn: "Rebrand from OurTube to Soi'Brand with new design system",
                descriptionVi: "Đổi thương hiệu từ OurTube sang Soi'Brand với hệ thống thiết kế mới",
            },
            {
                type: "feature",
                descriptionEn: "Add routes, logger levels, and comprehensive testing",
                descriptionVi: "Thêm routes, cấp độ logger và testing toàn diện",
            },
            {
                type: "improvement",
                descriptionEn: "Globalize UI design system with CSS variables",
                descriptionVi: "Toàn cầu hóa hệ thống thiết kế UI với biến CSS",
            },
        ],
    },
    {
        version: "0.7.0",
        date: "2026-01-20",
        changes: [
            {
                type: "feature",
                descriptionEn: "Add animated multi-step sub-labels to loading state",
                descriptionVi: "Thêm sub-labels đa bước có animation cho trạng thái loading",
            },
            {
                type: "improvement",
                descriptionEn: "Improve loading labels and Vietnamese relative time translations",
                descriptionVi: "Cải thiện loading labels và dịch thời gian tương đối tiếng Việt",
            },
            {
                type: "feature",
                descriptionEn: "Add channel name to sidebar title and section navigation",
                descriptionVi: "Thêm tên kênh vào tiêu đề sidebar và điều hướng section",
            },
        ],
    },
];

export default function PatchNotesPage() {
    const router = useRouter();
    const lang = useLang();
    const { langCode } = useLanguage();

    const getTypeBadge = (type: PatchNote["changes"][0]["type"]) => {
        return lang.patch.badges[type];
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={styles.content}
            >
                <div className={styles.header}>
                    <button onClick={() => router.back()} className={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        {lang.patch.backButton}
                    </button>
                    <h1 className={styles.title}>{lang.patch.title}</h1>
                    <p className={styles.subtitle}>{lang.patch.subtitle}</p>
                </div>

                <div className={styles.timeline}>
                    {patchNotes.map((patch, index) => (
                        <motion.div
                            key={patch.version}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={styles.patchCard}
                        >
                            <div className={styles.patchHeader}>
                                <div>
                                    <h2 className={styles.version}>v{patch.version}</h2>
                                    <p className={styles.date}>
                                        {new Date(patch.date).toLocaleDateString(
                                            langCode === "vi" ? "vi-VN" : "en-US",
                                            { year: "numeric", month: "long", day: "numeric" }
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.changes}>
                                {patch.changes.map((change, changeIndex) => (
                                    <div key={changeIndex} className={styles.changeItem}>
                                        <span className={styles.badge}>
                                            {getTypeBadge(change.type)}
                                        </span>
                                        <p className={styles.changeDescription}>
                                            {langCode === "vi" ? change.descriptionVi : change.descriptionEn}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
