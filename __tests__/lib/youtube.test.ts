import {
    resolveChannelId,
    getChannelInfo,
    getChannelVideos,
    getFullChannelData,
} from "@/lib/youtube";
import { apiClient } from "@/lib/axios";
import { APIError } from "@/lib/types";

jest.mock("@/lib/axios");
jest.mock("@/lib/logger");

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("YouTube Service", () => {
    const mockApiKey = "test-api-key";

    beforeEach(() => {
        jest.clearAllMocks();
        mockApiClient.get.mockReset();
        process.env.YOUTUBE_API_KEY = mockApiKey;
    });

    describe("resolveChannelId", () => {
        it("should extract channel ID from direct URL", async () => {
            const channelId = await resolveChannelId(
                "https://www.youtube.com/channel/UC123",
                mockApiKey
            );
            expect(channelId).toBe("UC123");
        });

        it("should resolve username to channel ID", async () => {
            mockApiClient.get.mockResolvedValue({
                data: {
                    items: [
                        {
                            snippet: {
                                channelId: "UC123",
                            },
                        },
                    ],
                },
            });

            const channelId = await resolveChannelId(
                "https://www.youtube.com/@testuser",
                mockApiKey
            );

            expect(channelId).toBe("UC123");
            expect(mockApiClient.get).toHaveBeenCalledWith(
                expect.stringContaining("/search"),
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: "testuser",
                        type: "channel",
                    }),
                })
            );
        });

        it("should return null if channel not found", async () => {
            mockApiClient.get.mockResolvedValue({
                data: {
                    items: [],
                },
            });

            const channelId = await resolveChannelId(
                "https://www.youtube.com/@nonexistent",
                mockApiKey
            );

            expect(channelId).toBeNull();
        });

        it("should throw error if API key is not configured", async () => {
            delete process.env.YOUTUBE_API_KEY;

            await expect(
                resolveChannelId("https://www.youtube.com/@testuser")
            ).rejects.toThrow("YouTube API key not configured");
        });

        it("should propagate quota exceeded errors", async () => {
            mockApiClient.get.mockRejectedValue({
                response: {
                    status: 429,
                    data: {
                        error: {
                            errors: [{ reason: "quotaExceeded" }],
                            message: "Quota exceeded",
                        },
                    },
                },
            });

            await expect(
                resolveChannelId("https://www.youtube.com/@testuser", mockApiKey)
            ).rejects.toThrow(APIError);
        });
    });

    describe("getChannelInfo", () => {
        const mockChannelResponse = {
            data: {
                items: [
                    {
                        id: "UC123",
                        snippet: {
                            title: "Test Channel",
                            description: "Test description",
                            customUrl: "@testchannel",
                            publishedAt: "2020-01-01T00:00:00Z",
                            thumbnails: {
                                default: { url: "https://example.com/thumb.jpg" },
                            },
                        },
                        statistics: {
                            viewCount: "50000",
                            subscriberCount: "1000",
                            videoCount: "100",
                        },
                    },
                ],
            },
        };

        it("should fetch channel information successfully", async () => {
            mockApiClient.get.mockResolvedValue(mockChannelResponse);

            const channelInfo = await getChannelInfo("UC123", mockApiKey);

            expect(channelInfo).toEqual({
                id: "UC123",
                title: "Test Channel",
                description: "Test description",
                customUrl: "@testchannel",
                publishedAt: "2020-01-01T00:00:00Z",
                thumbnails: {
                    default: { url: "https://example.com/thumb.jpg" },
                },
                statistics: {
                    viewCount: "50000",
                    subscriberCount: "1000",
                    videoCount: "100",
                },
            });

            expect(mockApiClient.get).toHaveBeenCalledWith(
                expect.stringContaining("/channels"),
                expect.objectContaining({
                    params: expect.objectContaining({
                        id: "UC123",
                        part: "snippet,statistics,contentDetails",
                    }),
                })
            );
        });

        it("should return null if channel not found", async () => {
            mockApiClient.get.mockResolvedValue({
                data: {
                    items: [],
                },
            });

            const channelInfo = await getChannelInfo("UC999", mockApiKey);

            expect(channelInfo).toBeNull();
        });

        it("should handle missing statistics with default values", async () => {
            mockApiClient.get.mockResolvedValue({
                data: {
                    items: [
                        {
                            id: "UC123",
                            snippet: {
                                title: "Test Channel",
                                description: "Test",
                                thumbnails: {},
                            },
                            statistics: {}, // Missing all statistics
                        },
                    ],
                },
            });

            const channelInfo = await getChannelInfo("UC123", mockApiKey);

            expect(channelInfo?.statistics).toEqual({
                viewCount: "0",
                subscriberCount: "0",
                videoCount: "0",
            });
        });

        it("should throw error if API key is not configured", async () => {
            delete process.env.YOUTUBE_API_KEY;

            await expect(getChannelInfo("UC123")).rejects.toThrow(
                "YouTube API key not configured"
            );
        });
    });

    describe("getChannelVideos", () => {
        const mockPlaylistResponse = {
            data: {
                items: [
                    {
                        contentDetails: {
                            videoId: "video1",
                            videoPublishedAt: new Date().toISOString(),
                        },
                        snippet: {
                            publishedAt: new Date().toISOString(),
                        },
                    },
                ],
            },
        };

        const mockVideosResponse = {
            data: {
                items: [
                    {
                        id: "video1",
                        snippet: {
                            title: "Test Video",
                            description: "Test description",
                            publishedAt: new Date().toISOString(),
                            thumbnails: {},
                            tags: ["test"],
                        },
                        statistics: {
                            viewCount: "1000",
                            likeCount: "100",
                            commentCount: "10",
                        },
                        contentDetails: {
                            duration: "PT5M30S",
                        },
                    },
                ],
            },
        };

        it("should fetch channel videos successfully", async () => {
            mockApiClient.get
                .mockResolvedValueOnce({
                    data: {
                        items: [
                            {
                                contentDetails: {
                                    relatedPlaylists: {
                                        uploads: "UU123",
                                    },
                                },
                            },
                        ],
                    },
                })
                .mockResolvedValueOnce(mockPlaylistResponse)
                .mockResolvedValueOnce(mockVideosResponse);

            const videos = await getChannelVideos("UC123", 50, mockApiKey);

            expect(videos).toHaveLength(1);
            expect(videos[0]).toEqual({
                id: "video1",
                title: "Test Video",
                description: "Test description",
                publishedAt: expect.any(String),
                thumbnails: {},
                statistics: {
                    viewCount: "1000",
                    likeCount: "100",
                    commentCount: "10",
                },
                tags: ["test"],
                contentDetails: {
                    duration: "PT5M30S",
                },
            });
        });

        it("should return empty array if no videos found", async () => {
            mockApiClient.get
                .mockResolvedValueOnce({
                    data: {
                        items: [
                            {
                                contentDetails: {
                                    relatedPlaylists: {
                                        uploads: "UU123",
                                    },
                                },
                            },
                        ],
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        items: [],
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        items: [],
                    },
                });

            const videos = await getChannelVideos("UC123", 50, mockApiKey);

            expect(videos).toEqual([]);
        });

        it("should handle missing video statistics with default values", async () => {
            // Generate 50 videos to satisfy MIN_VIDEOS requirement
            const playlistItems = Array.from({ length: 50 }, (_, i) => ({
                contentDetails: {
                    videoId: `video${i + 1}`,
                    videoPublishedAt: new Date().toISOString(),
                },
                snippet: {
                    publishedAt: new Date().toISOString(),
                },
            }));

            const videoItems = Array.from({ length: 50 }, (_, i) => ({
                id: `video${i + 1}`,
                snippet: {
                    title: `Test ${i + 1}`,
                    description: "Test",
                    publishedAt: new Date().toISOString(),
                    thumbnails: {},
                },
                statistics: i === 0 ? {} : { viewCount: "1000", likeCount: "100", commentCount: "10" }, // First video missing stats
                contentDetails: {
                    duration: "PT5M",
                },
            }));

            mockApiClient.get
                .mockResolvedValueOnce({
                    data: {
                        items: [
                            {
                                contentDetails: {
                                    relatedPlaylists: {
                                        uploads: "UU123",
                                    },
                                },
                            },
                        ],
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        items: playlistItems,
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        items: videoItems,
                    },
                });

            const videos = await getChannelVideos("UC123", 50, mockApiKey);

            expect(videos[0].statistics).toEqual({
                viewCount: "0",
                likeCount: "0",
                commentCount: "0",
            });
        });

        it("should throw error if API key is not configured", async () => {
            delete process.env.YOUTUBE_API_KEY;

            await expect(getChannelVideos("UC123")).rejects.toThrow(
                "YouTube API key not configured"
            );
        });
    });

    describe("getFullChannelData", () => {
        it("should fetch full channel data successfully", async () => {

            // Generate 50 videos to satisfy MIN_VIDEOS requirement
            const playlistItems = Array.from({ length: 50 }, (_, i) => ({
                contentDetails: {
                    videoId: `video${i + 1}`,
                    videoPublishedAt: new Date().toISOString(),
                },
                snippet: {
                    publishedAt: new Date().toISOString(),
                },
            }));

            const videoItems = Array.from({ length: 50 }, (_, i) => ({
                id: `video${i + 1}`,
                snippet: {
                    title: `Test Video ${i + 1}`,
                    description: "Test",
                    publishedAt: new Date().toISOString(),
                    thumbnails: {},
                },
                statistics: {
                    viewCount: "1000",
                    likeCount: "100",
                    commentCount: "10",
                },
                contentDetails: {
                    duration: "PT5M",
                },
            }));

            mockApiClient.get
                .mockResolvedValueOnce({
                    data: {
                        items: [
                            {
                                id: "UC123",
                                snippet: {
                                    title: "Test Channel",
                                    description: "Test",
                                    thumbnails: {},
                                },
                                statistics: {
                                    viewCount: "50000",
                                    subscriberCount: "1000",
                                    videoCount: "100",
                                },
                            },
                        ],
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        items: [
                            {
                                contentDetails: {
                                    relatedPlaylists: {
                                        uploads: "UU123",
                                    },
                                },
                            },
                        ],
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        items: playlistItems,
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        items: videoItems,
                    },
                });

            const result = await getFullChannelData(
                "https://www.youtube.com/channel/UC123",
                mockApiKey
            );

            expect(result.channelInfo).toBeDefined();
            expect(result.channelInfo?.id).toBe("UC123");
            expect(result.videos).toHaveLength(50);
        });

        it("should throw error if channel ID cannot be resolved", async () => {
            mockApiClient.get.mockResolvedValue({
                data: {
                    items: [],
                },
            });

            await expect(
                getFullChannelData("https://www.youtube.com/@nonexistent", mockApiKey)
            ).rejects.toThrow(APIError);
        });

        it("should throw error if channel info is not found", async () => {
            // Mock getChannelInfo to return empty (channel not found)
            mockApiClient.get.mockResolvedValue({
                data: {
                    items: [], // No channel found
                },
            });

            await expect(
                getFullChannelData("https://www.youtube.com/channel/UC999", mockApiKey)
            ).rejects.toThrow("Channel not found");
        });
    });
});
