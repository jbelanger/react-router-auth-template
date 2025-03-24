import crypto from "crypto";
import { AuthError } from "./types.ts";
/**
 * Generate PKCE code verifier and challenge
 * @returns Code verifier and challenge
 */
export async function generatePKCEChallenge() {
    const codeVerifier = generateSecureRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    return { verifier: codeVerifier, challenge: codeChallenge };
}

/**
 * Generate cryptographically secure random string for PKCE
 * @param length - Length of the random string
 * @returns Secure random string using alphanumeric characters
 */
export function generateSecureRandomString(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

/**
 * Generate code challenge from verifier for PKCE
 * @param verifier - Code verifier
 * @returns Code challenge
 */
export async function generateCodeChallenge(verifier: string) {
    // Generate SHA-256 hash of the verifier
    const verifierHash = crypto.createHash('sha256').update(verifier).digest();

    // Convert to URL-safe base64 string
    const base64Challenge = Buffer.from(verifierHash)
        .toString('base64')
        .replace(/\+/g, '-')  // Convert '+' to '-'
        .replace(/\//g, '_')  // Convert '/' to '_'
        .replace(/=+$/, '');  // Remove trailing '='

    return base64Challenge;
}

/**
 * Extracts the actual message from MSAL log output
 * @param message - Raw MSAL log message
 * @returns Extracted message or original if pattern doesn't match
 */
export function extractMeaningfulLogContent(message: string): string {
    const messagePattern = /.*: .* - (.*)/;
    const extractedContent = message.match(messagePattern);
    return extractedContent ? extractedContent[1].trim() : message;
}

/**
 * Creates a standardized AuthError from any error type
 * 
 * @param error - The original error
 * @param defaultCode - Default error code if none can be extracted
 * @param defaultMessage - Default error message if none can be extracted
 * @returns A standardized AuthError
 */
export function createAuthError(
    error: { message: string, code: string },
    defaultCode: string = "UNKNOWN_ERROR",
    defaultMessage: string = "An unknown error occurred"
): AuthError {
    return new AuthError(error.message, error.code);
}