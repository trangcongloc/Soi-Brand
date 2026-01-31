import {
    setCachedReport,
    getCachedReport,
    getCachedReportsForChannel,
    getCachedReportByTimestamp,
    deleteCachedReport,
    deleteCachedReportByTimestamp,
    clearExpiredReports,
    clearAllReports,
    setChannelAlias,
    resolveChannelId,
    getCachedChannelList,
} from "@/lib/cache";
import { MarketingReport } from "@/lib/types";

// Mock logger
jest.mock("@/lib/logger", () => ({
    logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
}));

describe("cache", () => {
    const mockReport: MarketingReport = {
        report_id: "test-report-id",
        job_id: "test-job-id",
        brand_name: "Test Channel",
        report_part_1: {
            channel_info: {
                stats: {
                    heartCount: 0,
                    videoCount: 50,
                    followerCount: 1000,
                    followingCount: 0,
                    viewCount: 100000,
                },
                avatar: "https://example.com/avatar.jpg",
                bioLink: "",
                nickname: "Test Channel",
                uniqueId: "@testchannel",
                channelId: "UC123",
                signature: "Test description",
                joinedAt: "2020-01-01",
            },
            posts: [],
        },
        report_part_2: {
            ad_strategy: {
                overview: "",
                ad_angles: [],
                ad_creatives: null,
                target_audience_clues: "",
            },
            funnel_analysis: { tofu: "", mofu: "", bofu: "" },
            strategy_analysis: {
                brand_identity: {
                    visual_style: "",
                    tone_of_voice: "",
                    brand_positioning: "",
                },
                content_focus: { overview: "", topics: [] },
                content_structure_analysis: {
                    hook_tactics: "",
                    storytelling: "",
                    cta_strategy: "",
                    emotional_triggers: "",
                },
            },
        },
        report_part_3: {
            strengths: [],
            executive_summary: "",
            actionable_insights: {
                learn_from: "",
                avoid: "",
                video_ideas: [],
            },
            weaknesses_opportunities: [],
        },
        created_at: new Date().toISOString(),
    };

    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
        mockStorage = {};

        (localStorage.getItem as jest.Mock).mockImplementation(
            (key: string) => mockStorage[key] || null
        );

        (localStorage.setItem as jest.Mock).mockImplementation(
            (key: string, value: string) => {
                mockStorage[key] = value;
            }
        );

        (localStorage.removeItem as jest.Mock).mockImplementation(
            (key: string) => {
                delete mockStorage[key];
            }
        );

        (localStorage.key as jest.Mock).mockImplementation((index: number) => {
            return Object.keys(mockStorage)[index] || null;
        });

        Object.defineProperty(localStorage, "length", {
            get: () => Object.keys(mockStorage).length,
            configurable: true,
        });
    });

    describe("setCachedReport / getCachedReport", () => {
        it("saves and retrieves a report", () => {
            setCachedReport("UC123", mockReport);

            const retrieved = getCachedReport("UC123");

            expect(retrieved).not.toBeNull();
            expect(retrieved?.brand_name).toBe("Test Channel");
        });

        it("returns null for non-existent channel", () => {
            const retrieved = getCachedReport("UC999");
            expect(retrieved).toBeNull();
        });
    });

    describe("getCachedReportsForChannel", () => {
        it("returns all reports for a channel sorted by date", () => {
            // Save multiple reports
            setCachedReport("UC123", { ...mockReport, brand_name: "Report 1" });

            // Manually add another report with different timestamp
            // Must wrap in CachedItem structure to match LocalStorageCache format
            const timestamp2 = Date.now() + 1000;
            mockStorage[`soibrand_report_UC123_${timestamp2}`] = JSON.stringify({
                data: {
                    report: { ...mockReport, brand_name: "Report 2" },
                    timestamp: timestamp2,
                    channelId: "UC123",
                },
                timestamp: timestamp2,
            });

            const reports = getCachedReportsForChannel("UC123");

            expect(reports.length).toBe(2);
            // Most recent first
            expect(reports[0].brandName).toBe("Report 2");
        });

        it("returns empty array for channel with no reports", () => {
            const reports = getCachedReportsForChannel("UC999");
            expect(reports).toEqual([]);
        });
    });

    describe("getCachedReportByTimestamp", () => {
        it("retrieves specific report by timestamp", () => {
            setCachedReport("UC123", mockReport);

            const reports = getCachedReportsForChannel("UC123");
            const timestamp = reports[0].timestamp;

            const retrieved = getCachedReportByTimestamp("UC123", timestamp);
            expect(retrieved?.brand_name).toBe("Test Channel");
        });

        it("returns null for invalid timestamp", () => {
            setCachedReport("UC123", mockReport);

            const retrieved = getCachedReportByTimestamp("UC123", 999999);
            expect(retrieved).toBeNull();
        });
    });

    describe("deleteCachedReport", () => {
        it("deletes all reports for a channel", () => {
            setCachedReport("UC123", mockReport);
            setCachedReport("UC456", { ...mockReport, brand_name: "Other Channel" });

            deleteCachedReport("UC123");

            expect(getCachedReport("UC123")).toBeNull();
            expect(getCachedReport("UC456")).not.toBeNull();
        });
    });

    describe("deleteCachedReportByTimestamp", () => {
        it("deletes specific report", () => {
            setCachedReport("UC123", mockReport);
            const reports = getCachedReportsForChannel("UC123");

            deleteCachedReportByTimestamp("UC123", reports[0].timestamp);

            expect(getCachedReport("UC123")).toBeNull();
        });
    });

    describe("clearAllReports", () => {
        it("clears all cached reports", () => {
            setCachedReport("UC123", mockReport);
            setCachedReport("UC456", { ...mockReport, brand_name: "Other" });

            clearAllReports();

            expect(getCachedReport("UC123")).toBeNull();
            expect(getCachedReport("UC456")).toBeNull();
        });
    });

    describe("channel aliases", () => {
        it("stores and resolves channel aliases", () => {
            setChannelAlias("@testchannel", "UC123");

            const resolved = resolveChannelId("@testchannel");
            expect(resolved).toBe("UC123");
        });

        it("returns null for unknown alias", () => {
            const resolved = resolveChannelId("@unknown");
            expect(resolved).toBeNull();
        });
    });

    describe("getCachedChannelList", () => {
        it("returns list of all cached channels", () => {
            setCachedReport("UC123", mockReport);
            setCachedReport("UC456", {
                ...mockReport,
                brand_name: "Other Channel",
                report_part_1: {
                    ...mockReport.report_part_1,
                    channel_info: {
                        ...mockReport.report_part_1.channel_info,
                        channelId: "UC456",
                    },
                },
            });

            const channels = getCachedChannelList();

            expect(channels.length).toBe(2);
            expect(channels.map((c) => c.brandName)).toContain("Test Channel");
            expect(channels.map((c) => c.brandName)).toContain("Other Channel");
        });
    });

    describe("clearExpiredReports", () => {
        it("removes expired reports", () => {
            // Add an old report manually
            const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
            mockStorage[`soibrand_report_UC123_${oldTimestamp}`] = JSON.stringify({
                report: mockReport,
                timestamp: oldTimestamp,
                channelId: "UC123",
            });

            // Add a fresh report
            setCachedReport("UC456", { ...mockReport, brand_name: "Fresh" });

            clearExpiredReports();

            const oldReport = getCachedReportsForChannel("UC123");
            const freshReport = getCachedReportsForChannel("UC456");

            expect(oldReport.length).toBe(0);
            expect(freshReport.length).toBe(1);
        });
    });
});
