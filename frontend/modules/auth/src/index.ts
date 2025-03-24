/**
 * @file Auth module entry point
 * Provides authentication functionality using Microsoft Entra ID (Azure AD)
 */

/**
 * Creates a preconfigured MSAL authentication provider
 * @see './msal-provider.ts'
 */
export { createMsalProvider } from './msal-provider.ts';

/**
 * Core authentication types
 * @see './types.ts' for detailed type definitions
 */
export type { AuthConfig, AuthError } from './types.ts';