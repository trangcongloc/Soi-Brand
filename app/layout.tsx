import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { defaultLanguage } from "@/lib/lang/data";
import LanguageProvider from "@/components/LanguageProvider";
import SettingsButton from "@/components/SettingsButton";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

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
            <body className={inter.className}>
                <a href="#main-content" className="skip-link">
                    Skip to content
                </a>
                <LanguageProvider>
                    {children}
                    <SettingsButton />
                </LanguageProvider>
            </body>
        </html>
    );
}
