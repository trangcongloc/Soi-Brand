"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { logger } from "@/lib/logger";
import { Scene } from "@/lib/prompt";
import { UI_COPY_STATUS_TIMEOUT_MS } from "@/lib/ui-config";
import { findNearestCinematicColor } from "@/lib/prompt/colorMapper";
import styles from "./PromptSceneCard.module.css";

// Helper functions for semantic color descriptions
function getColorSemantic(hex: string): string {
  const match = findNearestCinematicColor(hex);
  return match.semanticName;
}

function getSemanticPaletteName(palette: string): string {
  const paletteDescriptions: Record<string, string> = {
    "teal-orange": "Hollywood blockbuster (epic, dynamic)",
    "warm-orange": "Warm intimacy (nostalgic, comforting)",
    "cool-blue": "Cool mystery (professional, modern)",
    "desaturated": "Muted drama (serious, cinematic)",
    "vibrant": "Bold energy (colorful, vibrant)",
    "pastel": "Soft dream (delicate, gentle)",
    "noir": "Classic noir (dramatic, stark)"
  };
  return paletteDescriptions[palette] || palette;
}

interface VeoSceneCardProps {
  scene: Scene;
  index: number;
}

function VeoSceneCard({ scene, index }: VeoSceneCardProps) {
  const lang = useLang();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(scene.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), UI_COPY_STATUS_TIMEOUT_MS);
    } catch (err) {
      logger.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.sceneNumber}>Scene {index + 1}</span>
        <button
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
        >
{expanded ? lang.prompt.result.sceneCard.collapse : lang.prompt.result.sceneCard.expand}
          <svg
            className={`${styles.chevron} ${expanded ? styles.open : ""}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Description (always visible) */}
      <p className={styles.description}>{scene.description}</p>

      {/* Character (if present) */}
      {scene.character && scene.character.toLowerCase() !== "none" && (
        <div className={styles.characterBadge}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{scene.character.split("-")[0].trim()}</span>
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.details}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Object */}
            {scene.object && (
              <div className={styles.detailSection}>
                <h4>{lang.prompt.result.sceneCard.object}</h4>
                <p>{scene.object}</p>
              </div>
            )}

            {/* Full Character */}
            {scene.character && scene.character.toLowerCase() !== "none" && (
              <div className={styles.detailSection}>
                <h4>{lang.prompt.result.sceneCard.character}</h4>
                <p className={styles.characterFull}>{scene.character}</p>
              </div>
            )}

            {/* Visual Specs */}
            {scene.visual_specs && (
              <div className={styles.detailSection}>
                <h4>{lang.prompt.result.sceneCard.visualSpecs}</h4>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.primarySubject}</span>
                    <span>{scene.visual_specs.primary_subject}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.environment}</span>
                    <span>{scene.visual_specs.environment}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.keyDetails}</span>
                    <span>{scene.visual_specs.key_details}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lighting */}
            {scene.lighting && (
              <div className={styles.detailSection}>
                <h4>{lang.prompt.result.sceneCard.lighting}</h4>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.mood}</span>
                    <span>{scene.lighting.mood}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.source}</span>
                    <span>{scene.lighting.source}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.shadows}</span>
                    <span>{scene.lighting.shadows}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Composition */}
            {scene.composition && (
              <div className={styles.detailSection}>
                <h4>{lang.prompt.result.sceneCard.composition}</h4>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.angle}</span>
                    <span>{scene.composition.angle}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.framing}</span>
                    <span>{scene.composition.framing}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.prompt.result.sceneCard.focus}</span>
                    <span>{scene.composition.focus}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Style (collapsible) */}
            {scene.style && (
              <details className={styles.styleDetails}>
                <summary>{lang.prompt.result.sceneCard.style}</summary>
                <div className={styles.styleGrid}>
                  {Object.entries(scene.style).map(([key, value]) => (
                    <div key={key} className={styles.styleItem}>
                      <span className={styles.specLabel}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* VEO 3: Audio System */}
            {scene.audio && (
              <details className={styles.styleDetails}>
                <summary>{lang.prompt.result.sceneCard.audio || "Audio"}</summary>
                <div className={styles.specGrid}>
                  {scene.audio.environmental && (
                    <div>
                      <span className={styles.specLabel}>
                        {lang.prompt.result.sceneCard.audioAmbient || "Ambient"}
                      </span>
                      <span>{scene.audio.environmental.ambiance}</span>
                    </div>
                  )}
                  {scene.audio.music && (
                    <div>
                      <span className={styles.specLabel}>
                        {lang.prompt.result.sceneCard.audioMusic || "Music"}
                      </span>
                      <span>{scene.audio.music.mood} {scene.audio.music.genre || ""}</span>
                    </div>
                  )}
                  {scene.audio.soundEffects && scene.audio.soundEffects.length > 0 && (
                    <div>
                      <span className={styles.specLabel}>
                        {lang.prompt.result.sceneCard.audioSFX || "Sound FX"}
                      </span>
                      <span>{scene.audio.soundEffects.map(s => s.sound).join(", ")}</span>
                    </div>
                  )}
                  {scene.audio.negations && scene.audio.negations.length > 0 && (
                    <div>
                      <span className={styles.specLabel}>
                        {lang.prompt.result.sceneCard.audioNegations || "Prevent"}
                      </span>
                      <span>{scene.audio.negations.join(", ")}</span>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* VEO 3: Dialogue System */}
            {scene.dialogue && scene.dialogue.length > 0 && (
              <details className={styles.styleDetails}>
                <summary>{lang.prompt.result.sceneCard.dialogue || "Dialogue"}</summary>
                <div className={styles.specGrid}>
                  {scene.dialogue.map((d, idx) => (
                    <div key={idx}>
                      <span className={styles.specLabel}>{d.character}</span>
                      <span>&quot;{d.line}&quot; {d.delivery ? `(${d.delivery})` : ""}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* VEO 3: Enhanced Camera */}
            {scene.enhancedCamera && (
              <details className={styles.styleDetails}>
                <summary>{lang.prompt.result.sceneCard.cameraPosition || "Camera Position"}</summary>
                <div className={styles.specGrid}>
                  {scene.enhancedCamera.position && (
                    <div>
                      <span className={styles.specLabel}>Position</span>
                      <span>{scene.enhancedCamera.position}</span>
                    </div>
                  )}
                  {scene.enhancedCamera.height && (
                    <div>
                      <span className={styles.specLabel}>Height</span>
                      <span>{scene.enhancedCamera.height}</span>
                    </div>
                  )}
                  {scene.enhancedCamera.distance && (
                    <div>
                      <span className={styles.specLabel}>Distance</span>
                      <span>{scene.enhancedCamera.distance}</span>
                    </div>
                  )}
                  {scene.enhancedCamera.positionPhrase && (
                    <div>
                      <span className={styles.specLabel}>VEO 3 Phrase</span>
                      <span style={{ fontStyle: "italic", fontSize: "var(--fs-xs)" }}>
                        {scene.enhancedCamera.positionPhrase}
                      </span>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* VEO 3: Expression Control */}
            {scene.expressionControl && (
              <details className={styles.styleDetails}>
                <summary>{lang.prompt.result.sceneCard.expression || "Expression"}</summary>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>Primary</span>
                    <span>{scene.expressionControl.primary}</span>
                  </div>
                  {scene.expressionControl.eyeMovement && (
                    <div>
                      <span className={styles.specLabel}>Eyes</span>
                      <span>
                        {scene.expressionControl.eyeMovement.direction || ""}{" "}
                        {scene.expressionControl.eyeMovement.behavior || ""}
                      </span>
                    </div>
                  )}
                  {scene.expressionControl.bodyLanguage && (
                    <div>
                      <span className={styles.specLabel}>Body</span>
                      <span>
                        {scene.expressionControl.bodyLanguage.posture || ""}{" "}
                        {scene.expressionControl.bodyLanguage.gesture || ""}
                      </span>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* VEO 3: Emotional Arc */}
            {scene.emotionalArc && (
              <details className={styles.styleDetails}>
                <summary>{lang.prompt.result.sceneCard.emotionalArc || "Emotional Arc"}</summary>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>Start</span>
                    <span>{scene.emotionalArc.startState}</span>
                  </div>
                  {scene.emotionalArc.middleState && (
                    <div>
                      <span className={styles.specLabel}>Middle</span>
                      <span>{scene.emotionalArc.middleState}</span>
                    </div>
                  )}
                  <div>
                    <span className={styles.specLabel}>End</span>
                    <span>{scene.emotionalArc.endState}</span>
                  </div>
                  {scene.emotionalArc.transitionType && (
                    <div>
                      <span className={styles.specLabel}>Transition</span>
                      <span>{scene.emotionalArc.transitionType}</span>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* VEO 3: Advanced Composition */}
            {(scene.lensEffects || scene.colorGrading || scene.advancedLighting) && (
              <details className={styles.styleDetails}>
                <summary>{lang.prompt.result.sceneCard.advancedComposition || "Advanced Composition"}</summary>
                <div className={styles.specGrid}>
                  {scene.lensEffects && (
                    <>
                      {scene.lensEffects.type && (
                        <div>
                          <span className={styles.specLabel}>Lens</span>
                          <span>{scene.lensEffects.type}</span>
                        </div>
                      )}
                      {scene.lensEffects.depthOfField && (
                        <div>
                          <span className={styles.specLabel}>DOF</span>
                          <span>{scene.lensEffects.depthOfField}</span>
                        </div>
                      )}
                      {scene.lensEffects.aperture && (
                        <div>
                          <span className={styles.specLabel}>Aperture</span>
                          <span>{scene.lensEffects.aperture}</span>
                        </div>
                      )}
                    </>
                  )}
                  {scene.colorGrading && (
                    <>
                      {scene.colorGrading.palette && (
                        <div>
                          <span className={styles.specLabel}>Palette</span>
                          <span>{getSemanticPaletteName(scene.colorGrading.palette)}</span>
                        </div>
                      )}
                      {scene.colorGrading.filmEmulation && (
                        <div>
                          <span className={styles.specLabel}>Film</span>
                          <span>{scene.colorGrading.filmEmulation}</span>
                        </div>
                      )}
                      {(scene.colorGrading.shadowColor || scene.colorGrading.highlightColor) && (
                        <div>
                          <span className={styles.specLabel}>Split-tone</span>
                          <span>
                            {scene.colorGrading.shadowColor &&
                              `${getColorSemantic(scene.colorGrading.shadowColor)} shadows`}
                            {scene.colorGrading.shadowColor && scene.colorGrading.highlightColor && " / "}
                            {scene.colorGrading.highlightColor &&
                              `${getColorSemantic(scene.colorGrading.highlightColor)} highlights`}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {scene.advancedLighting && (
                    <>
                      {scene.advancedLighting.setup && (
                        <div>
                          <span className={styles.specLabel}>Lighting</span>
                          <span>{scene.advancedLighting.setup}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>
            )}

            {/* VEO 3: Shot Size */}
            {scene.shotSize && (
              <div className={styles.detailSection}>
                <h4>{lang.prompt.result.sceneCard.shotSize || "Shot Size"}</h4>
                <p>{scene.shotSize}</p>
              </div>
            )}

            {/* VEO 3: Movement Quality */}
            {scene.movementQuality && (
              <div className={styles.detailSection}>
                <h4>{lang.prompt.result.sceneCard.movementQuality || "Movement"}</h4>
                <p>{scene.movementQuality}</p>
              </div>
            )}

            {/* VEO 3: Quality Score */}
            {scene.qualityScore && (
              <details className={styles.styleDetails}>
                <summary>
                  {lang.prompt.result.sceneCard.qualityScore || "Quality Score"}: {scene.qualityScore.overallScore}/100
                </summary>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>Level</span>
                    <span style={{ textTransform: "capitalize" }}>{scene.qualityScore.level}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>Success Rate</span>
                    <span>{scene.qualityScore.generationSuccessRate}%</span>
                  </div>
                  {scene.qualityScore.optimizationSuggestions && scene.qualityScore.optimizationSuggestions.length > 0 && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span className={styles.specLabel}>Suggestions</span>
                      <ul style={{ margin: "4px 0", paddingLeft: "16px", fontSize: "var(--fs-xs)" }}>
                        {scene.qualityScore.optimizationSuggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Prompt */}
            <div className={styles.promptSection}>
              <div className={styles.promptHeader}>
                <h4>{lang.prompt.result.sceneCard.prompt}</h4>
                <button
                  className={styles.copyButton}
                  onClick={handleCopyPrompt}
                >
                  {copied ? (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {lang.prompt.result.sceneCard.copied}
                    </>
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {lang.prompt.result.sceneCard.copyPrompt}
                    </>
                  )}
                </button>
              </div>
              <p className={styles.prompt}>{scene.prompt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(VeoSceneCard);
