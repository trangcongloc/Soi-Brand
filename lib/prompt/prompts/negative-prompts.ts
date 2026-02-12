/**
 * Prompt Pipeline - Negative prompt defaults
 */

/**
 * Default negative prompt - common AI video generation issues
 */
export const DEFAULT_NEGATIVE_PROMPT =
  // Text and overlays
  "text overlays, subtitles, captions, watermarks, logos, UI overlays, " +
  // Quality issues
  "blurry, low quality, out of focus, compression artifacts, pixelated, " +
  // Anatomical/physics errors
  "duplicate subjects, anatomical errors, extra limbs, deformed faces, " +
  // Continuity issues
  "repeated actions, looping movements, objects appearing out of nowhere, " +
  "objects disappearing suddenly, teleporting items";

/**
 * Get preset negative prompt by mode
 */
export function getDefaultNegativePrompt(
  mode: "minimal" | "standard" | "aggressive" = "standard"
): string {
  if (mode === "minimal") {
    return "text overlays, watermarks, blurry, low quality";
  }
  if (mode === "aggressive") {
    return DEFAULT_NEGATIVE_PROMPT + ", motion blur, grain, noise, flickering, vignetting, black bars";
  }
  return DEFAULT_NEGATIVE_PROMPT; // standard
}
