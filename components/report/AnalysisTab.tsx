import React from "react";
import dynamic from "next/dynamic";
import { Post, ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, useLanguage } from "@/lib/lang";

const VideoPerformanceChart = dynamic(
    () => import("@/components/VideoPerformanceChart"),
    {
        ssr: false,
        loading: () => (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                Loading chart...
            </div>
        ),
    }
);

interface AnalysisTabProps {
    report_part_2: ReportPart2;
    posts: Post[];
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ report_part_2, posts }) => {
    const lang = useLang();
    const { langCode } = useLanguage();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Strategy Analysis Section */}
            <section>
                <h3 className={styles.sectionTitle}>{lang.analysis.strategyTitle}</h3>
                <div className={styles.grid2}>
                    {/* Brand Identity */}
                    <div className={styles.card}>
                        <h4 className={styles.cardTitle}>{lang.analysis.brandIdentity.title}</h4>
                        <div className={styles.analysisText}>
                            <p>
                                <span className="font-semibold">{lang.analysis.brandIdentity.style}</span>{" "}
                                {report_part_2.strategy_analysis.brand_identity.visual_style}
                            </p>
                            <p>
                                <span className="font-semibold">{lang.analysis.brandIdentity.tone}</span>{" "}
                                {report_part_2.strategy_analysis.brand_identity.tone_of_voice}
                            </p>
                            <p>
                                <span className="font-semibold">{lang.analysis.brandIdentity.positioning}</span>{" "}
                                {report_part_2.strategy_analysis.brand_identity.brand_positioning}
                            </p>
                        </div>
                    </div>

                    {/* Content Focus */}
                    <div className={styles.card}>
                        <h4 className={styles.cardTitle}>{lang.analysis.contentFocus.title}</h4>
                        <p className={`${styles.analysisText} ${styles.mutedText}`}>
                            {report_part_2.strategy_analysis.content_focus?.overview || lang.analysis.contentFocus.noData}
                        </p>
                        <div className={styles.adAngles}>
                            {report_part_2.strategy_analysis.content_focus?.topics?.map((topic, i) => (
                                <span key={i} className={styles.angleTag}>{topic}</span>
                            ))}
                        </div>
                    </div>

                    {/* Content Niche Analysis */}
                    {report_part_2.content_niche_analysis && (
                        <div className={styles.card} style={{ marginTop: "1rem" }}>
                            <h4 className={styles.cardTitle}>{lang.analysis.contentNicheAnalysis.title}</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <span className={styles.statLabel}>{lang.analysis.contentNicheAnalysis.primaryNiche}</span>
                                    <span style={{ marginLeft: "0.5rem", fontWeight: "600", color: "#e53935" }}>
                                        {report_part_2.content_niche_analysis.primary_niche}
                                    </span>
                                </div>
                                {report_part_2.content_niche_analysis.sub_niches?.length > 0 && (
                                    <div>
                                        <span className={styles.statLabel}>{lang.analysis.contentNicheAnalysis.subNiches}</span>
                                        <div className={styles.adAngles} style={{ marginTop: "0.5rem" }}>
                                            {report_part_2.content_niche_analysis.sub_niches.map((niche, i) => (
                                                <span key={i} className={styles.angleTag}>{niche}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {report_part_2.content_niche_analysis.content_categories?.length > 0 && (
                                    <div>
                                        <span className={styles.statLabel}>{lang.analysis.contentNicheAnalysis.contentCategories}</span>
                                        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                            {report_part_2.content_niche_analysis.content_categories.map((cat, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    <div style={{ width: "60px", height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                                                        <div style={{ width: `${cat.percentage}%`, height: "100%", background: i === 0 ? "#e53935" : i === 1 ? "#ff7043" : "#ffab91", borderRadius: "4px" }}></div>
                                                    </div>
                                                    <span style={{ fontSize: "11px", fontWeight: "600", minWidth: "35px" }}>{cat.percentage}%</span>
                                                    <span style={{ fontSize: "12px", color: "#333" }}>{cat.category}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div style={{ borderTop: "1px solid #eee", paddingTop: "0.75rem" }}>
                                    <p className={`${styles.analysisText} ${styles.mutedText}`} style={{ marginBottom: "0.5rem" }}>
                                        <strong>{lang.analysis.contentNicheAnalysis.nichePositioning}</strong> {report_part_2.content_niche_analysis.niche_positioning}
                                    </p>
                                    <p className={`${styles.analysisText} ${styles.mutedText}`} style={{ marginBottom: "0.5rem" }}>
                                        <strong>{lang.analysis.contentNicheAnalysis.competitorLandscape}</strong> {report_part_2.content_niche_analysis.competitor_landscape}
                                    </p>
                                    <p className={`${styles.analysisText} ${styles.mutedText}`}>
                                        <strong>{lang.analysis.contentNicheAnalysis.contentUniqueness}</strong> {report_part_2.content_niche_analysis.content_uniqueness}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Ad Strategy */}
                <div style={{ marginTop: "1rem" }}>
                    <div className={styles.card}>
                        <h4 className={styles.cardTitle}>{lang.analysis.adStrategy.title}</h4>
                        <p className={`${styles.analysisText} ${styles.mutedText}`}>{report_part_2.ad_strategy.overview}</p>
                        <div className={styles.adAngles}>
                            {report_part_2.ad_strategy.ad_angles.map((angle, i) => (
                                <span key={i} className={styles.angleTag}>{angle}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Funnel Analysis */}
            <section>
                <h3 className={styles.sectionTitle}>{lang.analysis.funnelAnalysis.title}</h3>
                <div style={{ marginTop: "1rem" }}>
                    <div className={styles.card}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {/* TOFU */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "0.25rem 0.5rem", background: "#3b82f6", color: "white", borderRadius: "0.25rem" }}>TOFU</span>
                                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#666" }}>{lang.analysis.funnelAnalysis.tofu}</span>
                                </div>
                                <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#444" }}>{report_part_2.funnel_analysis.tofu}</p>
                            </div>
                            {/* MOFU */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "0.25rem 0.5rem", background: "#f59e0b", color: "white", borderRadius: "0.25rem" }}>MOFU</span>
                                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#666" }}>{lang.analysis.funnelAnalysis.mofu}</span>
                                </div>
                                <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#444" }}>{report_part_2.funnel_analysis.mofu}</p>
                            </div>
                            {/* BOFU */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "0.25rem 0.5rem", background: "#10b981", color: "white", borderRadius: "0.25rem" }}>BOFU</span>
                                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#666" }}>{lang.analysis.funnelAnalysis.bofu}</span>
                                </div>
                                <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#444" }}>{report_part_2.funnel_analysis.bofu}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Video Performance Chart */}
            {posts.length > 0 && (
                <section>
                    <h3 className={styles.sectionTitle}>{langCode === "vi" ? "Hiệu suất Video" : "Video Performance"}</h3>
                    <div className={styles.card} style={{ marginTop: "1rem" }}>
                        <VideoPerformanceChart posts={posts} maxItems={50} />
                    </div>
                </section>
            )}

            {/* Content Pillars */}
            <section>
                <h3 className={styles.sectionTitle}>{lang.analysis.contentPillars.title}</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                    {report_part_2.strategy_analysis.content_pillars.map((pillar, idx) => (
                        <div key={idx} className={styles.pillarCard}>
                            <div className={styles.pillarHeader}>
                                <span className={styles.pillarIndex}>{idx + 1}</span>
                                <h4 className={styles.pillarTitle}>{pillar.pillar}</h4>
                            </div>
                            <p className={styles.pillarDesc}>{pillar.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Audience Analysis */}
            {report_part_2.audience_analysis && (
                <section>
                    <h3 className={styles.sectionTitle}>{lang.analysis.audienceAnalysis.title}</h3>
                    <div className={styles.grid2}>
                        {/* Demographics */}
                        <div className={styles.card}>
                            <h4 className={styles.cardTitle}>{lang.analysis.audienceAnalysis.demographicsTitle}</h4>
                            <div style={{ fontSize: "11px", lineHeight: "1.8" }}>
                                {report_part_2.audience_analysis.demographics?.age_distribution && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <strong>{lang.analysis.audienceAnalysis.ageDistribution}</strong>
                                        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                            {report_part_2.audience_analysis.demographics.age_distribution.map((age, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <span style={{ minWidth: "50px", fontSize: "10px" }}>{age.range}</span>
                                                    <div style={{ flex: 1, height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                                                        <div style={{ width: `${age.percentage}%`, height: "100%", background: "#e53935", borderRadius: "3px" }}></div>
                                                    </div>
                                                    <span style={{ minWidth: "30px", fontSize: "10px", textAlign: "right" }}>{age.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {report_part_2.audience_analysis.demographics?.gender_split && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <strong>{lang.analysis.audienceAnalysis.genderSplit}</strong>
                                        <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
                                            <span style={{ color: "#3b82f6" }}>{lang.analysis.audienceAnalysis.male}: {report_part_2.audience_analysis.demographics.gender_split.male}%</span>
                                            <span style={{ color: "#ec4899" }}>{lang.analysis.audienceAnalysis.female}: {report_part_2.audience_analysis.demographics.gender_split.female}%</span>
                                            {report_part_2.audience_analysis.demographics.gender_split.other > 0 && (
                                                <span style={{ color: "#8b5cf6" }}>{lang.analysis.audienceAnalysis.other}: {report_part_2.audience_analysis.demographics.gender_split.other}%</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {report_part_2.audience_analysis.demographics?.top_countries && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <strong>{lang.analysis.audienceAnalysis.topCountries}</strong>
                                        <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                            {report_part_2.audience_analysis.demographics.top_countries.map((country, i) => (
                                                <span key={i} className={styles.angleTag}>{country.country} ({country.percentage}%)</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <p><strong>{lang.analysis.audienceAnalysis.primaryLanguages}</strong> {report_part_2.audience_analysis.demographics?.primary_languages?.join(", ")}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.incomeLevel}</strong> {report_part_2.audience_analysis.demographics?.income_level}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.educationLevel}</strong> {report_part_2.audience_analysis.demographics?.education_level}</p>
                            </div>
                        </div>
                        {/* Behavior */}
                        <div className={styles.card}>
                            <h4 className={styles.cardTitle}>{lang.analysis.audienceAnalysis.behaviorTitle}</h4>
                            <div style={{ fontSize: "11px", lineHeight: "1.8" }}>
                                <p><strong>{lang.analysis.audienceAnalysis.estimatedWatchTime}</strong> {report_part_2.audience_analysis.behavior?.estimated_watch_time}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.returningVsNew}</strong> {report_part_2.audience_analysis.behavior?.returning_vs_new_ratio}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.subscriberGrowth}</strong> {report_part_2.audience_analysis.behavior?.subscriber_growth_trend}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.peakViewingDays}</strong> {report_part_2.audience_analysis.behavior?.peak_viewing_days?.join(", ")}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.peakViewingHours}</strong> {report_part_2.audience_analysis.behavior?.peak_viewing_hours?.join(", ")}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.engagementPatterns}</strong> {report_part_2.audience_analysis.behavior?.engagement_patterns}</p>
                                <p><strong>{lang.analysis.audienceAnalysis.devicePreferences}</strong> {report_part_2.audience_analysis.behavior?.device_preferences}</p>
                                {report_part_2.audience_analysis.psychographics && (
                                    <div style={{ marginTop: "1rem", borderTop: "1px solid #eee", paddingTop: "0.75rem" }}>
                                        <strong>{lang.analysis.audienceAnalysis.psychographicsTitle}</strong>
                                        <p style={{ marginTop: "0.5rem" }}><strong>{lang.analysis.audienceAnalysis.values}</strong> {report_part_2.audience_analysis.psychographics.values?.join(", ")}</p>
                                        <p><strong>{lang.analysis.audienceAnalysis.lifestyle}</strong> {report_part_2.audience_analysis.psychographics.lifestyle}</p>
                                        <p><strong>{lang.analysis.audienceAnalysis.purchaseBehavior}</strong> {report_part_2.audience_analysis.psychographics.purchase_behavior}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Audience Personas */}
            {report_part_2.audience_personas && report_part_2.audience_personas.length > 0 && (
                <section>
                    <h3 className={styles.sectionTitle}>{lang.analysis.audiencePersonas.title}</h3>
                    <div className={styles.grid2}>
                        {report_part_2.audience_personas.map((persona, idx) => (
                            <div key={idx} className={styles.card}>
                                <h4 className={styles.cardTitle} style={{ color: "#6366f1" }}>{persona.name}</h4>
                                {persona.avatar_description && (
                                    <p style={{ fontSize: "11px", color: "#666", marginBottom: "0.75rem", fontStyle: "italic" }}>{persona.avatar_description}</p>
                                )}
                                <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 1rem", marginBottom: "0.75rem" }}>
                                        {persona.age_range && <p><strong>{lang.analysis.audiencePersonas.ageRange}</strong> {persona.age_range}</p>}
                                        {persona.gender && <p><strong>{lang.analysis.audiencePersonas.gender}</strong> {persona.gender}</p>}
                                        {persona.location && <p><strong>{lang.analysis.audiencePersonas.location}</strong> {persona.location}</p>}
                                        {persona.occupation && <p><strong>{lang.analysis.audiencePersonas.occupation}</strong> {persona.occupation}</p>}
                                        {persona.viewing_frequency && <p><strong>{lang.analysis.audiencePersonas.viewingFrequency}</strong> {persona.viewing_frequency}</p>}
                                    </div>
                                    <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.audiencePersonas.interests}</strong> {persona.interests?.join(", ")}</p>
                                    <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.audiencePersonas.painPoints}</strong> {persona.pain_points?.join(", ")}</p>
                                    {persona.goals && persona.goals.length > 0 && (
                                        <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.audiencePersonas.goals}</strong> {persona.goals.join(", ")}</p>
                                    )}
                                    <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.audiencePersonas.contentPreferences}</strong> {persona.content_preferences}</p>
                                    {persona.preferred_video_length && (
                                        <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.audiencePersonas.preferredVideoLength}</strong> {persona.preferred_video_length}</p>
                                    )}
                                    {persona.social_platforms && persona.social_platforms.length > 0 && (
                                        <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.audiencePersonas.socialPlatforms}</strong> {persona.social_platforms.join(", ")}</p>
                                    )}
                                    {persona.buying_triggers && persona.buying_triggers.length > 0 && (
                                        <p style={{ marginBottom: 0 }}><strong>{lang.analysis.audiencePersonas.buyingTriggers}</strong> {persona.buying_triggers.join(", ")}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Content Calendar */}
            {report_part_2.content_calendar && (
                <section>
                    <h3 className={styles.sectionTitle}>{lang.analysis.contentCalendar.title}</h3>
                    <div className={styles.card}>
                        <div className={styles.grid2} style={{ gap: "1rem" }}>
                            <div>
                                <p style={{ fontSize: "11px", marginBottom: "0.5rem" }}>
                                    <strong>{lang.analysis.contentCalendar.bestDays}</strong> {report_part_2.content_calendar.best_posting_days.join(", ")}
                                </p>
                                <p style={{ fontSize: "11px", marginBottom: "0.5rem" }}>
                                    <strong>{lang.analysis.contentCalendar.bestTimes}</strong> {report_part_2.content_calendar.best_posting_times.join(", ")}
                                </p>
                                <p style={{ fontSize: "11px", marginBottom: 0 }}>
                                    <strong>{lang.analysis.contentCalendar.recommendedFrequency}</strong> {report_part_2.content_calendar.recommended_frequency}
                                </p>
                            </div>
                            {report_part_2.content_calendar.content_mix && (
                                <div>
                                    <p style={{ fontSize: "11px", fontWeight: "600", marginBottom: "0.75rem" }}>{lang.analysis.contentCalendar.contentMix}:</p>
                                    {report_part_2.content_calendar.content_mix.map((mix, idx) => (
                                        <div key={idx} style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "6px", borderLeft: `3px solid ${idx === 0 ? "#e53935" : idx === 1 ? "#ff7043" : "#3b82f6"}` }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#333" }}>{mix.content_type || (mix as any).pillar}</span>
                                                <span style={{ fontSize: "11px", fontWeight: "700", color: idx === 0 ? "#e53935" : idx === 1 ? "#ff7043" : "#3b82f6" }}>{mix.percentage}%</span>
                                            </div>
                                            <div style={{ height: "4px", background: "#e5e7eb", borderRadius: "2px", overflow: "hidden", marginBottom: "0.5rem" }}>
                                                <div style={{ width: `${mix.percentage}%`, height: "100%", background: idx === 0 ? "#e53935" : idx === 1 ? "#ff7043" : "#3b82f6", borderRadius: "2px" }}></div>
                                            </div>
                                            {mix.specific_topics && mix.specific_topics.length > 0 && (
                                                <div style={{ marginTop: "0.5rem" }}>
                                                    <span style={{ fontSize: "10px", color: "#666" }}>{lang.analysis.contentCalendar.specificTopics}</span>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                                                        {mix.specific_topics.map((topic, i) => (
                                                            <span key={i} style={{ fontSize: "10px", padding: "2px 8px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px", color: "#333" }}>{topic}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {mix.example_videos && mix.example_videos.length > 0 && (
                                                <div style={{ marginTop: "0.5rem", fontSize: "10px", color: "#888" }}>
                                                    {lang.analysis.contentCalendar.exampleVideos} {mix.example_videos.join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Growth Opportunities */}
            {report_part_2.growth_opportunities && report_part_2.growth_opportunities.length > 0 && (
                <section>
                    <h3 className={styles.sectionTitle}>{lang.analysis.growthOpportunities.title}</h3>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                        {report_part_2.growth_opportunities.map((opp, idx) => (
                            <div key={idx} className={styles.card} style={{ borderLeft: `3px solid ${opp.priority === "high" ? "#ef4444" : opp.priority === "medium" ? "#f59e0b" : "#10b981"}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "9px", fontWeight: "700", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", textTransform: "uppercase", background: opp.priority === "high" ? "#fef2f2" : opp.priority === "medium" ? "#fffbeb" : "#f0fdf4", color: opp.priority === "high" ? "#ef4444" : opp.priority === "medium" ? "#f59e0b" : "#10b981" }}>{opp.priority}</span>
                                    <h4 style={{ fontSize: "12px", fontWeight: "600", margin: 0 }}>{opp.opportunity}</h4>
                                </div>
                                <p style={{ fontSize: "11px", color: "#666", marginBottom: "0.5rem" }}>{opp.description}</p>
                                <p style={{ fontSize: "10px", color: "#10b981", fontWeight: "500" }}>{opp.expected_impact}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SEO Analysis */}
            {report_part_2.seo_analysis && (
                <section>
                    <h3 className={styles.sectionTitle}>{lang.analysis.seoAnalysis.title}</h3>

                    {/* Keyword Strategy */}
                    <div className={styles.card} style={{ marginBottom: "1rem" }}>
                        <h4 className={styles.cardTitle} style={{ color: "#6366f1", marginBottom: "0.75rem" }}>{lang.analysis.seoAnalysis.keywordStrategy}</h4>
                        <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                            <p style={{ marginBottom: "0.5rem" }}>
                                <strong>{lang.analysis.seoAnalysis.topKeywords}</strong> {report_part_2.seo_analysis.keyword_strategy.top_keywords.join(", ")}
                            </p>
                            <p style={{ marginBottom: "0.5rem" }}>
                                <strong>{lang.analysis.seoAnalysis.keywordDensity}</strong> {report_part_2.seo_analysis.keyword_strategy.keyword_density}
                            </p>
                            {report_part_2.seo_analysis.keyword_strategy.missing_keywords.length > 0 && (
                                <p style={{ marginBottom: 0 }}>
                                    <strong>{lang.analysis.seoAnalysis.missingKeywords}</strong> {report_part_2.seo_analysis.keyword_strategy.missing_keywords.join(", ")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tag Analysis */}
                    <div className={styles.card} style={{ marginBottom: "1rem" }}>
                        <h4 className={styles.cardTitle} style={{ color: "#10b981", marginBottom: "0.75rem" }}>{lang.analysis.seoAnalysis.tagAnalysis}</h4>
                        <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                            <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.seoAnalysis.tagCoverage}</strong> {report_part_2.seo_analysis.tag_analysis.tag_coverage}</p>
                            <p style={{ marginBottom: "0.5rem" }}><strong>{lang.analysis.seoAnalysis.tagConsistency}</strong> {report_part_2.seo_analysis.tag_analysis.tag_consistency}</p>
                            {report_part_2.seo_analysis.tag_analysis.tag_optimization_score && (
                                <p style={{ marginBottom: "0.75rem" }}>
                                    <strong>{lang.analysis.seoAnalysis.tagOptimizationScore}</strong>{" "}
                                    <span style={{ color: "#10b981", fontWeight: "600" }}>{report_part_2.seo_analysis.tag_analysis.tag_optimization_score}</span>
                                </p>
                            )}

                            {/* All Channel Tags */}
                            {report_part_2.seo_analysis.tag_analysis.all_channel_tags && report_part_2.seo_analysis.tag_analysis.all_channel_tags.length > 0 && (
                                <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                    <strong style={{ display: "block", marginBottom: "0.5rem", color: "#166534" }}>{lang.analysis.seoAnalysis.allChannelTags}</strong>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                        {report_part_2.seo_analysis.tag_analysis.all_channel_tags.map((tag, i) => (
                                            <span key={i} style={{ fontSize: "10px", padding: "3px 8px", background: "#dcfce7", color: "#166534", borderRadius: "4px", border: "1px solid #bbf7d0" }}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Most Used Tags */}
                            {report_part_2.seo_analysis.tag_analysis.most_used_tags && report_part_2.seo_analysis.tag_analysis.most_used_tags.length > 0 && (
                                <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "6px" }}>
                                    <strong style={{ display: "block", marginBottom: "0.5rem" }}>{lang.analysis.seoAnalysis.mostUsedTags}</strong>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {report_part_2.seo_analysis.tag_analysis.most_used_tags.map((tag, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                                <span className={styles.angleTag} style={{ background: "#e0f2fe", color: "#0369a1" }}>{tag.tag}</span>
                                                <span style={{ fontSize: "10px", color: "#666" }}>{lang.analysis.seoAnalysis.tagFrequency} {tag.frequency}x</span>
                                                <span style={{ fontSize: "10px", color: "#059669" }}>{tag.performance_impact}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tag Categories */}
                            {report_part_2.seo_analysis.tag_analysis.tag_categories && report_part_2.seo_analysis.tag_analysis.tag_categories.length > 0 && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <strong style={{ display: "block", marginBottom: "0.5rem" }}>{lang.analysis.seoAnalysis.tagCategories}</strong>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        {report_part_2.seo_analysis.tag_analysis.tag_categories.map((cat, i) => (
                                            <div key={i} style={{ padding: "0.5rem", background: i % 2 === 0 ? "#fef3c7" : "#dbeafe", borderRadius: "4px" }}>
                                                <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{cat.category}</div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.25rem" }}>
                                                    {cat.tags.map((t, j) => (
                                                        <span key={j} style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(255,255,255,0.7)", borderRadius: "3px" }}>{t}</span>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: "10px", color: "#666" }}>{lang.analysis.seoAnalysis.categoryEffectiveness} {cat.effectiveness}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p style={{ marginBottom: "0.5rem" }}>
                                <strong>{lang.analysis.seoAnalysis.recommendedTags}</strong> {report_part_2.seo_analysis.tag_analysis.recommended_tags.join(", ")}
                            </p>

                            {/* Competitor Tags */}
                            {report_part_2.seo_analysis.tag_analysis.competitor_tags && report_part_2.seo_analysis.tag_analysis.competitor_tags.length > 0 && (
                                <p style={{ marginBottom: "0.5rem" }}>
                                    <strong>{lang.analysis.seoAnalysis.competitorTags}</strong>{" "}
                                    <span style={{ color: "#dc2626" }}>{report_part_2.seo_analysis.tag_analysis.competitor_tags.join(", ")}</span>
                                </p>
                            )}

                            {/* Long-tail Opportunities */}
                            {report_part_2.seo_analysis.tag_analysis.long_tail_opportunities && report_part_2.seo_analysis.tag_analysis.long_tail_opportunities.length > 0 && (
                                <p style={{ marginBottom: 0 }}>
                                    <strong>{lang.analysis.seoAnalysis.longTailOpportunities}</strong>{" "}
                                    <span style={{ color: "#7c3aed" }}>{report_part_2.seo_analysis.tag_analysis.long_tail_opportunities.join(", ")}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Optimization Opportunities */}
                    {report_part_2.seo_analysis.optimization_opportunities.length > 0 && (
                        <div>
                            <h4 className={styles.cardTitle} style={{ marginBottom: "0.75rem" }}>{lang.analysis.seoAnalysis.optimizationOpportunities}</h4>
                            <div style={{ display: "grid", gap: "0.75rem" }}>
                                {report_part_2.seo_analysis.optimization_opportunities.map((opp, idx) => (
                                    <div key={idx} className={styles.card} style={{ borderLeft: `3px solid ${opp.priority === "high" ? "#ef4444" : opp.priority === "medium" ? "#f59e0b" : "#10b981"}` }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                            <span style={{ fontSize: "9px", fontWeight: "700", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", textTransform: "uppercase", background: opp.priority === "high" ? "#fef2f2" : opp.priority === "medium" ? "#fffbeb" : "#f0fdf4", color: opp.priority === "high" ? "#ef4444" : opp.priority === "medium" ? "#f59e0b" : "#10b981" }}>{opp.priority}</span>
                                            <h5 style={{ fontSize: "12px", fontWeight: "600", margin: 0 }}>{opp.area}</h5>
                                        </div>
                                        <p style={{ fontSize: "11px", color: "#666", marginBottom: "0.25rem" }}><strong>Issue:</strong> {opp.issue}</p>
                                        <p style={{ fontSize: "11px", color: "#10b981", fontWeight: "500", marginBottom: 0 }}><strong>Recommendation:</strong> {opp.recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default AnalysisTab;
