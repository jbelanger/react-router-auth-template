/**
 * Using Pino to avoid Winston's DailyRotateFile transport event listener limits when audit logging is enabled.
 * Also provides correlation ID tracking for request tracing.
 */

import { getLogger, type Logger } from './pino-logger.js';

// Export logger functionality
export { getLogger, type Logger };

// Export envvironment schema
export { loggerEnvSchema } from './env.schema.js';