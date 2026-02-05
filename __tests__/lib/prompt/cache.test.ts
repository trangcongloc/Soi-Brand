/**
 * Tests for VEO client-side caching functions
 * @module __tests__/lib/prompt/cache.test.ts
 */

import {
  getCachedJobsForVideoLocal as getCachedJobsForVideo,
  getCachedJobLocal as getCachedJob,
  getLatestCachedJobLocal as getLatestCachedJob,
  setCachedJobLocal as setCachedJob,
  clearExpiredJobsLocal as clearExpiredJobs,
  clearAllJobsLocal as clearAllJobs,
  deleteCachedJobLocal as deleteCachedJob,
  getCachedJobListLocal as getCachedJobList,
} from "@/lib/prompt/cache-local";

import type {
  CachedPromptJob,
  PromptJobSummary,
  Scene,
} from "@/lib/prompt/types";

describe("VEO Cache", () => {
  // Mock localStorage implementation
  let localStorageData: Record<string, string>;

  beforeEach(() => {
    localStorageData = {};

    // Setup localStorage mock with proper implementation
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => localStorageData[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageData[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageData[key];
        }),
        clear: jest.fn(() => {
          localStorageData = {};
        }),
        get length() {
          return Object.keys(localStorageData).length;
        },
        key: jest.fn((index: number) => {
          const keys = Object.keys(localStorageData);
          return keys[index] || null;
        }),
      },
      writable: true,
    });

    // Mock window.dispatchEvent
    window.dispatchEvent = jest.fn();
  });

  // Helper to create a mock cached job
  function createMockCachedJob(
    jobId: string,
    videoId: string,
    timestamp = Date.now()
  ): CachedPromptJob {
    const mockSummary: PromptJobSummary = {
      mode: "hybrid",
      youtubeUrl: `https://youtube.com/watch?v=${videoId}`,
      videoId,
      targetScenes: 10,
      actualScenes: 10,
      voice: "english",
      charactersFound: 2,
      characters: ["John", "Jane"],
      processingTime: "2m 30s",
      createdAt: new Date(timestamp).toISOString(),
    };

    const mockScene: Scene = {
      description: "Test scene",
      object: "object",
      character: "character",
      style: {
        genre: "test",
        art_movement: "test",
        medium: "test",
        palette: "test",
        color_temperature: "test",
        contrast: "test",
        texture: "test",
        brushwork_or_line: "test",
        rendering_engine: "test",
        camera_lens: "test",
        focal_length: "test",
        depth_of_field: "test",
        film_stock_or_profile: "test",
        grain: "test",
        noise_reduction: "test",
        post_processing: "test",
        composition_style: "test",
        mood: "test",
        lighting_style: "test",
      },
      visual_specs: {
        primary_subject: "test",
        environment: "test",
        key_details: "test",
      },
      lighting: { mood: "test", source: "test", shadows: "test" },
      composition: { angle: "test", framing: "test", focus: "test" },
      technical: { quality: "test", colors: "test" },
      prompt: "Test prompt",
    };

    return {
      jobId,
      videoId,
      videoUrl: `https://youtube.com/watch?v=${videoId}`,
      summary: mockSummary,
      scenes: [mockScene],
      characterRegistry: { John: "Tall man", Jane: "Short woman" },
      timestamp,
      status: "completed",
    };
  }

  // Helper to store a job in mock localStorage
  // Must wrap in CachedItem structure to match LocalStorageCache format
  function storeJob(job: CachedPromptJob): void {
    const key = `prompt_job_${job.jobId}`;
    const cachedItem = {
      data: job,
      timestamp: job.timestamp,
    };
    localStorageData[key] = JSON.stringify(cachedItem);
  }

  // ============================================================================
  // getCachedJob
  // ============================================================================
  describe("getCachedJob", () => {
    it("returns null when job does not exist", () => {
      expect(getCachedJob("non-existent")).toBeNull();
    });

    it("returns cached job when it exists", () => {
      const mockJob = createMockCachedJob("test-123", "video-abc");
      storeJob(mockJob);

      const result = getCachedJob("test-123");

      expect(result).not.toBeNull();
      expect(result!.jobId).toBe("test-123");
      expect(result!.videoId).toBe("video-abc");
    });

    it("returns null for expired job and removes it", () => {
      // Create job that expired 8 days ago
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const expiredJob = createMockCachedJob("expired-job", "video-xyz", eightDaysAgo);
      storeJob(expiredJob);

      const result = getCachedJob("expired-job");

      expect(result).toBeNull();
      expect(localStorageData["prompt_job_expired-job"]).toBeUndefined();
    });

    it("returns job if within TTL", () => {
      // Create job from 6 days ago (still valid)
      const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
      const validJob = createMockCachedJob("valid-job", "video-123", sixDaysAgo);
      storeJob(validJob);

      const result = getCachedJob("valid-job");

      expect(result).not.toBeNull();
      expect(result!.jobId).toBe("valid-job");
    });
  });

  // ============================================================================
  // getCachedJobsForVideo
  // ============================================================================
  describe("getCachedJobsForVideo", () => {
    it("returns empty array when no jobs exist", () => {
      const result = getCachedJobsForVideo("video-xyz");
      expect(result).toEqual([]);
    });

    it("returns jobs matching videoId", () => {
      const job1 = createMockCachedJob("job-1", "video-abc", Date.now() - 1000);
      const job2 = createMockCachedJob("job-2", "video-abc", Date.now());
      const job3 = createMockCachedJob("job-3", "video-xyz", Date.now()); // Different video

      storeJob(job1);
      storeJob(job2);
      storeJob(job3);

      const result = getCachedJobsForVideo("video-abc");

      expect(result).toHaveLength(2);
      expect(result.every((j) => j.videoId === "video-abc")).toBe(true);
    });

    it("sorts jobs by timestamp descending (newest first)", () => {
      const oldJob = createMockCachedJob("old-job", "video-abc", Date.now() - 3600000);
      const newJob = createMockCachedJob("new-job", "video-abc", Date.now());
      const middleJob = createMockCachedJob("mid-job", "video-abc", Date.now() - 1800000);

      storeJob(oldJob);
      storeJob(newJob);
      storeJob(middleJob);

      const result = getCachedJobsForVideo("video-abc");

      expect(result[0].jobId).toBe("new-job");
      expect(result[1].jobId).toBe("mid-job");
      expect(result[2].jobId).toBe("old-job");
    });

    it("filters out expired jobs", () => {
      const validJob = createMockCachedJob("valid", "video-abc", Date.now());
      const expiredJob = createMockCachedJob(
        "expired",
        "video-abc",
        Date.now() - 8 * 24 * 60 * 60 * 1000
      );

      storeJob(validJob);
      storeJob(expiredJob);

      const result = getCachedJobsForVideo("video-abc");

      expect(result).toHaveLength(1);
      expect(result[0].jobId).toBe("valid");
    });
  });

  // ============================================================================
  // getLatestCachedJob
  // ============================================================================
  describe("getLatestCachedJob", () => {
    it("returns null when no jobs exist for video", () => {
      expect(getLatestCachedJob("video-xyz")).toBeNull();
    });

    it("returns the most recent job for video", () => {
      const oldJob = createMockCachedJob("old", "video-abc", Date.now() - 3600000);
      const newJob = createMockCachedJob("new", "video-abc", Date.now());

      storeJob(oldJob);
      storeJob(newJob);

      const result = getLatestCachedJob("video-abc");

      expect(result).not.toBeNull();
      expect(result!.jobId).toBe("new");
    });
  });

  // ============================================================================
  // setCachedJob
  // ============================================================================
  describe("setCachedJob", () => {
    it("stores job in localStorage", () => {
      const mockSummary: PromptJobSummary = {
        mode: "direct",
        youtubeUrl: "https://youtube.com/watch?v=test",
        videoId: "test",
        targetScenes: 5,
        actualScenes: 5,
        voice: "vietnamese",
        charactersFound: 1,
        characters: ["Hero"],
        processingTime: "1m",
        createdAt: new Date().toISOString(),
      };

      setCachedJob("new-job-123", {
        videoId: "video-test",
        videoUrl: "https://youtube.com/watch?v=video-test",
        summary: mockSummary,
        scenes: [],
        characterRegistry: {},
      });

      expect(localStorageData["prompt_job_new-job-123"]).toBeDefined();

      const stored = JSON.parse(localStorageData["prompt_job_new-job-123"]);
      expect(stored.data.jobId).toBe("new-job-123");
      expect(stored.data.videoId).toBe("video-test");
    });

    it("dispatches custom event after storing", () => {
      const mockSummary: PromptJobSummary = {
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        targetScenes: 10,
        actualScenes: 10,
        voice: "no-voice",
        charactersFound: 0,
        characters: [],
        processingTime: "0s",
        createdAt: new Date().toISOString(),
      };

      setCachedJob("event-test", {
        videoId: "vid",
        videoUrl: "url",
        summary: mockSummary,
        scenes: [],
        characterRegistry: {},
      });

      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it("enforces MAX_TOTAL_JOBS limit by removing oldest", () => {
      // Create 20 jobs (the limit)
      for (let i = 0; i < 20; i++) {
        const timestamp = Date.now() - (20 - i) * 1000; // Older jobs first
        const job = createMockCachedJob(`job-${i}`, `video-${i}`, timestamp);
        storeJob(job);
      }

      // Verify we have 20 jobs
      const initialKeys = Object.keys(localStorageData).filter((k) =>
        k.startsWith("prompt_job_")
      );
      expect(initialKeys.length).toBe(20);

      // Add one more job
      const mockSummary: PromptJobSummary = {
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "new-vid",
        targetScenes: 10,
        actualScenes: 10,
        voice: "no-voice",
        charactersFound: 0,
        characters: [],
        processingTime: "0s",
        createdAt: new Date().toISOString(),
      };

      setCachedJob("job-new", {
        videoId: "new-vid",
        videoUrl: "url",
        summary: mockSummary,
        scenes: [],
        characterRegistry: {},
      });

      // Should still have 20 jobs (oldest removed)
      const finalKeys = Object.keys(localStorageData).filter((k) =>
        k.startsWith("prompt_job_")
      );
      expect(finalKeys.length).toBe(20);
      expect(localStorageData["prompt_job_job-new"]).toBeDefined();
    });
  });

  // ============================================================================
  // clearExpiredJobs
  // ============================================================================
  describe("clearExpiredJobs", () => {
    it("removes expired jobs", () => {
      const validJob = createMockCachedJob("valid", "video", Date.now());
      const expiredJob = createMockCachedJob(
        "expired",
        "video",
        Date.now() - 8 * 24 * 60 * 60 * 1000
      );

      storeJob(validJob);
      storeJob(expiredJob);

      clearExpiredJobs();

      expect(localStorageData["prompt_job_valid"]).toBeDefined();
      expect(localStorageData["prompt_job_expired"]).toBeUndefined();
    });

    it("keeps valid jobs", () => {
      const job1 = createMockCachedJob("job-1", "video-1", Date.now());
      const job2 = createMockCachedJob("job-2", "video-2", Date.now() - 86400000);

      storeJob(job1);
      storeJob(job2);

      clearExpiredJobs();

      expect(localStorageData["prompt_job_job-1"]).toBeDefined();
      expect(localStorageData["prompt_job_job-2"]).toBeDefined();
    });
  });

  // ============================================================================
  // clearAllJobs
  // ============================================================================
  describe("clearAllJobs", () => {
    it("removes all VEO jobs from localStorage", () => {
      storeJob(createMockCachedJob("job-1", "video-1"));
      storeJob(createMockCachedJob("job-2", "video-2"));

      // Add a non-VEO item
      localStorageData["other_key"] = "other_value";

      clearAllJobs();

      expect(localStorageData["prompt_job_job-1"]).toBeUndefined();
      expect(localStorageData["prompt_job_job-2"]).toBeUndefined();
      expect(localStorageData["other_key"]).toBe("other_value"); // Should remain
    });

    it("dispatches event with null jobId", () => {
      clearAllJobs();

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { jobId: null },
        })
      );
    });
  });

  // ============================================================================
  // deleteCachedJob
  // ============================================================================
  describe("deleteCachedJob", () => {
    it("removes specific job by ID", () => {
      storeJob(createMockCachedJob("job-1", "video-1"));
      storeJob(createMockCachedJob("job-2", "video-2"));

      deleteCachedJob("job-1");

      expect(localStorageData["prompt_job_job-1"]).toBeUndefined();
      expect(localStorageData["prompt_job_job-2"]).toBeDefined();
    });

    it("dispatches event with deleted jobId", () => {
      storeJob(createMockCachedJob("job-to-delete", "video"));

      deleteCachedJob("job-to-delete");

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { jobId: "job-to-delete" },
        })
      );
    });
  });

  // ============================================================================
  // getCachedJobList
  // ============================================================================
  describe("getCachedJobList", () => {
    it("returns empty array when no jobs exist", () => {
      expect(getCachedJobList()).toEqual([]);
    });

    it("returns all valid cached jobs", () => {
      storeJob(createMockCachedJob("job-1", "video-1"));
      storeJob(createMockCachedJob("job-2", "video-2"));

      const result = getCachedJobList();

      expect(result).toHaveLength(2);
    });

    it("filters out expired jobs", () => {
      storeJob(createMockCachedJob("valid", "video-1", Date.now()));
      storeJob(
        createMockCachedJob(
          "expired",
          "video-2",
          Date.now() - 8 * 24 * 60 * 60 * 1000
        )
      );

      const result = getCachedJobList();

      expect(result).toHaveLength(1);
      expect(result[0].jobId).toBe("valid");
    });

    it("sorts by timestamp descending", () => {
      storeJob(createMockCachedJob("old", "video-1", Date.now() - 3600000));
      storeJob(createMockCachedJob("new", "video-2", Date.now()));
      storeJob(createMockCachedJob("mid", "video-3", Date.now() - 1800000));

      const result = getCachedJobList();

      expect(result[0].jobId).toBe("new");
      expect(result[1].jobId).toBe("mid");
      expect(result[2].jobId).toBe("old");
    });

    it("includes correct job info fields", () => {
      storeJob(createMockCachedJob("info-test", "video-xyz", Date.now()));

      const result = getCachedJobList();

      expect(result[0]).toMatchObject({
        jobId: "info-test",
        videoId: "video-xyz",
        sceneCount: 1,
        charactersFound: 2,
        mode: "hybrid",
        voice: "english",
        hasScript: false,
        status: "completed",
      });
    });
  });

  // ============================================================================
  // Edge cases and error handling
  // ============================================================================
  describe("Error handling", () => {
    it("handles corrupted JSON in localStorage gracefully", () => {
      localStorageData["prompt_job_corrupted"] = "not valid json{{{";
      storeJob(createMockCachedJob("valid", "video-1"));

      // Should not throw and should return valid jobs
      const result = getCachedJobList();

      expect(result).toHaveLength(1);
      expect(result[0].jobId).toBe("valid");
    });

    it("handles missing required fields gracefully", () => {
      // Store job with missing jobId (wrapped in CachedItem structure)
      const now = Date.now();
      localStorageData["prompt_job_incomplete"] = JSON.stringify({
        data: {
          videoId: "video-1",
          timestamp: now,
        },
        timestamp: now,
      });
      storeJob(createMockCachedJob("valid", "video-1"));

      const result = getCachedJobList();

      // Should skip incomplete job
      expect(result.every((j) => j.jobId !== undefined)).toBe(true);
    });
  });
});
