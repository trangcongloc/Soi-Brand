/**
 * Tests for VEO utility functions
 * @module __tests__/lib/prompt/utils.test.ts
 */

import {
  extractVideoId,
  isValidYouTubeUrl,
  sanitizeForFolder,
  parseDuration,
  formatTime,
  formatTimeLong,
  generateTimeRanges,
  validatePositiveInt,
  generateJobId,
  getVoiceLabel,
  estimateProcessingTime,
  formatProcessingTime,
  truncateText,
  getYouTubeThumbnail,
  cleanScriptText,
} from "@/lib/prompt/utils";

describe("VEO Utils", () => {
  // ============================================================================
  // extractVideoId
  // ============================================================================
  describe("extractVideoId", () => {
    it("extracts video ID from youtube.com/watch?v= URL", () => {
      expect(
        extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from youtu.be short URL", () => {
      expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ"
      );
    });

    it("extracts video ID from youtube.com/shorts/ URL", () => {
      expect(
        extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID with additional query params", () => {
      expect(
        extractVideoId(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLtest"
        )
      ).toBe("dQw4w9WgXcQ");
    });

    it("returns null for invalid URL", () => {
      expect(extractVideoId("not-a-valid-url")).toBeNull();
    });

    it("returns null for non-YouTube URL", () => {
      expect(extractVideoId("https://vimeo.com/123456789")).toBeNull();
    });

    it("handles URL with hyphens and underscores in video ID", () => {
      expect(
        extractVideoId("https://www.youtube.com/watch?v=abc-_12XYZ0")
      ).toBe("abc-_12XYZ0");
    });

    it("handles mobile YouTube URLs", () => {
      expect(
        extractVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });
  });

  // ============================================================================
  // isValidYouTubeUrl (for videos, not channels)
  // ============================================================================
  describe("isValidYouTubeUrl", () => {
    it("returns true for standard watch URL", () => {
      expect(
        isValidYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe(true);
    });

    it("returns true for youtu.be URL", () => {
      expect(isValidYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    });

    it("returns true for shorts URL", () => {
      expect(
        isValidYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")
      ).toBe(true);
    });

    it("returns true for http (non-https) URL", () => {
      expect(
        isValidYouTubeUrl("http://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe(true);
    });

    it("returns false for channel URL", () => {
      expect(
        isValidYouTubeUrl("https://www.youtube.com/channel/UC1234567890")
      ).toBe(false);
    });

    it("returns false for @username URL", () => {
      expect(isValidYouTubeUrl("https://www.youtube.com/@MrBeast")).toBe(false);
    });

    it("returns false for non-YouTube URL", () => {
      expect(isValidYouTubeUrl("https://vimeo.com/123456789")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidYouTubeUrl("")).toBe(false);
    });

    it("returns false for malformed URL", () => {
      expect(isValidYouTubeUrl("not-a-url")).toBe(false);
    });
  });

  // ============================================================================
  // sanitizeForFolder
  // ============================================================================
  describe("sanitizeForFolder", () => {
    it("converts to lowercase", () => {
      expect(sanitizeForFolder("Hello World")).toBe("hello-world");
    });

    it("replaces special characters with hyphens", () => {
      expect(sanitizeForFolder("Test@File#Name!")).toBe("test-file-name");
    });

    it("removes leading and trailing hyphens", () => {
      expect(sanitizeForFolder("---test---")).toBe("test");
    });

    it("truncates to maxLength", () => {
      expect(sanitizeForFolder("a".repeat(100), 10)).toBe("a".repeat(10));
    });

    it("uses default maxLength of 50", () => {
      const longString = "a".repeat(100);
      const result = sanitizeForFolder(longString);
      expect(result.length).toBe(50);
    });

    it("handles unicode characters", () => {
      expect(sanitizeForFolder("Hello")).toBe("hello");
    });

    it("handles empty string", () => {
      expect(sanitizeForFolder("")).toBe("");
    });

    it("handles string with only special characters", () => {
      expect(sanitizeForFolder("!@#$%")).toBe("");
    });
  });

  // ============================================================================
  // parseDuration
  // ============================================================================
  describe("parseDuration", () => {
    it("parses MM:SS format", () => {
      expect(parseDuration("05:30")).toBe(330);
    });

    it("parses HH:MM:SS format", () => {
      expect(parseDuration("01:30:00")).toBe(5400);
    });

    it("parses 'X minutes' format", () => {
      expect(parseDuration("5 minutes")).toBe(300);
    });

    it("parses 'X mins' format", () => {
      expect(parseDuration("10 mins")).toBe(600);
    });

    it("parses 'Xm Ys' format", () => {
      expect(parseDuration("2m 30s")).toBe(150);
    });

    it("parses 'X hours Y minutes' format", () => {
      expect(parseDuration("1 hour 30 minutes")).toBe(5400);
    });

    it("parses 'X seconds' format", () => {
      expect(parseDuration("45 seconds")).toBe(45);
    });

    it("parses plain number as seconds", () => {
      expect(parseDuration("600")).toBe(600);
      expect(parseDuration("5")).toBe(5);
      expect(parseDuration("90")).toBe(90);
    });

    it("returns 0 for undefined input", () => {
      expect(parseDuration(undefined)).toBe(0);
    });

    it("returns 0 for empty string", () => {
      expect(parseDuration("")).toBe(0);
    });

    it("returns 0 for invalid string", () => {
      expect(parseDuration("invalid")).toBe(0);
    });

    it("handles case insensitivity", () => {
      expect(parseDuration("5 MINUTES")).toBe(300);
    });

    it("handles mixed formats with hours, minutes, and seconds", () => {
      expect(parseDuration("1h 30m 45s")).toBe(5445);
    });

    it("parses decimal numbers", () => {
      expect(parseDuration("1.5 hours")).toBe(5400);
    });
  });

  // ============================================================================
  // formatTime
  // ============================================================================
  describe("formatTime", () => {
    it("formats seconds to MM:SS", () => {
      expect(formatTime(90)).toBe("01:30");
    });

    it("formats 0 seconds", () => {
      expect(formatTime(0)).toBe("00:00");
    });

    it("pads single digits", () => {
      expect(formatTime(65)).toBe("01:05");
    });

    it("handles 1+ hour durations with HH:MM:SS format", () => {
      expect(formatTime(3661)).toBe("01:01:01");
    });

    it("formats just under 1 hour correctly", () => {
      expect(formatTime(3599)).toBe("59:59");
    });
  });

  // ============================================================================
  // formatTimeLong
  // ============================================================================
  describe("formatTimeLong", () => {
    it("formats short duration as MM:SS", () => {
      expect(formatTimeLong(90)).toBe("01:30");
    });

    it("formats long duration as HH:MM:SS", () => {
      expect(formatTimeLong(3661)).toBe("01:01:01");
    });

    it("formats exactly 1 hour", () => {
      expect(formatTimeLong(3600)).toBe("01:00:00");
    });

    it("formats 0 seconds", () => {
      expect(formatTimeLong(0)).toBe("00:00");
    });

    it("pads all components", () => {
      expect(formatTimeLong(3665)).toBe("01:01:05");
    });
  });

  // ============================================================================
  // generateTimeRanges
  // ============================================================================
  describe("generateTimeRanges", () => {
    it("generates correct ranges for even division", () => {
      const ranges = generateTimeRanges(120, 60, 8);
      expect(ranges).toHaveLength(2);
      expect(ranges[0]).toEqual({
        start: 0,
        end: 60,
        range: "00:00-01:00",
        sceneCount: 8,
      });
      expect(ranges[1]).toEqual({
        start: 60,
        end: 120,
        range: "01:00-02:00",
        sceneCount: 8,
      });
    });

    it("handles uneven division with remainder", () => {
      const ranges = generateTimeRanges(100, 60, 8);
      expect(ranges).toHaveLength(2);
      expect(ranges[1].end).toBe(100);
      expect(ranges[1].sceneCount).toBe(5); // 40 seconds / 8 = 5 scenes
    });

    it("generates single range for short duration", () => {
      const ranges = generateTimeRanges(30, 60, 8);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].start).toBe(0);
      expect(ranges[0].end).toBe(30);
    });

    it("handles 0 total seconds", () => {
      const ranges = generateTimeRanges(0, 60, 8);
      expect(ranges).toHaveLength(0);
    });

    it("uses custom secondsPerScene", () => {
      const ranges = generateTimeRanges(60, 60, 10);
      expect(ranges[0].sceneCount).toBe(6); // 60/10 = 6
    });
  });

  // ============================================================================
  // validatePositiveInt
  // ============================================================================
  describe("validatePositiveInt", () => {
    it("returns parsed value for valid positive integer", () => {
      expect(validatePositiveInt("10", 5, "test")).toBe(10);
    });

    it("returns default for 0", () => {
      expect(validatePositiveInt("0", 5, "test")).toBe(5);
    });

    it("returns default for negative number", () => {
      expect(validatePositiveInt("-5", 10, "test")).toBe(10);
    });

    it("returns default for NaN", () => {
      expect(validatePositiveInt("abc", 5, "test")).toBe(5);
    });

    it("returns default for undefined", () => {
      expect(validatePositiveInt(undefined, 5, "test")).toBe(5);
    });

    it("returns default for null", () => {
      expect(validatePositiveInt(null, 5, "test")).toBe(5);
    });

    it("returns default for empty string", () => {
      expect(validatePositiveInt("", 5, "test")).toBe(5);
    });

    it("parses decimal to integer", () => {
      expect(validatePositiveInt("10.7", 5, "test")).toBe(10);
    });
  });

  // ============================================================================
  // generateJobId
  // ============================================================================
  describe("generateJobId", () => {
    it("starts with 'prompt_' prefix", () => {
      const jobId = generateJobId();
      expect(jobId.startsWith("prompt_")).toBe(true);
    });

    it("generates unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateJobId());
      }
      expect(ids.size).toBe(100);
    });

    it("contains timestamp and random parts", () => {
      const jobId = generateJobId();
      const parts = jobId.split("_");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("prompt");
    });
  });

  // ============================================================================
  // getVoiceLabel
  // ============================================================================
  describe("getVoiceLabel", () => {
    it("returns 'Silent (no voice)' for 'no-voice'", () => {
      expect(getVoiceLabel("no-voice")).toBe("Silent (no voice)");
    });

    it("capitalizes first letter for other voices", () => {
      expect(getVoiceLabel("english")).toBe("English");
    });

    it("handles 'vietnamese'", () => {
      expect(getVoiceLabel("vietnamese")).toBe("Vietnamese");
    });

    it("handles single character", () => {
      expect(getVoiceLabel("a")).toBe("A");
    });
  });

  // ============================================================================
  // estimateProcessingTime
  // ============================================================================
  describe("estimateProcessingTime", () => {
    it("returns at least 30 seconds for direct mode", () => {
      expect(estimateProcessingTime(1, "direct")).toBeGreaterThanOrEqual(30);
    });

    it("returns at most 120 seconds for direct mode", () => {
      expect(estimateProcessingTime(1000, "direct")).toBeLessThanOrEqual(120);
    });

    it("calculates batch-based time for hybrid mode", () => {
      // 20 scenes, batch size 10 = 2 batches
      // 2 * 35 + 1 * 2 = 72 seconds
      expect(estimateProcessingTime(20, "hybrid", 10)).toBe(72);
    });

    it("handles single batch in hybrid mode", () => {
      // 5 scenes, batch size 10 = 1 batch
      // 1 * 35 + 0 * 2 = 35 seconds
      expect(estimateProcessingTime(5, "hybrid", 10)).toBe(35);
    });
  });

  // ============================================================================
  // formatProcessingTime
  // ============================================================================
  describe("formatProcessingTime", () => {
    it("formats seconds only for < 60 seconds", () => {
      expect(formatProcessingTime(45)).toBe("45s");
    });

    it("formats minutes and seconds for >= 60 seconds", () => {
      expect(formatProcessingTime(90)).toBe("1m 30s");
    });

    it("formats minutes only when no remaining seconds", () => {
      expect(formatProcessingTime(120)).toBe("2m");
    });

    it("rounds fractional seconds", () => {
      expect(formatProcessingTime(45.7)).toBe("46s");
    });
  });

  // ============================================================================
  // truncateText
  // ============================================================================
  describe("truncateText", () => {
    it("returns original text if shorter than maxLength", () => {
      expect(truncateText("Hello", 10)).toBe("Hello");
    });

    it("returns original text if equal to maxLength", () => {
      expect(truncateText("Hello", 5)).toBe("Hello");
    });

    it("truncates and adds ellipsis if longer than maxLength", () => {
      expect(truncateText("Hello World", 8)).toBe("Hello...");
    });

    it("handles maxLength exactly 3", () => {
      expect(truncateText("Hello", 3)).toBe("...");
    });
  });

  // ============================================================================
  // getYouTubeThumbnail
  // ============================================================================
  describe("getYouTubeThumbnail", () => {
    it("returns default quality thumbnail", () => {
      expect(getYouTubeThumbnail("abc123", "default")).toBe(
        "https://img.youtube.com/vi/abc123/default.jpg"
      );
    });

    it("returns medium quality thumbnail (default)", () => {
      expect(getYouTubeThumbnail("abc123")).toBe(
        "https://img.youtube.com/vi/abc123/mqdefault.jpg"
      );
    });

    it("returns high quality thumbnail", () => {
      expect(getYouTubeThumbnail("abc123", "high")).toBe(
        "https://img.youtube.com/vi/abc123/hqdefault.jpg"
      );
    });

    it("returns maxres quality thumbnail", () => {
      expect(getYouTubeThumbnail("abc123", "maxres")).toBe(
        "https://img.youtube.com/vi/abc123/maxresdefault.jpg"
      );
    });
  });

  // ============================================================================
  // cleanScriptText
  // ============================================================================
  describe("cleanScriptText", () => {
    it("removes standalone timestamp sequences", () => {
      const input = "00:00 00:01 00:05 00:08 Hello World";
      expect(cleanScriptText(input)).toBe("Hello World");
    });

    it("removes inline timestamps before text", () => {
      const input = "10:24 Super! Great job.";
      expect(cleanScriptText(input)).toBe("Super! Great job.");
    });

    it("removes trailing timestamps", () => {
      const input = "Hello World 10:32";
      expect(cleanScriptText(input)).toBe("Hello World");
    });

    it("preserves normal text without timestamps", () => {
      const input = "This is a normal sentence without timestamps.";
      expect(cleanScriptText(input)).toBe(
        "This is a normal sentence without timestamps."
      );
    });

    it("handles empty string", () => {
      expect(cleanScriptText("")).toBe("");
    });

    it("handles null/undefined gracefully", () => {
      expect(cleanScriptText(null as unknown as string)).toBe("");
      expect(cleanScriptText(undefined as unknown as string)).toBe("");
    });

    it("cleans up excessive whitespace", () => {
      const input = "Hello    World   Test";
      expect(cleanScriptText(input)).toBe("Hello World Test");
    });

    it("handles mixed timestamps and content", () => {
      const input = "00:00 00:05 Welcome to the show 00:10 00:15";
      const result = cleanScriptText(input);
      expect(result).toContain("Welcome");
      expect(result).not.toContain("00:00");
    });
  });
});
