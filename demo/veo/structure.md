# VEO Response Structure

All JSON responses from the VEO pipeline, organized by phase/step.

---

## Phase 0: Color Profile Extraction

Runs BEFORE character extraction. Extracts the video's visual DNA for consistent scene generation.
Only generated when `extractColorProfile=ON`.

```json
{
    "dominantColors": [
        {
            "hex": "#C8834A",
            "name": "golden hour amber",
            "moods": ["warm", "nostalgic", "intimate", "organic"],
            "usage": "key light spill on surfaces, skin tone highlights, window light"
        }
    ],

    "colorTemperature": {
        "category": "warm",
        "kelvinEstimate": 3800,
        "description": "Mixed warm tungsten interior (3200K) with cooler morning daylight (5200K)"
    },

    "contrast": {
        "level": "medium-high",
        "style": "film-like lifted blacks with rich, creamy midtones",
        "blackPoint": "lifted — deepest shadows sit at charcoal rather than true black",
        "whitePoint": "soft roll-off — highlights retain detail, no hard clipping"
    },

    "shadows": {
        "color": "warm amber-brown with subtle olive undertone",
        "density": "medium — shadows are present but transparent, not opaque",
        "falloff": "gradual — soft transition from light to shadow"
    },

    "highlights": {
        "color": "warm golden cream with slight peach tint",
        "handling": "soft roll-off with retained detail",
        "bloom": true
    },

    "filmStock": {
        "suggested": "Kodak Portra 400",
        "characteristics": "Warm skin tone rendering, lifted blacks, fine grain structure",
        "digitalProfile": "ARRI LogC to Rec.709 with warm LUT"
    },

    "mood": {
        "primary": "warm and inviting, artisanal craftsmanship",
        "atmosphere": "cozy farmhouse kitchen in early morning",
        "emotionalTone": "nostalgic reverence for ingredients and tradition"
    },

    "grain": {
        "amount": "subtle",
        "type": "fine organic film grain",
        "pattern": "uniform with slight clustering in shadow regions"
    },

    "postProcessing": {
        "colorGrade": "warm earth tones with orange-teal split",
        "saturation": "normal — punchy greens in herbs, restrained in skin tones",
        "vignettePresent": true,
        "splitToning": {
            "shadows": "deep amber brown",
            "highlights": "golden cream"
        }
    },

    "confidence": 0.92
}
```

---

## Phase 1: Character Extraction

Runs AFTER color profile, BEFORE scene generation. Establishes character skeletons for consistency across all scenes/batches.

```json
{
    "characters": [
        {
            "name": "Chef Marco",
            "gender": "male",
            "age": "early 40s",
            "ethnicity": "Italian, olive skin with warm undertone",
            "bodyType": "stocky build, broad shoulders, medium height (~5'9\")",
            "faceShape": "square jaw with strong chin",
            "hair": "salt-and-pepper, short length, slicked back, thick texture",
            "facialHair": "trimmed goatee, dark brown with grey flecks",
            "distinctiveFeatures": "small scar on left cheek, deep laugh lines, thick dark eyebrows",
            "baseOutfit": "white double-breasted chef coat with rolled sleeves, black canvas apron",
            "firstAppearance": "0:03"
        }
    ],

    "background": "rustic farmhouse kitchen with rough-hewn stone walls, exposed wooden ceiling beams, copper pots hanging from iron rack, large gas stove, worn wooden prep stations, window on left wall with golden morning light"
}
```

---

## Step 1: Script Extraction (URL to Script)

Generates a structured transcript from video. Used as input for Step 2 (script-to-scenes) in hybrid workflow.

```json
{
    "title": "Farm-to-Table: Chef Marco's Morning Prep",
    "duration": "02:47",
    "language": "English",

    "summary": "A culinary documentary segment following Chef Marco through his morning prep routine...",

    "characters": [
        "Chef Marco - male, early 40s, Italian, stocky build, salt-and-pepper slicked hair, trimmed goatee, white chef coat, black apron"
    ],

    "settings": [
        "rustic farmhouse kitchen with stone walls, copper pots, gas stove, morning window light"
    ],

    "segments": [
        {
            "timestamp": "00:00",
            "content": "Wide establishing shot of the farmhouse kitchen at dawn.",
            "speaker": null,
            "action": "Camera slowly pans across the empty kitchen.",
            "emotion": "quiet anticipation, serene"
        },
        {
            "timestamp": "00:24",
            "content": "You always start with what the earth gives you.",
            "speaker": "Chef Marco",
            "action": "Marco lifts the basil bunch to his nose, inhales deeply.",
            "emotion": "warm pride, reverence for ingredients"
        }
    ],

    "rawText": "Full concatenated transcript text..."
}
```

---

## Step 2: Scene Generation

The main output. Field ordering matches `RESPONSE_SCHEMA` in `lib/veo/prompts.ts`.

Fields are grouped into 10 sections. Sections 7-10 are conditional based on settings.

### Section 1: Scene Identity

Always present. Core scene description and generation prompt.

```json
{
    "description": "Optimized scene narrative (2-4 present-tense sentences): subject+setting, actions, camera behavior, sensory details, lighting mood, shot composition, clear start/end",

    "prompt": "Synthesized generation prompt combining description + character + style + camera into a single string for the image/video generator",

    "negativePrompt": "Comma-separated unwanted elements (text overlays, subtitles, watermarks, quality issues, continuity problems)"
}
```

### Section 2: Characters

Always present. Character appearance locked from Phase 1 extraction.

```json
{
    "character": "Name - appearance tags. Format: 'Chef Marco - male, 40s, Italian, olive skin, stocky build, salt-and-pepper slicked hair, trimmed goatee, white chef coat, black apron, silver wristwatch'",

    "characterVariations": "{\"Chef Marco\": {\"accessories\": \"silver wristwatch\", \"expression\": \"eyes closed, slight smile\", \"pose\": \"standing upright, hands lifting basil\"}}"
}
```

`characterVariations` is a JSON string for per-scene temporary changes (accessories, expressions, poses, outfit changes).

### Section 3: Objects

Always present.

```json
{
    "object": "Main objects visible in scene (not people). Comma-separated list."
}
```

### Section 4: Visual

Always present. Composition, lighting, environment details, technical quality.

```json
{
    "composition": {
        "angle": "eye-level | low-angle | high-angle | dutch | bird's-eye | worm's-eye | over-the-shoulder | POV",
        "framing": "extreme-close-up | close-up | medium-close-up | medium-shot | medium-long-shot | full-shot | long-shot | extreme-long-shot",
        "focus": "What is in focus: subject's face, hands, environment, background blur"
    },

    "lighting": {
        "mood": "warm, golden, intimate morning atmosphere",
        "source": "natural daylight from left window (key), gas stove flame (fill), pendant lamp (rim)",
        "shadows": "long amber shadows from window, soft fill on shadow side"
    },

    "visual_specs": {
        "primary_subject": "Chef Marco selecting fresh basil at prep station",
        "environment": "rustic farmhouse kitchen with stone walls, copper cookware, gas stove",
        "key_details": "steam from pot, golden light rays, herb basket texture, knife blade reflection"
    },

    "technical": {
        "quality": "4K broadcast, sharp focus on subject, clean sensor, professional grade",
        "colors": "warm earth palette, rich greens from herbs, copper amber highlights"
    }
}
```

### Section 5: Style

Always present. Identical across all scenes in a batch to lock aesthetics.

```json
{
    "style": {
        "genre": "culinary documentary",
        "art_movement": "naturalism",
        "medium": "digital cinema | digital photography",
        "palette": "warm earth tones — burnt sienna, olive green, copper amber, cream white, charcoal",
        "color_temperature": "warm, 3800K tungsten mixed with 5200K window daylight",
        "contrast": "medium-high, lifted blacks with rich midtones",
        "texture": "organic grain, tactile surfaces, visible material detail",
        "brushwork_or_line": "clean photographic lines with soft edges in bokeh",
        "rendering_engine": "photorealistic, natural light rendering",
        "camera_lens": "35mm prime",
        "focal_length": "35mm",
        "depth_of_field": "shallow, f/2.8, subject sharp with soft background",
        "film_stock_or_profile": "Kodak Portra 400 emulation",
        "grain": "subtle organic film grain",
        "noise_reduction": "minimal, preserving texture",
        "post_processing": "warm color grade, slight desaturation in shadows, orange-teal split toning",
        "composition_style": "rule of thirds, leading lines from countertop",
        "mood": "intimate, warm, artisanal craftsmanship",
        "lighting_style": "natural window light key, warm practical fill, subtle rim"
    }
}
```

When `extractColorProfile=ON`, style fields contain exact hex codes, kelvin values, film stock, and split toning from Phase 0. When OFF, generic defaults are used.

### Section 6: Camera

Always present. Shot size, positioning, lens effects.

```json
{
    "shotSize": "EWS | WS | MWS | MS | MCU | CU | ECU",

    "enhancedCamera": {
        "position": "at counter level, directly across the prep station from Marco",
        "height": "ground-level | eye-level | overhead | aerial",
        "distance": "intimate | close | medium | far | extreme",
        "positionPhrase": "Medium shot with camera positioned at counter level across from Chef Marco (thats where the camera is)"
    },

    "lensEffects": {
        "type": "standard | wide-angle | telephoto | macro | anamorphic",
        "depthOfField": "shallow | medium | deep | rack-focus",
        "aperture": "f/2.8",
        "bokehStyle": "smooth, creamy circular bokeh on background copper pots",
        "flare": false
    }
}
```

### Section 7: Motion (video mode only)

Only present when `mediaType=video`. Omitted for image mode.

```json
{
    "video": {
        "duration": 7,
        "fps": 24,
        "speed": "normal | slow-motion | timelapse",
        "cameraMovement": {
            "type": "static | pan | tilt | dolly | crane | handheld | orbital | zoom | tracking",
            "direction": "left | right | up | down | in | out | clockwise | counterclockwise",
            "intensity": "subtle | moderate | dynamic",
            "path": "Natural language description of camera path"
        },
        "subjectMotion": {
            "primary": "Chef Marco reaches into basket, lifts basil to nose, places on cutting board",
            "secondary": "Steam rising continuously from cast-iron pot",
            "background": "Dust particles floating through window light beam"
        },
        "transitionIn": "cut | fade | dissolve | wipe | zoom",
        "transitionOut": "cut | fade | dissolve | wipe | zoom",
        "continuity": {
            "matchAction": false,
            "matchColor": true,
            "previousSceneLink": "First scene — establishes kitchen setting"
        },
        "audioCues": [
            "gentle simmering from cast-iron pot",
            "rustle of basil leaves",
            "soft thud as basil placed on cutting board"
        ]
    },

    "movementQuality": "natural | fluid | graceful | energetic | deliberate"
}
```

### Section 8: Performance

Present for video mode. Single frozen expression for image mode (no emotionalArc).

```json
{
    "expressionControl": {
        "primary": "quiet concentration and sensory pleasure",
        "microExpressions": "nostrils flare slightly, corners of mouth lift into subtle smile, crow's feet deepen",
        "eyeMovement": "eyes close gently while smelling basil, then open focused at cutting board",
        "bodyLanguage": "upright confident posture, deliberate careful hand movements, shoulders relaxed",
        "antiModelFace": true
    },

    "emotionalArc": {
        "startState": "focused selection, scanning basket with intent",
        "middleState": "sensory appreciation, eyes closed inhaling aroma",
        "endState": "decisive confidence, placing basil down with purpose",
        "transitionType": "gradual | sudden | building"
    }
}
```

### Section 9: Color Grading (extractColorProfile=ON only)

Only present when `extractColorProfile=ON`. Omitted otherwise.

```json
{
    "colorGrading": {
        "palette": "teal-orange | desaturated | warm-orange | cool-blue | noir",
        "shadowColor": "deep amber brown",
        "highlightColor": "golden cream",
        "saturation": "muted | normal | punchy",
        "filmEmulation": "Kodak Portra 400 | Fuji Superia"
    },

    "advancedLighting": {
        "setup": "three-point | rembrandt | golden-hour | chiaroscuro | neon",
        "keyLight": "Natural morning daylight from left window, warm and directional",
        "fillLight": "Gas stove flame casting warm orange practical fill",
        "rimLight": true,
        "atmosphericEffects": "haze | fog | dust | rain"
    }
}
```

### Section 10: Audio (audio options ON only)

Only present when music/sfx/ambient options are enabled. Omitted when all audio is OFF.

```json
{
    "audio": {
        "environmental": {
            "ambiance": "quiet farmhouse kitchen morning, gentle simmering, birds outside",
            "intensity": "subtle | moderate | prominent",
            "spatialPosition": "surrounding | distant left | close right"
        },
        "music": {
            "mood": "warm, contemplative",
            "genre": "acoustic guitar with soft strings",
            "volume": "background | prominent | featured"
        },
        "soundEffects": [
            { "sound": "Gentle bubbling simmer", "trigger": "cast-iron pot on stove throughout" },
            { "sound": "Soft leaf rustle", "trigger": "Marco lifting basil from basket" }
        ],
        "negations": [
            "no crowd noise",
            "no restaurant chatter",
            "no electronic beeping"
        ]
    },

    "dialogue": [
        {
            "character": "Chef Marco",
            "line": "You always start with what the earth gives you.",
            "delivery": "with quiet reverence, spoken softly",
            "emotion": "calm pride, deep respect for ingredients"
        }
    ]
}
```

`dialogue` only present when `voice` is set to a language (not `no-voice`).

---

## Settings Impact Summary

| Setting | Sections Affected |
|---------|-------------------|
| `mediaType=image` | Section 7 (Motion) omitted, Section 8 (emotionalArc) omitted |
| `mediaType=video` | All sections present |
| `extractColorProfile=ON` | Section 5 (Style) has exact hex/kelvin/film stock, Section 9 (Color Grading) present |
| `extractColorProfile=OFF` | Section 5 (Style) uses generic defaults, Section 9 omitted |
| `music=ON` | `audio.music` present |
| `sfx=ON` | `audio.soundEffects` present, `video.audioCues` present |
| `ambient=ON` | `audio.environmental` present |
| `voice=<language>` | `dialogue` array present |
| All audio OFF | Section 10 (Audio) omitted entirely |
| `selfieMode=ON` | Modifies description/prompt with selfie-style framing |
