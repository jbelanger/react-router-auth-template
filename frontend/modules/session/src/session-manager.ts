import type { Request } from 'express';
import assert from 'node:assert';
import validator from 'validator';
import { getLogger } from '@gc-fwcs/logger';
import { randomBytes } from 'crypto';

/** Type alias for Express session to improve code readability */
type ExpressSession = Request['session'];

/**
 * List of keys that are reserved for Express session internal use.
 * These keys cannot be used for storing custom session data.
 */
const SYSTEM_RESERVED_KEYS = [
  'id',
  'cookie',
  'regenerate',
  'destroy',
  'reload',
  'resetMaxAge',
  'save',
  'touch',
  'csrfToken'
] as const;

/** Number of bytes to use for CSRF token generation */
const CSRF_TOKEN_BYTES = 32;
/** Key under which CSRF token is stored in session */
const CSRF_SESSION_KEY = 'csrfToken';

const log = getLogger('session');

/**
 * Interface defining the session management system.
 * Provides a type-safe API for session data operations with built-in CSRF protection.
 * All operations automatically handle key normalization and validation.
 */
export interface Session {
  /**
   * The unique identifier for this session.
   * This ID is managed by the underlying session store.
   */
  id: string;

  /**
   * Generates or retrieves the CSRF token for this session.
   * The same token persists throughout the session unless regeneration is requested.
   * Use this token in forms and API requests to prevent CSRF attacks.
   * 
   * @param regenerate When true, forces generation of a new token
   * @returns A 32-byte hexadecimal token
   */
  csrfToken(regenerate?: boolean): string;

  /**
   * Validates a provided CSRF token against the session's stored token.
   * Use this to verify tokens received in requests.
   * 
   * @param token The token to validate
   * @returns true if the token matches the stored token, false otherwise
   */
  validateCsrfToken(token: string): boolean;

  /**
   * Checks if a specific key exists in the session.
   * The key is normalized before checking.
   * Reserved system keys always return false.
   * 
   * @param key The key to check
   * @returns true if the key exists, false otherwise
   */
  has(key: string): boolean;

  /**
   * Safely retrieves a value from the session.
   * Returns undefined if the key doesn't exist.
   * 
   * @param key The key to look up
   * @returns The value if found, undefined otherwise
   */
  find<T>(key: string): T | undefined;

  /**
   * Retrieves a required value from the session.
   * Use this when you expect the value to exist.
   * 
   * @param key The key to look up
   * @throws Error if the key doesn't exist
   * @returns The value associated with the key
   */
  get<T>(key: string): T;

  /**
   * Stores a value in the session.
   * The key is normalized and validated before storage.
   * 
   * @param key The key under which to store the value
   * @param value The value to store
   * @returns true if saved successfully
   */
  set<T = unknown>(key: string, value: T): boolean;

  /**
   * Removes a value from the session.
   * The key is normalized before removal.
   * 
   * @param key The key to remove
   * @returns true if the key existed and was removed, false otherwise
   */
  unset(key: string): boolean;

  /**
   * Terminates the current session.
   * This invalidates the session immediately.
   */
  destroy(): void;
}

/**
 * Normalizes a session key to ensure it's valid and safe to use.
 * - Removes invalid characters, replacing them with underscores
 * - Ensures the key starts with a valid character
 * - Validates the key is not empty
 * 
 * @throws {Error} If the key is empty or contains only whitespace
 */
const normalizeSessionKey = (key: string): string => {
  assert(!validator.isEmpty(key, { ignore_whitespace: true }), 'Session key cannot be empty');
  let normalizedKey = key.replace(/[^a-zA-Z0-9_$]/g, '_');
  if (!/^[a-zA-Z_$]/.test(normalizedKey)) {
    normalizedKey = '_' + normalizedKey;
  }
  log.trace('Normalized session key: original %s, normalized %s', key, normalizedKey);
  return normalizedKey;
};

/**
 * Checks if a key is reserved for system use.
 * Reserved keys are used internally by Express session.
 */
const isSystemReservedKey = (key: string): boolean =>
  SYSTEM_RESERVED_KEYS.includes(key as typeof SYSTEM_RESERVED_KEYS[number]);

/**
 * Validates that a key is not reserved for system use.
 * @throws {Error} If the key is reserved
 */
const validateKeyNotReserved = (key: string): void => {
  assert(!isSystemReservedKey(key), `Session key '${key}' is reserved and cannot be used`);
};

/**
 * Generates a cryptographically secure random token.
 * Used for CSRF protection.
 * 
 * @returns A 32-byte hexadecimal string
 */
const generateSecureToken = (): string =>
  randomBytes(CSRF_TOKEN_BYTES).toString('hex');

/**
 * Creates a session management object wrapping an Express session.
 * 
 * Features:
 * - Type-safe session operations
 * - Automatic key normalization
 * - Protection against reserved key usage
 * - Built-in CSRF protection
 * - Comprehensive error handling
 * - Detailed logging
 * 
 * @param expressSession The Express session object to wrap
 * @throws {Error} If the session object is undefined
 * @returns A Session interface implementation
 * 
 * @example
 * ```typescript
 * const session = createSession(req.session);
 * session.set('user', { id: 1, name: 'John' });
 * const user = session.get('user');
 * ```
 */
export function createSession(expressSession: ExpressSession): Session {
  assert(expressSession, 'Session object is undefined. Ensure session middleware is properly configured.');
  log.trace('Session initialized with ID: %s', expressSession.id);

  const has = (key: string): boolean => {
    const normalizedKey = normalizeSessionKey(key);
    if (isSystemReservedKey(normalizedKey)) return false;
    const exists = normalizedKey in expressSession;
    log.trace('Checking session key existence: %s, exists: %s', normalizedKey, exists);
    return exists;
  };

  const find = <T>(key: string): T | undefined => {
    if (!has(key)) return undefined;
    const normalizedKey = normalizeSessionKey(key);
    const value = expressSession[normalizedKey] as T | undefined;
    log.trace('Retrieved value for session key: %s', normalizedKey);
    return value;
  };

  const get = <T>(key: string): T => {
    const value = find<T>(key);
    if (value === undefined) {
      log.error('Required session key not found: %s, sessionId: %s', key, expressSession.id);
      throw new Error(`Key '${key}' not found in session [${expressSession.id}]`);
    }
    log.trace('Retrieved required value for session key: %s', key);
    return value;
  };

  const set = <T = unknown>(key: string, value: T): boolean => {
    const normalizedKey = normalizeSessionKey(key);
    validateKeyNotReserved(normalizedKey);
    expressSession[normalizedKey] = value;
    expressSession.save((err) => {
      if (err) {
        log.error('Failed to save session: %s', err.message);
      } else {
        log.trace('Session value set successfully: %s', normalizedKey);
      }
    });
    return true;
  };

  const unset = (key: string): boolean => {
    const normalizedKey = normalizeSessionKey(key);
    if (!has(normalizedKey)) return false;
    validateKeyNotReserved(normalizedKey);
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete expressSession[normalizedKey];
    expressSession.save((err) => {
      if (err) {
        log.error('Failed to save session after removing key: %s, error: %s', normalizedKey, err.message);
      } else {
        log.trace('Session value removed successfully: %s', normalizedKey);
      }
    });
    return true;
  };

  const destroy = (): void => {
    expressSession.destroy((err) => {
      if (err) {
        log.error('Failed to destroy session: %s, error: %s', expressSession.id, err.message);
      } else {
        log.trace('Session destroyed successfully: %s', expressSession.id);
      }
    });
  };

  const csrfToken = (regenerate = false): string => {
    if (!regenerate && expressSession[CSRF_SESSION_KEY]) {
      return expressSession[CSRF_SESSION_KEY];
    }

    const token = generateSecureToken();
    expressSession[CSRF_SESSION_KEY] = token;
    expressSession.save((err) => {
      if (err) {
        log.error('Failed to save CSRF token: %s', err.message);
      } else {
        log.trace('New CSRF token generated and saved');
      }
    });

    return token;
  };

  const validateCsrfToken = (token: string): boolean => {
    const storedToken = expressSession[CSRF_SESSION_KEY];
    if (!storedToken) {
      log.warn('CSRF token validation failed: No token in session');
      return false;
    }
    const isValid = token === storedToken;
    if (!isValid) {
      log.warn('CSRF token validation failed: Token mismatch');
    }
    return isValid;
  };

  return {
    get id() { return expressSession.id; },
    has,
    find,
    get,
    set,
    unset,
    destroy,
    csrfToken,
    validateCsrfToken
  };
}

/**
 * Creates a null session implementation for stateless contexts.
 * 
 * This implementation:
 * - Returns empty/false values for read operations
 * - Throws errors for write operations
 * - Provides type-safety while preventing accidental writes
 * 
 * Use this when you need to maintain the Session interface contract
 * but don't have or want actual session storage.
 * 
 * @returns A Session implementation that prevents state modification
 */
export function createNullSession(): Session {
  const throwStatelessError = () => {
    throw new Error('Session operations not available in stateless context');
  };

  return {
    get id(): string {
      throwStatelessError();
      return '';
    },
    has: () => false,
    find: () => undefined,
    get: throwStatelessError,
    set: throwStatelessError,
    unset: () => false,
    destroy: () => {
      // No-op: nothing to destroy in stateless context
    },
    csrfToken: throwStatelessError,
    validateCsrfToken: () => false
  };
}
