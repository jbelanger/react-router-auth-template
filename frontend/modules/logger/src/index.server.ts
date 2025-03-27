/**
 * Using Pino to avoid Winston's DailyRotateFile transport event listener limits when audit logging is enabled.
 * Also provides correlation ID tracking for request tracing.
 */

import { getLogger, type Logger } from './pino-logger.js';
// import {
//     getCurrentCorrelationId,
//     setCorrelationContext,
//     withCorrelationId
// } from './correlation.ts';

// Export logger functionality
export { getLogger, type Logger };

// Export correlation ID utilities
// export {
//     getCurrentCorrelationId,
//     setCorrelationContext,
//     withCorrelationId
// };


// Export envvironment schema
export { loggerEnvSchema } from './env.schema.js';