/**
 * Unit tests for color mapper
 * Tests hex-to-semantic color mapping, distance calculations, and enrichment
 */

import {
  hexToRgb,
  rgbToHex,
  colorDistance,
  findNearestCinematicColor,
  buildSemanticColorDescription,
  enrichColorEntry,
  isGenericName,
  hasGoodMoods,
  hasGoodSemanticName,
  enrichColorEntries,
  getRecommendedColors,
  suggestPalette,
  type RGB,
} from '../colorMapper';

import type { ColorEntry } from '../types';

describe('colorMapper', () => {
  describe('hexToRgb', () => {
    test('converts hex to RGB object', () => {
      expect(hexToRgb('#1a3a5c')).toEqual({ r: 26, g: 58, b: 92 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    test('handles hex without # prefix', () => {
      expect(hexToRgb('1a3a5c')).toEqual({ r: 26, g: 58, b: 92 });
    });
  });

  describe('rgbToHex', () => {
    test('converts RGB to hex', () => {
      expect(rgbToHex({ r: 26, g: 58, b: 92 })).toBe('#1a3a5c');
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    });

    test('handles rounding', () => {
      expect(rgbToHex({ r: 26.4, g: 58.6, b: 92.3 })).toBe('#1a3b5c');
    });
  });

  describe('colorDistance', () => {
    test('calculates distance between identical colors', () => {
      const c1: RGB = { r: 26, g: 58, b: 92 };
      const c2: RGB = { r: 26, g: 58, b: 92 };
      expect(colorDistance(c1, c2)).toBe(0);
    });

    test('calculates distance between black and white', () => {
      const black: RGB = { r: 0, g: 0, b: 0 };
      const white: RGB = { r: 255, g: 255, b: 255 };
      const distance = colorDistance(black, white);
      // sqrt(255^2 * 3) ≈ 441.67
      expect(distance).toBeCloseTo(441.67, 1);
    });

    test('calculates distance between similar colors', () => {
      const c1: RGB = { r: 100, g: 100, b: 100 };
      const c2: RGB = { r: 101, g: 101, b: 101 };
      const distance = colorDistance(c1, c2);
      // sqrt(1 + 1 + 1) ≈ 1.732
      expect(distance).toBeCloseTo(1.732, 3);
    });
  });

  describe('findNearestCinematicColor', () => {
    test('maps hex to nearest cinematic color', () => {
      const result = findNearestCinematicColor('#1a3a5c');
      expect(result.semanticName).toBe('deep ocean mystery blue');
      expect(result.moods).toContain('mysterious');
      expect(result.confidence).toBeGreaterThan(0.9); // Very close match
    });

    test('returns high confidence for exact match', () => {
      const result = findNearestCinematicColor('#1a3a5c');
      expect(result.confidence).toBe(1); // Exact match
    });

    test('returns lower confidence for distant colors', () => {
      // Pick a color far from any in vocabulary
      const result = findNearestCinematicColor('#7f7f7f');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1);
    });

    test('filters by usage context', () => {
      const result = findNearestCinematicColor('#1a3a5c', 'shadows');
      expect(result.usageContexts).toContain('shadows');
    });

    test('falls back to full vocabulary if no colors match context', () => {
      // This should still work even with impossible context
      const result = findNearestCinematicColor('#1a3a5c', 'skin-tones' as any);
      expect(result.semanticName).toBeDefined();
    });
  });

  describe('buildSemanticColorDescription', () => {
    test('builds description with moods', () => {
      const color = {
        id: 'test-color',
        semanticName: 'deep ocean mystery blue',
        moods: ['mysterious', 'professional'] as any[],
        hex: '#1a3a5c',
        rgb: { r: 26, g: 58, b: 92 },
        usageContexts: [] as any[],
        temperature: 'cool' as const,
        psychologyNotes: 'test',
        confidence: 1,
      };
      const desc = buildSemanticColorDescription(color, true);
      expect(desc).toBe('deep ocean mystery blue (mysterious, professional)');
    });

    test('builds description without moods when disabled', () => {
      const color = {
        id: 'test-color',
        semanticName: 'deep ocean mystery blue',
        moods: ['mysterious', 'professional'] as any[],
        hex: '#1a3a5c',
        rgb: { r: 26, g: 58, b: 92 },
        usageContexts: [] as any[],
        temperature: 'cool' as const,
        psychologyNotes: 'test',
        confidence: 1,
      };
      const desc = buildSemanticColorDescription(color, false);
      expect(desc).toBe('deep ocean mystery blue');
    });

    test('handles colors with no moods', () => {
      const color = {
        id: 'test-color',
        semanticName: 'deep ocean mystery blue',
        moods: [] as any[],
        hex: '#1a3a5c',
        rgb: { r: 26, g: 58, b: 92 },
        usageContexts: [] as any[],
        temperature: 'cool' as const,
        psychologyNotes: 'test',
        confidence: 1,
      };
      const desc = buildSemanticColorDescription(color, true);
      expect(desc).toBe('deep ocean mystery blue');
    });

    test('limits to 2 moods for conciseness', () => {
      const color = {
        id: 'test-color',
        semanticName: 'test color',
        moods: ['mood1', 'mood2', 'mood3', 'mood4'] as any[],
        hex: '#000000',
        rgb: { r: 0, g: 0, b: 0 },
        usageContexts: [] as any[],
        temperature: 'neutral' as const,
        psychologyNotes: 'test',
        confidence: 1,
      };
      const desc = buildSemanticColorDescription(color, true);
      expect(desc).toBe('test color (mood1, mood2)');
    });
  });

  describe('enrichColorEntry', () => {
    test('enriches color entry with semantic data', () => {
      const entry: ColorEntry = {
        hex: '#1a3a5c',
        name: 'blue',
        usage: 'shadows',
      };
      const enriched = enrichColorEntry(entry);

      expect(enriched.semanticName).toBeDefined();
      expect(enriched.semanticName).not.toBe('blue'); // Should be more descriptive
      expect(enriched.moods.length).toBeGreaterThan(0);
      expect(enriched.temperature).toBeDefined();
      expect(enriched.psychologyNotes).toBeDefined();
      expect(enriched.confidence).toBeGreaterThan(0);
    });

    test('uses usage context when provided', () => {
      const entry: ColorEntry = {
        hex: '#1a3a5c',
        name: 'blue',
        usage: 'shadows',
      };
      const enriched = enrichColorEntry(entry);

      expect(enriched.moods).toBeDefined();
    });
  });

  describe('isGenericName', () => {
    test('identifies generic color names', () => {
      expect(isGenericName('blue')).toBe(true);
      expect(isGenericName('dark red')).toBe(true);
      expect(isGenericName('cool blue')).toBe(true);
      expect(isGenericName('warm orange')).toBe(true);
    });

    test('identifies non-generic names', () => {
      expect(isGenericName('deep ocean mystery blue')).toBe(false);
      expect(isGenericName('golden hour amber')).toBe(false);
      expect(isGenericName('vintage warm coral')).toBe(false);
    });
  });

  describe('hasGoodMoods', () => {
    test('returns true for 2+ moods', () => {
      expect(hasGoodMoods(['mysterious', 'professional'])).toBe(true);
      expect(hasGoodMoods(['warm', 'nostalgic', 'cozy'])).toBe(true);
    });

    test('returns false for less than 2 moods', () => {
      expect(hasGoodMoods(['mysterious'])).toBe(false);
      expect(hasGoodMoods([])).toBe(false);
      expect(hasGoodMoods(undefined)).toBe(false);
    });
  });

  describe('hasGoodSemanticName', () => {
    test('returns true for good semantic names', () => {
      expect(hasGoodSemanticName('deep ocean mystery blue')).toBe(true);
      expect(hasGoodSemanticName('golden hour amber glow')).toBe(true);
    });

    test('returns false for generic names', () => {
      expect(hasGoodSemanticName('blue')).toBe(false);
      expect(hasGoodSemanticName('dark red')).toBe(false);
    });

    test('returns false for short names', () => {
      expect(hasGoodSemanticName('darkblue')).toBe(false); // < 10 chars
    });

    test('returns false for undefined', () => {
      expect(hasGoodSemanticName(undefined)).toBe(false);
    });
  });

  describe('enrichColorEntries', () => {
    test('enriches multiple color entries', () => {
      const entries: ColorEntry[] = [
        { hex: '#1a3a5c', name: 'blue', usage: 'shadows' },
        { hex: '#d4a574', name: 'amber', usage: 'highlights' },
      ];
      const enriched = enrichColorEntries(entries);

      expect(enriched).toHaveLength(2);
      enriched.forEach(color => {
        expect(color.semanticName).toBeDefined();
        expect(color.moods.length).toBeGreaterThan(0);
        expect(color.temperature).toBeDefined();
      });
    });
  });

  describe('getRecommendedColors', () => {
    test('returns colors matching requested moods', () => {
      const colors = getRecommendedColors(['mysterious', 'cold'], 5);
      expect(colors).toHaveLength(5);
      // At least some should have the requested moods
      const hasRequestedMood = colors.some(c =>
        c.moods.includes('mysterious') || c.moods.includes('cold')
      );
      expect(hasRequestedMood).toBe(true);
    });

    test('respects limit parameter', () => {
      const colors = getRecommendedColors(['warm'], 3);
      expect(colors.length).toBeLessThanOrEqual(3);
    });
  });

  describe('suggestPalette', () => {
    test('suggests palette based on mood and temperature', () => {
      const palette = suggestPalette('mysterious', 'cool', 3);
      expect(palette.length).toBeGreaterThan(0);
      expect(palette.length).toBeLessThanOrEqual(3);

      // All colors should match criteria
      palette.forEach(color => {
        expect(color.moods).toContain('mysterious');
        expect(color.temperature).toBe('cool');
      });
    });

    test('relaxes temperature constraint if insufficient matches', () => {
      // Use a combination unlikely to have many matches
      const palette = suggestPalette('playful', 'neutral', 5);
      expect(palette.length).toBeGreaterThan(0);
      // At least should have the mood
      palette.forEach(color => {
        expect(color.moods).toContain('playful');
      });
    });
  });

  describe('integration tests', () => {
    test('full enrichment workflow', () => {
      // Simulate Gemini extraction with generic names
      const entry: ColorEntry = {
        hex: '#1a3a5c',
        name: 'blue', // Generic name
        usage: 'shadows',
      };

      // Check if name is generic
      expect(isGenericName(entry.name)).toBe(true);

      // Enrich with local vocabulary
      const enriched = enrichColorEntry(entry);

      // Verify enrichment
      expect(hasGoodSemanticName(enriched.semanticName)).toBe(true);
      expect(hasGoodMoods(enriched.moods as any)).toBe(true);
      expect(enriched.temperature).toBeDefined();
      expect(enriched.psychologyNotes).toBeDefined();

      // Build semantic description using the enriched color
      // Note: buildSemanticColorDescription only uses semanticName and moods
      const desc = buildSemanticColorDescription(enriched as any, true);
      expect(desc).toContain('(');
      expect(desc).toContain(')');
    });

    test('handles already-enriched colors', () => {
      // Simulate basic color entry from Gemini
      const entry: ColorEntry = {
        hex: '#1a3a5c',
        name: 'deep ocean mystery blue',
        usage: 'shadows',
      };

      // Enrich it
      const enriched = enrichColorEntry(entry);

      // Check the enriched result
      expect(hasGoodSemanticName(enriched.semanticName)).toBe(true);
      expect(hasGoodMoods(enriched.moods as any)).toBe(true);

      // Re-enriching should still work
      const reEnriched = enrichColorEntry(enriched);
      expect(reEnriched.semanticName).toBeDefined();
      expect(reEnriched.moods.length).toBeGreaterThan(0);
    });
  });
});
