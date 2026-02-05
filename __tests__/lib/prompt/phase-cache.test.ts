/**
 * Tests for PhaseCache functions
 * @module __tests__/lib/prompt/phase-cache.test.ts
 */

import {
  getResumeDataFromPhaseCache,
  cachePhase0,
  cachePhase1,
  cachePhase2Batch,
  clearPhaseCache,
  getPhaseCache,
  createPhaseCacheSettings,
} from "@/lib/prompt/phase-cache";

import {
  createMockScene,
  createMockCharacter,
  createMockCinematicProfile,
} from "@/__tests__/fixtures/prompt/factories";

import type { CharacterRegistry } from "@/lib/prompt/types";

describe("PhaseCache", () => {
  // Mock localStorage
  let localStorageData: Record<string, string>;

  beforeEach(() => {
    localStorageData = {};

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
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockSettings = createPhaseCacheSettings({
    mode: "hybrid",
    sceneCount: 40,
    batchSize: 10,
    workflow: "url-to-scenes",
  });

  describe("getResumeDataFromPhaseCache", () => {
    it("should return null when no cache exists", () => {
      const result = getResumeDataFromPhaseCache("nonexistent-job");
      expect(result).toBeNull();
    });

    it("should reconstruct scenes from phase2Batches in order", () => {
      const jobId = "test-job-1";
      const videoUrl = "https://youtube.com/watch?v=test";

      // Create scenes with identifiable sequence numbers
      const batch0Scenes = [
        createMockScene({ sequence: 1 }),
        createMockScene({ sequence: 2 }),
      ];
      const batch1Scenes = [
        createMockScene({ sequence: 3 }),
        createMockScene({ sequence: 4 }),
      ];
      const batch2Scenes = [
        createMockScene({ sequence: 5 }),
        createMockScene({ sequence: 6 }),
      ];

      // Cache batches out of order
      cachePhase2Batch(jobId, videoUrl, mockSettings, 0, batch0Scenes, {});
      cachePhase2Batch(jobId, videoUrl, mockSettings, 2, batch2Scenes, {});
      cachePhase2Batch(jobId, videoUrl, mockSettings, 1, batch1Scenes, {});

      const result = getResumeDataFromPhaseCache(jobId);

      expect(result).not.toBeNull();
      expect(result!.scenes).toHaveLength(6);
      // Verify scenes are sorted by batch number
      expect(result!.scenes[0].sequence).toBe(1);
      expect(result!.scenes[1].sequence).toBe(2);
      expect(result!.scenes[2].sequence).toBe(3);
      expect(result!.scenes[3].sequence).toBe(4);
      expect(result!.scenes[4].sequence).toBe(5);
      expect(result!.scenes[5].sequence).toBe(6);
      expect(result!.completedBatches).toBe(3);
    });

    it("should merge characters with Phase 1 having priority", () => {
      const jobId = "test-job-2";
      const videoUrl = "https://youtube.com/watch?v=test";

      // Cache Phase 1 characters (from video extraction - higher priority)
      const phase1Registry: CharacterRegistry = {
        "John": "Phase 1 description of John",
      };
      const mockSkeleton = createMockCharacter({ name: "John" });
      cachePhase1(jobId, videoUrl, mockSettings, [mockSkeleton], "Office setting", phase1Registry);

      // Cache Phase 2 batch with overlapping character
      const batch0Characters: CharacterRegistry = {
        "John": "Phase 2 description of John (should be ignored)",
        "Jane": "Phase 2 description of Jane",
      };
      cachePhase2Batch(jobId, videoUrl, mockSettings, 0, [createMockScene()], batch0Characters);

      const result = getResumeDataFromPhaseCache(jobId);

      expect(result).not.toBeNull();
      // Phase 1 John description should win
      expect(result!.characterRegistry["John"]).toBe("Phase 1 description of John");
      // Jane should be added from Phase 2
      expect(result!.characterRegistry["Jane"]).toBe("Phase 2 description of Jane");
    });

    it("should include color profile from Phase 0", () => {
      const jobId = "test-job-3";
      const videoUrl = "https://youtube.com/watch?v=test";

      const mockProfile = createMockCinematicProfile();

      // Cache Phase 0
      cachePhase0(jobId, videoUrl, mockSettings, mockProfile, 0.85);

      // Cache a batch
      cachePhase2Batch(jobId, videoUrl, mockSettings, 0, [createMockScene()], {});

      const result = getResumeDataFromPhaseCache(jobId);

      expect(result).not.toBeNull();
      expect(result!.colorProfile).toBeDefined();
      expect(result!.colorProfile!.colorProfile).toEqual(mockProfile);
      expect(result!.colorProfile!.confidence).toBe(0.85);
    });

    it("should include Phase 1 character data", () => {
      const jobId = "test-job-4";
      const videoUrl = "https://youtube.com/watch?v=test";

      const mockSkeleton = createMockCharacter({ name: "TestChar" });
      const registry: CharacterRegistry = { "TestChar": "Test character description" };
      cachePhase1(jobId, videoUrl, mockSettings, [mockSkeleton], "Test background", registry);

      const result = getResumeDataFromPhaseCache(jobId);

      expect(result).not.toBeNull();
      expect(result!.characters).toBeDefined();
      expect(result!.characters!.characters).toHaveLength(1);
      expect(result!.characters!.background).toBe("Test background");
    });

    it("should return empty scenes when only Phase 0/1 cached", () => {
      const jobId = "test-job-5";
      const videoUrl = "https://youtube.com/watch?v=test";

      const mockProfile = createMockCinematicProfile();

      // Only cache Phase 0
      cachePhase0(jobId, videoUrl, mockSettings, mockProfile, 0.9);

      const result = getResumeDataFromPhaseCache(jobId);

      expect(result).not.toBeNull();
      expect(result!.scenes).toHaveLength(0);
      expect(result!.completedBatches).toBe(0);
    });
  });

  describe("clearPhaseCache", () => {
    it("should clear cache for a specific job", () => {
      const jobId = "test-job-clear";
      const videoUrl = "https://youtube.com/watch?v=test";

      cachePhase2Batch(jobId, videoUrl, mockSettings, 0, [createMockScene()], {});
      expect(getPhaseCache(jobId)).not.toBeNull();

      clearPhaseCache(jobId);
      expect(getPhaseCache(jobId)).toBeNull();
    });
  });
});
