"use client";

import { useState, useMemo } from "react";
import { Post } from "@/lib/types";
import { calculateHackerNewsScore } from "../report-utils";

export type SortOrder = "latest" | "rating";

export interface PostWithScore {
    post: Post;
    originalIndex: number;
    score: number;
}

export function usePostsSorting(posts: Post[], selectedDate: string | null) {
    const [sortOrder, setSortOrder] = useState<SortOrder>("latest");

    // Format date as yyyy-mm-dd using local timezone
    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Calculate scores for all posts
    const postsWithScores = useMemo(
        () =>
            posts.map((post, originalIndex) => ({
                post,
                originalIndex,
                score: parseFloat(
                    calculateHackerNewsScore(
                        post.statistics.play_count,
                        post.published_at
                    )
                ),
            })),
        [posts]
    );

    // Get top 10 indices for fire emoji
    const topIndices = useMemo(() => {
        const sortedByScoreOnly = [...postsWithScores].sort(
            (a, b) => b.score - a.score
        );
        return new Set(
            sortedByScoreOnly.slice(0, 10).map((item) => item.originalIndex)
        );
    }, [postsWithScores]);

    // Filter posts by selected date
    const filteredPosts = useMemo(
        () =>
            selectedDate
                ? postsWithScores.filter(({ post }) => {
                      const postDate = getLocalDateStr(
                          new Date(post.published_at)
                      );
                      return postDate === selectedDate;
                  })
                : postsWithScores,
        [selectedDate, postsWithScores]
    );

    // Sort posts based on selected order
    const sortedPosts = useMemo(
        () =>
            sortOrder === "rating"
                ? [...filteredPosts].sort((a, b) => b.score - a.score)
                : filteredPosts,
        [sortOrder, filteredPosts]
    );

    return {
        sortOrder,
        setSortOrder,
        sortedPosts,
        topIndices,
    };
}
