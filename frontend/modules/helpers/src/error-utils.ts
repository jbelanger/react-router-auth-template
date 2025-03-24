
/**
 * Type definition for sanitized error information
 */
export interface SanitizedError {
    /** Error message */
    message: string;
    /** Error code */
    code: string;
    /** Stack trace (if available and requested) */
    stack?: string;
}


/**
 * Sanitizes an error for consistent error handling and reporting
 * 
 * @param error - The original error object
 * @param defaultCode - Default error code if none can be extracted
 * @param defaultMessage - Default error message if none can be extracted
 * @param includeStack - Whether to include stack trace (defaults to false in production)
 * @returns Sanitized error information
 */
export function sanitizeError(
    error: unknown,
    defaultCode: string = "UNKNOWN_ERROR",
    defaultMessage: string = "An unknown error occurred",
    includeStack: boolean = process.env.ENVIRONMENT !== 'production'
): SanitizedError {
    let result: SanitizedError = {
        message: defaultMessage,
        code: defaultCode,
        stack: undefined
    };

    // Handle standard Error instances
    if (error instanceof Error) {
        // Extract error code if available (some libraries put it in code, others in name)
        const code = (error as any).code || (error as any).errorCode || defaultCode;
        return result = {
            message: error.message,
            code: typeof code === 'string' ? code : defaultCode,
            stack: (includeStack && error.stack) ? error.stack : undefined
        };
    }

    // Handle string errors
    if (typeof error === 'string') {
        return {
            message: error,
            code: defaultCode
        };
    }

    // Handle MSAL errors that might be objects with specific structure
    if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;

        // Try to extract error information from known patterns
        if (errorObj.errorMessage || errorObj.errorCode) {
            result = {
                message: errorObj.errorMessage || defaultMessage,
                code: errorObj.errorCode || defaultCode
            };
        }
        // Try to extract from error_description (OAuth-style errors)
        else if (errorObj.error_description || errorObj.error) {
            result = {
                message: errorObj.error_description || errorObj.error || defaultMessage,
                code: errorObj.error || defaultCode
            };
        }

        // Include stack trace if requested and available
        if (includeStack && errorObj.stack) {
            result = { ...result, stack: errorObj.stack };
        }

        return result;
    }

    // Fallback for completely unknown errors
    return result;
}