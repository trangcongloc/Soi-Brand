"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/lang";
import { Scene, CharacterRegistry, getCharacterDescription } from "@/lib/prompt";
import { getUserSettings } from "@/lib/userSettings";
import { DEFAULT_IMAGE_MODEL } from "@/lib/geminiModels";
import styles from "./PromptCharacterPanel.module.css";

interface VeoCharacterPanelProps {
  characterRegistry: CharacterRegistry;
  scenes: Scene[];
}

interface GeneratedImage {
  image: string;
  mimeType: string;
}

function VeoCharacterPanel({ characterRegistry, scenes }: VeoCharacterPanelProps) {
  const lang = useLang();
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Count appearances for each character
  const characterStats = useMemo(() => {
    const stats: Record<string, number> = {};

    for (const name of Object.keys(characterRegistry)) {
      stats[name] = scenes.filter((scene) =>
        scene.character?.toLowerCase().includes(name.toLowerCase())
      ).length;
    }

    return stats;
  }, [characterRegistry, scenes]);

  const handleGenerateImage = useCallback(async (name: string, description: string) => {
    setGeneratingFor(name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

    try {
      const settings = getUserSettings();
      const apiKey = settings.geminiApiKey;

      if (!apiKey) {
        setErrors((prev) => ({ ...prev, [name]: "Gemini API key not configured. Set it in Settings." }));
        return;
      }

      const model = settings.geminiImageModel || DEFAULT_IMAGE_MODEL;

      const response = await fetch("/api/prompt/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: name,
          characterDescription: description,
          model,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({ ...prev, [name]: data.error || "Failed to generate image" }));
        return;
      }

      setGeneratedImages((prev) => ({
        ...prev,
        [name]: { image: data.image, mimeType: data.mimeType },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setErrors((prev) => ({ ...prev, [name]: message }));
    } finally {
      setGeneratingFor(null);
    }
  }, []);

  const handleDownloadImage = useCallback((name: string, imageData: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = `data:${imageData.mimeType};base64,${imageData.image}`;
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  }, []);

  const characters = Object.entries(characterRegistry);

  if (characters.length === 0) {
    return (
      <div className={styles.empty}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <p>{lang.prompt.result.characterCard.noCharacters}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {characters.map(([name, charData], index) => {
        const description = getCharacterDescription(charData);
        const isGenerating = generatingFor === name;
        const generatedImage = generatedImages[name];
        const error = errors[name];

        return (
          <motion.div
            key={name}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={styles.header}>
              <div className={styles.avatar}>
                {generatedImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${generatedImage.mimeType};base64,${generatedImage.image}`}
                    alt={name}
                    className={styles.avatarImage}
                  />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <div className={styles.info}>
                <h3 className={styles.name}>{name}</h3>
                <span className={styles.appearances}>
                  {characterStats[name]} {lang.prompt.result.characterCard.appearances}
                </span>
              </div>
            </div>

            <div className={styles.descriptionSection}>
              <h4 className={styles.descriptionLabel}>
                {lang.prompt.result.characterCard.description}
              </h4>
              <p className={styles.description}>{description}</p>
            </div>

            {/* Generated Image Preview */}
            {generatedImage && (
              <div className={styles.imagePreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${generatedImage.mimeType};base64,${generatedImage.image}`}
                  alt={`Generated: ${name}`}
                  className={styles.generatedImage}
                />
                <button
                  className={styles.downloadImageBtn}
                  onClick={() => handleDownloadImage(name, generatedImage)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}

            {/* Generate Image Button */}
            <button
              className={styles.generateBtn}
              onClick={() => handleGenerateImage(name, description)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className={styles.spinner} />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  {generatedImage ? "Regenerate Image" : "Generate Image"}
                </>
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

export default memo(VeoCharacterPanel);
