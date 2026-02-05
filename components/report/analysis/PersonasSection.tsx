"use client";

import { ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";

interface PersonasSectionProps {
    report_part_2: ReportPart2;
}

const PersonasSection: React.FC<PersonasSectionProps> = ({ report_part_2 }) => {
    const lang = useLang();

    if (!report_part_2.audience_personas || report_part_2.audience_personas.length === 0) {
        return null;
    }

    return (
        <section id="section-personas">
            <h3 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {lang.analysis.audiencePersonas.title}
            </h3>
            <div className={styles.grid2}>
                {report_part_2.audience_personas.map(
                    (persona, idx) => (
                        <div key={idx} className={styles.card}>
                            <h4
                                className={styles.cardTitle}
                                style={{ color: "#6366f1" }}
                            >
                                {persona.name}
                            </h4>
                            {persona.avatar_description && (
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: "#666",
                                        marginBottom: "0.75rem",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {persona.avatar_description}
                                </p>
                            )}
                            <div
                                style={{
                                    fontSize: "11px",
                                    lineHeight: "1.6",
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr",
                                        gap: "0.25rem 1rem",
                                        marginBottom: "0.75rem",
                                    }}
                                >
                                    {persona.age_range && (
                                        <p>
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .ageRange
                                                }
                                            </strong>{" "}
                                            {persona.age_range}
                                        </p>
                                    )}
                                    {persona.gender && (
                                        <p>
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .gender
                                                }
                                            </strong>{" "}
                                            {persona.gender}
                                        </p>
                                    )}
                                    {persona.location && (
                                        <p>
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .location
                                                }
                                            </strong>{" "}
                                            {persona.location}
                                        </p>
                                    )}
                                    {persona.occupation && (
                                        <p>
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .occupation
                                                }
                                            </strong>{" "}
                                            {persona.occupation}
                                        </p>
                                    )}
                                    {persona.viewing_frequency && (
                                        <p>
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .viewingFrequency
                                                }
                                            </strong>{" "}
                                            {
                                                persona.viewing_frequency
                                            }
                                        </p>
                                    )}
                                </div>
                                <p
                                    style={{
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    <strong>
                                        {
                                            lang.analysis
                                                .audiencePersonas
                                                .interests
                                        }
                                    </strong>{" "}
                                    {persona.interests?.join(", ")}
                                </p>
                                <p
                                    style={{
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    <strong>
                                        {
                                            lang.analysis
                                                .audiencePersonas
                                                .painPoints
                                        }
                                    </strong>{" "}
                                    {persona.pain_points?.join(
                                        ", "
                                    )}
                                </p>
                                {persona.goals &&
                                    persona.goals.length > 0 && (
                                        <p
                                            style={{
                                                marginBottom:
                                                    "0.5rem",
                                            }}
                                        >
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .goals
                                                }
                                            </strong>{" "}
                                            {persona.goals.join(
                                                ", "
                                            )}
                                        </p>
                                    )}
                                <p
                                    style={{
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    <strong>
                                        {
                                            lang.analysis
                                                .audiencePersonas
                                                .contentPreferences
                                        }
                                    </strong>{" "}
                                    {persona.content_preferences}
                                </p>
                                {persona.preferred_video_length && (
                                    <p
                                        style={{
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        <strong>
                                            {
                                                lang.analysis
                                                    .audiencePersonas
                                                    .preferredVideoLength
                                            }
                                        </strong>{" "}
                                        {
                                            persona.preferred_video_length
                                        }
                                    </p>
                                )}
                                {persona.social_platforms &&
                                    persona.social_platforms
                                        .length > 0 && (
                                        <p
                                            style={{
                                                marginBottom:
                                                    "0.5rem",
                                            }}
                                        >
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .socialPlatforms
                                                }
                                            </strong>{" "}
                                            {persona.social_platforms.join(
                                                ", "
                                            )}
                                        </p>
                                    )}
                                {persona.buying_triggers &&
                                    persona.buying_triggers.length >
                                        0 && (
                                        <p
                                            style={{
                                                marginBottom: 0,
                                            }}
                                        >
                                            <strong>
                                                {
                                                    lang.analysis
                                                        .audiencePersonas
                                                        .buyingTriggers
                                                }
                                            </strong>{" "}
                                            {persona.buying_triggers.join(
                                                ", "
                                            )}
                                        </p>
                                    )}
                            </div>
                        </div>
                    )
                )}
            </div>
        </section>
    );
};

export default PersonasSection;
