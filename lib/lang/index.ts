import { vi, type ViLanguage } from "./vi";

export type Language = ViLanguage;

export const defaultLanguage = vi;

export function useLang(): Language {
    return vi;
}

export function formatString(
    template: string,
    values: Record<string, string | number>
): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return values[key]?.toString() || match;
    });
}
