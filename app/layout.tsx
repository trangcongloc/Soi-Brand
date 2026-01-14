import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { defaultLanguage } from "@/lib/lang";

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
        <html lang="vi">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
