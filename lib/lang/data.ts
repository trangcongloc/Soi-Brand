// Server-safe language data (no "use client")
import { vi } from "./vi";
import { en } from "./en";
import type { ViLanguage } from "./vi";
import type { EnLanguage } from "./en";

export type LanguageCode = "vi" | "en";
export type Language = ViLanguage | EnLanguage;

export type { ViLanguage, EnLanguage };

export const languages = {
    vi,
    en,
} as const;

export const defaultLanguage = vi;
export const defaultLanguageCode: LanguageCode = "vi";

export function getLanguage(code: LanguageCode): Language {
    return languages[code] || defaultLanguage;
}

export function formatString(
    template: string,
    values: Record<string, string | number>
): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return values[key]?.toString() || match;
    });
}
