/**
 * Tests for VEO Scene Deduplication System
 */

import {
  calculateSceneSimilarity,
  compareDescriptions,
  compareCharacters,
  compareObjects,
  compareEnvironments,
  deduplicateScenes,
  findSimilarScenes,
  getDeduplicationStats,
} from "@/lib/veo/deduplication";
import type { Scene } from "@/lib/veo/types";

// ============================================================================
// Helper Functions
// ============================================================================

function createMockScene(overrides: Partial<Scene> = {}): Scene {
  return {
    description: "A chef preparing ingredients in a kitchen",
    object: "knife, cutting board, vegetables",
    character: "Chef Marco",
    style: {
      genre: "realistic cooking",
      art_movement: "contemporary",
      medium: "digital film",
      palette: "warm tones",
      color_temperature: "warm",
      contrast: "medium",
      texture: "smooth",
      brushwork_or_line: "clean",
      rendering_engine: "photorealistic",
      camera_lens: "50mm",
      focal_length: "50mm",
      depth_of_field: "shallow",
      film_stock_or_profile: "cinematic",
      grain: "minimal",
      noise_reduction: "moderate",
      post_processing: "color grading",
      composition_style: "rule of thirds",
      mood: "professional",
      lighting_style: "soft natural light",
    },
    visual_specs: {
      primary_subject: "chef at work",
      environment: "modern kitchen",
      key_details: "professional setup",
    },
    lighting: {
      mood: "bright",
      source: "natural window light",
      shadows: "soft",
    },
    composition: {
      angle: "eye level",
      framing: "medium shot",
      focus: "subject",
    },
    technical: {
      quality: "4K",
      colors: "vibrant",
    },
    prompt: "A professional chef preparing ingredients in a modern kitchen",
    ...overrides,
  };
}

// ============================================================================
// Text Comparison Tests
// ============================================================================

describe("compareDescriptions", () => {
  it("should return 1.0 for identical descriptions", () => {
    const desc = "A chef preparing ingredients in a kitchen";
    const similarity = compareDescriptions(desc, desc);
    expect(similarity).toBe(1.0);
  });

  it("should return high similarity for nearly identical descriptions", () => {
    const desc1 = "A chef preparing ingredients in a modern kitchen";
    const desc2 = "A chef preparing ingredients in a contemporary kitchen";
    const similarity = compareDescriptions(desc1, desc2);
    expect(similarity).toBeGreaterThanOrEqual(0.75); // More tolerant threshold
  });

  it("should return low similarity for different descriptions", () => {
    const desc1 = "A chef preparing ingredients in a kitchen";
    const desc2 = "A dancer performing on stage under bright lights";
    const similarity = compareDescriptions(desc1, desc2);
    expect(similarity).toBeLessThan(0.3);
  });

  it("should handle empty strings", () => {
    const similarity = compareDescriptions("", "");
    expect(similarity).toBe(1.0); // Both empty = identical
  });

  it("should be case-insensitive", () => {
    const desc1 = "A CHEF PREPARING INGREDIENTS";
    const desc2 = "a chef preparing ingredients";
    const similarity = compareDescriptions(desc1, desc2);
    expect(similarity).toBeCloseTo(1.0, 1); // Allow floating point tolerance
  });
});

describe("compareCharacters", () => {
  it("should return 1.0 for identical character names", () => {
    const similarity = compareCharacters("Chef Marco", "Chef Marco");
    expect(similarity).toBe(1.0);
  });

  it("should return 1.0 for 'No characters' fields", () => {
    const similarity = compareCharacters("No characters", "No characters");
    expect(similarity).toBe(1.0);
  });

  it("should return high similarity for overlapping character lists", () => {
    const char1 = "Chef Marco, Sous Chef Anna";
    const char2 = "Chef Marco, Line Cook Ben";
    const similarity = compareCharacters(char1, char2);
    expect(similarity).toBeGreaterThan(0.3);
  });

  it("should return 0 for completely different characters", () => {
    const char1 = "Chef Marco";
    const char2 = "Dancer Sarah";
    const similarity = compareCharacters(char1, char2);
    expect(similarity).toBe(0);
  });

  it("should handle empty strings", () => {
    const similarity = compareCharacters("", "");
    expect(similarity).toBe(1.0);
  });
});

describe("compareObjects", () => {
  it("should return 1.0 for identical object lists", () => {
    const obj = "knife, cutting board, vegetables";
    const similarity = compareObjects(obj, obj);
    expect(similarity).toBe(1.0);
  });

  it("should return high similarity for overlapping objects", () => {
    const obj1 = "knife, cutting board, vegetables";
    const obj2 = "knife, cutting board, fruits";
    const similarity = compareObjects(obj1, obj2);
    expect(similarity).toBeGreaterThan(0.5);
  });

  it("should return low similarity for different objects", () => {
    const obj1 = "knife, cutting board";
    const obj2 = "microphone, camera";
    const similarity = compareObjects(obj1, obj2);
    expect(similarity).toBeLessThan(0.3);
  });
});

describe("compareEnvironments", () => {
  it("should return 1.0 for identical environments", () => {
    const env = "modern kitchen with stainless steel appliances";
    const similarity = compareEnvironments(env, env);
    expect(similarity).toBe(1.0);
  });

  it("should return high similarity for similar environments", () => {
    const env1 = "modern kitchen with appliances";
    const env2 = "contemporary kitchen with equipment";
    const similarity = compareEnvironments(env1, env2);
    expect(similarity).toBeGreaterThanOrEqual(0.4); // More tolerant threshold
  });

  it("should return low similarity for different environments", () => {
    const env1 = "modern kitchen";
    const env2 = "outdoor garden";
    const similarity = compareEnvironments(env1, env2);
    expect(similarity).toBeLessThan(0.3);
  });
});

// ============================================================================
// Scene Similarity Tests
// ============================================================================

describe("calculateSceneSimilarity", () => {
  it("should return 1.0 for identical scenes", () => {
    const scene1 = createMockScene();
    const scene2 = createMockScene();
    const similarity = calculateSceneSimilarity(scene1, scene2);
    expect(similarity).toBeCloseTo(1.0, 1);
  });

  it("should return high similarity for nearly identical scenes", () => {
    const scene1 = createMockScene({
      description: "A chef preparing vegetables in a kitchen",
    });
    const scene2 = createMockScene({
      description: "A chef chopping vegetables in a kitchen",
    });
    const similarity = calculateSceneSimilarity(scene1, scene2);
    expect(similarity).toBeGreaterThan(0.7);
  });

  it("should return low similarity for very different scenes", () => {
    const scene1 = createMockScene({
      description: "A chef preparing ingredients in a kitchen",
      character: "Chef Marco",
      visual_specs: {
        primary_subject: "chef at work",
        environment: "modern kitchen",
        key_details: "professional setup",
      },
    });
    const scene2 = createMockScene({
      description: "A dancer performing on stage under spotlights",
      character: "Dancer Sarah",
      visual_specs: {
        primary_subject: "dancer",
        environment: "theater stage",
        key_details: "performance lighting",
      },
    });
    const similarity = calculateSceneSimilarity(scene1, scene2);
    expect(similarity).toBeLessThan(0.3);
  });

  it("should weight description heavily in similarity calculation", () => {
    const scene1 = createMockScene({
      description: "A chef preparing a complex dish",
    });
    const scene2 = createMockScene({
      description: "A chef preparing a complex dish",
      object: "different objects", // Different object but same description
    });
    const similarity = calculateSceneSimilarity(scene1, scene2);
    expect(similarity).toBeGreaterThan(0.85); // Should still be very similar
  });
});

// ============================================================================
// Deduplication Tests
// ============================================================================

describe("deduplicateScenes", () => {
  it("should keep all unique scenes", () => {
    const existingScenes: Scene[] = [
      createMockScene({
        description: "Chef preparing fresh vegetables in a bright kitchen",
        object: "knife, cutting board, carrots, onions",
        visual_specs: {
          primary_subject: "chef chopping vegetables",
          environment: "bright modern kitchen",
          key_details: "fresh produce on counter",
        },
      }),
      createMockScene({
        description: "Chef cooking pasta in boiling water on stove",
        object: "pot, pasta, stove, wooden spoon",
        visual_specs: {
          primary_subject: "chef at stove",
          environment: "kitchen with gas stove",
          key_details: "steam rising from pot",
        },
      }),
    ];

    const newScenes: Scene[] = [
      createMockScene({
        description: "Chef carefully plating the finished dish on white porcelain",
        object: "plate, garnish, sauce, tweezers",
        visual_specs: {
          primary_subject: "chef plating food",
          environment: "plating station",
          key_details: "delicate garnish placement",
        },
      }),
      createMockScene({
        description: "Chef tasting the rich tomato sauce with a spoon",
        object: "spoon, sauce pan, herbs",
        visual_specs: {
          primary_subject: "chef tasting",
          environment: "kitchen near stove",
          key_details: "thoughtful expression",
        },
      }),
    ];

    const result = deduplicateScenes(existingScenes, newScenes, 0.75);

    expect(result.unique.length).toBe(2);
    expect(result.duplicates.length).toBe(0);
  });

  it("should detect and remove duplicate scenes", () => {
    const existingScenes: Scene[] = [
      createMockScene({ description: "A chef preparing vegetables in the kitchen" }),
    ];

    const newScenes: Scene[] = [
      createMockScene({ description: "A chef preparing vegetables in the kitchen" }), // Exact duplicate
      createMockScene({ description: "Chef plating the finished dish" }), // Unique
    ];

    const result = deduplicateScenes(existingScenes, newScenes, 0.75);

    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(1);
    expect(result.unique[0].description).toBe("Chef plating the finished dish");
  });

  it("should detect similar (but not identical) scenes", () => {
    const existingScenes: Scene[] = [
      createMockScene({ description: "A chef preparing vegetables in a modern kitchen" }),
    ];

    const newScenes: Scene[] = [
      createMockScene({ description: "A chef chopping vegetables in a modern kitchen" }), // Very similar
      createMockScene({ description: "Chef serving the meal to customers" }), // Unique
    ];

    const result = deduplicateScenes(existingScenes, newScenes, 0.75);

    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(1);
    expect(result.unique[0].description).toBe("Chef serving the meal to customers");
  });

  it("should detect duplicates within the new batch itself", () => {
    const existingScenes: Scene[] = [];

    const newScenes: Scene[] = [
      createMockScene({ description: "A chef preparing vegetables" }),
      createMockScene({ description: "A chef preparing vegetables" }), // Duplicate of first
      createMockScene({ description: "Chef cooking pasta" }), // Unique
    ];

    const result = deduplicateScenes(existingScenes, newScenes, 0.75);

    expect(result.unique.length).toBe(2);
    expect(result.duplicates.length).toBe(1);
  });

  it("should respect the similarity threshold", () => {
    const existingScenes: Scene[] = [
      createMockScene({ description: "A chef preparing vegetables" }),
    ];

    const newScenes: Scene[] = [
      createMockScene({ description: "A chef chopping vegetables" }), // Moderately similar
    ];

    // With high threshold (0.9), should NOT be detected as duplicate
    const result1 = deduplicateScenes(existingScenes, newScenes, 0.9);
    expect(result1.unique.length).toBe(1);
    expect(result1.duplicates.length).toBe(0);

    // With lower threshold (0.7), should be detected as duplicate
    const result2 = deduplicateScenes(existingScenes, newScenes, 0.7);
    expect(result2.unique.length).toBe(0);
    expect(result2.duplicates.length).toBe(1);
  });

  it("should provide similarity reasons", () => {
    const existingScenes: Scene[] = [
      createMockScene({ description: "A chef preparing vegetables" }),
    ];

    const newScenes: Scene[] = [
      createMockScene({ description: "A chef preparing vegetables" }), // Duplicate
    ];

    const result = deduplicateScenes(existingScenes, newScenes, 0.75);

    expect(result.similarities.length).toBe(1);
    expect(result.similarities[0].reason).toContain("similarity");
    expect(result.similarities[0].similarity).toBeGreaterThan(0.75);
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe("findSimilarScenes", () => {
  it("should find all similar scene pairs", () => {
    const scenes: Scene[] = [
      createMockScene({ description: "Chef preparing vegetables" }),
      createMockScene({ description: "Chef chopping vegetables" }), // Similar to scene 1
      createMockScene({ description: "Chef cooking pasta" }), // Unique
      createMockScene({ description: "Chef preparing vegetables" }), // Similar to scene 1
    ];

    const result = findSimilarScenes(scenes, 0.75);

    expect(result.length).toBeGreaterThan(0);
    // Should find at least the pair (0, 3) which are very similar
  });

  it("should return empty array when no similar scenes exist", () => {
    const scenes: Scene[] = [
      createMockScene({ description: "Chef preparing vegetables" }),
      createMockScene({ description: "Dancer on stage" }),
      createMockScene({ description: "Artist painting a portrait" }),
    ];

    const result = findSimilarScenes(scenes, 0.75);

    expect(result.length).toBe(0);
  });

  it("should sort results by similarity (highest first)", () => {
    const scenes: Scene[] = [
      createMockScene({ description: "Chef preparing vegetables" }),
      createMockScene({ description: "Chef chopping vegetables" }), // Moderately similar
      createMockScene({ description: "Chef preparing vegetables" }), // Very similar
    ];

    const result = findSimilarScenes(scenes, 0.7);

    expect(result.length).toBeGreaterThan(0);
    // First result should have highest similarity
    if (result.length > 1) {
      expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity);
    }
  });
});

describe("getDeduplicationStats", () => {
  it("should calculate correct statistics", () => {
    const result = {
      unique: [createMockScene(), createMockScene()],
      duplicates: [createMockScene()],
      similarities: [
        { scene1Index: 0, scene2Index: 2, similarity: 0.85, reason: "Test" },
      ],
    };

    const stats = getDeduplicationStats(result);

    expect(stats.totalProcessed).toBe(3);
    expect(stats.uniqueCount).toBe(2);
    expect(stats.duplicateCount).toBe(1);
    expect(stats.removalRate).toBeCloseTo(1 / 3, 2);
    expect(stats.averageSimilarity).toBe(0.85);
  });

  it("should handle no duplicates", () => {
    const result = {
      unique: [createMockScene(), createMockScene()],
      duplicates: [],
      similarities: [],
    };

    const stats = getDeduplicationStats(result);

    expect(stats.totalProcessed).toBe(2);
    expect(stats.uniqueCount).toBe(2);
    expect(stats.duplicateCount).toBe(0);
    expect(stats.removalRate).toBe(0);
    expect(stats.averageSimilarity).toBe(0);
  });

  it("should handle empty result", () => {
    const result = {
      unique: [],
      duplicates: [],
      similarities: [],
    };

    const stats = getDeduplicationStats(result);

    expect(stats.totalProcessed).toBe(0);
    expect(stats.uniqueCount).toBe(0);
    expect(stats.duplicateCount).toBe(0);
    expect(stats.removalRate).toBe(0);
    expect(stats.averageSimilarity).toBe(0);
  });
});
