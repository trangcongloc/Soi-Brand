/**
 * Cinematic Color Vocabulary Library
 *
 * Curated library of 60-80 cinematic colors with semantic names,
 * mood associations, and usage contexts for Prompt 3 prompting.
 */

export type ColorMood =
  | "mysterious" | "warm" | "clinical" | "nostalgic" | "energetic"
  | "melancholic" | "hopeful" | "tense" | "intimate" | "epic"
  | "vintage" | "modern" | "organic" | "synthetic" | "cold"
  | "professional" | "dramatic" | "playful" | "romantic" | "harsh"
  | "soft" | "bold" | "serene" | "ominous" | "luxurious";

export type ColorUsage =
  | "shadows" | "highlights" | "midtones" | "skin-tones"
  | "backgrounds" | "accents" | "split-tone-shadows" | "split-tone-highlights";

export type ColorTemperature = "warm" | "cool" | "neutral";

export interface CinematicColorDefinition {
  id: string;
  semanticName: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  moods: ColorMood[];
  usageContexts: ColorUsage[];
  temperature: ColorTemperature;
  filmReferences?: string[];
  psychologyNotes: string;
}

/**
 * Curated library of cinematic colors organized by category
 */
export const CINEMATIC_COLORS: CinematicColorDefinition[] = [
  // ========== BLUES ==========
  {
    id: "deep-ocean-blue",
    semanticName: "deep ocean mystery blue",
    hex: "#1a3a5c",
    rgb: { r: 26, g: 58, b: 92 },
    moods: ["mysterious", "professional", "cold"],
    usageContexts: ["shadows", "backgrounds", "split-tone-shadows"],
    temperature: "cool",
    filmReferences: ["Blade Runner 2049", "Drive"],
    psychologyNotes: "Evokes trust, depth, mystery, and professionalism"
  },
  {
    id: "cyberpunk-teal",
    semanticName: "cyberpunk teal glow",
    hex: "#0abdc6",
    rgb: { r: 10, g: 189, b: 198 },
    moods: ["modern", "synthetic", "energetic"],
    usageContexts: ["accents", "highlights", "split-tone-highlights"],
    temperature: "cool",
    filmReferences: ["Blade Runner 2049", "Tron: Legacy"],
    psychologyNotes: "Futuristic, artificial, high-tech atmosphere"
  },
  {
    id: "powder-blue-melancholy",
    semanticName: "powder blue melancholy",
    hex: "#b0d4e3",
    rgb: { r: 176, g: 212, b: 227 },
    moods: ["melancholic", "soft", "serene"],
    usageContexts: ["highlights", "midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["Moonlight", "The Grand Budapest Hotel"],
    psychologyNotes: "Gentle sadness, contemplation, dreamlike quality"
  },
  {
    id: "steel-blue",
    semanticName: "cold steel blue",
    hex: "#4682b4",
    rgb: { r: 70, g: 130, b: 180 },
    moods: ["professional", "cold", "clinical"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Social Network", "Steve Jobs"],
    psychologyNotes: "Corporate, technological, analytical atmosphere"
  },
  {
    id: "navy-shadow",
    semanticName: "navy shadow depths",
    hex: "#001f3f",
    rgb: { r: 0, g: 31, b: 63 },
    moods: ["ominous", "mysterious", "dramatic"],
    usageContexts: ["shadows", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Dark Knight", "Inception"],
    psychologyNotes: "Deep mystery, authority, sophistication"
  },

  // ========== ORANGES & AMBERS ==========
  {
    id: "golden-hour-amber",
    semanticName: "golden hour amber",
    hex: "#d4a574",
    rgb: { r: 212, g: 165, b: 116 },
    moods: ["warm", "nostalgic", "romantic"],
    usageContexts: ["highlights", "skin-tones", "split-tone-highlights"],
    temperature: "warm",
    filmReferences: ["Mad Max: Fury Road", "The Revenant"],
    psychologyNotes: "Warmth, nostalgia, comfort, optimism"
  },
  {
    id: "warm-intimate-orange",
    semanticName: "warm intimate orange",
    hex: "#ff8c42",
    rgb: { r: 255, g: 140, b: 66 },
    moods: ["intimate", "warm", "energetic"],
    usageContexts: ["highlights", "accents", "skin-tones"],
    temperature: "warm",
    filmReferences: ["Her", "Lost in Translation"],
    psychologyNotes: "Intimacy, creativity, enthusiasm, friendliness"
  },
  {
    id: "blockbuster-orange",
    semanticName: "Hollywood blockbuster orange",
    hex: "#ff6f00",
    rgb: { r: 255, g: 111, b: 0 },
    moods: ["epic", "dramatic", "bold"],
    usageContexts: ["highlights", "accents", "split-tone-highlights"],
    temperature: "warm",
    filmReferences: ["Transformers", "Armageddon"],
    psychologyNotes: "Explosive energy, excitement, high stakes"
  },
  {
    id: "sunset-peach",
    semanticName: "sunset peach glow",
    hex: "#ffb07c",
    rgb: { r: 255, g: 176, b: 124 },
    moods: ["romantic", "soft", "warm"],
    usageContexts: ["highlights", "skin-tones"],
    temperature: "warm",
    filmReferences: ["Call Me By Your Name", "La La Land"],
    psychologyNotes: "Romance, tenderness, warmth, beauty"
  },
  {
    id: "burnt-sienna",
    semanticName: "burnt sienna earth",
    hex: "#e97451",
    rgb: { r: 233, g: 116, b: 81 },
    moods: ["organic", "warm", "vintage"],
    usageContexts: ["midtones", "accents"],
    temperature: "warm",
    filmReferences: ["O Brother, Where Art Thou?"],
    psychologyNotes: "Earthy, grounded, rustic authenticity"
  },

  // ========== TEALS ==========
  {
    id: "cinematic-teal",
    semanticName: "cinematic teal standard",
    hex: "#008b8b",
    rgb: { r: 0, g: 139, b: 139 },
    moods: ["epic", "modern", "professional"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["Mad Max: Fury Road", "Tron: Legacy"],
    psychologyNotes: "Blockbuster aesthetic, visual sophistication"
  },
  {
    id: "medical-teal",
    semanticName: "medical clinical teal",
    hex: "#5f9ea0",
    rgb: { r: 95, g: 158, b: 160 },
    moods: ["clinical", "cold", "professional"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Machinist", "Side Effects"],
    psychologyNotes: "Sterile, analytical, detached observation"
  },
  {
    id: "tropical-teal",
    semanticName: "tropical paradise teal",
    hex: "#00ced1",
    rgb: { r: 0, g: 206, b: 209 },
    moods: ["playful", "energetic", "bold"],
    usageContexts: ["accents", "highlights"],
    temperature: "cool",
    filmReferences: ["Miami Vice", "Spring Breakers"],
    psychologyNotes: "Vibrant escapism, freedom, adventure"
  },
  {
    id: "muted-teal",
    semanticName: "muted vintage teal",
    hex: "#5b9aa0",
    rgb: { r: 91, g: 154, b: 160 },
    moods: ["vintage", "melancholic", "soft"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Shape of Water", "Carol"],
    psychologyNotes: "Retro nostalgia, faded memories, gentle melancholy"
  },

  // ========== REDS & MAGENTAS ==========
  {
    id: "passionate-crimson",
    semanticName: "passionate crimson red",
    hex: "#dc143c",
    rgb: { r: 220, g: 20, b: 60 },
    moods: ["dramatic", "bold", "romantic"],
    usageContexts: ["accents", "highlights"],
    temperature: "warm",
    filmReferences: ["Amélie", "In the Mood for Love"],
    psychologyNotes: "Passion, danger, intensity, desire"
  },
  {
    id: "neon-magenta",
    semanticName: "neon magenta surge",
    hex: "#ff00ff",
    rgb: { r: 255, g: 0, b: 255 },
    moods: ["synthetic", "energetic", "bold"],
    usageContexts: ["accents", "highlights", "split-tone-highlights"],
    temperature: "cool",
    filmReferences: ["Drive", "Only God Forgives"],
    psychologyNotes: "Artificial energy, rebellion, modern edge"
  },
  {
    id: "brick-red",
    semanticName: "desaturated brick red",
    hex: "#8b4513",
    rgb: { r: 139, g: 69, b: 19 },
    moods: ["vintage", "organic", "warm"],
    usageContexts: ["midtones", "shadows"],
    temperature: "warm",
    filmReferences: ["The Godfather", "Once Upon a Time in the West"],
    psychologyNotes: "Aged authenticity, earthiness, tradition"
  },
  {
    id: "rose-dust",
    semanticName: "rose dust blush",
    hex: "#c08081",
    rgb: { r: 192, g: 128, b: 129 },
    moods: ["romantic", "soft", "vintage"],
    usageContexts: ["skin-tones", "highlights"],
    temperature: "warm",
    filmReferences: ["Marie Antoinette", "A Single Man"],
    psychologyNotes: "Delicate romance, femininity, nostalgia"
  },
  {
    id: "blood-red",
    semanticName: "dark blood red",
    hex: "#8b0000",
    rgb: { r: 139, g: 0, b: 0 },
    moods: ["ominous", "dramatic", "tense"],
    usageContexts: ["shadows", "accents"],
    temperature: "warm",
    filmReferences: ["There Will Be Blood", "The Revenant"],
    psychologyNotes: "Danger, violence, primal intensity"
  },

  // ========== GREENS ==========
  {
    id: "forest-green",
    semanticName: "organic forest green",
    hex: "#228b22",
    rgb: { r: 34, g: 139, b: 34 },
    moods: ["organic", "serene", "soft"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Revenant", "The Tree of Life"],
    psychologyNotes: "Nature, growth, harmony, life"
  },
  {
    id: "hospital-green",
    semanticName: "clinical hospital green",
    hex: "#98fb98",
    rgb: { r: 152, g: 251, b: 152 },
    moods: ["clinical", "cold", "harsh"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Matrix", "One Flew Over the Cuckoo's Nest"],
    psychologyNotes: "Institutional sterility, unnatural environment"
  },
  {
    id: "vintage-film-green",
    semanticName: "vintage film green",
    hex: "#556b2f",
    rgb: { r: 85, g: 107, b: 47 },
    moods: ["vintage", "organic", "melancholic"],
    usageContexts: ["midtones", "shadows"],
    temperature: "cool",
    filmReferences: ["The Master", "There Will Be Blood"],
    psychologyNotes: "Period authenticity, aged quality, earthiness"
  },
  {
    id: "mint-pastel",
    semanticName: "mint pastel dream",
    hex: "#aaf0d1",
    rgb: { r: 170, g: 240, b: 209 },
    moods: ["soft", "playful", "serene"],
    usageContexts: ["highlights", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Grand Budapest Hotel", "Moonrise Kingdom"],
    psychologyNotes: "Whimsy, innocence, gentle calm"
  },
  {
    id: "olive-shadow",
    semanticName: "olive shadow tone",
    hex: "#808000",
    rgb: { r: 128, g: 128, b: 0 },
    moods: ["organic", "vintage", "harsh"],
    usageContexts: ["shadows", "midtones"],
    temperature: "warm",
    filmReferences: ["Apocalypse Now", "Sicario"],
    psychologyNotes: "Military grit, survival, earthiness"
  },

  // ========== NEUTRALS ==========
  {
    id: "film-noir-charcoal",
    semanticName: "film noir charcoal",
    hex: "#36454f",
    rgb: { r: 54, g: 69, b: 79 },
    moods: ["dramatic", "mysterious", "vintage"],
    usageContexts: ["shadows", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Third Man", "Double Indemnity"],
    psychologyNotes: "Classic noir mystery, sophistication, shadow"
  },
  {
    id: "lifted-black",
    semanticName: "lifted black shadow",
    hex: "#2c3e50",
    rgb: { r: 44, g: 62, b: 80 },
    moods: ["modern", "dramatic", "professional"],
    usageContexts: ["shadows", "backgrounds"],
    temperature: "cool",
    filmReferences: ["Interstellar", "Inception"],
    psychologyNotes: "Modern cinematic depth without crushing blacks"
  },
  {
    id: "creamy-white",
    semanticName: "creamy highlight white",
    hex: "#f5f5dc",
    rgb: { r: 245, g: 245, b: 220 },
    moods: ["soft", "warm", "vintage"],
    usageContexts: ["highlights", "backgrounds"],
    temperature: "warm",
    filmReferences: ["The Grand Budapest Hotel", "Amélie"],
    psychologyNotes: "Gentle highlights, avoiding harsh whites"
  },
  {
    id: "warm-beige",
    semanticName: "warm skin beige",
    hex: "#d2b48c",
    rgb: { r: 210, g: 180, b: 140 },
    moods: ["warm", "organic", "intimate"],
    usageContexts: ["skin-tones", "midtones"],
    temperature: "warm",
    filmReferences: ["Call Me By Your Name", "The English Patient"],
    psychologyNotes: "Natural warmth, human connection, comfort"
  },
  {
    id: "cool-gray",
    semanticName: "cool neutral gray",
    hex: "#808080",
    rgb: { r: 128, g: 128, b: 128 },
    moods: ["professional", "modern", "serene"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "neutral",
    filmReferences: ["Her", "Lost in Translation"],
    psychologyNotes: "Balance, neutrality, modern sophistication"
  },
  {
    id: "warm-gray",
    semanticName: "warm concrete gray",
    hex: "#a39e93",
    rgb: { r: 163, g: 158, b: 147 },
    moods: ["vintage", "organic", "soft"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "warm",
    filmReferences: ["The Master", "Roma"],
    psychologyNotes: "Muted elegance, timeless quality"
  },
  {
    id: "stark-white",
    semanticName: "stark clinical white",
    hex: "#ffffff",
    rgb: { r: 255, g: 255, b: 255 },
    moods: ["clinical", "harsh", "modern"],
    usageContexts: ["highlights", "backgrounds"],
    temperature: "neutral",
    filmReferences: ["THX 1138", "A Clockwork Orange"],
    psychologyNotes: "Sterile purity, harsh contrast, clinical detachment"
  },
  {
    id: "pure-black",
    semanticName: "pure shadow black",
    hex: "#000000",
    rgb: { r: 0, g: 0, b: 0 },
    moods: ["dramatic", "ominous", "mysterious"],
    usageContexts: ["shadows", "backgrounds"],
    temperature: "neutral",
    filmReferences: ["The Dark Knight", "Se7en"],
    psychologyNotes: "Absolute darkness, mystery, fear, unknown"
  },

  // ========== PURPLES & VIOLETS ==========
  {
    id: "royal-purple",
    semanticName: "royal purple luxury",
    hex: "#6a0dad",
    rgb: { r: 106, g: 13, b: 173 },
    moods: ["luxurious", "mysterious", "dramatic"],
    usageContexts: ["accents", "shadows"],
    temperature: "cool",
    filmReferences: ["The Grand Budapest Hotel", "Black Swan"],
    psychologyNotes: "Royalty, luxury, mystery, spirituality"
  },
  {
    id: "lavender-soft",
    semanticName: "soft lavender dream",
    hex: "#e6e6fa",
    rgb: { r: 230, g: 230, b: 250 },
    moods: ["soft", "romantic", "serene"],
    usageContexts: ["highlights", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Grand Budapest Hotel", "Marie Antoinette"],
    psychologyNotes: "Gentle elegance, dreamlike quality, femininity"
  },
  {
    id: "deep-violet",
    semanticName: "deep violet night",
    hex: "#4b0082",
    rgb: { r: 75, g: 0, b: 130 },
    moods: ["mysterious", "ominous", "dramatic"],
    usageContexts: ["shadows", "backgrounds"],
    temperature: "cool",
    filmReferences: ["Blade Runner", "Only God Forgives"],
    psychologyNotes: "Night mystery, otherworldly atmosphere"
  },

  // ========== YELLOWS & GOLDS ==========
  {
    id: "golden-sunlight",
    semanticName: "golden sunlight glow",
    hex: "#ffd700",
    rgb: { r: 255, g: 215, b: 0 },
    moods: ["hopeful", "warm", "energetic"],
    usageContexts: ["highlights", "accents"],
    temperature: "warm",
    filmReferences: ["The Wizard of Oz", "Amélie"],
    psychologyNotes: "Optimism, happiness, divine light"
  },
  {
    id: "mustard-vintage",
    semanticName: "vintage mustard tone",
    hex: "#ffdb58",
    rgb: { r: 255, g: 219, b: 88 },
    moods: ["vintage", "warm", "nostalgic"],
    usageContexts: ["midtones", "accents"],
    temperature: "warm",
    filmReferences: ["The Grand Budapest Hotel", "O Brother, Where Art Thou?"],
    psychologyNotes: "70s nostalgia, retro warmth"
  },
  {
    id: "pale-yellow",
    semanticName: "pale morning yellow",
    hex: "#ffffe0",
    rgb: { r: 255, g: 255, b: 224 },
    moods: ["soft", "hopeful", "serene"],
    usageContexts: ["highlights", "backgrounds"],
    temperature: "warm",
    filmReferences: ["Days of Heaven", "The Tree of Life"],
    psychologyNotes: "Dawn hope, gentle optimism, natural light"
  },

  // ========== PINKS ==========
  {
    id: "hot-pink",
    semanticName: "hot pink energy",
    hex: "#ff69b4",
    rgb: { r: 255, g: 105, b: 180 },
    moods: ["playful", "bold", "energetic"],
    usageContexts: ["accents", "highlights"],
    temperature: "warm",
    filmReferences: ["Baby Driver", "Spring Breakers"],
    psychologyNotes: "Youth energy, rebellion, playfulness"
  },
  {
    id: "blush-pink",
    semanticName: "delicate blush pink",
    hex: "#ffc0cb",
    rgb: { r: 255, g: 192, b: 203 },
    moods: ["romantic", "soft", "intimate"],
    usageContexts: ["skin-tones", "highlights"],
    temperature: "warm",
    filmReferences: ["Lost in Translation", "Her"],
    psychologyNotes: "Tenderness, romance, vulnerability"
  },
  {
    id: "salmon-coral",
    semanticName: "vintage salmon coral",
    hex: "#fa8072",
    rgb: { r: 250, g: 128, b: 114 },
    moods: ["vintage", "warm", "nostalgic"],
    usageContexts: ["skin-tones", "midtones"],
    temperature: "warm",
    filmReferences: ["The Grand Budapest Hotel", "Call Me By Your Name"],
    psychologyNotes: "Retro warmth, faded elegance"
  },

  // ========== BROWNS & SIENNAS ==========
  {
    id: "rich-chocolate",
    semanticName: "rich chocolate brown",
    hex: "#3b2414",
    rgb: { r: 59, g: 36, b: 20 },
    moods: ["organic", "warm", "vintage"],
    usageContexts: ["shadows", "midtones"],
    temperature: "warm",
    filmReferences: ["The Godfather", "There Will Be Blood"],
    psychologyNotes: "Earthiness, richness, tradition"
  },
  {
    id: "sepia-tone",
    semanticName: "sepia vintage tone",
    hex: "#704214",
    rgb: { r: 112, g: 66, b: 20 },
    moods: ["vintage", "nostalgic", "warm"],
    usageContexts: ["midtones", "shadows"],
    temperature: "warm",
    filmReferences: ["The Assassination of Jesse James", "O Brother, Where Art Thou?"],
    psychologyNotes: "Historical nostalgia, aged photography"
  },
  {
    id: "tan-sand",
    semanticName: "desert tan sand",
    hex: "#d2b48c",
    rgb: { r: 210, g: 180, b: 140 },
    moods: ["organic", "warm", "serene"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "warm",
    filmReferences: ["Lawrence of Arabia", "Mad Max: Fury Road"],
    psychologyNotes: "Desert warmth, natural expansiveness"
  },

  // ========== CYANS & AQUAS ==========
  {
    id: "electric-cyan",
    semanticName: "electric cyan pulse",
    hex: "#00ffff",
    rgb: { r: 0, g: 255, b: 255 },
    moods: ["synthetic", "energetic", "modern"],
    usageContexts: ["accents", "highlights"],
    temperature: "cool",
    filmReferences: ["Tron: Legacy", "Ghost in the Shell"],
    psychologyNotes: "Digital energy, futuristic atmosphere"
  },
  {
    id: "aqua-blue",
    semanticName: "clear aqua blue",
    hex: "#7fffd4",
    rgb: { r: 127, g: 255, b: 212 },
    moods: ["serene", "playful", "soft"],
    usageContexts: ["highlights", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Beach", "Moana"],
    psychologyNotes: "Tropical serenity, escape, clarity"
  },

  // ========== ADDITIONAL SPECIALIZED COLORS ==========
  {
    id: "smoky-blue",
    semanticName: "smoky blue haze",
    hex: "#4a5f7f",
    rgb: { r: 74, g: 95, b: 127 },
    moods: ["mysterious", "melancholic", "soft"],
    usageContexts: ["shadows", "midtones"],
    temperature: "cool",
    filmReferences: ["Blade Runner", "Drive"],
    psychologyNotes: "Atmospheric mystery, urban melancholy"
  },
  {
    id: "copper-metallic",
    semanticName: "copper metallic glow",
    hex: "#b87333",
    rgb: { r: 184, g: 115, b: 51 },
    moods: ["warm", "luxurious", "vintage"],
    usageContexts: ["highlights", "accents"],
    temperature: "warm",
    filmReferences: ["The Grand Budapest Hotel", "1917"],
    psychologyNotes: "Metallic warmth, aged luxury"
  },
  {
    id: "jade-green",
    semanticName: "jade mystical green",
    hex: "#00a86b",
    rgb: { r: 0, g: 168, b: 107 },
    moods: ["mysterious", "organic", "luxurious"],
    usageContexts: ["accents", "midtones"],
    temperature: "cool",
    filmReferences: ["Crouching Tiger Hidden Dragon", "In the Mood for Love"],
    psychologyNotes: "Eastern mysticism, natural luxury"
  },
  {
    id: "slate-blue",
    semanticName: "slate blue professional",
    hex: "#6a7b8b",
    rgb: { r: 106, g: 123, b: 139 },
    moods: ["professional", "serene", "modern"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Social Network", "Steve Jobs"],
    psychologyNotes: "Corporate calm, technological sophistication"
  },
  {
    id: "rust-orange",
    semanticName: "rust orange decay",
    hex: "#b7410e",
    rgb: { r: 183, g: 65, b: 14 },
    moods: ["organic", "harsh", "dramatic"],
    usageContexts: ["shadows", "accents"],
    temperature: "warm",
    filmReferences: ["Mad Max: Fury Road", "The Road"],
    psychologyNotes: "Decay, rust, post-apocalyptic grit"
  },
  {
    id: "ice-blue",
    semanticName: "ice blue frost",
    hex: "#99ccff",
    rgb: { r: 153, g: 204, b: 255 },
    moods: ["cold", "serene", "clinical"],
    usageContexts: ["highlights", "backgrounds"],
    temperature: "cool",
    filmReferences: ["The Revenant", "Frozen"],
    psychologyNotes: "Frigid cold, isolation, purity"
  },
  {
    id: "champagne-gold",
    semanticName: "champagne gold elegance",
    hex: "#f7e7ce",
    rgb: { r: 247, g: 231, b: 206 },
    moods: ["luxurious", "soft", "warm"],
    usageContexts: ["highlights", "skin-tones"],
    temperature: "warm",
    filmReferences: ["The Great Gatsby", "Marie Antoinette"],
    psychologyNotes: "Opulent elegance, sophisticated luxury"
  },
  {
    id: "ash-gray",
    semanticName: "ash gray smoke",
    hex: "#b2beb5",
    rgb: { r: 178, g: 190, b: 181 },
    moods: ["melancholic", "soft", "vintage"],
    usageContexts: ["midtones", "backgrounds"],
    temperature: "neutral",
    filmReferences: ["Roma", "The Master"],
    psychologyNotes: "Faded memories, subtle melancholy"
  }
];


