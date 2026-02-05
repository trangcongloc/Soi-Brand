# VEO Response Types (JSON)

JSON response structures from the VEO pipeline.

---

## Scene

```json
{
  "id": "string",
  "sequence": "number",
  "mediaType": "image | video",
  "description": "string",
  "object": "string",
  "character": "string",
  "prompt": "string",
  "negativePrompt": "string",
  "voice": "string",
  "style": { StyleObject },
  "visual_specs": { VisualSpecs },
  "lighting": { Lighting },
  "composition": { Composition },
  "technical": { Technical },
  "characterVariations": { "characterName": { CharacterVariation } }
}
```

## StyleObject

```json
{
  "genre": "string",
  "art_movement": "string",
  "medium": "string",
  "palette": "string",
  "color_temperature": "string",
  "contrast": "string",
  "texture": "string",
  "camera_lens": "string",
  "focal_length": "string",
  "depth_of_field": "string",
  "film_stock_or_profile": "string",
  "grain": "string",
  "mood": "string",
  "lighting_style": "string"
}
```

## VisualSpecs

```json
{
  "primary_subject": "string",
  "environment": "string",
  "key_details": "string"
}
```

## Lighting

```json
{
  "mood": "string",
  "source": "string",
  "shadows": "string"
}
```

## Composition

```json
{
  "angle": "string",
  "framing": "string",
  "focus": "string"
}
```

## Technical

```json
{
  "quality": "string",
  "colors": "string"
}
```

## CharacterSkeleton

```json
{
  "name": "string",
  "gender": "string",
  "age": "string",
  "ethnicity": "string",
  "bodyType": "string",
  "faceShape": "string",
  "hair": "string",
  "facialHair": "string | null",
  "distinctiveFeatures": "string | null",
  "baseOutfit": "string",
  "firstAppearance": "string | null"
}
```

## ColorProfile (Phase 0)

```json
{
  "dominantColors": [
    {
      "hex": "string",
      "name": "string",
      "moods": ["string"],
      "usage": "string"
    }
  ],
  "colorTemperature": "string",
  "contrastLevel": "string",
  "saturationStyle": "string",
  "filmLook": "string",
  "lightingMood": "string",
  "grainTexture": "string"
}
```

## SSE Events

```json
// Progress
{ "event": "progress", "data": { "batch": "number", "total": "number", "scenes": "number" } }

// Character
{ "event": "character", "data": { "name": "string", "description": "string" } }

// Complete
{ "event": "complete", "data": { "jobId": "string", "scenes": [Scene], "characterRegistry": { "name": CharacterSkeleton } } }

// Error
{ "event": "error", "data": { "type": "string", "message": "string", "retryable": "boolean" } }
```

## Enums

```json
VeoMode: "direct" | "hybrid"
VeoWorkflow: "url-to-script" | "script-to-scenes" | "url-to-scenes"
VoiceLanguage: "no-voice" | "english" | "vietnamese" | "spanish" | "french" | "german" | "japanese" | "korean" | "chinese"
MediaType: "image" | "video"
```
