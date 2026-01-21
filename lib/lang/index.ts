"use client";

import { createContext, useContext } from "react";
import {
    languages,
    defaultLanguage,
    defaultLanguageCode,
    getLanguage,
    formatString,
} from "./data";
import type { Language, LanguageCode } from "./data";

// Re-export from data for convenience
export type { Language, LanguageCode };
export {
    languages,
    defaultLanguage,
    defaultLanguageCode,
    getLanguage,
    formatString,
};

// Language Context (client-only)
interface LanguageContextType {
    lang: Language;
    langCode: LanguageCode;
    setLanguage: (code: LanguageCode) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
    lang: defaultLanguage,
    langCode: defaultLanguageCode,
    setLanguage: () => {},
});

// Hook to use language
export function useLang(): Language {
    const context = useContext(LanguageContext);
    return context.lang;
}

// Hook to use language with setter
export function useLanguage() {
    return useContext(LanguageContext);
}

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = "soibrand-language";

// Get stored language preference
export function getStoredLanguage(): LanguageCode | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "vi" || stored === "en") {
        return stored;
    }
    return null;
}

// Store language preference
export function storeLanguage(code: LanguageCode): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
}
