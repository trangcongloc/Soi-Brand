# Veo 3 Master Prompting Guide

> Reference guide for AI video generation with Google Veo 3.
> Source: [snubroot/Veo-3-Prompting-Guide](https://github.com/snubroot/Veo-3-Prompting-Guide)

---

## Table of Contents

1. [Professional Prompt Structure](#professional-prompt-structure)
2. [Camera Positioning](#camera-positioning)
3. [Dialogue Formatting](#dialogue-formatting)
4. [Audio Design](#audio-design)
5. [Lighting Setups](#lighting-setups)
6. [Color Palettes & Grading](#color-palettes--grading)
7. [Lens Effects](#lens-effects)
8. [Character Expressions & Emotions](#character-expressions--emotions)
9. [Selfie/POV Mode](#selfiepov-mode)
10. [Negative Prompts](#negative-prompts)
11. [Advanced Composition](#advanced-composition)
12. [Pro Tips](#pro-tips)

---

## Professional Prompt Structure

The 7-component format for professional results:

| Component | Description | Example |
|-----------|-------------|---------|
| **Subject** | Detailed character/object descriptions | "A 40-year-old Italian chef with salt-pepper hair, white coat" |
| **Action** | Specific movements and behaviors | "confidently slices vegetables with precise knife movements" |
| **Scene** | Environment and setting details | "in a rustic farmhouse kitchen with copper pots on walls" |
| **Style** | Camera work and visual aesthetic | "cinematic wide shot with shallow depth of field" |
| **Dialogue** | Character speech with emotional tone | "Chef says: 'The secret is in the freshness.'" |
| **Sounds** | Audio design and ambient elements | "sizzling pan, knife on cutting board, kitchen ambiance" |
| **Technical** | Negative prompts and quality controls | "No subtitles, no watermarks, no blurry faces" |

---

## Camera Positioning

### The Critical Breakthrough: "(thats where the camera is)"

This phrase triggers proper camera-aware processing in Veo 3.

**Syntax Pattern:**
```
[Shot type] with camera positioned at [location] (thats where the camera is)
```

**Examples:**
```
"Close-up shot with camera positioned at counter level (thats where the camera is)"

"POV shot from camera at eye level (thats where the camera is) as character explains"

"Over-shoulder view, camera behind interviewer (thats where the camera is)"

"Low angle shot, camera on ground looking up (thats where the camera is)"

"Aerial view, camera positioned directly overhead (thats where the camera is)"
```

### Camera Height Options
- `ground-level` - Dramatic low perspective
- `eye-level` - Natural, neutral view
- `overhead` - Looking down on subject
- `aerial` - High drone-style shot

### Camera Distance Options
- `intimate` - Extreme close-up, personal
- `close` - Head and shoulders
- `medium` - Waist up
- `far` - Full body with environment
- `extreme` - Wide establishing shot

---

## Dialogue Formatting

### The Colon Rule (Prevents Subtitles)

**Critical syntax:** Character name + action + colon + dialogue

```
✅ WORKS: "The detective looks at camera and says: 'Something's wrong here.'"
❌ FAILS: "The detective says: 'Something's wrong here.'" (triggers subtitles)
```

### Dialogue Rules

1. **8-Second Rule**: Keep dialogue under 8 seconds (12-15 words, 20-25 syllables)
2. **Phonetic Spelling**: Fix mispronunciations with phonetic versions
   - `"foh-fur's"` instead of `"Fofur's"`
3. **Specify Tone**: Add emotional delivery
   - `"with conviction and determination"`
   - `"whispered softly"`
   - `"shouted angrily"`
4. **Multiple Speakers**: Name each character explicitly before their line

### Dialogue Examples

```
"Chef Marco turns to camera and says: 'The secret is in the freshness.'
with warm, passionate enthusiasm"

"Sarah leans forward, eyes narrowing, and whispers: 'I know what you did.'
with menacing intensity"

"The narrator speaks: 'In a world where anything is possible...'
with deep, cinematic gravitas"
```

---

## Audio Design

### Environmental Audio

Specify location-appropriate sounds to prevent audio hallucinations:

| Location | Audio Specification |
|----------|---------------------|
| **Kitchen** | "sizzling pan, knife chopping, boiling water, kitchen ambiance" |
| **Forest** | "birds chirping, leaves rustling, gentle wind, natural ambiance" |
| **Office** | "keyboard typing, air conditioning hum, paper rustling, professional atmosphere" |
| **City Street** | "traffic noise, distant horns, footsteps on pavement, urban ambiance" |
| **Beach** | "waves crashing, seagulls calling, sand shifting, ocean breeze" |
| **Restaurant** | "utensils clinking, quiet conversation murmur, soft background music" |

### Music Integration

```
"Uplifting orchestral music with strings, building to inspiring crescendo"

"Soft jazz piano with subtle bass line, sophisticated intimate atmosphere"

"Tense electronic pulse, building suspense with deep bass"

"Gentle acoustic guitar, warm nostalgic folk melody"
```

### Music Volume Levels
- `background` - Subtle, doesn't compete with dialogue
- `prominent` - Clearly audible, sets mood
- `featured` - Primary audio focus

### Sound Effect Specification

Always name exact sounds with triggers:

```
"Footsteps on gravel as character walks"

"Door slamming shut, echoing in hallway"

"Car engine starting, tires screeching on asphalt"

"Glass shattering, pieces tinkling on floor"
```

### Audio Negation

Prevent unwanted sounds:
```
"No unwanted laughter, no applause, no crowd noise"
```

---

## Lighting Setups

### Three-Point Lighting (Gold Standard)

```
"Warm key light from left, fill light softening shadows,
rim lighting separating subject from background"
```

### Mood-Based Lighting

| Mood | Lighting Setup |
|------|----------------|
| **Golden Hour** | "Warm, nostalgic atmospheric light through windows, long shadows" |
| **Blue Hour** | "Cool, mysterious deep twilight colors, soft ambient glow" |
| **Chiaroscuro** | "Stark contrasts, film noir dramatic shadows, single light source" |
| **Neon** | "Vibrant magenta/cyan reflecting off wet surfaces, cyberpunk aesthetic" |
| **Soft/Diffused** | "Even, flattering light, minimal shadows, beauty lighting" |
| **Rembrandt** | "Triangle of light on cheek, dramatic portrait lighting" |
| **Butterfly** | "Light directly above face, glamour photography style" |
| **Split** | "Half face lit, half in shadow, dramatic conflict lighting" |

### Lighting Examples

```
"Three-point lighting setup with warm 3200K key light from camera left,
soft fill from right, and cool rim light creating subject separation"

"Natural window light streaming from behind, creating silhouette effect
with lens flare accents"

"Practical lighting from desk lamp, creating pool of warm light
surrounded by darkness, intimate night scene"
```

---

## Color Palettes & Grading

### Color Palette Types

| Palette | Description | Use Case |
|---------|-------------|----------|
| **Monochromatic** | Single color scheme | Artistic unity, mood focus |
| **Vibrant** | High saturation | Energetic, youthful content |
| **Pastel** | Soft, muted colors | Gentle, dreamy mood |
| **Desaturated** | Reduced color intensity | Serious, dramatic tone |
| **Sepia** | Vintage brown tinting | Nostalgic, historical |
| **Cool Blue** | Cold color scheme | Modern, tech, mysterious |
| **Warm Orange** | Warm color scheme | Comfort, intimacy, sunset |

### Cinematic Grading Syntax

```
"Cinematic color grading with warm orange tones in highlights
and cool blue shadows, creating professional film aesthetic"

"Desaturated color palette with selective color emphasis on the red rose,
drawing focus to key element"

"Teal and orange color grade, skin tones warm against cool backgrounds,
Hollywood blockbuster look"

"High contrast black and white with deep blacks and bright whites,
classic film noir aesthetic"
```

### Split Toning

```
"Split-toning with shadows pushed toward blue (#1a3a5c)
and highlights toward warm amber (#d4a574)"
```

---

## Lens Effects

### Depth of Field

| Effect | Keyword | Description |
|--------|---------|-------------|
| **Shallow DOF** | "shallow depth of field" | Isolates subject with beautiful bokeh |
| **Deep Focus** | "deep focus" | Everything sharp from foreground to background |
| **Rack Focus** | "rack focus" | Shifts focus dramatically between subjects |
| **Soft Focus** | "soft focus" | Dreamy, ethereal, romantic look |

### Lens Types

| Lens | Keyword | Effect |
|------|---------|--------|
| **Macro** | "macro lens" | Shows intricate tiny details |
| **Wide-Angle** | "wide-angle lens" | Expands perspective and space |
| **Telephoto** | "telephoto lens" | Compresses distance, isolates subject |
| **Fish-Eye** | "fish-eye lens" | Extreme distortion, 180° view |
| **Anamorphic** | "anamorphic lens" | Cinematic horizontal flare, 2.39:1 feel |

### Lens Effects

```
"Shallow depth of field with creamy bokeh, f/1.4 aperture feel"

"Lens flare from sun entering frame, cinematic JJ Abrams style"

"Anamorphic lens distortion with horizontal blue streaks on highlights"

"Macro lens capturing water droplets on flower petals, extreme detail"
```

---

## Character Expressions & Emotions

### Micro-Expression Control

Eliminate "model face" with specific expression instructions:

```
"Eyes squint thoughtfully, head tilts as if processing,
slight smile begins forming at corner of mouth"

"Furrow between brows deepens, momentary pause before speaking,
jaw tightens conveying internal conflict"

"Small step forward, chin raised slightly, eyes focused and direct,
shoulders squared, inviting confrontation"
```

### Eye Movement

| Direction | Meaning |
|-----------|---------|
| `up` | Thinking, remembering |
| `down` | Sad, submissive, ashamed |
| `left/right` | Considering, processing |
| `camera` | Direct address, connection |
| `away` | Avoiding, uncomfortable |

### Eye Behavior

- `narrow` - Suspicious, focused
- `squint` - Thinking, sun in eyes
- `wide` - Surprise, fear, excitement
- `darting` - Nervous, searching
- `focused` - Determined, intent

### Body Language

| Posture | Meaning |
|---------|---------|
| `upright` | Confident, alert |
| `slouched` | Defeated, tired, casual |
| `leaning` | Interested, engaged |
| `rigid` | Tense, uncomfortable |
| `relaxed` | At ease, comfortable |

### Emotional Arc

Structure emotion progression across the scene:

```
"Character starts confused with furrowed brow,
gradually becomes confident as understanding dawns,
ends with satisfied accomplishment smile and relaxed shoulders"

"Beginning with nervous energy and fidgeting,
building to determined resolve,
culminating in triumphant celebration"
```

### Anti-Model-Face Technique

Add natural imperfection:
```
"Natural, unstaged expression with slight asymmetry,
avoiding perfect model pose, authentic human moment"
```

---

## Selfie/POV Mode

### Proven Selfie Formula

```
"A selfie video of [CHARACTER] [ACTIVITY].
[He/She] holds camera at arm's length.
[His/Her] arm is clearly visible in frame.
Occasionally looking into camera before [SPECIFIC_ACTION].
The image is slightly grainy, looks very film-like.
[He/She] says: '[DIALOGUE]' [TONE].
Ends with [GESTURE]."
```

### Critical Selfie Elements

1. **Start phrase**: "A selfie video of..."
2. **Arm visibility**: "arm is clearly visible in the frame"
3. **Natural eye contact**: "occasionally looking into the camera before..."
4. **Film-like quality**: "slightly grainy, looks very film-like"
5. **Closing gesture**: thumbs up, wave, smile, etc.

### Selfie Example

```
"A selfie video of a young woman hiking in mountains.
She holds camera at arm's length, her arm clearly visible in frame.
Occasionally looking into camera before panning to show the view.
The image is slightly grainy, looks very film-like, natural lighting.
She says: 'Finally made it to the top!' with breathless excitement.
Ends with triumphant fist pump and wide smile."
```

### Camera Shake Options
- `none` - Perfectly stable (less authentic)
- `subtle` - Slight natural movement
- `natural` - Authentic handheld feel

---

## Negative Prompts

### Master Negative Prompt

```
"No subtitles. No captions. No watermarks. No text overlays.
No words on screen. No logos. No cartoon effects. No blurry faces.
No distorted hands. No poor lighting. No oversaturation.
No compression artifacts. No camera shake. No lip-sync issues."
```

### Domain-Specific Negatives

**Corporate/Professional:**
```
"No casual attire, no distracting backgrounds, no poor posture,
no unprofessional gestures, no cluttered desk"
```

**Educational:**
```
"No overly dramatic presentation, no artificial staging,
no condescending tone, no outdated visuals"
```

**Social Media:**
```
"No outdated aesthetics, no poor mobile optimization,
no vertical letterboxing, no low engagement elements"
```

**Cinematic:**
```
"No TV soap opera look, no flat lighting, no amateur framing,
no jump cuts, no continuity errors"
```

### Quality Control Negatives

```
"No anatomical errors, no extra limbs, no deformed faces,
no duplicate subjects, no objects appearing/disappearing,
no teleporting items, no physics violations"
```

---

## Advanced Composition

### Perspective & Distortion

| Technique | Effect |
|-----------|--------|
| **Wide-angle simulation** | Expands space, dynamic energy |
| **Telephoto compression** | Flattens depth, intimate feel |
| **Fish-eye distortion** | Extreme curve, unique POV |
| **Dutch angle** | Tilted frame, unease/tension |
| **Bird's eye** | Looking straight down, omniscient |
| **Worm's eye** | Looking straight up, dramatic power |

### Composition Rules

```
"Rule of thirds composition with subject at left intersection point"

"Leading lines drawing eye from foreground to subject"

"Frame within frame using doorway to focus attention"

"Symmetrical composition creating formal, balanced aesthetic"

"Dynamic diagonal composition implying movement and energy"
```

### Advanced Camera Movements

| Movement | Syntax |
|----------|--------|
| **Dolly zoom** | "Vertigo effect, background stretching while subject stays same size" |
| **Whip pan** | "Fast horizontal pan with motion blur between subjects" |
| **Steadicam** | "Smooth floating movement following subject through space" |
| **Crane shot** | "Vertical movement revealing scene from above" |
| **Tracking** | "Camera moves parallel to subject maintaining distance" |
| **Push in** | "Slow dolly toward subject building intensity" |
| **Pull out** | "Slow dolly away revealing context" |

---

## Pro Tips

### 1. Layer Techniques
Combine multiple elements for professional results:
```
Character detail + Camera positioning + Audio design + Lighting + Color grade
```

### 2. Iterate Strategically
Test variations in order:
1. Camera angle variations
2. Lighting adjustments
3. Dialogue delivery
4. Color grading
5. Audio refinement

### 3. Duration Discipline
- Keep all dialogue under 8 seconds
- Plan scene duration before prompting
- Leave room for natural pacing

### 4. Audio Prevention
- Always specify expected ambient sounds
- Name exact sound effects
- Block unwanted audio with negations

### 5. Character Consistency
- Reuse exact same physical descriptions
- Document character "skeleton" (unchanging traits)
- Track outfit/accessory changes separately

### 6. Platform Optimization

| Platform | Aspect Ratio | Considerations |
|----------|--------------|----------------|
| YouTube | 16:9 | Horizontal, detailed backgrounds |
| TikTok | 9:16 | Vertical, face-focused, safe zones |
| Instagram Reels | 9:16 | Vertical, quick hooks |
| YouTube Shorts | 9:16 | Vertical, 60s max |
| Instagram Feed | 1:1, 4:5 | Square/portrait, scroll-stopping |

---

## Quick Reference Card

### Essential Syntax Patterns

```
CAMERA:     "[Shot] with camera at [position] (thats where the camera is)"
DIALOGUE:   "[Character] [action] and says: '[words]' [tone]"
AUDIO:      "[ambient sounds], [music mood], [specific SFX]"
LIGHTING:   "[key light] from [direction], [fill], [rim/accent]"
COLOR:      "[palette type] color grading with [shadow color] and [highlight color]"
EXPRESSION: "[facial detail], [eye behavior], [body language]"
NEGATIVE:   "No [unwanted element], no [artifact], no [quality issue]"
```

### Generation Checklist

- [ ] Subject fully described (physical traits, clothing, accessories)
- [ ] Action clearly specified (movement path, speed, purpose)
- [ ] Scene/environment detailed (location, elements, atmosphere)
- [ ] Camera position includes "(thats where the camera is)"
- [ ] Dialogue follows colon format, under 8 seconds
- [ ] Audio specified (ambient + music + SFX)
- [ ] Lighting setup defined
- [ ] Color palette/grade specified
- [ ] Negative prompts included
- [ ] Duration appropriate for content

---

## Battle-Tested Templates

### POV Vlog Template

```
POV vlog-style footage in 4K, realistic cinematic look. A [CHARACTER_DESCRIPTION]
holds a camera at arm's length, [ACTION] through [ENVIRONMENT]. They speak in a
[TONE] while recording themselves. [ENVIRONMENTAL_DETAILS] are visible around them.
The character [CAMERA_INTERACTION], reflecting [EMOTIONS]. [CAMERA_QUALITY],
[AUDIO_DESCRIPTION], and [LIGHTING] complete the scene.
```

### ASMR Macro Template

```
Shot in extreme macro perspective, [CUTTING_TOOL] cutting a [DETAILED_OBJECT].
The [OBJECT] has [TEXTURE_DETAILS] with [VISUAL_PROPERTIES]. [OBJECT] rests on
[SURFACE] bathed in [LIGHTING]. Each [ACTION] produces [AUDIO_FOCUS] in an
otherwise silent room.
```

### Street Interview Template (Viral)

```
Create a [PLATFORM]-style street interview video set [TIME] in [LOCATION].
The environment includes [ENVIRONMENTAL_DETAILS]. Use [CAMERA_STYLE] filmed
[ANGLE] in [COMPOSITION], with [LENS_TYPE] for [VISUAL_EFFECT].
[INTERVIEWER_DESCRIPTION] holds a mic. They stop [INTERVIEWEE_DESCRIPTION].
[POSITIONING] under [LIGHTING]. [INTERVIEWER] speaks [TONE]: "[QUESTION]"
[INTERVIEWEE] [REACTION], then replies [RESPONSE_TONE]: "[ANSWER]"
[POST_DIALOGUE_EFFECTS]. [SUBTITLE_INSTRUCTION]. [BRANDING_INSTRUCTION].
Dialogue must be [SYNC_REQUIREMENT]. Keep the energy [ENERGY_STYLE].
```

### Corporate Presentation Template

```
Professional corporate boardroom setting with floor-to-ceiling windows overlooking
a city skyline. A confident [GENDER] executive in [AGE]s, wearing [ATTIRE], stands
beside a large wall-mounted display showing [DATA/CONTENT]. [GESTURE_TYPE] while
speaking: "[PROFESSIONAL_STATEMENT]" Medium shot transitioning to a slow push-in
for emphasis. Professional three-point lighting with warm key light, subtle fill,
and rim lighting. Audio: Clear, authoritative voice with subtle room tone.
No background music. Camera movement is smooth and deliberate, ending on a
medium close-up of [PRONOUN] confident expression.
```

### Educational Content Template

```
Modern classroom with natural lighting from large windows. An enthusiastic
[SUBJECT] teacher in [AGE]s, wearing casual professional attire, demonstrates
[EXPERIMENT/CONCEPT] at [WORKSPACE]. [VISUAL_ELEMENTS] [ACTION]. [PRONOUN]
explains with animated gestures: "[EDUCATIONAL_DIALOGUE]" Students visible in
the background lean forward with interest. Medium wide shot with rack focus
from the [FOCUS_SUBJECT] to the teacher's excited expression. Audio: Clear
explanation voice, [SUBJECT_SOUNDS], occasional student reactions. Warm,
natural lighting creates an inviting learning atmosphere.
```

---

## Character Consistency Framework

### 15+ Attribute Template

```
[NAME] is a [ETHNICITY] [GENDER] appearing to be in [AGE_RANGE], with a
[BUILD] and [HEIGHT] stature. [PRONOUN] has [HAIR_DESCRIPTION], [EYE_COLOR]
eyes with [EXPRESSION], and [FACIAL_FEATURES]. [CLOTHING_DESCRIPTION].
[POSTURE_AND_MANNERISMS]. [DISTINCTIVE_FEATURES]. [EMOTIONAL_BASELINE].
```

### Example Character Profile

```
Sarah Chen is a 35-year-old Asian-American woman with shoulder-length black hair
styled in a professional bob, warm brown eyes behind wire-rimmed glasses, wearing
a charcoal gray blazer over a white collared shirt, with confident posture and an
approachable smile that creates small crinkles around her eyes.
```

### Consistency Rules

1. **Physical**: Maintain identical descriptions across all prompts
2. **Clothing**: Preserve styling choices unless story requires change
3. **Personality**: Keep mannerisms and expressions consistent
4. **Lighting**: Ensure lighting doesn't alter apparent features
5. **Voice**: Maintain speech patterns and characteristics

---

## Quality Standards

### Quality Hierarchy

| Level | Components | Result Quality |
|-------|------------|----------------|
| **Master** | All 8 components + advanced techniques | 95%+ success |
| **Professional** | 6-8 components with detailed descriptions | 85%+ success |
| **Intermediate** | 4-6 components with basic details | 70%+ success |
| **Basic** | 1-3 components | Poor results |

### Pre-Generation Checklist (10-Point)

- [ ] Character description includes 15+ specific physical attributes
- [ ] Scene description includes 10+ environmental elements
- [ ] Camera work specifies shot type, angle, and movement
- [ ] Lighting setup is professionally detailed
- [ ] Audio design prevents hallucinations (explicit ambient sounds)
- [ ] Dialogue includes tone and delivery specifications
- [ ] Negative prompts cover all unwanted elements
- [ ] Technical specifications are broadcast-quality
- [ ] Brand compliance is maintained (if applicable)
- [ ] Duration is optimized for 8-second format

### Success Metrics Targets

- **Generation Success Rate**: >95%
- **Character Consistency**: >98%
- **Audio-Visual Sync**: >97%
- **Professional Quality**: >96%
- **Generation Time**: 2-3 minutes per video

---

## Movement Quality Keywords

### Subject Movement

```
"natural movement" - Default, realistic human motion
"energetic movement" - Dynamic, high-energy actions
"slow and deliberate movement" - Thoughtful, careful actions
"graceful movement" - Smooth, flowing motion
"confident movement" - Assured, purposeful actions
"fluid movement" - Seamless, continuous motion
```

### Physics-Aware Prompting

```
"realistic physics governing all actions"
"natural fluid dynamics"
"authentic momentum conservation"
"proper weight and balance"
"realistic material behavior"
```

### Material Behavior

| Material | Keyword |
|----------|---------|
| Fabric | "flowing", "stiff", "billowing" |
| Hair | "static", "windswept", "bouncing" |
| Liquid | "splashing", "dripping", "pouring" |
| Smoke | "rising wisps", "dispersing naturally" |

---

## Shot Size Reference

| Shot | Abbreviation | Use Case |
|------|--------------|----------|
| Extreme Wide Shot | EWS | Environmental context, isolation |
| Wide Shot | WS | Full body + environment |
| Medium Wide Shot | MWS | Character + context |
| Medium Shot | MS | Waist up (conversation standard) |
| Medium Close-Up | MCU | Focused attention |
| Close-Up | CU | Emotional intensity |
| Extreme Close-Up | ECU | Critical detail |

---

## Audio Hallucination Prevention

### Problem-Solution Pairs

```
❌ Problem: "Character tells a joke" (may add unwanted laughter)
✅ Solution: "Character tells a joke. Audio: quiet office ambiance,
   no audience sounds, professional atmosphere."

❌ Problem: Generic scene (wrong background sounds)
✅ Solution: "Audio: sounds of distant bands, noisy crowd, ambient
   background of a busy festival field"
```

### Prevention Keywords

```
"no background music"
"professional atmosphere"
"no unwanted sounds"
"natural room tone"
"crystal clear dialogue"
"professional audio mixing"
"balanced audio levels"
"studio-quality sound"
```

---

## Subtitle Prevention Methods

### Method 1: Colon Format (Recommended)

```
✅ Use: Character says: "dialogue" (with colon before dialogue)
❌ Avoid: Character says "dialogue" (no colon - triggers subtitles)
```

### Method 2: Explicit Negation

```
Add to prompt: "(no subtitles)" or "no subtitles, no text overlays"
```

### Method 3: Multiple Negatives (Stubborn Cases)

```
"No subtitles. No subtitles! No on-screen text whatsoever."
```

---

## Platform-Specific Workarounds

### Vertical Video (Current Limitation)

Veo 3 only supports 16:9 natively. Workaround:

```
Veo 3 Generation (16:9) → Luma Reframe Video → 9:16 Vertical (720p)
```

*Note: Native vertical support coming soon*

### Professional Enhancement Pipeline

```
Veo 3 Generation → Quality Assessment → Post-Production Enhancement
```

**Enhancement Tools:**
- **4K/60fps Upscaling**: Topaz Lab's Video Upscaler
- **Vertical Conversion**: Luma's Reframe Video
- **Professional Editing**: DaVinci Resolve

---

## Complete Example Prompt

```
Subject: Sarah Chen, a 35-year-old Asian-American CEO in a tailored navy
blazer, stands confidently with warm brown eyes and professional bob haircut.

Action: She gestures toward charts while explaining growth strategies,
maintaining confident posture and natural hand movements throughout.

Scene: Modern glass conference room with city skyline at golden hour,
8 board members seated, presentation screens showing quarterly data.

Style: Smooth dolly-in from wide to medium shot with camera at eye level
(thats where the camera is), shallow depth of field, cinematic color grade.

Dialogue: Sarah looks directly at camera and says: "Our Q3 results exceeded
expectations, positioning us for unprecedented growth."
(Tone: confident authority with measured delivery)

Sounds: Clear articulate voice, subtle office ambiance, air conditioning hum,
no background music, professional atmosphere.

Technical (Negative Prompt): no subtitles, no captions, no watermarks,
no text overlays, no poor lighting, no blurry faces, no amateur quality.
```

---

*This guide is based on the [Veo 3 Prompting Guide](https://github.com/snubroot/Veo-3-Prompting-Guide) (Version 4.0) by snubroot.*
