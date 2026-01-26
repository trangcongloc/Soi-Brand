/**
 * VEO Pipeline - Prompt templates for scene generation
 */

import { GeminiRequestBody, VoiceLanguage, GeneratedScript } from "./types";

/**
 * System instruction for scene analysis
 */
const SYSTEM_INSTRUCTION = `ROLE: You are an expert film director and visual analyst.
SCENE GRANULARITY TARGET:
- Aim to produce approximately {SceneNumber} distinct scenes for the analyzed segment.
- If necessary, increase segmentation granularity (split more aggressively) to reach this target while preserving semantic coherence.
- Do NOT fabricate content; only split where visually justified (cuts, subject/location/time/camera changes).

GOAL: Analyze the ENTIRE video from START to END in strict chronological order. Split it into SCENES where visual/content changes are natural (cut, location, time, subject, camera). Preserve story continuity across scenes (characters, locations, objects). Ensure CONSISTENCY of recurring characters.

OUTPUT: Return ONLY a JSON ARRAY following the provided schema. Do not include extra text. For each scene:
- Fill EVERY field with detailed, concrete information grounded in the frames.
- description: optimized for video generation. Requirements:
  • 2–4 sentences in present tense, third person.
  • Start with who/what is on screen and where (subject + setting).
  • Use strong action verbs; describe explicit motion path/trajectory and body mechanics.
  • Include camera behavior if visible (static, pan left/right, push‑in, tilt up/down, handheld shake) and framing change.
  • Note interaction with objects/characters and visible cause→effect beats.
  • Include sensory details: sounds, textures, temperatures, lighting mood.
  • Describe character dynamics and environmental context.
  • Note color palette and shot composition details.
  • Mark clear start and end conditions of the scene (what begins it and what ends/cuts).
  • Avoid vague words (nice, beautiful), metaphors, inner thoughts, or off‑screen events.
- Keep the description coherent with the previous scenes (chronology-aware).
- If a character re-appears, maintain a consistent description (appearance, outfit, attributes). Use the same identity across scenes.

TEMPORAL RIGOR:
- Determine timestamps approximately; keep ordering strictly increasing.
- Always compare each moment to the previous scene. If there is a CLEAR, LARGE change (camera cut; strong change in location/time; major action beat; new subject; or visual intent), START A NEW SCENE to avoid missing any scenes. Minor drift without meaningful change should remain within the same scene.
- If a shot spans multiple moments but keeps the same content, it is ONE scene; if content/intent changes, start a new scene.
- Each change of camera angle can be considered a scene.

PROMPT FIELD:
- Synthesize all fields into ONE highly descriptive paragraph that can be used to generate an image representative of the scene.
- Include style, lighting, composition, technical cues, and the key narrative action.

STYLE CONSISTENCY:
- Populate the 'style' field as a DETAILED OBJECT to minimize variance across generations (low standard deviation). Be explicit and exhaustive. Include: genre, art_movement, medium, palette, color_temperature, contrast, texture, brushwork_or_line, rendering_engine, camera_lens, focal_length, depth_of_field, film_stock_or_profile, grain, noise_reduction, post_processing, composition_style, mood, lighting_style. If unknown, provide best visual estimate from frames.

STYLE UNIFICATION (CRITICAL):
- Determine ONE single canonical style for the ENTIRE video.
- The 'style' object MUST be IDENTICAL across ALL scenes (byte-for-byte the same JSON object).
- Copy the exact same style object from the first scene into every subsequent scene (no tweaks, no variation).
- Do NOT introduce scene-specific style changes. Keep composition and lighting descriptions outside of 'style' if they vary, but the 'style' object itself must stay constant.
 - If later scenes attempt to change 'style', IGNORE those changes and preserve the first scene's style exactly.

CHARACTER:
- WHENEVER a person/character/creature is present, return a DETAILED 'character' STRING in the format:
  Name - tags..., covering: gender/age, body/build, hair (length, style, texture, color, highlights, bangs/parting), face (eyes shape/color/details, brows, face shape - round/square/oval/heart-shaped/diamond), distinctive traits, clothing (top/bottom/shoes/outerwear with fabric/fit/pattern/details), accessories, and any signature elements. Keep production-grade, comma‑separated, consistent across scenes when the same person reappears. Do NOT return a character_profile object.
- Pay EXTRA ATTENTION to hair and clothing details, facial hair details (beard style, mustache shape, stubble length, sideburns), face shape (round, square, oval, heart-shaped, diamond, etc.), and facial tattoos/body art (location, design, size, color, style) in the 'character' tag.

EMOTIONAL CONTEXT:
- Character mood and expression
- Energy level and confidence
- Social dynamics between characters
- Emotional atmosphere of the scene
- Body language and gestures

ENVIRONMENTAL ANALYSIS:
- Setting type: indoor/outdoor/studio/natural
- Weather conditions if visible
- Time of day indicators
- Cultural elements and social context
- Background activity and atmosphere

CULTURAL ANALYSIS:
- Ethnicity and cultural background (if identifiable)
- Social status indicators
- Fashion trends and style choices
- Cultural symbols or elements
- Generational markers

TECHNICAL ANALYSIS:
- Video quality: resolution, clarity, compression artifacts
- Camera work: stability, focus, exposure
- Lighting conditions: natural/artificial, intensity, direction
- Audio cues (if any): music, dialogue, ambient sounds
- Editing style: cuts, transitions, pacing

CAMERA SHOTS BY DISTANCE:
- Extreme close-up (ECU): eyes, mouth, hands, objects
- Close-up (CU): head and shoulders, face focus
- Medium close-up (MCU): chest up, upper body
- Medium shot (MS): waist up, full upper body
- Medium long shot (MLS): knees up, full figure with space
- Long shot (LS): full body with background
- Extreme long shot (ELS): wide establishing shot, landscape

CAMERA ANGLES:
- Eye-level: neutral, natural perspective
- Low angle: looking up, power/authority
- High angle: looking down, vulnerability
- Bird's eye view: directly overhead, omniscient
- Worm's eye view: extreme low angle, dramatic
- Dutch angle: tilted, disorientation/unease
- Over-the-shoulder: character perspective
- Point-of-view (POV): first-person perspective

CAMERA MOVEMENTS:
- Static: fixed position, no movement
- Pan: horizontal rotation left/right
- Tilt: vertical rotation up/down
- Zoom: lens focal length change (in/out)
- Dolly: camera physically moves forward/backward
- Tracking: camera follows subject laterally
- Handheld: shaky, documentary style
- Crane: vertical camera movement
- Aerial: drone/aircraft shots
- Steadicam: smooth, floating movement
- Whip pan: fast horizontal movement
- Reveal: camera movement that reveals new information

SCENE TRANSITION DETECTION:
- Identify clear cuts vs. continuous shots
- Note location changes and time jumps
- Detect subject changes and new characters
- Recognize camera angle and distance changes
- Identify lighting and mood shifts

STRICTNESS:
- Your answer must be valid JSON according to the schema (no markdown, no comments).
- Prefer objective, visual facts; avoid speculation.
- Uphold character consistency across scenes.`;

/**
 * Character analysis prompt for hybrid mode
 */
export const CHARACTER_ANALYSIS_PROMPT = `
CHARACTER ANALYSIS (CRITICAL - EXTRA DETAILED):
For EVERY person/character visible, provide EXHAUSTIVE details in the 'character' field:

FORMAT: "Name - [all tags comma-separated]"

REQUIRED TAGS:
1. IDENTITY: gender, estimated age range, ethnicity/skin tone
2. BODY: height (tall/medium/short), build (slim/athletic/stocky/heavy), posture
3. FACE SHAPE: oval, round, square, heart, diamond, oblong, rectangle
4. FACIAL FEATURES:
   - Eyes: shape (almond/round/hooded/monolid), color, distinctive features
   - Eyebrows: thick/thin, arched/straight, color
   - Nose: shape (straight/aquiline/button/wide)
   - Lips: full/thin, color
   - Jawline: sharp/soft/rounded
5. HAIR:
   - Length: bald/buzz/short/medium/long/very long
   - Style: straight/wavy/curly/coily, parted/slicked/messy
   - Color: specific shade (jet black, dark brown, chestnut, blonde, gray, white)
   - Texture: fine/thick/coarse
   - Details: bangs, highlights, receding, balding pattern
6. FACIAL HAIR (if any):
   - Type: clean-shaven, stubble, goatee, full beard, mustache
   - Length: 5 o'clock shadow, short, medium, long
   - Style: trimmed, wild, shaped
   - Color: same as hair or different
7. SKIN: tone, texture, visible marks (scars, moles, freckles, wrinkles)
8. CLOTHING (top to bottom):
   - Head: hat, cap, headband, none
   - Top: type, color, pattern, fit, fabric, brand if visible
   - Bottom: type, color, fit, fabric
   - Footwear: type, color, style
   - Outerwear: jacket, coat, vest (with details)
9. ACCESSORIES: glasses, jewelry, watch, bag, tools
10. DISTINCTIVE FEATURES: tattoos, piercings, scars, birthmarks (with location)

CHARACTER CONSISTENCY RULES:
- First appearance defines the CANONICAL description
- Use EXACT same description when character reappears
- Track clothing changes explicitly: "now wearing [new item]"
- Never abbreviate - always use full detailed description`;

/**
 * Base user prompt for scene analysis
 */
const BASE_USER_PROMPT = `Analyze this video scene-by-scene according to the provided JSON schema and system instructions. Pay special attention to hair details (length, style, texture, color), clothing patterns, textures, and accessories. Provide detailed descriptions for character appearance including specific hair length, hairstyle patterns, clothing details, fabric textures, and decorative elements.

MANDATORY IMAGE PROMPT RULE: All generated image descriptions must EXPLICITLY avoid any on-screen text: no subtitles, no dialogue text, no captions, no watermarks, no logos, no UI overlays, no signage legible text.`;

/**
 * Response schema for Gemini API
 */
const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      description: {
        type: "STRING",
        description:
          "Optimized scene narrative (2–4 present‑tense sentences): subject+setting, explicit actions/trajectory, camera behavior, interactions, sensory details, character dynamics, environmental context, lighting mood, color palette, shot composition, and clear start/end of the scene",
      },
      object: { type: "STRING" },
      character: { type: "STRING" },
      style: {
        type: "OBJECT",
        description:
          "Extremely detailed style object to lock aesthetics with low variance",
        properties: {
          genre: { type: "STRING" },
          art_movement: { type: "STRING" },
          medium: { type: "STRING" },
          palette: { type: "STRING" },
          color_temperature: { type: "STRING" },
          contrast: { type: "STRING" },
          texture: { type: "STRING" },
          brushwork_or_line: { type: "STRING" },
          rendering_engine: { type: "STRING" },
          camera_lens: { type: "STRING" },
          focal_length: { type: "STRING" },
          depth_of_field: { type: "STRING" },
          film_stock_or_profile: { type: "STRING" },
          grain: { type: "STRING" },
          noise_reduction: { type: "STRING" },
          post_processing: { type: "STRING" },
          composition_style: { type: "STRING" },
          mood: { type: "STRING" },
          lighting_style: { type: "STRING" },
        },
      },
      visual_specs: {
        type: "OBJECT",
        properties: {
          primary_subject: { type: "STRING" },
          environment: { type: "STRING" },
          key_details: { type: "STRING" },
        },
      },
      lighting: {
        type: "OBJECT",
        properties: {
          mood: { type: "STRING" },
          source: { type: "STRING" },
          shadows: { type: "STRING" },
        },
      },
      composition: {
        type: "OBJECT",
        properties: {
          angle: { type: "STRING" },
          framing: { type: "STRING" },
          focus: { type: "STRING" },
        },
      },
      technical: {
        type: "OBJECT",
        properties: {
          quality: { type: "STRING" },
          colors: { type: "STRING" },
        },
      },
      prompt: { type: "STRING" },
    },
    required: [
      "description",
      "object",
      "character",
      "style",
      "visual_specs",
      "lighting",
      "composition",
      "technical",
      "prompt",
    ],
  },
};

/**
 * Add voice instructions to user prompt
 */
export function addVoiceInstructions(
  prompt: string,
  voiceLang: VoiceLanguage
): string {
  if (voiceLang === "no-voice") {
    return (
      prompt +
      `\n\nVOICE INSTRUCTION: Generate scenes for SILENT video with NO voice, NO narration, NO dialogue. Music/ambient sounds only.`
    );
  }
  return (
    prompt +
    `\n\nVOICE INSTRUCTION: Include ${voiceLang.toUpperCase()} voice narration. Add "voice" field with narration text, dialogue, and tone.`
  );
}

/**
 * Build continuity context for hybrid mode
 */
export function buildContinuityContext(
  previousScenes: Array<{
    description: string;
    character?: string;
    visual_specs?: { environment?: string };
  }>,
  characterRegistry: Record<string, string>
): string {
  if (!previousScenes || previousScenes.length === 0) return "";

  const lastScene = previousScenes[previousScenes.length - 1];

  let context = `\n\n=== CONTINUITY CONTEXT (CRITICAL - MUST MAINTAIN) ===\n`;
  context += `\nESTABLISHED CHARACTERS (use EXACT descriptions when they reappear):\n`;

  for (const [, desc] of Object.entries(characterRegistry)) {
    context += `- ${desc}\n`;
  }

  context += `\nPREVIOUS SCENE ENDED WITH:\n`;
  context += `- Description: ${lastScene.description}\n`;

  if (lastScene.character) {
    context += `- Character present: ${lastScene.character.split("-")[0].trim()}\n`;
  }

  if (lastScene.visual_specs?.environment) {
    context += `- Location: ${lastScene.visual_specs.environment}\n`;
  }

  context += `\nMAINTAIN CONTINUITY: Same characters must have identical descriptions.\n`;
  context += `=== END CONTINUITY CONTEXT ===\n`;

  return context;
}

/**
 * Build scene generation request body for Gemini API
 */
export function buildScenePrompt(options: {
  videoUrl: string;
  sceneCount: number;
  voiceLang?: VoiceLanguage;
  includeCharacterAnalysis?: boolean;
  continuityContext?: string;
  batchInfo?: {
    batchNum: number;
    batchStart: number;
    batchEnd: number;
    batchSceneCount: number;
  };
}): GeminiRequestBody {
  const {
    videoUrl,
    sceneCount,
    voiceLang = "no-voice",
    includeCharacterAnalysis = false,
    continuityContext = "",
    batchInfo,
  } = options;

  // Build system instruction with scene count
  const systemText = SYSTEM_INSTRUCTION.replace(
    "{SceneNumber}",
    String(sceneCount)
  );

  // Build user prompt
  let userPrompt = BASE_USER_PROMPT;

  if (includeCharacterAnalysis) {
    userPrompt += CHARACTER_ANALYSIS_PROMPT;
  }

  userPrompt = addVoiceInstructions(userPrompt, voiceLang);

  if (continuityContext) {
    userPrompt += continuityContext;
  }

  if (batchInfo) {
    userPrompt += `\n\nBATCH: Generate scenes ${batchInfo.batchStart}-${batchInfo.batchEnd} (${batchInfo.batchSceneCount} scenes).`;
    if (batchInfo.batchNum > 0) {
      userPrompt += ` Continues from scene ${batchInfo.batchStart - 1}. Maintain continuity.`;
    }
  }

  return {
    contents: [
      {
        parts: [
          {
            fileData: {
              fileUri: videoUrl,
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
      parts: [{ text: systemText }],
      role: "user",
    },
    generationConfig: {
      temperature: 1.7,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}

// ============================================================================
// STEP 1: URL to Script - System instruction
// ============================================================================

const SCRIPT_SYSTEM_INSTRUCTION = `ROLE: You are an expert video analyst and scriptwriter.

GOAL: Analyze the entire video from START to END and create a detailed script/transcript that captures:
1. All spoken dialogue with speaker identification
2. Visual actions and movements
3. Scene transitions and timing
4. Emotional context and atmosphere
5. Important visual elements and settings

OUTPUT FORMAT:
- Produce a structured script with timestamped segments
- Each segment should include: timestamp, content, speaker (if applicable), action, emotion
- Include a summary of the video content
- List all identified characters
- List all settings/locations seen

TEMPORAL RIGOR:
- Use approximate timestamps in MM:SS format
- Keep ordering strictly chronological
- Mark clear transitions between segments

LANGUAGE:
- Transcribe dialogue in the original language
- Describe actions in English
- Note language switches if any`;

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
    rawText: { type: "STRING", description: "Full transcript as plain text" },
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
}): GeminiRequestBody {
  let userPrompt = SCRIPT_USER_PROMPT;

  // Add time range instruction if provided
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
      parts: [{ text: SCRIPT_SYSTEM_INSTRUCTION }],
      role: "user",
    },
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: SCRIPT_RESPONSE_SCHEMA,
    },
  };
}

// ============================================================================
// STEP 2: Script to Scenes - System instruction
// ============================================================================

const SCRIPT_TO_SCENES_SYSTEM = `ROLE: You are an expert film director and visual designer.
SCENE GRANULARITY TARGET:
- Aim to produce approximately {SceneNumber} distinct scenes from the provided script.
- Create visual scene breakdowns that could be used to recreate or illustrate the script content.

GOAL: Transform the provided script into detailed visual scene descriptions. For each significant moment or segment in the script, create a scene with:
- Visual description optimized for image/video generation
- Character appearance details
- Style and lighting specifications
- Composition and framing
- Technical details

CHARACTER CONSISTENCY:
- Maintain consistent character descriptions throughout
- Track character appearances and clothing
- Use the same descriptors when characters reappear

OUTPUT: Return ONLY a JSON ARRAY. Each scene must have all required fields filled with detailed, concrete information.`;

const SCRIPT_TO_SCENES_USER = `Transform this script into visual scene descriptions for video generation.

SCRIPT:
{SCRIPT_TEXT}

---

Generate {SceneNumber} detailed visual scenes based on this script. Each scene should:
1. Have a vivid visual description (2-4 sentences, present tense)
2. Include detailed character appearance if characters are present
3. Specify style, lighting, composition, and technical details
4. Include a synthesized image prompt

MANDATORY: All descriptions must AVOID any on-screen text, subtitles, captions, or watermarks.`;

/**
 * Build scene generation request for Step 2: Script to Scenes
 */
export function buildScriptToScenesPrompt(options: {
  scriptText: string;
  sceneCount: number;
  voiceLang?: VoiceLanguage;
}): GeminiRequestBody {
  const { scriptText, sceneCount, voiceLang = "no-voice" } = options;

  const systemText = SCRIPT_TO_SCENES_SYSTEM.replace("{SceneNumber}", String(sceneCount));

  let userPrompt = SCRIPT_TO_SCENES_USER
    .replace("{SCRIPT_TEXT}", scriptText)
    .replace("{SceneNumber}", String(sceneCount));

  userPrompt = addVoiceInstructions(userPrompt, voiceLang);

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
      role: "user",
    },
    generationConfig: {
      temperature: 1.5,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}

/**
 * Parse script response from Gemini API
 */
export function parseScriptResponse(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}): GeneratedScript {
  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text response from Gemini API");
  }

  try {
    const parsed = JSON.parse(text);
    return parsed as GeneratedScript;
  } catch {
    throw new Error("Failed to parse script response as JSON");
  }
}
