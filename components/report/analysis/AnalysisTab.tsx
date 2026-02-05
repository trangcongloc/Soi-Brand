"use client";

import { Post, ReportPart2 } from "@/lib/types";
import { useLanguage } from "@/lib/lang";

// Import section components
import StrategySection from "./StrategySection";
import ContentStructureSection from "./ContentStructureSection";
import FunnelSection from "./FunnelSection";
import AudienceSection from "./AudienceSection";
import PersonasSection from "./PersonasSection";
import SeoSection from "./SeoSection";
import GrowthSection from "./GrowthSection";

interface AnalysisTabProps {
    report_part_2: ReportPart2;
    posts: Post[];
}

interface CurrentStats {
    frequency: string;
    bestDays: string[];
    bestTimes: string[];
    totalPosts: number;
    analyzedPeriod: number;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ report_part_2, posts }) => {
    const { langCode } = useLanguage();

    // Calculate current posting stats from posts data
    const calculateCurrentPostingStats = (): CurrentStats | null => {
        if (posts.length < 2) return null;

        // Sort posts by date
        const sortedPosts = [...posts].sort(
            (a, b) =>
                new Date(a.published_at).getTime() -
                new Date(b.published_at).getTime()
        );

        // Calculate frequency
        const firstDate = new Date(sortedPosts[0].published_at);
        const lastDate = new Date(
            sortedPosts[sortedPosts.length - 1].published_at
        );
        const daysDiff = Math.max(
            1,
            Math.ceil(
                (lastDate.getTime() - firstDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            )
        );
        const videosPerDay = posts.length / daysDiff;

        // Calculate all frequency formats
        const perWeek = videosPerDay * 7;
        const perMonth = videosPerDay * 30;

        let frequency: string;
        if (videosPerDay >= 1) {
            frequency =
                langCode === "vi"
                    ? `${videosPerDay.toFixed(1)} video/ngay`
                    : `${videosPerDay.toFixed(1)} videos/day`;
        } else if (videosPerDay >= 1 / 7) {
            frequency =
                langCode === "vi"
                    ? `${perWeek.toFixed(1)} video/tuan (${videosPerDay.toFixed(
                          2
                      )}/ngay)`
                    : `${perWeek.toFixed(
                          1
                      )} videos/week (${videosPerDay.toFixed(2)}/day)`;
        } else {
            frequency =
                langCode === "vi"
                    ? `${perMonth.toFixed(1)} video/thang (${perWeek.toFixed(
                          2
                      )}/tuan)`
                    : `${perMonth.toFixed(1)} videos/month (${perWeek.toFixed(
                          2
                      )}/week)`;
        }

        // Calculate best posting days from actual data
        const dayCounts: { [key: string]: number } = {};
        const dayNames =
            langCode === "vi"
                ? [
                      "Chu nhat",
                      "Thu 2",
                      "Thu 3",
                      "Thu 4",
                      "Thu 5",
                      "Thu 6",
                      "Thu 7",
                  ]
                : [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                  ];

        posts.forEach((post) => {
            const day = new Date(post.published_at).getDay();
            const dayName = dayNames[day];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });

        const sortedDays = Object.entries(dayCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency (descending)
            .slice(0, 3) // Get top 3
            .sort((a, b) => {
                // Sort top 3 chronologically
                const indexA = dayNames.indexOf(a[0]);
                const indexB = dayNames.indexOf(b[0]);

                if (langCode === "vi") {
                    // Vietnamese: Monday (1) to Sunday (0), so Sunday should be last
                    const orderA = indexA === 0 ? 7 : indexA; // Sunday becomes 7
                    const orderB = indexB === 0 ? 7 : indexB; // Sunday becomes 7
                    return orderA - orderB;
                } else {
                    // English: Sunday (0) to Saturday (6)
                    return indexA - indexB;
                }
            })
            .map(([day]) => day);

        // Calculate best posting times from actual data
        const hourCounts: { [key: number]: number } = {};
        posts.forEach((post) => {
            const hour = new Date(post.published_at).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const sortedHours = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency (descending)
            .slice(0, 3) // Get top 3
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0])) // Sort top 3 chronologically (0:00 to 23:00)
            .map(([hour]) => {
                const h = parseInt(hour);
                return `${h.toString().padStart(2, "0")}:00`;
            });

        return {
            frequency,
            bestDays: sortedDays,
            bestTimes: sortedHours,
            totalPosts: posts.length,
            analyzedPeriod: daysDiff,
        };
    };

    const currentStats = calculateCurrentPostingStats();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* ========== BRAND & POSITIONING ========== */}
            <StrategySection report_part_2={report_part_2} />

            {/* ========== CONTENT ANALYSIS ========== */}
            <ContentStructureSection
                report_part_2={report_part_2}
                posts={posts}
                currentStats={currentStats}
            />

            {/* ========== MARKETING FUNNEL ========== */}
            <FunnelSection report_part_2={report_part_2} />

            {/* ========== AUDIENCE INTELLIGENCE ========== */}
            <AudienceSection report_part_2={report_part_2} />

            {/* Audience Personas */}
            <PersonasSection report_part_2={report_part_2} />

            {/* ========== OPTIMIZATION & GROWTH ========== */}
            <SeoSection report_part_2={report_part_2} posts={posts} />

            {/* Growth Opportunities */}
            <GrowthSection report_part_2={report_part_2} />
        </div>
    );
};

export default AnalysisTab;
