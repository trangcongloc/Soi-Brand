import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
    title: "'Soi' Brand",
    description:
        "Công cụ phân tích chiến lược marketing YouTube chuyên nghiệp, sử dụng AI để tạo báo cáo chi tiết về kênh YouTube của bạn.",
    keywords:
        "OurTube, YouTube, marketing, analysis, AI, phân tích, chiến lược",
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
