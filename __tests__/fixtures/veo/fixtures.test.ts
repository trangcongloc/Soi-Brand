/**
 * VEO Test Fixtures - Sample Usage Tests
 * Demonstrates how to use the fixtures for testing VEO pipeline
 */

import {
  // Factories
  createMockJob,
  createMockScenes,
  createMockProgress,
  createMockCharacter,
  createMockCharacterRegistry,
  createMockLogEntry,
  resetTestCounters,
  hoursAgo,
  daysAgo,
  minutesAgo,

  // Pre-built jobs
  completedJob,
  inProgressJob,
  failedJob,
  stalledJob,
  emptyJob,
  expiredJob,

  // Pre-built scenes
  fullScene,
  minimalScene,
  videoScene,
  sceneWithAudio,

  // Characters
  chefMarco,
  skeletonRegistry,

  // Color profiles
  fullColorProfile,
  coolModernProfile,

  // SSE events
  progressBatch1of5,
  errorEventQuota,
  completeEvent,
  successfulJobSequence,
  serializeSSEEvent,

  // Error scenarios
  quotaExceededScenario,
  createErrorEvent,
  isRetryableErrorType,
} from "./index";

describe("VEO Test Fixtures", () => {
  beforeEach(() => {
    resetTestCounters();
  });

  describe("Factory Functions", () => {
    it("creates a mock job with defaults", () => {
      const job = createMockJob();

      expect(job.jobId).toBeDefined();
      expect(job.status).toBe("completed");
      expect(job.scenes.length).toBe(10);
      expect(job.characterRegistry).toBeDefined();
    });

    it("creates a mock job with custom status", () => {
      const job = createMockJob({
        status: "in_progress",
        sceneCount: 25,
        resumeData: {
          completedBatches: 2,
          existingScenes: createMockScenes(10),
          existingCharacters: { "Chef": "test" },
          workflow: "url-to-scenes",
          mode: "direct",
          batchSize: 5,
          sceneCount: 25,
          voice: "english",
        },
      });

      expect(job.status).toBe("in_progress");
      expect(job.resumeData?.completedBatches).toBe(2);
    });

    it("creates mock scenes with sequence numbers", () => {
      const scenes = createMockScenes(5);

      expect(scenes.length).toBe(5);
      scenes.forEach((scene, i) => {
        expect(scene.sequence).toBe(i + 1);
      });
    });

    it("creates a mock character skeleton", () => {
      const char = createMockCharacter({ name: "Test Chef" });

      expect(char.name).toBe("Test Chef");
      expect(char.gender).toBeDefined();
      expect(char.baseOutfit).toBeDefined();
    });

    it("creates mock progress at specific batch", () => {
      const progress = createMockProgress({
        completedBatches: 3,
        totalBatches: 5,
        sceneCount: 25,
        batchSize: 5,
      });

      expect(progress.completedBatches).toBe(3);
      expect(progress.totalBatches).toBe(5);
      expect(progress.scenes.length).toBe(15); // 3 batches * 5 scenes
    });

    it("creates log entries for different phases", () => {
      const phase0Log = createMockLogEntry({ phase: "phase-0" });
      const phase1Log = createMockLogEntry({ phase: "phase-1" });
      const phase2Log = createMockLogEntry({ phase: "phase-2", batchNumber: 0 });

      expect(phase0Log.phase).toBe("phase-0");
      expect(phase1Log.phase).toBe("phase-1");
      expect(phase2Log.phase).toBe("phase-2");
      expect(phase2Log.batchNumber).toBe(0);
    });
  });

  describe("Pre-built Job Fixtures", () => {
    it("completedJob has all required fields", () => {
      expect(completedJob.status).toBe("completed");
      expect(completedJob.scenes.length).toBeGreaterThan(0);
      expect(completedJob.colorProfile).toBeDefined();
      expect(completedJob.logs).toBeDefined();
    });

    it("inProgressJob has resumeData", () => {
      expect(inProgressJob.status).toBe("in_progress");
      expect(inProgressJob.resumeData).toBeDefined();
      expect(inProgressJob.resumeData?.completedBatches).toBeGreaterThan(0);
    });

    it("failedJob has error info", () => {
      expect(failedJob.status).toBe("failed");
      expect(failedJob.error).toBeDefined();
      expect(failedJob.error?.type).toBe("GEMINI_QUOTA");
      expect(failedJob.error?.retryable).toBe(true);
    });

    it("stalledJob is in_progress but old", () => {
      expect(stalledJob.status).toBe("in_progress");
      // Timestamp should be more than 5 minutes ago
      expect(Date.now() - stalledJob.timestamp).toBeGreaterThan(5 * 60 * 1000);
    });

    it("expiredJob has past expiresAt", () => {
      expect(expiredJob.expiresAt).toBeDefined();
      expect(expiredJob.expiresAt!).toBeLessThan(Date.now());
    });

    it("emptyJob has no scenes", () => {
      expect(emptyJob.scenes.length).toBe(0);
    });
  });

  describe("Scene Fixtures", () => {
    it("minimalScene has only required fields", () => {
      expect(minimalScene.description).toBeDefined();
      expect(minimalScene.object).toBeDefined();
      expect(minimalScene.style).toBeDefined();
      expect(minimalScene.prompt).toBeDefined();
    });

    it("fullScene has VEO 3 optional fields", () => {
      expect(fullScene.id).toBeDefined();
      expect(fullScene.sequence).toBeDefined();
      expect(fullScene.negativePrompt).toBeDefined();
      expect(fullScene.characterVariations).toBeDefined();
    });

    it("videoScene has video settings", () => {
      expect(videoScene.mediaType).toBe("video");
      expect(videoScene.video).toBeDefined();
      expect(videoScene.video?.duration).toBeGreaterThan(0);
      expect(videoScene.video?.cameraMovement).toBeDefined();
    });

    it("sceneWithAudio has audio specification", () => {
      expect(sceneWithAudio.audio).toBeDefined();
      expect(sceneWithAudio.audio?.environmental).toBeDefined();
      expect(sceneWithAudio.audio?.hallucinationPrevention).toBeDefined();
    });
  });

  describe("Character Fixtures", () => {
    it("chefMarco is a complete skeleton", () => {
      expect(chefMarco.name).toBe("Chef Marco");
      expect(chefMarco.gender).toBe("male");
      expect(chefMarco.age).toBeDefined();
      expect(chefMarco.ethnicity).toBeDefined();
      expect(chefMarco.baseOutfit).toBeDefined();
    });

    it("skeletonRegistry contains multiple characters", () => {
      expect(Object.keys(skeletonRegistry).length).toBeGreaterThan(1);
      expect(skeletonRegistry["Chef Marco"]).toBeDefined();
      expect(skeletonRegistry["Sous Chef Anna"]).toBeDefined();
    });
  });

  describe("Color Profile Fixtures", () => {
    it("fullColorProfile has all sections", () => {
      expect(fullColorProfile.dominantColors.length).toBeGreaterThan(0);
      expect(fullColorProfile.colorTemperature).toBeDefined();
      expect(fullColorProfile.contrast).toBeDefined();
      expect(fullColorProfile.mood).toBeDefined();
      expect(fullColorProfile.filmStock).toBeDefined();
    });

    it("profiles have different temperature categories", () => {
      expect(fullColorProfile.colorTemperature.category).toBe("warm");
      expect(coolModernProfile.colorTemperature.category).toBe("cool");
    });
  });

  describe("SSE Event Fixtures", () => {
    it("progress events have batch info", () => {
      expect(progressBatch1of5.event).toBe("progress");
      expect(progressBatch1of5.data.batch).toBe(1);
      expect(progressBatch1of5.data.total).toBe(5);
    });

    it("error events have type and retryable flag", () => {
      expect(errorEventQuota.event).toBe("error");
      expect(errorEventQuota.data.type).toBe("GEMINI_QUOTA");
      expect(errorEventQuota.data.retryable).toBe(true);
    });

    it("complete events have all job data", () => {
      expect(completeEvent.event).toBe("complete");
      expect(completeEvent.data.jobId).toBeDefined();
      expect(completeEvent.data.scenes.length).toBeGreaterThan(0);
      expect(completeEvent.data.characterRegistry).toBeDefined();
    });

    it("successfulJobSequence has correct event order", () => {
      const eventTypes = successfulJobSequence.map(e => e.event);

      // Should start with progress/log events
      expect(eventTypes[0]).toBe("progress");

      // Should end with complete
      expect(eventTypes[eventTypes.length - 1]).toBe("complete");
    });

    it("serializeSSEEvent produces valid SSE format", () => {
      const serialized = serializeSSEEvent(progressBatch1of5);

      expect(serialized).toContain("event: progress");
      expect(serialized).toContain("data:");
      expect(serialized).toContain("batch");
    });
  });

  describe("Error Fixtures", () => {
    it("quotaExceededScenario is retryable", () => {
      expect(quotaExceededScenario.retryable).toBe(true);
      expect(quotaExceededScenario.type).toBe("GEMINI_QUOTA");
    });

    it("createErrorEvent produces valid VeoErrorEvent", () => {
      const errorEvent = createErrorEvent(quotaExceededScenario);

      expect(errorEvent.event).toBe("error");
      expect(errorEvent.data.type).toBe(quotaExceededScenario.type);
      expect(errorEvent.data.message).toBe(quotaExceededScenario.message);
    });

    it("isRetryableErrorType correctly identifies types", () => {
      expect(isRetryableErrorType("GEMINI_QUOTA")).toBe(true);
      expect(isRetryableErrorType("GEMINI_RATE_LIMIT")).toBe(true);
      expect(isRetryableErrorType("PARSE_ERROR")).toBe(false);
      expect(isRetryableErrorType("INVALID_URL")).toBe(false);
    });
  });

  describe("Time Helpers", () => {
    it("hoursAgo returns correct timestamp", () => {
      const twoHoursAgo = hoursAgo(2);
      const diff = Date.now() - twoHoursAgo;

      // Should be approximately 2 hours (within 1 second tolerance)
      expect(diff).toBeGreaterThan(2 * 60 * 60 * 1000 - 1000);
      expect(diff).toBeLessThan(2 * 60 * 60 * 1000 + 1000);
    });

    it("daysAgo returns correct timestamp", () => {
      const threeDaysAgo = daysAgo(3);
      const diff = Date.now() - threeDaysAgo;

      expect(diff).toBeGreaterThan(3 * 24 * 60 * 60 * 1000 - 1000);
      expect(diff).toBeLessThan(3 * 24 * 60 * 60 * 1000 + 1000);
    });

    it("minutesAgo returns correct timestamp", () => {
      const tenMinutesAgo = minutesAgo(10);
      const diff = Date.now() - tenMinutesAgo;

      expect(diff).toBeGreaterThan(10 * 60 * 1000 - 1000);
      expect(diff).toBeLessThan(10 * 60 * 1000 + 1000);
    });
  });

  describe("Real-world Bug Scenarios", () => {
    it("can test stalled in_progress job detection", () => {
      // A job is stalled if it's in_progress but hasn't updated in 5+ minutes
      const STALL_THRESHOLD_MS = 5 * 60 * 1000;

      const isStalled = (job: typeof stalledJob) => {
        return (
          job.status === "in_progress" &&
          Date.now() - job.timestamp > STALL_THRESHOLD_MS
        );
      };

      expect(isStalled(stalledJob)).toBe(true);
      expect(isStalled(inProgressJob)).toBe(false);
    });

    it("can test job expiration logic", () => {
      const isExpired = (job: typeof completedJob) => {
        return job.expiresAt !== undefined && job.expiresAt < Date.now();
      };

      expect(isExpired(expiredJob)).toBe(true);
      expect(isExpired(completedJob)).toBe(false);
    });

    it("can test resume data availability", () => {
      const canResume = (job: typeof failedJob) => {
        return (
          job.error?.retryable === true &&
          job.resumeData !== undefined &&
          job.resumeData.completedBatches < (job.error.totalBatches ?? 0)
        );
      };

      expect(canResume(failedJob)).toBe(true);
    });

    it("can simulate partial job completion scenario", () => {
      // Create a job that completed 3 of 6 batches before failing
      const partiallyCompletedJob = createMockJob({
        status: "failed",
        sceneCount: 30,
        scenes: createMockScenes(15), // 3 batches of 5
        error: {
          type: "GEMINI_QUOTA",
          message: "Quota exceeded",
          failedBatch: 3,
          totalBatches: 6,
          retryable: true,
        },
        resumeData: {
          completedBatches: 3,
          existingScenes: createMockScenes(15),
          existingCharacters: createMockCharacterRegistry([chefMarco]),
          workflow: "url-to-scenes",
          mode: "direct",
          batchSize: 5,
          sceneCount: 30,
          voice: "english",
        },
      });

      expect(partiallyCompletedJob.scenes.length).toBe(15);
      expect(partiallyCompletedJob.resumeData?.completedBatches).toBe(3);
      expect(partiallyCompletedJob.error?.failedBatch).toBe(3);

      // Calculate remaining work
      const remainingBatches = (partiallyCompletedJob.error?.totalBatches ?? 0) -
        (partiallyCompletedJob.resumeData?.completedBatches ?? 0);
      expect(remainingBatches).toBe(3);
    });
  });
});
