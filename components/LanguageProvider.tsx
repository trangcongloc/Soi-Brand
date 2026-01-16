"use client";

import { useState, useEffect, ReactNode } from "react";
import {
    LanguageContext,
    LanguageCode,
    getLanguage,
    getStoredLanguage,
    storeLanguage,
    defaultLanguageCode,
} from "@/lib/lang";

interface LanguageProviderProps {
    children: ReactNode;
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
    const [langCode, setLangCode] = useState<LanguageCode>(defaultLanguageCode);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Check stored preference first, otherwise use default (Vietnamese)
        const stored = getStoredLanguage();
        if (stored) {
            setLangCode(stored);
        }
        // If no stored preference, keep defaultLanguageCode (vi)
        setIsInitialized(true);
    }, []);

    const setLanguage = (code: LanguageCode) => {
        setLangCode(code);
        storeLanguage(code);
    };

    const lang = getLanguage(langCode);

    // Prevent flash of wrong language
    if (!isInitialized) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ lang, langCode, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}
