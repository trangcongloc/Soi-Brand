"use client";

import { useState } from "react";
import Image from "next/image";
import { ChannelInfo } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";
import { formatFullNumber, truncateText } from "../report-utils";

interface ChannelInfoCardProps {
    channelInfo: ChannelInfo;
}

export default function ChannelInfoCard({ channelInfo }: ChannelInfoCardProps) {
    const lang = useLang();
    const [isChannelHovered, setIsChannelHovered] = useState(false);

    const handleChannelClick = () => {
        if (channelInfo.channelId) {
            const channelUrl = `https://www.youtube.com/channel/${channelInfo.channelId}`;
            window.open(channelUrl, "_blank");
        }
    };

    return (
        <div className={styles.channelCard}>
            <div className={styles.channelInfoTop}>
                {channelInfo.avatar && (
                    <Image
                        src={channelInfo.avatar}
                        alt={channelInfo.nickname}
                        width={64}
                        height={64}
                        className={styles.channelAvatar}
                        unoptimized
                    />
                )}
                <div className={styles.channelTitles}>
                    <span
                        className={styles.channelNickname}
                        onMouseEnter={() => setIsChannelHovered(true)}
                        onMouseLeave={() => setIsChannelHovered(false)}
                        onClick={handleChannelClick}
                    >
                        {isChannelHovered && channelInfo.uniqueId
                            ? channelInfo.uniqueId
                            : channelInfo.nickname}
                    </span>
                    <span className={styles.channelSubscribers}>
                        {lang.channel.createdDate}{" "}
                        {channelInfo.joinedAt
                            ? new Date(channelInfo.joinedAt).toLocaleDateString(
                                  "vi-VN"
                              )
                            : lang.channel.notUpdated}
                    </span>
                </div>
            </div>

            <div className={styles.channelStatsGrid}>
                <div className={styles.channelStatCard}>
                    <span className={styles.channelStatValue}>
                        {formatFullNumber(channelInfo.stats.videoCount)}
                    </span>
                    <span className={styles.channelStatLabel}>
                        {lang.channel.stats.videos}
                    </span>
                </div>
                <div className={styles.channelStatCard}>
                    <span className={styles.channelStatValue}>
                        {formatFullNumber(channelInfo.stats.viewCount)}
                    </span>
                    <span className={styles.channelStatLabel}>
                        {lang.channel.stats.views}
                    </span>
                </div>
                <div className={styles.channelStatCard}>
                    <span className={styles.channelStatValue}>
                        {formatFullNumber(channelInfo.stats.followerCount)}
                    </span>
                    <span className={styles.channelStatLabel}>
                        {lang.channel.stats.subs}
                    </span>
                </div>
                <div className={styles.channelStatCard}>
                    <span className={styles.channelStatValue}>
                        {formatFullNumber(channelInfo.stats.heartCount)}
                    </span>
                    <span className={styles.channelStatLabel}>
                        {lang.channel.stats.likes}
                    </span>
                </div>
            </div>

            {channelInfo.signature && (
                <div className={styles.channelDescription}>
                    <p className={styles.channelDescText}>
                        {truncateText(channelInfo.signature, 150)}
                    </p>
                </div>
            )}
        </div>
    );
}
