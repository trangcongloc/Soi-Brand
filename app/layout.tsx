import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { defaultLanguage } from "@/lib/lang/data";
import LanguageProvider from "@/components/LanguageProvider";
import SettingsButton from "@/components/SettingsButton";
import ErrorBoundary from "@/components/ErrorBoundary";

const beVietnamPro = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
    title: defaultLanguage.metadata.title,
    description: defaultLanguage.metadata.description,
    keywords: defaultLanguage.metadata.keywords,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={beVietnamPro.className}>
                <a href="#main-content" className="skip-link">
                    Skip to content
                </a>
                <ErrorBoundary>
                    <LanguageProvider>
                        {children}
                        <SettingsButton />
                    </LanguageProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
