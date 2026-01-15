"use client";

import { useState, useEffect, ReactNode } from "react";
import {
    LanguageContext,
    LanguageCode,
    getLanguage,
    detectBrowserLanguage,
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
        // Check stored preference first, then browser language
        const stored = getStoredLanguage();
        const detected = stored || detectBrowserLanguage();
        setLangCode(detected);
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
