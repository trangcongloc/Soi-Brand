/**
 * Prompt 3 Battle-Tested Prompt Templates
 * Based on the Veo 3 Prompting Guide
 */

import { PromptTemplate, TemplateCategory } from "./types";

// ============================================================================
// Template Collection
// ============================================================================

/**
 * POV Vlog Template - Travel and lifestyle vlogs
 */
export const POV_VLOG_TEMPLATE: PromptTemplate = {
  id: "pov-vlog",
  category: "pov-vlog",
  name: "POV Vlog",
  description: "Travel and lifestyle vlog footage in first-person perspective",
  template: {
    subject: "POV vlog-style footage in 4K, realistic cinematic look. A [CHARACTER_DESCRIPTION] holds a camera at arm's length",
    action: "[ACTION] through [ENVIRONMENT]",
    scene: "[ENVIRONMENTAL_DETAILS] are visible around them. The character [CAMERA_INTERACTION], reflecting [EMOTIONS]",
    style: "[CAMERA_QUALITY] with shallow depth of field",
    dialogue: "They speak in a [TONE]: '[DIALOGUE]'",
    sounds: "[AUDIO_DESCRIPTION], [AMBIENT_SOUNDS]",
    technical: "No subtitles, no watermarks, no text overlays, professional quality",
  },
  variables: [
    {
      name: "CHARACTER_DESCRIPTION",
      description: "Detailed character appearance",
      examples: ["young woman with flowing brown hair and casual hiking gear", "athletic man in his 30s with a bright smile and travel clothes"],
    },
    {
      name: "ACTION",
      description: "What the character is doing",
      examples: ["walking confidently", "exploring curiously", "hiking energetically"],
    },
    {
      name: "ENVIRONMENT",
      description: "The setting",
      examples: ["a bustling street market in Tokyo", "a scenic mountain trail at sunrise", "a charming European village"],
    },
    {
      name: "DIALOGUE",
      description: "What they say (max 12-15 words)",
      examples: ["Finally made it to the top!", "You have to see this view!", "This place is absolutely incredible."],
    },
    {
      name: "TONE",
      description: "Delivery style",
      examples: ["excited, breathless enthusiasm", "warm, inviting manner", "genuine amazement"],
    },
  ],
  tips: [
    "Keep arm clearly visible in frame for authentic selfie feel",
    "Add 'slightly grainy, film-like' for natural look",
    "End with a gesture (thumbs up, wave, smile)",
    "Limit dialogue to 12-15 words (8-second rule)",
  ],
};

/**
 * ASMR Macro Template - Sensory content with extreme close-ups
 */
export const ASMR_MACRO_TEMPLATE: PromptTemplate = {
  id: "asmr-macro",
  category: "asmr",
  name: "ASMR Macro",
  description: "Extreme close-up sensory content with satisfying sounds",
  template: {
    subject: "Shot in extreme macro perspective, [TOOL] cutting a [DETAILED_OBJECT]",
    action: "Each [ACTION] produces [SOUND_DETAIL] in an otherwise silent room",
    scene: "The [OBJECT] has [TEXTURE_DETAILS] with [VISUAL_PROPERTIES]. [OBJECT] rests on [SURFACE] bathed in [LIGHTING]",
    style: "Macro lens with shallow depth of field, 4K resolution, creamy bokeh background",
    sounds: "[AUDIO_FOCUS] - crystal clear recording of [PRIMARY_SOUND], natural room tone",
    technical: "No background music, no voice, no text overlays. Pure sensory focus.",
  },
  variables: [
    {
      name: "TOOL",
      description: "The cutting implement",
      examples: ["a sharp Japanese chef's knife", "precision scissors", "a gleaming razor blade"],
    },
    {
      name: "DETAILED_OBJECT",
      description: "What is being cut",
      examples: ["perfectly ripe mango with golden flesh", "kinetic sand in vibrant colors", "crisp green cucumber"],
    },
    {
      name: "TEXTURE_DETAILS",
      description: "Texture descriptions",
      examples: ["smooth, glistening surface", "satisfying fibrous interior", "uniform granular consistency"],
    },
    {
      name: "AUDIO_FOCUS",
      description: "Primary sound to capture",
      examples: ["crisp cutting sounds", "satisfying crunch", "smooth slicing whisper"],
    },
  ],
  tips: [
    "Focus on satisfying textures and sounds",
    "Use extreme close-up (ECU) framing",
    "Specify 'no background music' to prevent audio hallucination",
    "Include tactile and visual detail",
  ],
};

/**
 * Street Interview Template - Viral social media format
 */
export const STREET_INTERVIEW_TEMPLATE: PromptTemplate = {
  id: "street-interview",
  category: "street-interview",
  name: "Street Interview",
  description: "Viral-style street interview for social media",
  template: {
    subject: "Create a [PLATFORM]-style street interview video set [TIME] in [LOCATION]",
    action: "[INTERVIEWER_DESCRIPTION] holds a mic. They stop [INTERVIEWEE_DESCRIPTION]. [INTERVIEWER] speaks [TONE]: '[QUESTION]' [INTERVIEWEE] [REACTION], then replies [RESPONSE_TONE]: '[ANSWER]'",
    scene: "The environment includes [ENVIRONMENTAL_DETAILS]. [POSITIONING] under [LIGHTING]",
    style: "Use [CAMERA_STYLE] filmed [ANGLE] in [COMPOSITION], with [LENS_TYPE] for [VISUAL_EFFECT]",
    sounds: "Clear dialogue, urban street ambiance, no background music unless specified",
    technical: "[SUBTITLE_INSTRUCTION]. [BRANDING_INSTRUCTION]. Dialogue must be [SYNC_REQUIREMENT]. Keep the energy [ENERGY_STYLE].",
  },
  variables: [
    {
      name: "PLATFORM",
      description: "Target platform",
      examples: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    },
    {
      name: "QUESTION",
      description: "The interview question",
      examples: ["What's the best advice you've ever received?", "If you could have dinner with anyone, who would it be?"],
    },
    {
      name: "ANSWER",
      description: "The interviewee's response",
      examples: ["Honestly? My grandmother told me to always be kind.", "Without hesitation, I'd say my late father."],
    },
    {
      name: "REACTION",
      description: "Initial reaction before answering",
      examples: ["pauses thoughtfully", "laughs genuinely", "raises eyebrows in surprise"],
    },
  ],
  tips: [
    "Use colon format for dialogue to prevent subtitles",
    "Keep answers short and punchy for social media",
    "Include genuine reaction before answer",
    "Specify 'no subtitles' explicitly",
  ],
};

/**
 * Corporate Presentation Template - Professional business content
 */
export const CORPORATE_TEMPLATE: PromptTemplate = {
  id: "corporate",
  category: "corporate",
  name: "Corporate Presentation",
  description: "Professional business presentation or corporate video",
  template: {
    subject: "Professional corporate boardroom setting with floor-to-ceiling windows overlooking a city skyline. A confident [GENDER] executive in [AGE]s, wearing [ATTIRE], stands beside a large wall-mounted display showing [DATA_CONTENT]",
    action: "[GESTURE_TYPE] while speaking: '[PROFESSIONAL_STATEMENT]' Medium shot transitioning to a slow push-in for emphasis",
    scene: "Modern glass conference room, [ATTENDEES], natural light mixing with professional three-point lighting",
    style: "Professional three-point lighting with warm key light, subtle fill, and rim lighting. Camera movement is smooth and deliberate",
    dialogue: "[CHARACTER] says: '[STATEMENT]' with confident authority",
    sounds: "Clear, authoritative voice with subtle room tone. No background music.",
    technical: "No casual elements, no poor posture, broadcast quality, ending on a medium close-up of confident expression",
  },
  variables: [
    {
      name: "ATTIRE",
      description: "Professional clothing",
      examples: ["tailored navy blazer over white blouse", "charcoal gray suit with subtle pinstripe", "elegant burgundy dress with pearl accessories"],
    },
    {
      name: "PROFESSIONAL_STATEMENT",
      description: "Business dialogue",
      examples: ["Our Q3 results exceeded expectations, positioning us for unprecedented growth.", "This strategic initiative will transform how we serve our customers."],
    },
    {
      name: "GESTURE_TYPE",
      description: "Professional gestures",
      examples: ["gestures toward the charts with open palm", "emphasizes key points with measured hand movements"],
    },
    {
      name: "DATA_CONTENT",
      description: "What's on the display",
      examples: ["quarterly revenue charts and growth metrics", "strategic roadmap timeline", "market analysis data"],
    },
  ],
  tips: [
    "Use three-point lighting for professional look",
    "Include slow push-in for emphasis moments",
    "End on confident expression close-up",
    "Avoid casual language or gestures",
  ],
};

/**
 * Educational Content Template - Learning and tutorial content
 */
export const EDUCATIONAL_TEMPLATE: PromptTemplate = {
  id: "educational",
  category: "educational",
  name: "Educational Content",
  description: "Learning content, tutorials, and educational demonstrations",
  template: {
    subject: "Modern classroom with natural lighting from large windows. An enthusiastic [SUBJECT] teacher in [AGE]s, wearing casual professional attire, demonstrates [EXPERIMENT_CONCEPT] at [WORKSPACE]",
    action: "[VISUAL_ELEMENTS] [ACTION]. Explains with animated gestures: '[EDUCATIONAL_DIALOGUE]'",
    scene: "Students visible in the background lean forward with interest. [EQUIPMENT] and [MATERIALS] on the workspace",
    style: "Medium wide shot with rack focus from the [FOCUS_SUBJECT] to the teacher's excited expression. Warm, natural lighting creates an inviting learning atmosphere",
    dialogue: "Teacher says: '[EXPLANATION]' with engaging enthusiasm",
    sounds: "Clear explanation voice, [SUBJECT_SOUNDS], occasional student reactions",
    technical: "No overly dramatic presentation, no condescending tone, educational but engaging",
  },
  variables: [
    {
      name: "SUBJECT",
      description: "Subject being taught",
      examples: ["science", "cooking", "art", "technology"],
    },
    {
      name: "EXPERIMENT_CONCEPT",
      description: "What's being demonstrated",
      examples: ["a chemical reaction with baking soda and vinegar", "watercolor blending techniques", "basic coding concepts with visual blocks"],
    },
    {
      name: "EDUCATIONAL_DIALOGUE",
      description: "Teaching explanation",
      examples: ["Watch how the molecules react when we add the catalyst!", "Notice how the colors blend at the edge of the wet paint."],
    },
    {
      name: "SUBJECT_SOUNDS",
      description: "Relevant sounds",
      examples: ["bubbling chemical reaction", "brush strokes on paper", "keyboard clicks"],
    },
  ],
  tips: [
    "Use rack focus between demonstration and teacher's face",
    "Include student reactions for engagement",
    "Keep explanations clear and concise",
    "Show enthusiasm without being over-the-top",
  ],
};

/**
 * Horror/Thriller Template - Genre-specific suspense content
 */
export const HORROR_THRILLER_TEMPLATE: PromptTemplate = {
  id: "horror-thriller",
  category: "horror-thriller",
  name: "Horror/Thriller",
  description: "Suspenseful horror or thriller scenes",
  template: {
    subject: "[CHARACTER_DESCRIPTION] [ACTION] through [LOCATION]",
    action: "[FEAR_BEHAVIOR]. [TENSION_BUILDING_ACTION]",
    scene: "[ENVIRONMENT_DETAILS] cast [SHADOW_DESCRIPTION]. [ATMOSPHERIC_ELEMENTS]",
    style: "Chiaroscuro lighting with stark contrasts, handheld camera with subtle shake, desaturated color palette with occasional color accent",
    dialogue: "[CHARACTER] [WHISPERS/BREATHES]: '[TENSE_DIALOGUE]'",
    sounds: "[AMBIENT_HORROR_SOUNDS], heartbeat growing louder, [SUDDEN_SOUND]",
    technical: "No jump scare preview, no cheesy effects, psychological tension over shock",
  },
  variables: [
    {
      name: "FEAR_BEHAVIOR",
      description: "How fear manifests",
      examples: ["eyes darting nervously into shadows", "breathing becoming shallow and rapid", "hands trembling slightly"],
    },
    {
      name: "TENSION_BUILDING_ACTION",
      description: "Building suspense",
      examples: ["reaches slowly for the door handle", "presses back against the wall", "peers around the corner"],
    },
    {
      name: "AMBIENT_HORROR_SOUNDS",
      description: "Atmospheric audio",
      examples: ["distant creaking floorboards", "wind howling through broken windows", "unintelligible whispers"],
    },
    {
      name: "SHADOW_DESCRIPTION",
      description: "Shadows and darkness",
      examples: ["long, reaching shadows across the floor", "pools of impenetrable darkness", "shadows that seem to move"],
    },
  ],
  tips: [
    "Use chiaroscuro lighting for dramatic contrast",
    "Handheld camera adds documentary realism",
    "Build psychological tension over jump scares",
    "Desaturated palette with selective color accents",
  ],
};

/**
 * Fashion/Beauty Template - Glamour and style content
 */
export const FASHION_BEAUTY_TEMPLATE: PromptTemplate = {
  id: "fashion-beauty",
  category: "fashion-beauty",
  name: "Fashion/Beauty",
  description: "Fashion editorial, beauty showcase, and glamour content",
  template: {
    subject: "[MODEL_DESCRIPTION] showcases [FASHION_ITEM] in [SETTING]",
    action: "[POSE_MOVEMENT] with [ATTITUDE]. [CAMERA_INTERACTION]",
    scene: "[BACKDROP_DESCRIPTION] with [LIGHTING_DESCRIPTION]. [REFLECTIVE_SURFACES] catch the light",
    style: "Beauty lighting (butterfly setup) with soft diffusion, shallow depth of field highlighting [FOCUS_ELEMENT], elegant camera movement",
    sounds: "[MUSIC_STYLE] playing, fabric rustling softly",
    technical: "Flawless skin rendering, accurate color reproduction for fabrics, no amateur framing",
  },
  variables: [
    {
      name: "MODEL_DESCRIPTION",
      description: "Model appearance",
      examples: ["a striking woman with sharp cheekbones and confident gaze", "an elegant figure with graceful posture"],
    },
    {
      name: "FASHION_ITEM",
      description: "What's being showcased",
      examples: ["a flowing silk evening gown in deep burgundy", "bold geometric jewelry pieces", "a structured leather jacket"],
    },
    {
      name: "POSE_MOVEMENT",
      description: "Model movement",
      examples: ["turns slowly to reveal the dress back", "tilts head with practiced grace", "walks toward camera with confident stride"],
    },
    {
      name: "LIGHTING_DESCRIPTION",
      description: "Glamour lighting",
      examples: ["soft butterfly lighting creating perfect facial contours", "dramatic rim lighting separating subject from background"],
    },
  ],
  tips: [
    "Use butterfly lighting for flattering facial appearance",
    "Shallow DOF to emphasize fashion details",
    "Include fabric movement and texture details",
    "Elegant, deliberate camera movements",
  ],
};

/**
 * Documentary Template - Authentic storytelling
 */
export const DOCUMENTARY_TEMPLATE: PromptTemplate = {
  id: "documentary",
  category: "documentary",
  name: "Documentary",
  description: "Authentic documentary-style storytelling",
  template: {
    subject: "[SUBJECT_DESCRIPTION] in [REAL_WORLD_SETTING]",
    action: "[AUTHENTIC_ACTION] while [NATURAL_BEHAVIOR]",
    scene: "[ENVIRONMENT_DESCRIPTION] with [CONTEXTUAL_ELEMENTS]. [TIME_OF_DAY] lighting conditions",
    style: "Natural lighting, handheld documentary style with subtle movement, observational camera that captures rather than directs",
    dialogue: "[SUBJECT] speaks naturally: '[AUTHENTIC_QUOTE]' with [GENUINE_EMOTION]",
    sounds: "Natural ambient sounds of [LOCATION_SOUNDS], clear dialogue, minimal musical intervention",
    technical: "No artificial staging, no condescending narration, authentic moments over scripted ones",
  },
  variables: [
    {
      name: "AUTHENTIC_ACTION",
      description: "Real activity being documented",
      examples: ["crafts traditional pottery by hand", "tends to beehives with practiced expertise", "repairs vintage motorcycles"],
    },
    {
      name: "AUTHENTIC_QUOTE",
      description: "Genuine subject dialogue",
      examples: ["My grandmother taught me this technique when I was seven.", "Every piece tells a story of the person who will own it."],
    },
    {
      name: "CONTEXTUAL_ELEMENTS",
      description: "Environmental storytelling details",
      examples: ["decades of tools and memories on weathered wooden shelves", "photographs of three generations covering the walls"],
    },
  ],
  tips: [
    "Observational camera style - capture, don't direct",
    "Use natural lighting whenever possible",
    "Let subjects speak in their own words",
    "Include contextual environmental details",
  ],
};

// ============================================================================
// Template Registry
// ============================================================================

/**
 * All available templates indexed by ID
 */
export const TEMPLATE_REGISTRY: Record<string, PromptTemplate> = {
  "pov-vlog": POV_VLOG_TEMPLATE,
  "asmr-macro": ASMR_MACRO_TEMPLATE,
  "street-interview": STREET_INTERVIEW_TEMPLATE,
  "corporate": CORPORATE_TEMPLATE,
  "educational": EDUCATIONAL_TEMPLATE,
  "horror-thriller": HORROR_THRILLER_TEMPLATE,
  "fashion-beauty": FASHION_BEAUTY_TEMPLATE,
  "documentary": DOCUMENTARY_TEMPLATE,
};

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): PromptTemplate[] {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return TEMPLATE_REGISTRY[id];
}

/**
 * Get all available template IDs
 */
export function getAvailableTemplateIds(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Get all available categories with their templates
 */
export function getTemplateCategories(): { category: TemplateCategory; templates: PromptTemplate[] }[] {
  const categories = new Set<TemplateCategory>();
  Object.values(TEMPLATE_REGISTRY).forEach(t => categories.add(t.category));

  return Array.from(categories).map(category => ({
    category,
    templates: getTemplatesByCategory(category),
  }));
}

/**
 * Apply template with variable substitutions
 */
export function applyTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  let prompt = "";

  // Build prompt from template parts
  const parts = [
    template.template.subject,
    template.template.action,
    template.template.scene,
    template.template.style,
    template.template.dialogue,
    template.template.sounds,
    template.template.technical,
  ].filter(Boolean);

  prompt = parts.join(" ");

  // Substitute variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\[${key}\\]`, "g");
    prompt = prompt.replace(placeholder, value);
  }

  return prompt;
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateVariables(
  template: PromptTemplate,
  variables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const variable of template.variables) {
    if (!variables[variable.name]) {
      missing.push(variable.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
