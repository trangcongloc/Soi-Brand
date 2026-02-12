/**
 * Prompt Pipeline - Script generation and script-to-scenes prompts
 */

import {
  GeminiRequestBody,
  VoiceLanguage,
  AudioSettings,
  CharacterSkeleton,
  CinematicProfile,
  MediaType,
} from "../types";
import {
  addAudioInstructions,
  addVoiceInstructions,
  buildPreExtractedCharactersContext,
} from "./shared";
import { buildCinematicProfileContext } from "./color-profile";
import { getMediaTypeInstructions, RESPONSE_SCHEMA } from "./scene-generation";

// ============================================================================
// STEP 1: URL to Script
// ============================================================================

const SCRIPT_SYSTEM_INSTRUCTION = `ROLE: You are an expert video analyst and scriptwriter.

<goal>
Analyze the entire video from START to END and create a detailed script/transcript that captures:
1. All spoken dialogue with speaker identification
2. Visual actions and movements
3. Scene transitions and timing
4. Emotional context and atmosphere
5. Important visual elements and settings
</goal>

<character-identification priority="critical">
- Assign proper names to all recurring people in the video
- Use context clues (name tags, introductions, credits) when available
- If name unknown, assign role-based names: "Host Alex", "Chef Marco", "Guest Sarah", "Narrator Mike"
- Track each character's distinctive visual features for consistency:
  \u2022 Gender, age range, body type
  \u2022 Hair: color, length, style
  \u2022 Clothing: main outfit details
  \u2022 Distinctive features: glasses, beard, accessories
- In the "characters" output array, list each character as: "Name - brief appearance description"
- Example: ["Chef Marco - male, 40s, white coat, salt-pepper hair", "Host Sarah - female, 30s, red blazer, brown hair"]
</character-identification>

<output-format>
- Produce a structured script with timestamped segments
- Each segment: timestamp, content, speaker (if applicable), action, emotion
- Include a summary of the video content
- List all identified characters WITH their appearance descriptions
- List all settings/locations seen
</output-format>

<temporal-rules>
- Use approximate timestamps in MM:SS format
- Keep ordering strictly chronological
- Mark clear transitions between segments
</temporal-rules>

<language-rules>
- Transcribe dialogue in the original language
- Describe actions in English
- Note language switches if any
</language-rules>

<caption-handling priority="critical">
- Do NOT include any on-screen caption timestamps (00:00, 01:23, etc.) in the rawText field
- The rawText must contain ONLY the actual dialogue, narration, and action descriptions
- If the video has visible subtitles/captions with timestamps, extract ONLY the text content, not the timing markers
- Timestamps belong ONLY in the segments array's timestamp field, never in rawText
</caption-handling>

<self-critique>
Before finalizing JSON output, verify:
1. COVERAGE: every segment of the video is represented in the segments array
2. CHARACTERS: all visible people are listed in the characters array with appearance descriptions
3. TIMESTAMPS: segments are in strictly chronological order (MM:SS format)
4. RAW TEXT: rawText contains NO timestamps or time codes, only actual content
5. JSON VALIDITY: all required fields are populated (title, duration, language, segments, summary, characters, settings, rawText)
If ANY check fails, fix before outputting.
</self-critique>`;

const SCRIPT_USER_PROMPT = `Analyze this video and create a detailed script/transcript.

REQUIREMENTS:
1. Transcribe ALL spoken content with speaker identification
2. Describe visual actions between dialogue
3. Note emotional tones and atmosphere
4. Identify all characters by name or description
5. Note all locations/settings
6. Include approximate timestamps

Return ONLY valid JSON according to the schema.`;

const SCRIPT_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "Video title or main topic" },
    duration: { type: "STRING", description: "Video duration in MM:SS format" },
    language: { type: "STRING", description: "Primary language of the video" },
    segments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          timestamp: { type: "STRING", description: "Timestamp in MM:SS format" },
          content: { type: "STRING", description: "Dialogue or narration text" },
          speaker: { type: "STRING", description: "Who is speaking (if applicable)" },
          action: { type: "STRING", description: "Visual action happening" },
          emotion: { type: "STRING", description: "Emotional tone/context" },
        },
        required: ["timestamp", "content"],
      },
    },
    summary: { type: "STRING", description: "Brief summary of the video content" },
    characters: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of identified characters",
    },
    settings: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of locations/settings",
    },
    rawText: { type: "STRING", description: "Full transcript as plain text. MUST contain ONLY dialogue, narration, and action descriptions. Do NOT include any timestamps, time codes, or caption timing markers (like 00:00, 01:23, etc.) in this field." },
  },
  required: ["title", "duration", "language", "segments", "summary", "characters", "settings", "rawText"],
};

/**
 * Build script generation request for Step 1: URL to Script
 */
export function buildScriptPrompt(options: {
  videoUrl: string;
  startTime?: string;
  endTime?: string;
  videoDescription?: { fullText: string; chapters?: Array<{ timestamp: string; seconds: number; title: string }> };
  videoTitle?: string;
  videoDescriptionText?: string;
  useVideoCaptions?: boolean;
}): GeminiRequestBody {
  let userPrompt = SCRIPT_USER_PROMPT;
  let systemInstruction = SCRIPT_SYSTEM_INSTRUCTION;

  if (options.videoTitle) {
    systemInstruction += `\n\nVIDEO TITLE: ${options.videoTitle}\nUse this title for context about the video's topic and purpose.`;
  }

  if (options.videoDescriptionText) {
    systemInstruction += `\n\nVIDEO DESCRIPTION:\n${options.videoDescriptionText}\nUse this for additional context about the video content.`;
  }

  if (options.videoDescription?.chapters && options.videoDescription.chapters.length > 0) {
    systemInstruction += `\n\nVIDEO CHAPTERS (from video description):\n`;
    for (const chapter of options.videoDescription.chapters) {
      systemInstruction += `- ${chapter.timestamp} (${chapter.seconds}s): ${chapter.title}\n`;
    }
    systemInstruction += `\nCRITICAL: Use these chapter timestamps to structure your script segments. Ensure all chapter topics are covered in the transcript.`;
  }

  if (options.useVideoCaptions) {
    systemInstruction += `\n\nCAPTION EXTRACTION:\nExtract all on-screen text, subtitles, and captions visible in the video frames. Include them as part of the transcript with speaker identification where possible.`;
  }

  if (options.startTime || options.endTime) {
    const timeRange = [];
    if (options.startTime) {
      timeRange.push(`from ${options.startTime}`);
    }
    if (options.endTime) {
      timeRange.push(`to ${options.endTime}`);
    }
    userPrompt += `\n\nTIME RANGE: Only analyze the video segment ${timeRange.join(" ")}. Focus on this specific portion of the video and ignore content outside this range.`;
  }

  return {
    contents: [
      {
        parts: [
          {
            fileData: {
              fileUri: options.videoUrl,
              mimeType: "video/mp4",
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: SCRIPT_RESPONSE_SCHEMA,
    },
  };
}

// ============================================================================
// STEP 2: Script to Scenes
// ============================================================================

const SCRIPT_TO_SCENES_SYSTEM = `ROLE: You are an expert film director and visual designer.

SCENE GRANULARITY TARGET (CRITICAL - MUST FOLLOW):
- You MUST produce EXACTLY {SceneNumber} scenes. This is mandatory, not optional.
- If the script content seems insufficient for {SceneNumber} scenes, increase granularity: break down actions into smaller beats, separate dialogue exchanges, create transitional scenes.
- Each ~8 seconds of content = 1 scene. Split aggressively to hit the target.
- Do NOT under-generate. Under-generating is a failure mode.

GOAL: Transform the provided script into detailed visual scene descriptions. For each significant moment or segment in the script, create a scene with:
- Visual description optimized for image/video generation
- Character appearance details
- Style and lighting specifications
- Composition and framing
- Technical details

SCENE SPLITTING STRATEGY (to reach target count):
- Split dialogue into separate scenes per speaker/exchange
- Create establishing shots before action scenes
- Add reaction shots and cutaways
- Include transitional moments (walking, entering, leaving)
- Show before/during/after states of actions
- Split location changes into departure + arrival scenes

CHARACTER CONSISTENCY:
- Maintain consistent character descriptions throughout
- Track character appearances and clothing
- Use the same descriptors when characters reappear

OUTPUT: Return ONLY a JSON ARRAY with EXACTLY {SceneNumber} scenes. Each scene must have all required fields filled with detailed, concrete information.`;

const SCRIPT_TO_SCENES_USER = `Transform this script into EXACTLY {SceneNumber} visual scene descriptions for video generation.

SCRIPT:
{SCRIPT_TEXT}

---

MANDATORY REQUIREMENTS:
1. Generate EXACTLY {SceneNumber} scenes - no more, no less. Count your output.
2. Each scene must have a vivid visual description (2-4 sentences, present tense)
3. Include detailed character appearance if characters are present
4. Specify style, lighting, composition, and technical details
5. Include a synthesized image prompt
6. All descriptions must AVOID any on-screen text, subtitles, captions, or watermarks

SCENE COUNT ENFORCEMENT:
- If you find yourself generating fewer than {SceneNumber} scenes, you MUST increase granularity
- Split dialogue into multiple exchanges
- Add establishing/transitional shots
- Show reactions and cutaways
- Break long actions into sequential beats
- Your output MUST contain exactly {SceneNumber} scene objects in the JSON array`;

/**
 * Build scene generation request for Step 2: Script to Scenes
 */
export function buildScriptToScenesPrompt(options: {
  scriptText: string;
  sceneCount: number;
  voiceLang?: VoiceLanguage;
  audio?: AudioSettings;
  globalNegativePrompt?: string;
  preExtractedCharacters?: CharacterSkeleton[];
  preExtractedBackground?: string;
  cinematicProfile?: CinematicProfile;
  mediaType?: MediaType;
  selfieMode?: boolean;
}): GeminiRequestBody {
  const {
    scriptText,
    sceneCount,
    voiceLang = "no-voice",
    audio,
    globalNegativePrompt,
    preExtractedCharacters,
    preExtractedBackground,
    cinematicProfile,
    mediaType = "video",
    selfieMode,
  } = options;

  const systemText = SCRIPT_TO_SCENES_SYSTEM.replace("{SceneNumber}", String(sceneCount));

  let userPrompt = SCRIPT_TO_SCENES_USER
    .replace("{SCRIPT_TEXT}", scriptText)
    .replace("{SceneNumber}", String(sceneCount));

  if (preExtractedCharacters && preExtractedCharacters.length > 0) {
    userPrompt += buildPreExtractedCharactersContext(preExtractedCharacters, preExtractedBackground);
  }

  if (cinematicProfile) {
    userPrompt += buildCinematicProfileContext(cinematicProfile);
  }

  userPrompt += getMediaTypeInstructions(mediaType);

  if (selfieMode) {
    userPrompt += `\n
=== SELFIE/POV MODE ===
Formula: "A selfie video of [CHARACTER] [ACTIVITY]. [He/She] holds camera at arm's length. Arm clearly visible. Occasionally looking into camera before [ACTION]. Slightly grainy, film-like. Says: '[DIALOGUE]' [TONE]. Ends with [GESTURE]."
- Required: arm visible, natural eye contact, film-like quality, closing gesture
- Camera shake: none / subtle / natural
\u2192 Populate selfieSpec field
=== END SELFIE/POV MODE ===`;
  }

  if (audio) {
    userPrompt = addAudioInstructions(userPrompt, audio);
  } else {
    userPrompt = addVoiceInstructions(userPrompt, voiceLang);
  }

  if (globalNegativePrompt) {
    userPrompt += `\n\n=== GLOBAL NEGATIVE PROMPT (APPLY TO ALL SCENES) ===`;
    userPrompt += `\n${globalNegativePrompt}`;
    userPrompt += `\nInclude this in EVERY scene's negativePrompt field.`;
    userPrompt += `\nYou MAY add scene-specific exclusions (comma-separated after global).`;
    userPrompt += `\n=== END GLOBAL NEGATIVE PROMPT ===`;
  }

  return {
    contents: [
      {
        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemText }],
    },
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}
