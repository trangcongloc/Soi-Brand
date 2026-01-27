"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/lang";
import { Scene, CharacterRegistry, getCharacterDescription } from "@/lib/veo";
import styles from "./VeoCharacterPanel.module.css";

interface VeoCharacterPanelProps {
  characterRegistry: CharacterRegistry;
  scenes: Scene[];
}

function VeoCharacterPanel({ characterRegistry, scenes }: VeoCharacterPanelProps) {
  const lang = useLang();

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
        <p>{lang.veo.result.characterCard.noCharacters}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {characters.map(([name, charData], index) => (
        <motion.div
          key={name}
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className={styles.header}>
            <div className={styles.avatar}>
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
            </div>
            <div className={styles.info}>
              <h3 className={styles.name}>{name}</h3>
              <span className={styles.appearances}>
                {characterStats[name]} {lang.veo.result.characterCard.appearances}
              </span>
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <h4 className={styles.descriptionLabel}>
              {lang.veo.result.characterCard.description}
            </h4>
            <p className={styles.description}>{getCharacterDescription(charData)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default memo(VeoCharacterPanel);
