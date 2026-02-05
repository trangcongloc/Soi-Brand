"use client";

import { useState } from "react";
import { CinematicProfile } from "@/lib/prompt/types";
import { useLang } from "@/lib/lang";
import styles from "./PromptColorProfilePanel.module.css";

interface VeoColorProfilePanelProps {
  profile: CinematicProfile;
  confidence: number;
  defaultExpanded?: boolean;
}

// SVG Icons (inline to avoid lucide-react dependency)
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const PaletteIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5"/>
    <circle cx="17.5" cy="10.5" r=".5"/>
    <circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const ThermometerIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
  </svg>
);

const SunDimIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 4h.01M12 20h.01M4 12h.01M20 12h.01M6.34 6.34h.01M17.66 17.66h.01M6.34 17.66h.01M17.66 6.34h.01"/>
  </svg>
);

const FilmIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
    <line x1="7" y1="2" x2="7" y2="22"/>
    <line x1="17" y1="2" x2="17" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="2" y1="7" x2="7" y2="7"/>
    <line x1="2" y1="17" x2="7" y2="17"/>
    <line x1="17" y1="17" x2="22" y2="17"/>
    <line x1="17" y1="7" x2="22" y2="7"/>
  </svg>
);

const HeartIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);

const SparklesIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>
  </svg>
);

export default function VeoColorProfilePanel({
  profile,
  confidence,
  defaultExpanded = true,
}: VeoColorProfilePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const lang = useLang();

  const getTemperatureClass = (category: string) => {
    switch (category) {
      case "warm": return styles.warm;
      case "cool": return styles.cool;
      case "neutral": return styles.neutral;
      case "mixed": return styles.mixed;
      default: return "";
    }
  };

  const getContrastClass = (level: string) => {
    switch (level) {
      case "low": return styles.low;
      case "medium": return styles.medium;
      case "high": return styles.high;
      case "extreme": return styles.extreme;
      default: return "";
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <PaletteIcon size={14} />
          </div>
          <span className={styles.title}>{lang.prompt.result.colorProfile.title}</span>
          <span className={styles.confidence}>
            {Math.round(confidence * 100)}% {lang.prompt.result.colorProfile.confidence}
          </span>
        </div>
        <ChevronDownIcon className={`${styles.chevron} ${isExpanded ? styles.open : ""}`} />
      </div>

      {isExpanded && (
        <div className={styles.content}>
          {/* Dominant Colors */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {lang.prompt.result.colorProfile.dominantColors}
            </div>
            <div className={styles.colorPalette}>
              {profile.dominantColors.map((color, index) => (
                <div key={index} className={styles.colorSwatch}>
                  <div
                    className={styles.colorBox}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.semanticName || color.name} - ${color.usage}`}
                  />
                  <span className={styles.colorName}>
                    {color.semanticName || color.name}
                  </span>
                  {color.moods && color.moods.length > 0 && (
                    <div className={styles.colorMoods}>
                      {color.moods.map((mood, i) => (
                        <span key={i} className={styles.moodTag}>{mood}</span>
                      ))}
                    </div>
                  )}
                  <details className={styles.technicalDetails}>
                    <summary>Technical</summary>
                    <span className={styles.colorHex}>{color.hex}</span>
                    {color.confidence && (
                      <span className={styles.confidence}>
                        Match: {Math.round(color.confidence * 100)}%
                      </span>
                    )}
                  </details>
                  <span className={styles.colorUsage}>{color.usage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temperature & Contrast Grid */}
          <div className={styles.infoGrid}>
            {/* Color Temperature */}
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <ThermometerIcon size={12} />
                {" "}{lang.prompt.result.colorProfile.temperature}
              </div>
              <div className={styles.infoValue}>
                <span className={`${styles.tempBadge} ${getTemperatureClass(profile.colorTemperature.category)}`}>
                  {profile.colorTemperature.category} ({profile.colorTemperature.kelvinEstimate}K)
                </span>
              </div>
              <div className={styles.infoDesc}>
                {profile.colorTemperature.description}
              </div>
            </div>

            {/* Contrast */}
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <SunDimIcon size={12} />
                {" "}{lang.prompt.result.colorProfile.contrast}
              </div>
              <div className={styles.infoValue}>
                <span className={`${styles.contrastBadge} ${getContrastClass(profile.contrast.level)}`}>
                  {profile.contrast.level}
                </span>
              </div>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <strong>Style:</strong> {profile.contrast.style}
                </div>
                <div className={styles.detailItem}>
                  <strong>Black:</strong> {profile.contrast.blackPoint}
                </div>
                <div className={styles.detailItem}>
                  <strong>White:</strong> {profile.contrast.whitePoint}
                </div>
              </div>
            </div>

            {/* Film Stock */}
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <FilmIcon size={12} />
                {" "}{lang.prompt.result.colorProfile.filmStock}
              </div>
              <div className={styles.infoValue}>
                <span className={styles.filmStockPill}>
                  {profile.filmStock.suggested}
                </span>
              </div>
              <div className={styles.infoDesc}>
                {profile.filmStock.characteristics}
              </div>
              {profile.filmStock.digitalProfile && (
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <strong>Digital:</strong> {profile.filmStock.digitalProfile}
                  </div>
                </div>
              )}
            </div>

            {/* Shadows & Highlights */}
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <SparklesIcon size={12} />
                {" "}{lang.prompt.result.colorProfile.shadowsHighlights}
              </div>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <strong>Shadows:</strong> {profile.shadows.color}, {profile.shadows.density} density, {profile.shadows.falloff} falloff
                </div>
                <div className={styles.detailItem}>
                  <strong>Highlights:</strong> {profile.highlights.color}, {profile.highlights.handling}
                  {profile.highlights.bloom && " (with bloom)"}
                </div>
              </div>
            </div>
          </div>

          {/* Mood & Atmosphere */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <HeartIcon size={12} />
              {" "}{lang.prompt.result.colorProfile.mood}
            </div>
            <div className={styles.moodGrid}>
              <div className={styles.moodTag}>
                <strong>Primary:</strong> {profile.mood.primary}
              </div>
              <div className={styles.moodTag}>
                <strong>Atmosphere:</strong> {profile.mood.atmosphere}
              </div>
              <div className={styles.moodTag}>
                <strong>Emotion:</strong> {profile.mood.emotionalTone}
              </div>
            </div>
          </div>

          {/* Grain & Post-Processing */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                {lang.prompt.result.colorProfile.grain}
              </div>
              <div className={styles.infoValue}>
                <span className={styles.contrastBadge}>
                  {profile.grain.amount}
                </span>
              </div>
              {profile.grain.amount !== "none" && (
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <strong>Type:</strong> {profile.grain.type}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Pattern:</strong> {profile.grain.pattern}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                {lang.prompt.result.colorProfile.postProcessing}
              </div>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <strong>Grade:</strong> {profile.postProcessing.colorGrade}
                </div>
                <div className={styles.detailItem}>
                  <strong>Saturation:</strong> {profile.postProcessing.saturation}
                </div>
                <div className={styles.detailItem}>
                  <strong>Vignette:</strong> {profile.postProcessing.vignettePresent ? "Yes" : "No"}
                </div>
                {profile.postProcessing.splitToning && (
                  <div className={styles.detailItem}>
                    <strong>Split-tone:</strong> {profile.postProcessing.splitToning.shadows} / {profile.postProcessing.splitToning.highlights}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Color Psychology */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {lang.prompt.result.colorProfile.colorPsychology || "Color Psychology"}
            </div>
            <div className={styles.psychologyGrid}>
              {profile.dominantColors
                .filter(c => c.psychologyNotes)
                .map((color, i) => (
                  <div key={i} className={styles.psychologyCard}>
                    <div
                      className={styles.colorDot}
                      style={{ background: color.hex }}
                    />
                    <strong>{color.semanticName || color.name}</strong>
                    <p className={styles.psychologyNote}>
                      {color.psychologyNotes}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
