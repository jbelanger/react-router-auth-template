/**
 * @file providers.ts
 * Authentication provider implementations for the authentication system.
 * Currently implements Microsoft Entra ID (Azure AD) authentication using MSAL.
 */

import { AuthorizationCodeRequest, AuthorizationUrlRequest, ConfidentialClientApplication, Configuration, DistributedCachePlugin } from "@azure/msal-node";
import { AuthenticationResult, LogLevel } from "@azure/msal-common/node";
import { getLogger } from "@gc-fwcs/logger";
import { AuthConfig, AuthError, AuthProvider } from "./types.ts";
import { createAuthError, extractMeaningfulLogContent, generatePKCEChallenge, generateSecureRandomString } from "./utils.ts";
import { Session } from "@gc-fwcs/session";
import createMsalCacheClient from "./msal-cache-client.ts";
import createPartitionManager from "./partition-manager.ts";
import { sanitizeError } from "@gc-fwcs/helpers";

/**
 * Creates a Microsoft Authentication Library (MSAL) provider
 * @param config - Authentication configuration
 * @returns MSAL authentication provider functions
 */
export async function createMsalProvider(config: AuthConfig): Promise<AuthProvider> {
    const msalLog = getLogger("@azure/msal-node");
    const msalCacheClient = createMsalCacheClient(config.redisClient, config.cache);
    const msalConfig = {
        auth: {
            ...await getMetadata(config),
            clientId: config.auth.clientId,
            authority: `https://login.microsoftonline.com/${config.auth.tenantId}`,
            clientSecret: config.auth.clientSecret,
        },
        system: {
            loggerOptions: {
                loggerCallback(loglevel, message) {
                    const actualMessage = extractMeaningfulLogContent(message);
                    switch (loglevel) {
                        case LogLevel.Error:
                            msalLog.error(actualMessage);
                            break;
                        case LogLevel.Warning:
                            msalLog.warn(actualMessage);
                            break;
                        case LogLevel.Info: // fallthrough
                        case LogLevel.Verbose:  // fallthrough
                        default:
                            msalLog.debug(actualMessage);
                    }
                },
                logLevel: process.env.ENVIRONMENT === "production" ? LogLevel.Warning : LogLevel.Verbose,
                piiLoggingEnabled: false,
            },
            // proxyUrl: "http://localhost:8888" // uncomment to capture traffic with Fiddler
        },
    } as Configuration;
    /**
     * Creates a new MSAL instance with distributed cache support
     * @param session - User's session for cache partitioning
     * @returns Configured MSAL client instance
     */
    const createMsalClientInstance = async (session: Session): Promise<ConfidentialClientApplication> => {

        return new ConfidentialClientApplication({
            ...msalConfig,
            cache: {
                cachePlugin: new DistributedCachePlugin(
                    msalCacheClient,
                    createPartitionManager(session) // partitionKey homeAccountId
                ),
            },
        });
    };

    return {
        /**
         * Signs out the user by clearing MSAL cache and redirecting to logout endpoint
         * @param session - User's session to clear cached tokens and account data
         * @param request - Current request to derive origin for absolute URLs
         * @param returnPath - Relative path to redirect to after logout (defaults to "/")
         * @returns Entra ID logout URL with post-logout redirect
         * @throws {AuthError} If logout fails or return URL is invalid
         * 
         * Note: The post-logout redirect URI must be registered in the Entra ID application 
         * under "Authentication" > "Logout URL". Use absolute URLs that match exactly what's provided here.
         */
        async logout(session: Session, request: Request, returnPath: string = "/"): Promise<string> {
            const log = getLogger("auth/logout");
            const msalInstance = await createMsalClientInstance(session);

            try {
                // Get origin from request
                const origin = new URL(request.url).origin;

                // Ensure returnPath is a relative path
                if (returnPath.includes("://") || returnPath.startsWith("//")) {
                    throw new Error("Invalid return URL - must be a relative path, not an absolute URL");
                }

                // Ensure returnPath starts with "/"
                if (!returnPath.startsWith("/")) {
                    returnPath = "/" + returnPath;
                }

                // Construct absolute return URL
                const absoluteReturnUrl = `${origin}${returnPath}`;

                // Clear MSAL token cache for user
                const homeAccountId = session.find<string>('homeAccountId');
                if (homeAccountId) {
                    const accounts = await msalInstance.getTokenCache().getAllAccounts();
                    const account = accounts.find(acc => acc.homeAccountId === homeAccountId);
                    if (account) {
                        await msalInstance.getTokenCache().removeAccount(account);
                    }
                }

                // Clear session data
                session.unset('homeAccountId');

                // Generate Entra ID logout URL with post-logout redirect
                const logoutUrl = new URL(`https://login.microsoftonline.com/${config.auth.tenantId}/oauth2/v2.0/logout`);
                logoutUrl.searchParams.set('post_logout_redirect_uri', absoluteReturnUrl);

                log.debug("Generated logout URL", { redirectUri: absoluteReturnUrl });
                return logoutUrl.toString();
            } catch (error) {
                const errorInfo = sanitizeError(error);
                log.error("Logout failed", { errorInfo });
                throw createAuthError(errorInfo, "LOGOUT_ERROR", "Failed to sign out user");
            }
        },

        /**
         * Generates an authorization URL to initiate the OIDC login flow with PKCE
         * @param session - User's session for storing PKCE and state parameters
         * @param returnUrl - URL to redirect to after successful authentication (defaults to '/')
         * @returns URL to redirect the user to for authentication
         * @throws {AuthError} If URL generation fails or required config is missing
         */
        generateAuthorizationUrl: async (session: Session, returnUrl: string = "/"): Promise<string> => {
            const log = getLogger("auth/generateAuthorizationUrl");

            // Generate PKCE code verifier and challenge
            const { verifier, challenge } = await generatePKCEChallenge();
            const state = await generateSecureRandomString(32);

            // TODO: Add nonce to protect against replay attacks

            // Create authorization URL with PKCE
            const authCodeUrlParameters: AuthorizationUrlRequest = {
                scopes: config.auth.scopes || ["openid", "profile", "email", "offline_access"],
                redirectUri: config.auth.redirectUri,
                codeChallenge: challenge,
                codeChallengeMethod: "S256",
                state: state
            };

            // Generate authorization URL
            const msalInstance = await createMsalClientInstance(session);
            const url = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);

            log.debug('Storing [codeVerifier] and [state] in session for future validation');
            session.set('codeVerifier', verifier);
            session.set('returnUrl', returnUrl ?? '/');
            session.set('state', state);

            return url;
        },

        /**
         * Handles the OAuth callback by exchanging the authorization code for tokens
         * @param session - User's session containing PKCE verifier and state
         * @param request - The incoming request containing the authorization code
         * @returns Object containing authentication result and URL to redirect to
         * @throws {AuthError} If code exchange fails, state mismatch, or invalid response
         *
         * The function:
         * 1. Validates the callback parameters
         * 2. Exchanges the code for tokens using PKCE
         * 3. Stores the homeAccountId for cache partitioning
         */
        exchangeCodeForTokens: async (session: Session, request: Request): Promise<{
            authResult: AuthenticationResult;
            redirectTo: string;
        }> => {
            const log = getLogger("auth/handleCallback");
            const url = new URL(request.url);
            const code = url.searchParams.get("code");
            const error = url.searchParams.get("error");
            const errorDescription = url.searchParams.get("error_description");

            if (error) {
                log.error("Authentication error from Entra ID", { error, errorDescription });
                throw new AuthError(
                    `Authentication failed: ${errorDescription || error}`,
                    error
                );
            }

            const codeVerifier = session.get<string>('codeVerifier');
            const returnUrl = session.find<string>('returnUrl') ?? '/';
            const state = session.get<string>('state');

            session.unset('codeVerifier');
            session.unset('returnUrl');
            session.unset('state');

            // Exchange code for tokens
            const msalInstance = await createMsalClientInstance(session);
            return msalInstance.acquireTokenByCode({
                code,
                scopes: config.auth.scopes || ["openid", "profile", "email", "offline_access"],
                redirectUri: config.auth.redirectUri,
                codeVerifier,
                state
            } as AuthorizationCodeRequest).then((response) => {
                // Required by DistributedCachePlugin, acts as key for partitioning
                session.set('homeAccountId', response.account?.homeAccountId);
                return {
                    authResult: response,
                    redirectTo: returnUrl || "/"
                };
            }).catch((error) => {
                const errorInfo = sanitizeError(error);
                log.error("Authentication error", { errorInfo });
                throw createAuthError(errorInfo, "CALLBACK_ERROR", "Authentication failed");
            });
        },

        /**
         * Silently refreshes access tokens using cached refresh tokens
         * @param session - User's session containing homeAccountId for cache lookup
         * @returns Object containing new tokens or null if no account found
         * @throws {AuthError} If token refresh fails or cached account not found
         *
         * The function:
         * 1. Looks up the user's account in the token cache
         * 2. Uses MSAL's silent flow to refresh tokens if found
         * 3. Returns null if no cached account exists
         */
        refreshAccessToken: async (session: Session): Promise<{
            authResult: AuthenticationResult | null;
        }> => {
            // Get MSAL instance
            const msalInstance = await createMsalClientInstance(session);
            const log = getLogger("auth/refreshToken");

            // Try to get user account from the token cache
            const accounts = await msalInstance.getTokenCache().getAllAccounts();
            if (accounts.length === 0) {
                log.debug("No accounts were found in token cache");
                return {
                    authResult: null
                };
            }

            log.debug("Found accounts in cache", { count: accounts.length });
            const homeAccountId = session.find<string>('homeAccountId') ?? "";
            const account = homeAccountId ? accounts.find(acc => acc.homeAccountId.includes(homeAccountId)) : accounts[0];
            if (!account) {
                log.debug("Account not found in token cache");
                return {
                    authResult: null
                };
            }

            log.debug("Found account in cache", { username: account.username });
            // Use silent flow to get a new access token with the account from cache
            return msalInstance.acquireTokenSilent({
                account,
                scopes: config.auth.scopes || ["openid", "profile", "email", "offline_access"],
            }).then((response) => {
                return {
                    authResult: response
                };
            }).catch((error) => {
                const errorInfo = sanitizeError(error);
                log.error("Token refresh failed", { errorInfo });
                throw createAuthError(errorInfo, "TOKEN_REFRESH_ERROR", "Authentication expired");
            });
        }
    };

    /**
     * Fetches OpenID Connect metadata for a tenant from Microsoft's well-known endpoint
     * @param tenantId - Azure AD tenant ID
     * @returns OIDC metadata including endpoints and supported features
     * @throws {AuthError} If metadata fetch fails or returns invalid response
     */
    async function fetchOIDCMetadata(tenantId: string): Promise<any> {
        const log = getLogger("auth/fetchOIDCMetadata");
        try {
            const endpoint = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch OIDC metadata: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            const errorInfo = sanitizeError(error);
            log.error("Failed to fetch OIDC metadata", { errorInfo, tenantId });
            throw createAuthError(errorInfo, "METADATA_ERROR", "Failed to fetch authentication configuration");
        }
    }
    /**
     * Fetches cloud discovery metadata from Microsoft's discovery endpoint
     * @param tenantId - Azure AD tenant ID
     * @returns Cloud instance discovery metadata for the specified tenant
     * @throws {AuthError} If metadata fetch fails or returns invalid response
     */
    async function fetchCloudDiscoveryMetadata(tenantId: string): Promise<any> {

        const log = getLogger("auth/fetchCloudDiscoveryMetadata");
        try {
            const endpoint = new URL("https://login.microsoftonline.com/common/discovery/instance");
            endpoint.searchParams.set("api-version", "1.1");
            endpoint.searchParams.set("authorization_endpoint",
                `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
            );

            const response = await fetch(endpoint.toString());
            if (!response.ok) {
                throw new Error(`Failed to fetch cloud discovery metadata: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            const errorInfo = sanitizeError(error);
            log.error("Failed to fetch cloud discovery metadata", { errorInfo, tenantId });
            throw createAuthError(errorInfo, "METADATA_ERROR", "Failed to fetch authentication configuration");
        }
    }

    /**
     * Retrieves or fetches OIDC and cloud discovery metadata for MSAL configuration
     * @param config - Authentication configuration containing tenant and client details
     * @returns Object containing cached or freshly fetched metadata strings
     * @throws {AuthError} If metadata cannot be retrieved or cached
     *
     * The metadata is cached in Redis using the client ID and tenant ID as keys:
     * - ${clientId}.${tenantId}.discovery-metadata
     * - ${clientId}.${tenantId}.authority-metadata
     */
    async function getMetadata(config: AuthConfig): Promise<{ cloudDiscoveryMetadata: string, authorityMetadata: string }> {
        const tenantId = config.auth.tenantId;
        const clientId = config.auth.clientId;
        const cacheClient = config.redisClient;

        let [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
            cacheClient.get(`${clientId}.${tenantId}.discovery-metadata`),
            cacheClient.get(`${clientId}.${tenantId}.authority-metadata`),
        ]);

        // Fetch and cache if not found
        if (!cloudDiscoveryMetadata || !authorityMetadata) {
            [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                fetchCloudDiscoveryMetadata(tenantId),
                fetchOIDCMetadata(tenantId)
            ]);

            if (cloudDiscoveryMetadata && authorityMetadata) {
                await cacheClient.set(
                    `${clientId}.${tenantId}.discovery-metadata`,
                    JSON.stringify(cloudDiscoveryMetadata)
                );
                await cacheClient.set(
                    `${clientId}.${tenantId}.authority-metadata`,
                    JSON.stringify(authorityMetadata)
                );
            }
        }

        return {
            cloudDiscoveryMetadata:
                typeof cloudDiscoveryMetadata === "string"
                    ? cloudDiscoveryMetadata
                    : JSON.stringify(cloudDiscoveryMetadata),
            authorityMetadata:
                typeof authorityMetadata === "string"
                    ? authorityMetadata
                    : JSON.stringify(authorityMetadata)
        };
    }
}

