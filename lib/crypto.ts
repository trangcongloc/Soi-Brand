// Simple client-side encryption for API key storage
// Note: This provides obfuscation, not true security. Client-side storage
// is inherently vulnerable. For production, consider server-side key management.

import { isBrowser } from "./utils";

const SALT = "soi-brand-v1";
const ALGORITHM = "AES-GCM";

/**
 * Generate a consistent encryption key from the origin
 */
async function getEncryptionKey(): Promise<CryptoKey | null> {
    if (!isBrowser() || !window.crypto?.subtle) {
        return null;
    }

    try {
        // Use origin + salt as the base for key derivation
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(window.location.origin + SALT),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode(SALT),
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: ALGORITHM, length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    } catch {
        return null;
    }
}

/**
 * Encrypt a string value
 */
export async function encrypt(plaintext: string): Promise<string | null> {
    const key = await getEncryptionKey();
    if (!key) {
        return null;
    }

    try {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plaintext);

        const ciphertext = await window.crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            encoded
        );

        // Combine IV and ciphertext, then base64 encode
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return btoa(String.fromCharCode.apply(null, Array.from(combined)));
    } catch {
        return null;
    }
}

/**
 * Decrypt a string value
 */
export async function decrypt(encryptedBase64: string): Promise<string | null> {
    const key = await getEncryptionKey();
    if (!key) {
        return null;
    }

    try {
        const combined = new Uint8Array(
            atob(encryptedBase64).split("").map((c) => c.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch {
        return null;
    }
}

/**
 * Check if encryption is available
 */
export function isEncryptionAvailable(): boolean {
    return isBrowser() && !!window.crypto?.subtle;
}
