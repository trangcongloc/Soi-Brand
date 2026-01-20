"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReportDisplay from "@/components/ReportDisplay";
import { MarketingReport } from "@/lib/types";
import { useLanguage } from "@/lib/lang";

const CURRENT_REPORT_KEY = "soibrand_current_report";

export default function ReportPage() {
    const router = useRouter();
    const { lang } = useLanguage();
    const [report, setReport] = useState<MarketingReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load report from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CURRENT_REPORT_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setReport(parsed);
            } else {
                // No report found, redirect to home
                router.replace("/");
            }
        } catch {
            // Invalid data, redirect to home
            router.replace("/");
        }
        setIsLoading(false);
    }, [router]);

    // Update document title and favicon based on report
    useEffect(() => {
        const defaultTitle = lang.metadata.title;
        let addedFaviconLink: HTMLLinkElement | null = null;

        if (report) {
            document.title = report.brand_name;

            const channelAvatar = report.report_part_1.channel_info.avatar;
            if (channelAvatar) {
                const existingLinks = document.querySelectorAll("link[rel*='icon']");
                existingLinks.forEach(link => link.remove());

                addedFaviconLink = document.createElement('link');
                addedFaviconLink.rel = 'icon';
                addedFaviconLink.type = 'image/png';
                addedFaviconLink.href = channelAvatar;
                document.head.appendChild(addedFaviconLink);
            }
        }

        return () => {
            document.title = defaultTitle;
            if (addedFaviconLink && addedFaviconLink.parentNode) {
                addedFaviconLink.parentNode.removeChild(addedFaviconLink);
            }
        };
    }, [report, lang.metadata.title]);

    const handleReset = () => {
        localStorage.removeItem(CURRENT_REPORT_KEY);
        router.push("/");
    };

    if (isLoading) {
        return null; // Or a loading spinner
    }

    if (!report) {
        return null; // Will redirect
    }

    return (
        <main id="main-content" className="min-h-screen flex flex-col">
            <div className="flex-1" role="main">
                <motion.div
                    key="report"
                    className="container py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                >
                    <ReportDisplay
                        report={report}
                        onReset={handleReset}
                    />
                </motion.div>
            </div>
        </main>
    );
}
