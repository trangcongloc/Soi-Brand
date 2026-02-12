/**
 * Prompt Pipeline - Phase 2: Scene generation prompts
 */

import {
  GeminiRequestBody,
  GeminiPart,
  VoiceLanguage,
  AudioSettings,
  CharacterSkeleton,
  CinematicProfile,
  DirectBatchInfo,
  MediaType,
  SceneCountMode,
} from "../types";
import {
  addAudioInstructions,
  addVoiceInstructions,
  buildPreExtractedCharactersContext,
} from "./shared";
import { buildCinematicProfileContext } from "./color-profile";

// ============================================================================
// System Instructions
// ============================================================================

/**
 * Content-aware system instruction for gemini mode.
 * No hard scene count — Gemini decides based on natural transitions.
 */
const SYSTEM_INSTRUCTION_CONTENT_AWARE = `ROLE: Expert film director and visual analyst optimized for Prompt 3 video generation.

<scene-count-rules priority="critical">
Generate scenes by splitting on visual transitions.
- Target: ~8 seconds per scene (acceptable range: 5-12 seconds)
- HARD MINIMUM: ceil(video_duration / 15) scenes. FAILURE to meet minimum = invalid output.
- HARD MAXIMUM per scene: 15 seconds. Any scene > 15 seconds = SPLIT IT.
- First scene MUST start at 0:00. Last scene MUST end at video end.
- Self-check before output: count your scenes, verify minimum met, verify no scene > 15s.
</scene-count-rules>

<splitting-triggers>
Use ALL of these, not just hard cuts:
- Hard cuts, location changes, time jumps, subject changes
- Camera: angle change, zoom change, pan/tilt start/stop, tracking shot direction change
- Lighting: brightness shift, color temperature change, shadow movement
- Audio: music beat drop, tempo change, vocal entry/exit, sound effect
- Subject: pose change, expression change, movement direction change, gesture
- Background: people entering/exiting, activity change, object movement

WHY THIS MATTERS: Each scene becomes a separate VEO video clip. Under-segmentation = unusable long clips.
VALIDATION: Before finalizing, verify: scene_count >= ceil(duration_seconds / 15). If not, find more split points.
</splitting-triggers>

<output-format>
JSON ARRAY per schema. Every field required.
- description: 2-4 sentences, present tense, third person.
  \u2022 Subject + setting first, then action verbs with motion path/trajectory and body mechanics.
  \u2022 Camera behavior with position phrase: "[Shot] with camera at [location] (thats where the camera is)"
  \u2022 Object/character interactions with cause\u2192effect beats.
  \u2022 Sensory details, lighting mood, color palette, shot composition.
  \u2022 Clear start/end conditions. No vague words, metaphors, inner thoughts, or off-screen events.
- Maintain chronological coherence with previous scenes.
- Re-appearing characters use identical descriptions.
- TEMPORAL: Timestamps strictly increasing. New scene on clear visual change. Same content across time = one scene.
- PROMPT FIELD: Synthesize all fields into one descriptive paragraph. Include camera position phrase and audio design.
- STYLE: ONE canonical style, IDENTICAL across ALL scenes (byte-for-byte). Scene-specific composition/lighting go in their own fields, NOT in 'style'.
</output-format>

<character-format>
"Name - tags..." (15+ attributes for Prompt 3 consistency)
- Name first (real name, role name like "Chef Marco", or descriptive like "The Host")
- Tags: gender, age, ethnicity/skin tone, body type, face shape, hair (length+style+color+texture), facial hair, distinctive features, clothing (top/bottom/shoes/outerwear with fabric/fit/pattern), accessories
- NEVER put camera terms in character field \u2192 use composition fields
- EXTRA ATTENTION: hair details, facial hair, face shape, tattoos/body art
WRONG: \u274c "closeup of man" \u274c "A person" \u274c "Hand holding knife" \u274c "medium shot of woman"
</character-format>

<character-skeleton>
CONSISTENCY RULES:
- First appearance = CANONICAL fixed skeleton with all physical traits + base outfit
- Subsequent appearances = EXACT SAME skeleton copied verbatim
- Temporary changes (accessories, expression, pose, outfit) \u2192 characterVariations field
- Physical traits NEVER change across scenes
</character-skeleton>

<expression-control>
Anti-model-face technique:
- MICRO-EXPRESSIONS: eye squints, brow furrows, head tilts, lip quiver
- EYE DIRECTION: up=thinking, down=sad, camera=direct address, away=uncomfortable
- BODY LANGUAGE: upright=confident, slouched=defeated, leaning=engaged, rigid=tense
- EMOTIONAL ARC per scene: start state \u2192 transition \u2192 end state (e.g., "confused \u2192 processing \u2192 confident smile")
- Always: "natural, unstaged, slight asymmetry, authentic human moment"
\u2192 Populate expressionControl + emotionalArc fields for every scene with characters
</expression-control>

<dialogue-rules>
Colon format \u2014 prevents subtitles:
- COLON RULE: "[Character] [action] and says: '[line]' [tone]"
  \u274c WRONG: "[Character] says '[line]'" \u2014 triggers subtitles
- 8-SECOND RULE: max 12-15 words/line, 20-25 syllables/line
- Phonetic spelling for unusual names (e.g., "foh-fur's" not "Fofur's")
- Specify tone/delivery + body language cues
- Multiple speakers: name each character explicitly before their line
\u2192 Populate dialogue array: character, line, delivery, emotion
</dialogue-rules>

<camera-positioning>
- KEY PHRASE: "(thats where the camera is)" \u2014 triggers camera-aware processing
- Format: "[Shot] with camera at [location] (thats where the camera is)"
- Height: ground-level / eye-level / overhead / aerial
- Distance: intimate / close / medium / far / extreme
- Movement quality: natural / fluid / energetic / deliberate / graceful
\u2192 Populate enhancedCamera: position, height, distance, positionPhrase
</camera-positioning>

<composition-lighting>
- LENS: DoF (shallow/deep), aperture (f/1.4 bokeh, f/2.8), type (standard/wide/telephoto/macro/anamorphic), flare
- COLOR GRADING (semantic, not hex): teal-orange (epic) | warm-orange (nostalgic) | cool-blue (professional) | desaturated (dramatic) | noir (classic)
  Split-toning: "[mood] [color] shadows + [mood] [color] highlights"
- LIGHTING: three-point / rembrandt / golden-hour / chiaroscuro / neon \u2014 describe key, fill, rim lights
- COMPOSITION: rule-of-thirds / leading-lines / frame-within-frame / symmetry / negative-space
\u2192 Populate lensEffects, colorGrading, advancedLighting, advancedComposition fields
</composition-lighting>

<scene-context>
- Emotional: mood, energy, dynamics, body language
- Environmental: indoor/outdoor, weather, time of day, cultural elements, background activity
- Technical: quality, camera stability, lighting conditions, audio cues, editing style
- TRANSITIONS: Identify cuts vs continuous shots, location/time jumps, subject/lighting changes.
</scene-context>

<strictness>Valid JSON only. Objective visual facts. Character consistency across scenes.</strictness>

<negative-prompt-rules>
Include global negatives + scene-specific exclusions.
- Add context-appropriate exclusions (anachronisms, continuity violations, physics errors)
- Never contradict positive description
- Format: [global], [scene-specific]
- Physics: dropped items stay dropped, exited characters don't teleport back, maintain spatial consistency
</negative-prompt-rules>

<self-critique>
Before finalizing JSON output, verify:
1. SCENE COUNT: meets minimum requirement (ceil(duration / 15))
2. CHARACTER CONSISTENCY: exact same description string for each character across all scenes
3. TEMPORAL ORDER: timestamps strictly increasing, no gaps
4. DIALOGUE FORMAT: all dialogue uses colon format "[Character] [action] and says: '[line]' [tone]"
5. CAMERA SYNTAX: every scene includes "(thats where the camera is)" phrase
6. JSON VALIDITY: output is a valid JSON array with all required fields populated
If ANY check fails, fix before outputting.
</self-critique>`;

/**
 * Few-shot example for scene generation.
 * Shows one complete scene with all required fields properly filled.
 * Included conditionally — skipped in batch continuation to save tokens.
 */
const SCENE_FEW_SHOT_EXAMPLE = `
<example-output>
[{
  "description": "Chef Marco stands behind a rustic oak counter in a warmly lit kitchen, his hands resting on a wooden cutting board. Morning sunlight streams through a window to his left, casting golden highlights on the copper pots hanging on the stone wall behind him. Medium shot with camera at counter level across from Chef Marco (thats where the camera is). He lifts a freshly picked basil sprig, inspecting it with focused eyes that narrow slightly in concentration, then a subtle smile forms as he nods with professional satisfaction.",
  "prompt": "Photorealistic medium shot of a male Italian chef, 40s, standing behind rustic oak counter in warm kitchen. Golden morning sunlight from left window, copper pots on stone wall. Camera at counter level (thats where the camera is). Chef inspects basil sprig, eyes narrowing in concentration then subtle satisfied smile. Three-point lighting with warm key from window, soft fill, rim light on copper pots. Shallow depth of field f/2.8, warm color grading, Kodak Portra 400 film emulation. No text overlays, no subtitles.",
  "negativePrompt": "text overlays, subtitles, captions, watermarks, blurry, low quality, duplicate subjects, anatomical errors, extra limbs, deformed faces, modern appliances in rustic kitchen, plastic utensils",
  "character": "Chef Marco - male, 40s, Italian, olive skin, tall stocky build, square jaw with prominent Roman nose, salt-and-pepper short cropped hair slicked back, trimmed salt-and-pepper goatee, small scar above left eyebrow, gold wedding band on left hand, white double-breasted chef coat with rolled sleeves revealing forearm tattoo of olive branch, black apron tied at waist, black chef clogs",
  "characterVariations": "{\\"Chef Marco\\": {\\"expression\\": \\"focused concentration transitioning to satisfied approval\\", \\"pose\\": \\"standing upright, hands on cutting board then lifting basil\\", \\"accessories\\": \\"holding fresh basil sprig\\"}}",
  "object": "rustic oak cutting board, fresh basil sprig, copper pots, stone wall, window with morning light",
  "composition": {"angle": "eye-level", "framing": "medium-shot", "focus": "Chef Marco's hands and face, background softly blurred"},
  "lighting": {"mood": "warm, inviting, professional", "source": "natural morning sunlight from left window, supplemented by warm overhead", "shadows": "soft golden shadows, gentle falloff on right side"},
  "visual_specs": {"primary_subject": "Chef Marco examining fresh basil", "environment": "rustic farmhouse kitchen with stone walls, copper cookware, wooden beams", "key_details": "steam wisps from nearby pot, flour dust motes in sunlight beam, herbs hanging from ceiling rack"},
  "technical": {"quality": "broadcast quality, 4K, professional cinematography", "colors": "warm golden palette, earth tones, copper accents"},
  "style": {"genre": "culinary documentary", "art_movement": "naturalism", "medium": "digital cinema", "palette": "warm earth tones with copper and golden accents", "color_temperature": "warm, 4500K", "contrast": "medium-high with lifted blacks", "texture": "organic, natural grain", "brushwork_or_line": "clean photorealistic", "rendering_engine": "photorealistic", "camera_lens": "50mm prime", "focal_length": "50mm", "depth_of_field": "shallow f/2.8", "film_stock_or_profile": "Kodak Portra 400", "grain": "subtle organic film grain", "noise_reduction": "minimal, preserving texture", "post_processing": "warm color grade, slight vignette", "composition_style": "rule of thirds", "mood": "warm professional authenticity", "lighting_style": "natural + three-point supplement"},
  "shotSize": "MS",
  "enhancedCamera": {"position": "counter level, directly across from Chef Marco", "height": "eye-level", "distance": "medium", "positionPhrase": "Medium shot with camera at counter level across from Chef Marco (thats where the camera is)"},
  "dialogue": [{"character": "Chef Marco", "line": "The secret is always fresh ingredients", "delivery": "warm and confident, slight Italian accent", "emotion": "passionate professional pride"}],
  "video": {"duration": 8, "fps": 24, "speed": "normal", "cameraMovement": {"type": "static", "intensity": "subtle"}, "subjectMotion": {"primary": "Chef Marco lifts basil sprig from counter to inspect it", "secondary": "Steam wisps curl upward from nearby pot"}, "transitionIn": "cut", "transitionOut": "cut"}
}]
</example-output>`;

/**
 * Exact-count system instruction for auto/manual modes.
 * Same as content-aware but enforces an exact scene count via {SceneNumber} placeholder.
 */
const SYSTEM_INSTRUCTION_EXACT_COUNT =
  SYSTEM_INSTRUCTION_CONTENT_AWARE
    .replace(
      /<scene-count-rules priority="critical">[\s\S]*?<\/scene-count-rules>\n\n<splitting-triggers>[\s\S]*?<\/splitting-triggers>/,
      `<scene-count-rules priority="critical">
EXACTLY {SceneNumber} scenes. ~8s/scene. Under-generating = FAILURE.
You MUST generate EXACTLY {SceneNumber} scenes. Not fewer. Not more.
- First scene MUST start at 0:00. Last scene MUST end at video end.
- Split on: cuts, camera changes, lighting shifts, audio beats, subject motion, pose changes.
- If you cannot find {SceneNumber} natural splits, create finer splits (every pose change, every beat).
</scene-count-rules>`
    );

// ============================================================================
// Media Type Specific Instructions
// ============================================================================

/**
 * Image-specific system instructions for still image generation
 */
const IMAGE_GENERATION_INSTRUCTIONS = `
=== IMAGE GENERATION MODE (STILL IMAGES) ===
Generate scenes optimized for STILL IMAGE generation (Midjourney, DALL-E, Flux).

CRITICAL REQUIREMENTS:
- Each scene represents a SINGLE DECISIVE MOMENT - one frozen frame
- Describe static poses and expressions (no implied movement)
- Focus on rich environmental and compositional detail
- NO motion blur or implied movement descriptions
- Consider aspect ratio for framing composition
- Emphasize texture, material quality, and lighting details

IMAGE-SPECIFIC GUIDANCE:
- Use decisive, frozen moment language: "stands", "holds", "gazes" (not "walking", "reaching")
- Describe the exact position of all elements
- Include depth cues (foreground/midground/background)
- Specify material textures (velvet, brushed metal, rough wood)
- Note reflections, highlights, and shadow details

DO NOT:
- Describe motion or action sequences
- Use verbs that imply ongoing movement
- Include camera movement descriptions (pan, dolly, etc.)
- Reference time progression within a scene
=== END IMAGE GENERATION MODE ===`;

/**
 * Video-specific system instructions for video generation
 */
const VIDEO_GENERATION_INSTRUCTIONS = `
=== VIDEO GENERATION MODE (Prompt 3 OPTIMIZED) ===
Generate scenes optimized for Prompt 3 video generation.

CRITICAL REQUIREMENTS:
- Each scene represents a 4-8 SECOND VIDEO CLIP
- Describe explicit motion paths and trajectories
- Include camera position with "(thats where the camera is)" syntax
- Note the START and END states of any motion
- Describe subject motion AND camera motion separately
- Consider transitions between scenes for continuity

VIDEO-SPECIFIC FIELDS (REQUIRED):
1. video.duration: Estimated clip length (4-8 seconds typical)
2. video.cameraMovement: Type (static/pan/tilt/dolly/crane/handheld/orbital/zoom), direction, intensity
3. video.subjectMotion: Primary action, secondary motion, background motion

MOTION DESCRIPTION GUIDANCE:
- Use active verbs: "walks from left to right", "leans forward slowly"
- Specify direction and speed: "camera dollies in gradually", "quick pan left"
- Note motion intensity: subtle, moderate, dynamic
- Describe cause-and-effect beats: "as she pours, steam rises"

CAMERA MOVEMENT TYPES:
- static: Fixed position, no movement
- pan: Horizontal rotation (left/right)
- tilt: Vertical rotation (up/down)
- dolly: Camera moves forward/backward
- crane: Vertical camera movement
- handheld: Shaky, documentary style
- orbital: Camera orbits subject
- zoom: Lens focal length change
- tracking: Camera follows subject laterally

AUDIO DESIGN (per scene \u2014 follow AUDIO INSTRUCTIONS section below):
- Only populate audio layers that are ENABLED in the AUDIO INSTRUCTIONS section
- For DISABLED layers: do NOT populate the corresponding audio sub-field, and add to negations
- Environmental audio per location (e.g., kitchen: "sizzling, chopping, boiling")
- Music: "[mood] [genre] [instruments], [tempo]" with volume: background/prominent/featured
- SFX: "[sound] as [trigger]" (e.g., "Footsteps on gravel as character walks")
- HALLUCINATION PREVENTION: specify what TO hear AND what NOT to hear (negations list)
- Include room tone: "professional atmosphere" or "natural room tone"
\u2192 Populate audio field per AUDIO INSTRUCTIONS: environmental, music, soundEffects, negations

PHYSICS-AWARE MOTION:
- Keywords: "realistic physics", "natural fluid dynamics", "proper weight and balance"
- Materials: fabric (flowing/stiff/billowing), hair (static/windswept/bouncing), liquid (splashing/dripping/pouring), smoke (rising/dispersing)
- Gravity: normal / low (floating) / zero (weightless) / heavy (exaggerated)
\u2192 Populate physicsAwareness field

CONTINUITY BETWEEN SCENES:
- Use video.continuity to track scene relationships
- matchAction: true if motion continues from previous scene
- matchColor: true to maintain color grade
- Note any transitions (cut, fade, dissolve)

QUALITY SELF-CHECK (target 8-10/10 = Master level):
1. CHARACTER: 15+ physical attributes | 2. SCENE: 10+ environmental elements
3. CAMERA: shot+angle+movement+"(thats where the camera is)" | 4. LIGHTING: professional setup
5. AUDIO: explicit sounds + negations | 6. DIALOGUE: colon format + 8-sec rule
7. NEGATIVE PROMPTS: comprehensive | 8. TECHNICAL: broadcast quality
9. EXPRESSION: micro-expressions + emotional arc | 10. DURATION: optimized for 8s
=== END VIDEO GENERATION MODE ===`;

/**
 * Get media-specific instructions based on mediaType
 */
export function getMediaTypeInstructions(mediaType: "image" | "video" = "video"): string {
  return mediaType === "image" ? IMAGE_GENERATION_INSTRUCTIONS : VIDEO_GENERATION_INSTRUCTIONS;
}

// ============================================================================
// Selfie Mode
// ============================================================================

/**
 * Selfie/POV mode instructions
 */
const SELFIE_MODE_INSTRUCTIONS = `
=== SELFIE/POV MODE ===
Formula: "A selfie video of [CHARACTER] [ACTIVITY]. [He/She] holds camera at arm's length. Arm clearly visible. Occasionally looking into camera before [ACTION]. Slightly grainy, film-like. Says: '[DIALOGUE]' [TONE]. Ends with [GESTURE]."
- Required: arm visible, natural eye contact, film-like quality, closing gesture
- Camera shake: none / subtle / natural
\u2192 Populate selfieSpec field
=== END SELFIE/POV MODE ===`;

// ============================================================================
// User Prompt & Response Schema
// ============================================================================

/**
 * Base user prompt for scene analysis
 */
const BASE_USER_PROMPT = `Analyze this video scene-by-scene according to the provided JSON schema and system instructions. Pay special attention to hair details (length, style, texture, color), clothing patterns, textures, and accessories. Provide detailed descriptions for character appearance including specific hair length, hairstyle patterns, clothing details, fabric textures, and decorative elements.`;

/**
 * Response schema for Gemini API
 */
export const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      description: {
        type: "STRING",
        description:
          "Optimized scene narrative (2\u20134 present\u2011tense sentences): subject+setting, explicit actions/trajectory, camera behavior, interactions, sensory details, character dynamics, environmental context, lighting mood, color palette, shot composition, and clear start/end of the scene",
      },
      prompt: { type: "STRING" },
      negativePrompt: {
        type: "STRING",
        description: "Comma-separated unwanted elements. Include global + scene-specific additions.",
      },
      character: { type: "STRING", description: "Format: 'Name - appearance tags'. MUST start with name (e.g., 'Chef Marco - male, 40s, white coat...'). NEVER include camera terms like closeup, medium shot, POV here." },
      characterVariations: {
        type: "STRING",
        description: "JSON string of per-scene character variations. Format: {\"CharacterName\": {\"accessories\": \"...\", \"expression\": \"...\", \"pose\": \"...\", \"outfit\": \"...\"}}. Use for temporary changes like accessories, expressions, poses, or outfit changes.",
      },
      object: { type: "STRING", description: "Main objects visible in scene (not people)" },
      composition: {
        type: "OBJECT",
        description:
          "Camera framing for this scene. ALL camera angles and shot types go HERE, never in character field.",
        properties: {
          angle: { type: "STRING", description: "Camera angle: eye-level, low-angle, high-angle, dutch, bird's-eye, worm's-eye, over-the-shoulder, POV" },
          framing: { type: "STRING", description: "Shot type/distance: extreme-close-up, close-up, medium-close-up, medium-shot, medium-long-shot, full-shot, long-shot, extreme-long-shot" },
          focus: { type: "STRING", description: "What is in focus: subject's face, hands, environment, background blur, etc." },
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
      visual_specs: {
        type: "OBJECT",
        properties: {
          primary_subject: { type: "STRING" },
          environment: { type: "STRING" },
          key_details: { type: "STRING" },
        },
      },
      technical: {
        type: "OBJECT",
        properties: {
          quality: { type: "STRING" },
          colors: { type: "STRING" },
        },
      },
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
      shotSize: { type: "STRING", description: "Shot size hierarchy: EWS, WS, MWS, MS, MCU, CU, ECU" },
      enhancedCamera: {
        type: "OBJECT",
        description: "Prompt 3 Camera positioning with '(thats where the camera is)' syntax",
        properties: {
          position: { type: "STRING", description: "Camera position description (at counter level, behind interviewer)" },
          height: { type: "STRING", description: "ground-level, eye-level, overhead, aerial" },
          distance: { type: "STRING", description: "intimate, close, medium, far, extreme" },
          positionPhrase: { type: "STRING", description: "Full phrase with '(thats where the camera is)' syntax" },
        },
      },
      lensEffects: {
        type: "OBJECT",
        description: "Prompt 3 Lens Effects - DOF, bokeh, flare",
        properties: {
          type: { type: "STRING", description: "Lens type: standard, wide-angle, telephoto, macro, anamorphic" },
          depthOfField: { type: "STRING", description: "shallow, medium, deep, rack-focus" },
          aperture: { type: "STRING", description: "Aperture value (f/1.4, f/2.8)" },
          bokehStyle: { type: "STRING", description: "smooth, creamy, hexagonal" },
          flare: { type: "BOOLEAN", description: "Enable lens flare" },
        },
      },
      video: {
        type: "OBJECT",
        description: "Video-specific settings (only for video mediaType)",
        properties: {
          duration: { type: "NUMBER", description: "Scene duration in seconds (typically 4-8)" },
          fps: { type: "NUMBER", description: "Frames per second (24, 30, or 60)" },
          speed: { type: "STRING", description: "normal, slow-motion, or timelapse" },
          cameraMovement: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", description: "static, pan, tilt, dolly, crane, handheld, orbital, zoom, tracking" },
              direction: { type: "STRING", description: "left, right, up, down, in, out, clockwise, counterclockwise" },
              intensity: { type: "STRING", description: "subtle, moderate, dynamic" },
              path: { type: "STRING", description: "Natural language description of camera path" },
            },
          },
          subjectMotion: {
            type: "OBJECT",
            properties: {
              primary: { type: "STRING", description: "Main subject motion (e.g., 'Chef walks left to right')" },
              secondary: { type: "STRING", description: "Secondary motion (e.g., 'Steam rises from pot')" },
              background: { type: "STRING", description: "Background motion (e.g., 'Trees sway gently')" },
            },
          },
          transitionIn: { type: "STRING", description: "cut, fade, dissolve, wipe, or zoom" },
          transitionOut: { type: "STRING", description: "cut, fade, dissolve, wipe, or zoom" },
          continuity: {
            type: "OBJECT",
            description: "Inter-scene continuity tracking for batch coherence",
            properties: {
              matchAction: { type: "BOOLEAN", description: "True if motion continues from previous scene" },
              matchColor: { type: "BOOLEAN", description: "True to maintain color grade from previous scene" },
              previousSceneLink: { type: "STRING", description: "Brief description of what connects this scene to the previous one (e.g., 'continues Chef Marco's plating motion')" },
            },
          },
          audioCues: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Audio cues for the scene (e.g., 'fire crackling', 'knife on wood')",
          },
        },
      },
      movementQuality: { type: "STRING", description: "Movement quality: natural, fluid, graceful, energetic, deliberate" },
      expressionControl: {
        type: "OBJECT",
        description: "Prompt 3 Expression Control - anti-model-face technique",
        properties: {
          primary: { type: "STRING", description: "Primary emotion" },
          microExpressions: { type: "STRING", description: "Subtle facial movements" },
          eyeMovement: { type: "STRING", description: "Eye direction and behavior" },
          bodyLanguage: { type: "STRING", description: "Posture and gestures" },
          antiModelFace: { type: "BOOLEAN", description: "Enable natural, non-model expression" },
        },
      },
      emotionalArc: {
        type: "OBJECT",
        description: "Prompt 3 'This Then That' emotional progression",
        properties: {
          startState: { type: "STRING", description: "Initial emotional state" },
          middleState: { type: "STRING", description: "Transition state (optional)" },
          endState: { type: "STRING", description: "Final emotional state" },
          transitionType: { type: "STRING", description: "gradual, sudden, or building" },
        },
      },
      colorGrading: {
        type: "OBJECT",
        description: "Prompt 3 Color Grading - palette, split-toning",
        properties: {
          palette: { type: "STRING", description: "Color palette: teal-orange, desaturated, warm-orange, cool-blue, noir" },
          shadowColor: { type: "STRING", description: "Hex color for shadows" },
          highlightColor: { type: "STRING", description: "Hex color for highlights" },
          saturation: { type: "STRING", description: "muted, normal, punchy" },
          filmEmulation: { type: "STRING", description: "Film stock emulation (Kodak Portra, Fuji Superia)" },
        },
      },
      advancedLighting: {
        type: "OBJECT",
        description: "Prompt 3 Professional Lighting Setups",
        properties: {
          setup: { type: "STRING", description: "Lighting setup: three-point, rembrandt, golden-hour, chiaroscuro, neon" },
          keyLight: { type: "STRING", description: "Key light description" },
          fillLight: { type: "STRING", description: "Fill light description" },
          rimLight: { type: "BOOLEAN", description: "Enable rim lighting" },
          atmosphericEffects: { type: "STRING", description: "haze, fog, dust, rain" },
        },
      },
      audio: {
        type: "OBJECT",
        description: "Prompt 3 Audio System - environmental audio, music, SFX, hallucination prevention",
        properties: {
          environmental: {
            type: "OBJECT",
            properties: {
              ambiance: { type: "STRING", description: "Location-appropriate ambient sounds" },
              intensity: { type: "STRING", description: "subtle, moderate, or prominent" },
              spatialPosition: { type: "STRING", description: "surrounding, distant left, close right" },
            },
          },
          music: {
            type: "OBJECT",
            properties: {
              mood: { type: "STRING", description: "Mood of music (tense, uplifting, melancholic)" },
              genre: { type: "STRING", description: "Music genre (orchestral, jazz, lo-fi)" },
              volume: { type: "STRING", description: "background, prominent, or featured" },
            },
          },
          soundEffects: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                sound: { type: "STRING", description: "Sound description" },
                trigger: { type: "STRING", description: "What triggers this sound" },
              },
            },
            description: "Specific sound effects synchronized to actions",
          },
          negations: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Sounds to prevent (audio hallucination prevention)",
          },
        },
      },
      dialogue: {
        type: "ARRAY",
        description: "Prompt 3 Dialogue System - colon format for subtitle prevention",
        items: {
          type: "OBJECT",
          properties: {
            character: { type: "STRING", description: "Character name" },
            line: { type: "STRING", description: "Dialogue text (max 12-15 words for 8-sec rule)" },
            delivery: { type: "STRING", description: "Manner of delivery (whispered, shouted, with conviction)" },
            emotion: { type: "STRING", description: "Emotional state during dialogue" },
          },
        },
      },
    },
    required: [
      "description",
      "prompt",
      "character",
      "object",
      "composition",
      "lighting",
      "visual_specs",
      "technical",
      "style",
    ],
  },
};

// ============================================================================
// Build Scene Prompt
// ============================================================================

/**
 * Build scene generation request body for Gemini API
 * Supports both script-based batching and direct video time-based batching
 * Phase 2: Can use pre-extracted characters from Phase 1
 */
export function buildScenePrompt(options: {
  videoUrl: string;
  sceneCount: number;
  sceneCountMode?: SceneCountMode;
  voiceLang?: VoiceLanguage;
  audio?: AudioSettings;
  continuityContext?: string;
  globalNegativePrompt?: string;
  preExtractedCharacters?: CharacterSkeleton[];
  preExtractedBackground?: string;
  cinematicProfile?: CinematicProfile;
  mediaType?: MediaType;
  batchInfo?: {
    batchNum: number;
    batchStart: number;
    batchEnd: number;
    batchSceneCount: number;
  };
  directBatchInfo?: DirectBatchInfo;
  selfieMode?: boolean;
}): GeminiRequestBody {
  const {
    videoUrl,
    sceneCount,
    sceneCountMode = "auto",
    voiceLang = "no-voice",
    audio,
    continuityContext = "",
    globalNegativePrompt,
    preExtractedCharacters,
    preExtractedBackground,
    cinematicProfile,
    mediaType = "video",
    batchInfo,
    directBatchInfo,
    selfieMode,
  } = options;

  // Build system instruction based on scene count mode
  const effectiveSceneCount = directBatchInfo?.estimatedSceneCount ?? sceneCount;
  const isFirstBatchOrNonBatch = !directBatchInfo || directBatchInfo.batchNum === 0;
  const baseSystemText = sceneCountMode === "gemini"
    ? SYSTEM_INSTRUCTION_CONTENT_AWARE
    : SYSTEM_INSTRUCTION_EXACT_COUNT.replace(/{SceneNumber}/g, String(effectiveSceneCount));

  // Include few-shot example only for first batch (or non-batch) to save tokens on continuations
  const systemText = isFirstBatchOrNonBatch
    ? baseSystemText + "\n" + SCENE_FEW_SHOT_EXAMPLE
    : baseSystemText;

  // Build user prompt
  let userPrompt = BASE_USER_PROMPT;

  // Add pre-extracted characters context (Phase 2)
  if (preExtractedCharacters && preExtractedCharacters.length > 0) {
    userPrompt += buildPreExtractedCharactersContext(preExtractedCharacters, preExtractedBackground);
  }

  // Add cinematic profile context (Phase 0)
  if (cinematicProfile) {
    userPrompt += buildCinematicProfileContext(cinematicProfile);
  }

  // Add media type instructions
  userPrompt += getMediaTypeInstructions(mediaType);

  // Add selfie mode instructions if enabled
  if (selfieMode) {
    userPrompt += "\n" + SELFIE_MODE_INSTRUCTIONS;
  }

  // Add audio instructions
  if (audio) {
    userPrompt = addAudioInstructions(userPrompt, audio);
  } else {
    userPrompt = addVoiceInstructions(userPrompt, voiceLang);
  }

  if (continuityContext) {
    userPrompt += continuityContext;
  }

  // Direct mode: Add time range instruction for video segment analysis
  if (directBatchInfo) {
    const overlapSeconds = directBatchInfo.startSeconds - directBatchInfo.analysisStartSeconds;
    const hasOverlap = overlapSeconds > 0;

    userPrompt += `\n\n=== VIDEO SEGMENT INFO ===`;
    userPrompt += `\nThis is batch ${directBatchInfo.batchNum + 1} of ${directBatchInfo.totalBatches} (segment ${directBatchInfo.startTime}\u2013${directBatchInfo.endTime}).`;

    if (hasOverlap) {
      userPrompt += `\nVideo includes ${overlapSeconds}s overlap BEFORE ${directBatchInfo.startTime} for visual context.`;
      userPrompt += `\nDo NOT generate scenes for the overlap period (before ${directBatchInfo.startTime}).`;
    }

    if (sceneCountMode === "gemini") {
      const segmentDuration = directBatchInfo.endSeconds - directBatchInfo.startSeconds;
      const minScenes = Math.ceil(segmentDuration / 15);
      const targetScenes = Math.round(segmentDuration / 8);

      userPrompt += `\n\n\u26a0\ufe0f SCENE COUNT REQUIREMENT (${segmentDuration} seconds):`;
      userPrompt += `\n\u2022 HARD MINIMUM: ${minScenes} scenes (${segmentDuration}s \u00f7 15s max = ${minScenes})`;
      userPrompt += `\n\u2022 TARGET: ~${targetScenes} scenes (${segmentDuration}s \u00f7 8s target = ${targetScenes})`;
      userPrompt += `\n\u2022 FAILURE: < ${minScenes} scenes = INVALID OUTPUT. Find more split points.`;
      userPrompt += `\n\u2022 Coverage: ${directBatchInfo.startTime} to ${directBatchInfo.endTime} (every second must be in exactly one scene)`;
      userPrompt += `\n\nSPLIT ON: camera moves, zoom changes, lighting shifts, beat drops, pose changes, subject motion, background activity changes.`;
      userPrompt += `\nBefore finalizing: COUNT your scenes. Is it >= ${minScenes}? If NO, split more scenes.`;
    } else {
      userPrompt += `\nGenerate EXACTLY ${effectiveSceneCount} scenes for this segment (${directBatchInfo.startTime} to ${directBatchInfo.endTime} only).`;
    }

    if (directBatchInfo.batchNum > 0) {
      userPrompt += `\n(Continuation \u2014 maintain character consistency from previous scenes.)`;
    }
    userPrompt += `\n=== END VIDEO SEGMENT INFO ===`;
  }

  // Legacy script-based batch info
  if (batchInfo) {
    userPrompt += `\n\nBATCH: Generate scenes ${batchInfo.batchStart}-${batchInfo.batchEnd} (${batchInfo.batchSceneCount} scenes).`;
    if (batchInfo.batchNum > 0) {
      userPrompt += ` Continues from scene ${batchInfo.batchStart - 1}. Maintain continuity.`;
    }
  }

  // Global negative prompt instruction
  if (globalNegativePrompt) {
    userPrompt += `\n\n=== GLOBAL NEGATIVE PROMPT (APPLY TO ALL SCENES) ===`;
    userPrompt += `\n${globalNegativePrompt}`;
    userPrompt += `\nInclude this in EVERY scene's negativePrompt field.`;
    userPrompt += `\nYou MAY add scene-specific exclusions (comma-separated after global).`;
    userPrompt += `\n=== END GLOBAL NEGATIVE PROMPT ===`;
  }

  // Build video part with optional videoMetadata
  const videoPart: GeminiPart = {
    fileData: {
      fileUri: videoUrl,
      mimeType: "video/mp4",
    },
    ...(directBatchInfo && {
      videoMetadata: {
        startOffset: `${directBatchInfo.analysisStartSeconds}s`,
        endOffset: `${directBatchInfo.endSeconds}s`,
      },
    }),
  };

  return {
    contents: [
      {
        parts: [
          videoPart,
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
