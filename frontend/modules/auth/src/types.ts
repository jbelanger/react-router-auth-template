/**
 * @file types.ts
 * Type definitions and interfaces for the authentication system.
 */

import { AuthenticationResult } from "@azure/msal-common/node";
import { Session } from "@gc-fwcs/session";
import { RedisClientType } from "redis";

/**
 * Authentication service configuration
 */
export interface AuthConfig {
    /**
     * Microsoft authentication configuration
     */
    auth: {
        /**
         * Microsoft client ID (Application ID)
         */
        clientId: string;

        /**
         * Microsoft client secret
         */
        clientSecret: string;

        /**
         * Microsoft tenant ID
         */
        tenantId: string;

        /**
         * Authority URL (optional, derived from tenant ID if not provided)
         */
        authority?: string;

        /**
         * OAuth scopes to request
         */
        scopes?: string[];

        /**
         * Full URL for OAuth callbacks (must be a valid absolute URL)
         */
        redirectUri: string;
    };

    redisClient: RedisClientType;

    /**
     * Cache configuration options
     */
    cache?: CacheConfig;
}

/**
 * Authentication provider interface
 */
export interface AuthProvider {
    /**
     * Signs out the user by clearing tokens and redirecting to the identity provider's logout endpoint
     * @param session - User's session to clear cached tokens and account data
     * @param request - Current request to derive origin for absolute URLs
     * @param returnPath - Relative path to redirect to after logout (defaults to "/")
     * @returns URL to complete the logout process
     * @throws {AuthError} If logout fails or return URL is invalid
     * 
     * Note: For Microsoft Entra ID, the post-logout redirect URI must be registered
     * in the application registration under "Authentication" > "Logout URL".
     */
    logout(session: Session, request: Request, returnPath?: string): Promise<string>;

    /**
     * Initiates the login flow by generating an authorization URL
     * @param session - User's session for storing PKCE and state
     * @param returnUrl - URL to redirect to after successful authentication (defaults to '/')
     * @returns Authorization URL for the identity provider
     */
    generateAuthorizationUrl(session: Session, returnUrl?: string): Promise<string>;

    /**
     * Exchanges authorization code for access tokens after successful login
     * @param session - User's session containing PKCE verifier and state for validation
     * @param request - The incoming request with the authorization code from identity provider
     * @returns Authentication result and URL to redirect the user to
     * @throws {AuthError} If code exchange fails or state validation fails
     */
    exchangeCodeForTokens(session: Session, request: Request): Promise<{
        authResult: AuthenticationResult;
        redirectTo: string;
    }>;

    /**
     * Silently acquires a new access token using refresh token from cache
     * @param session - User's session containing homeAccountId for token lookup
     * @returns New token data or null if no cached tokens found
     * @throws {AuthError} If token refresh fails
     */
    refreshAccessToken(session: Session): Promise<{
        authResult: AuthenticationResult | null;
    }>;
}

/**
 * Authentication error
 */
export class AuthError extends Error {
    /**
     * Error code
     */
    code: string;

    /**
     * Creates an authentication error
     * @param message - Error message
     * @param code - Error code
     */
    constructor(message: string, code: string) {
        super(message);
        this.name = "AuthError";
        this.code = code;
    }
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
    /**
     * Token cache TTL in seconds (default: 24 hours)
     */
    ttl?: number;
}