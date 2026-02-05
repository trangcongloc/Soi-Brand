/**
 * Tests for VEO progress tracking functions
 * @module __tests__/lib/prompt/progress.test.ts
 */

import {
  createProgress,
  updateProgressAfterBatch,
  markProgressFailed,
  markProgressCompleted,
  updateProgressWithScript,
  getResumeData,
  canResumeProgress,
  calculateProgressPercent,
  getProgressMessage,
  serverProgress,
} from "@/lib/prompt/progress";

import type { PromptProgress, Scene, CharacterRegistry } from "@/lib/prompt/types";

describe("VEO Progress", () => {
  // ============================================================================
  // createProgress
  // ============================================================================
  describe("createProgress", () => {
    it("creates progress with correct initial values", () => {
      const progress = createProgress({
        jobId: "test-job-123",
        mode: "hybrid",
        youtubeUrl: "https://youtube.com/watch?v=abc123",
        videoId: "abc123",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
      });

      expect(progress.jobId).toBe("test-job-123");
      expect(progress.mode).toBe("hybrid");
      expect(progress.youtubeUrl).toBe("https://youtube.com/watch?v=abc123");
      expect(progress.videoId).toBe("abc123");
      expect(progress.sceneCount).toBe(20);
      expect(progress.batchSize).toBe(10);
      expect(progress.voiceLang).toBe("english");
      expect(progress.totalBatches).toBe(2);
    });

    it("sets completedBatches to 0", () => {
      const progress = createProgress({
        jobId: "test",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "vietnamese",
        totalBatches: 2,
      });

      expect(progress.completedBatches).toBe(0);
    });

    it("initializes empty characterRegistry", () => {
      const progress = createProgress({
        jobId: "test",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
      });

      expect(progress.characterRegistry).toEqual({});
    });

    it("initializes empty scenes array", () => {
      const progress = createProgress({
        jobId: "test",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
      });

      expect(progress.scenes).toEqual([]);
    });

    it("sets status to pending", () => {
      const progress = createProgress({
        jobId: "test",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
      });

      expect(progress.status).toBe("pending");
    });

    it("sets lastUpdated timestamp", () => {
      const before = new Date().toISOString();
      const progress = createProgress({
        jobId: "test",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
      });
      const after = new Date().toISOString();

      expect(progress.lastUpdated >= before).toBe(true);
      expect(progress.lastUpdated <= after).toBe(true);
    });

    it("includes optional scriptText", () => {
      const progress = createProgress({
        jobId: "test",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
        scriptText: "Sample script content",
      });

      expect(progress.scriptText).toBe("Sample script content");
    });
  });

  // ============================================================================
  // updateProgressAfterBatch
  // ============================================================================
  describe("updateProgressAfterBatch", () => {
    const baseProgress: PromptProgress = {
      jobId: "test-123",
      mode: "hybrid",
      youtubeUrl: "https://youtube.com/watch?v=abc123",
      videoId: "abc123",
      sceneCount: 20,
      batchSize: 10,
      voiceLang: "english",
      totalBatches: 2,
      completedBatches: 0,
      characterRegistry: {},
      scenes: [],
      lastUpdated: "2024-01-01T00:00:00.000Z",
      status: "pending",
    };

    const mockScene: Scene = {
      description: "Test scene",
      object: "Test object",
      character: "Test character",
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
      lighting: {
        mood: "test",
        source: "test",
        shadows: "test",
      },
      composition: {
        angle: "test",
        framing: "test",
        focus: "test",
      },
      technical: {
        quality: "test",
        colors: "test",
      },
      prompt: "Test prompt",
    };

    it("increments completedBatches", () => {
      const updated = updateProgressAfterBatch(baseProgress, [], {});
      expect(updated.completedBatches).toBe(1);
    });

    it("appends new scenes to existing scenes", () => {
      const initialProgress = { ...baseProgress, scenes: [mockScene] };
      const newScenes = [{ ...mockScene, description: "New scene" }];

      const updated = updateProgressAfterBatch(initialProgress, newScenes, {});

      expect(updated.scenes).toHaveLength(2);
      expect(updated.scenes[0].description).toBe("Test scene");
      expect(updated.scenes[1].description).toBe("New scene");
    });

    it("merges new characters with existing registry", () => {
      const initialProgress = {
        ...baseProgress,
        characterRegistry: { "John": "Tall man" },
      };
      const newCharacters: CharacterRegistry = { "Jane": "Short woman" };

      const updated = updateProgressAfterBatch(
        initialProgress,
        [],
        newCharacters
      );

      expect(updated.characterRegistry).toEqual({
        "John": "Tall man",
        "Jane": "Short woman",
      });
    });

    it("sets status to in_progress", () => {
      const updated = updateProgressAfterBatch(baseProgress, [], {});
      expect(updated.status).toBe("in_progress");
    });

    it("updates lastUpdated timestamp", () => {
      const before = new Date().toISOString();
      const updated = updateProgressAfterBatch(baseProgress, [], {});
      const after = new Date().toISOString();

      expect(updated.lastUpdated >= before).toBe(true);
      expect(updated.lastUpdated <= after).toBe(true);
    });

    it("preserves immutability - does not mutate original progress", () => {
      const originalBatches = baseProgress.completedBatches;
      updateProgressAfterBatch(baseProgress, [], {});

      expect(baseProgress.completedBatches).toBe(originalBatches);
    });
  });

  // ============================================================================
  // markProgressFailed
  // ============================================================================
  describe("markProgressFailed", () => {
    const baseProgress: PromptProgress = {
      jobId: "test-123",
      mode: "hybrid",
      youtubeUrl: "url",
      videoId: "id",
      sceneCount: 20,
      batchSize: 10,
      voiceLang: "english",
      totalBatches: 2,
      completedBatches: 1,
      characterRegistry: {},
      scenes: [],
      lastUpdated: "2024-01-01T00:00:00.000Z",
      status: "in_progress",
    };

    it("sets status to failed", () => {
      const failed = markProgressFailed(baseProgress, "Test error");
      expect(failed.status).toBe("failed");
    });

    it("sets lastError message", () => {
      const failed = markProgressFailed(baseProgress, "API timeout");
      expect(failed.lastError).toBe("API timeout");
    });

    it("updates lastUpdated timestamp", () => {
      const before = new Date().toISOString();
      const failed = markProgressFailed(baseProgress, "Error");
      const after = new Date().toISOString();

      expect(failed.lastUpdated >= before).toBe(true);
      expect(failed.lastUpdated <= after).toBe(true);
    });

    it("preserves other fields", () => {
      const failed = markProgressFailed(baseProgress, "Error");

      expect(failed.jobId).toBe("test-123");
      expect(failed.completedBatches).toBe(1);
      expect(failed.mode).toBe("hybrid");
    });
  });

  // ============================================================================
  // markProgressCompleted
  // ============================================================================
  describe("markProgressCompleted", () => {
    const baseProgress: PromptProgress = {
      jobId: "test-123",
      mode: "hybrid",
      youtubeUrl: "url",
      videoId: "id",
      sceneCount: 20,
      batchSize: 10,
      voiceLang: "english",
      totalBatches: 2,
      completedBatches: 2,
      characterRegistry: {},
      scenes: [],
      lastUpdated: "2024-01-01T00:00:00.000Z",
      status: "in_progress",
    };

    it("sets status to completed", () => {
      const completed = markProgressCompleted(baseProgress);
      expect(completed.status).toBe("completed");
    });

    it("updates lastUpdated timestamp", () => {
      const before = new Date().toISOString();
      const completed = markProgressCompleted(baseProgress);
      const after = new Date().toISOString();

      expect(completed.lastUpdated >= before).toBe(true);
      expect(completed.lastUpdated <= after).toBe(true);
    });

    it("preserves other fields", () => {
      const completed = markProgressCompleted(baseProgress);

      expect(completed.jobId).toBe("test-123");
      expect(completed.completedBatches).toBe(2);
    });
  });

  // ============================================================================
  // updateProgressWithScript
  // ============================================================================
  describe("updateProgressWithScript", () => {
    const baseProgress: PromptProgress = {
      jobId: "test-123",
      mode: "hybrid",
      youtubeUrl: "url",
      videoId: "id",
      sceneCount: 20,
      batchSize: 10,
      voiceLang: "english",
      totalBatches: 2,
      completedBatches: 0,
      characterRegistry: {},
      scenes: [],
      lastUpdated: "2024-01-01T00:00:00.000Z",
      status: "pending",
    };

    it("sets scriptText", () => {
      const updated = updateProgressWithScript(baseProgress, "New script text");
      expect(updated.scriptText).toBe("New script text");
    });

    it("updates lastUpdated timestamp", () => {
      const before = new Date().toISOString();
      const updated = updateProgressWithScript(baseProgress, "Script");
      const after = new Date().toISOString();

      expect(updated.lastUpdated >= before).toBe(true);
      expect(updated.lastUpdated <= after).toBe(true);
    });

    it("preserves other fields", () => {
      const updated = updateProgressWithScript(baseProgress, "Script");

      expect(updated.jobId).toBe("test-123");
      expect(updated.status).toBe("pending");
    });
  });

  // ============================================================================
  // getResumeData
  // ============================================================================
  describe("getResumeData", () => {
    it("returns null for completed progress", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 2,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "completed",
        scriptText: "Script",
      };

      expect(getResumeData(progress)).toBeNull();
    });

    it("returns null if scriptText is missing", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 1,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      };

      expect(getResumeData(progress)).toBeNull();
    });

    it("returns null if completedBatches is 0", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
        scriptText: "Script",
      };

      expect(getResumeData(progress)).toBeNull();
    });

    it("returns resume data for in_progress with scriptText", () => {
      const progress: PromptProgress = {
        jobId: "test-123",
        mode: "hybrid",
        youtubeUrl: "https://youtube.com/watch?v=abc",
        videoId: "abc",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "vietnamese",
        totalBatches: 2,
        completedBatches: 1,
        characterRegistry: { "John": "Description" },
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
        scriptText: "The script",
      };

      const resumeData = getResumeData(progress);

      expect(resumeData).not.toBeNull();
      expect(resumeData!.jobId).toBe("test-123");
      expect(resumeData!.videoUrl).toBe("https://youtube.com/watch?v=abc");
      expect(resumeData!.scriptText).toBe("The script");
      expect(resumeData!.mode).toBe("hybrid");
      expect(resumeData!.sceneCount).toBe(20);
      expect(resumeData!.batchSize).toBe(10);
      expect(resumeData!.voice).toBe("vietnamese");
      expect(resumeData!.completedBatches).toBe(1);
      expect(resumeData!.totalBatches).toBe(2);
      expect(resumeData!.existingCharacters).toEqual({ "John": "Description" });
    });
  });

  // ============================================================================
  // canResumeProgress
  // ============================================================================
  describe("canResumeProgress", () => {
    it("returns false for null progress", () => {
      expect(canResumeProgress(null)).toBe(false);
    });

    it("returns false for completed progress", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 2,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "completed",
        scriptText: "Script",
      };

      expect(canResumeProgress(progress)).toBe(false);
    });

    it("returns false for pending progress (no batches completed)", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
        scriptText: "Script",
      };

      expect(canResumeProgress(progress)).toBe(false);
    });

    it("returns false for in_progress without scriptText", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 1,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      };

      expect(canResumeProgress(progress)).toBe(false);
    });

    it("returns false if all batches completed (completedBatches >= totalBatches)", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 2,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
        scriptText: "Script",
      };

      expect(canResumeProgress(progress)).toBe(false);
    });

    it("returns true for resumable progress", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 3,
        completedBatches: 1,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
        scriptText: "Script",
      };

      expect(canResumeProgress(progress)).toBe(true);
    });
  });

  // ============================================================================
  // calculateProgressPercent
  // ============================================================================
  describe("calculateProgressPercent", () => {
    it("returns 0 when totalBatches is 0", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 0,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 0,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
      };

      expect(calculateProgressPercent(progress)).toBe(0);
    });

    it("calculates correct percentage for partial completion", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 4,
        completedBatches: 1,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      };

      expect(calculateProgressPercent(progress)).toBe(25);
    });

    it("returns 100 for completed progress", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 2,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "completed",
      };

      expect(calculateProgressPercent(progress)).toBe(100);
    });

    it("rounds to nearest integer", () => {
      const progress: PromptProgress = {
        jobId: "test",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 3,
        completedBatches: 1,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      };

      // 1/3 = 33.33... should round to 33
      expect(calculateProgressPercent(progress)).toBe(33);
    });
  });

  // ============================================================================
  // getProgressMessage
  // ============================================================================
  describe("getProgressMessage", () => {
    const baseProgress: PromptProgress = {
      jobId: "test",
      mode: "hybrid",
      youtubeUrl: "url",
      videoId: "id",
      sceneCount: 20,
      batchSize: 10,
      voiceLang: "english",
      totalBatches: 4,
      completedBatches: 2,
      characterRegistry: {},
      scenes: [
        // Simplified mock scenes
        { prompt: "test" } as Scene,
        { prompt: "test" } as Scene,
        { prompt: "test" } as Scene,
      ],
      lastUpdated: new Date().toISOString(),
      status: "in_progress",
    };

    it("returns pending message for pending status (English)", () => {
      const progress = { ...baseProgress, status: "pending" as const };
      expect(getProgressMessage(progress, "en")).toBe("Waiting to start...");
    });

    it("returns pending message for pending status (Vietnamese)", () => {
      const progress = { ...baseProgress, status: "pending" as const };
      expect(getProgressMessage(progress, "vi")).toContain("chờ");
    });

    it("returns in_progress message with batch info (English)", () => {
      const message = getProgressMessage(baseProgress, "en");
      expect(message).toContain("Processing");
      expect(message).toContain("2/4");
      expect(message).toContain("50%");
    });

    it("returns in_progress message with batch info (Vietnamese)", () => {
      const message = getProgressMessage(baseProgress, "vi");
      expect(message).toContain("xử lý");
      expect(message).toContain("2/4");
      expect(message).toContain("50%");
    });

    it("returns completed message with scene count (English)", () => {
      const progress = { ...baseProgress, status: "completed" as const };
      const message = getProgressMessage(progress, "en");
      expect(message).toContain("Completed");
      expect(message).toContain("3 scenes");
    });

    it("returns failed message with error (English)", () => {
      const progress = {
        ...baseProgress,
        status: "failed" as const,
        lastError: "API timeout",
      };
      const message = getProgressMessage(progress, "en");
      expect(message).toContain("Failed");
      expect(message).toContain("batch 3"); // completedBatches + 1
      expect(message).toContain("API timeout");
    });

    it("uses English as default language", () => {
      const message = getProgressMessage(baseProgress);
      expect(message).toContain("Processing");
    });
  });

  // ============================================================================
  // serverProgress (in-memory server-side storage)
  // ============================================================================
  describe("serverProgress", () => {
    beforeEach(() => {
      serverProgress.clear();
    });

    it("sets and gets progress by jobId", () => {
      const progress: PromptProgress = {
        jobId: "test-123",
        mode: "hybrid",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
      };

      serverProgress.set("test-123", progress);
      expect(serverProgress.get("test-123")).toEqual(progress);
    });

    it("returns undefined for non-existent jobId", () => {
      expect(serverProgress.get("non-existent")).toBeUndefined();
    });

    it("has() returns true for existing job", () => {
      const progress: PromptProgress = {
        jobId: "test-123",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
      };

      serverProgress.set("test-123", progress);
      expect(serverProgress.has("test-123")).toBe(true);
    });

    it("has() returns false for non-existent job", () => {
      expect(serverProgress.has("non-existent")).toBe(false);
    });

    it("deletes progress by jobId", () => {
      const progress: PromptProgress = {
        jobId: "test-123",
        mode: "direct",
        youtubeUrl: "url",
        videoId: "id",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
      };

      serverProgress.set("test-123", progress);
      serverProgress.delete("test-123");
      expect(serverProgress.has("test-123")).toBe(false);
    });

    it("clears all progress entries", () => {
      const progress1: PromptProgress = {
        jobId: "test-1",
        mode: "direct",
        youtubeUrl: "url1",
        videoId: "id1",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
      };

      const progress2: PromptProgress = {
        jobId: "test-2",
        mode: "direct",
        youtubeUrl: "url2",
        videoId: "id2",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
      };

      serverProgress.set("test-1", progress1);
      serverProgress.set("test-2", progress2);

      serverProgress.clear();

      expect(serverProgress.has("test-1")).toBe(false);
      expect(serverProgress.has("test-2")).toBe(false);
    });

    it("getAll() returns all progress entries", () => {
      const progress1: PromptProgress = {
        jobId: "test-1",
        mode: "direct",
        youtubeUrl: "url1",
        videoId: "id1",
        sceneCount: 10,
        batchSize: 5,
        voiceLang: "no-voice",
        totalBatches: 2,
        completedBatches: 0,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "pending",
      };

      const progress2: PromptProgress = {
        jobId: "test-2",
        mode: "hybrid",
        youtubeUrl: "url2",
        videoId: "id2",
        sceneCount: 20,
        batchSize: 10,
        voiceLang: "english",
        totalBatches: 2,
        completedBatches: 1,
        characterRegistry: {},
        scenes: [],
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      };

      serverProgress.set("test-1", progress1);
      serverProgress.set("test-2", progress2);

      const all = serverProgress.getAll();
      expect(all.size).toBe(2);
      expect(all.get("test-1")).toEqual(progress1);
      expect(all.get("test-2")).toEqual(progress2);
    });
  });
});
