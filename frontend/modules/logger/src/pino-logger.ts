import pino from 'pino';
import os from 'node:os';
import fs from 'node:fs';
import { z } from 'zod';
import { getCurrentCorrelationId } from './correlation.ts';



// Define log levels, including a custom 'audit' level
const logLevels = {
    audit: 5,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
} as const;

const env = {
    logLevel: z //
        .string()
        .refine((val: string) => Object.keys(logLevels).includes(val), { message: 'Invalid log level' })
        .default('info')
        .parse(process.env.LOG_LEVEL),
    auditLogEnabled: z //
        .string()
        .transform((val: string) => val === 'true')
        .default('true')
        .parse(process.env.AUDIT_LOG_ENABLED),
    auditLogDirname: z //
        .string()
        .trim()
        .min(1, { message: 'Invalid audit log directory name' })
        .default('logs')
        .parse(process.env.AUDIT_LOG_DIRNAME),
    auditLogFilename: z //
        .string()
        .trim()
        .min(1, { message: 'Invalid audit log file name' })
        .default('audit')
        .parse(process.env.AUDIT_LOG_FILENAME),
    auditLogRetentionDays: z //
        .string()
        .transform((val: string) => parseInt(val, 10))
        .default('30')
        .parse(process.env.AUDIT_LOG_RETENTION_DAYS),
    nodeEnv: z //
        .string()
        .default('development')
        .parse(process.env.NODE_ENV),
    serviceName: z //
        .string()
        .default('frontend-service')
        .parse(process.env.SERVICE_NAME),
} as const;

/**
 * Formats a log label string to be a fixed length. When the label string
 * is longer than the specified size, it is truncated and prefixed by a
 * horizontal ellipsis (…).
 */
function formatLabel(label: string, size: number) {
    const str = label.padStart(size);
    return str.length <= size ? str : `…${str.slice(-size + 1)}`;
}

// Our Logger type extending Pino's base logger type
export interface Logger extends pino.Logger<'audit'> {
    audit: pino.LogFn;
}

// Cache for loggers
const loggerCache = new Map<string, Logger>();

// Root logger instance
let rootLogger: Logger | null = null;

/**
 * Ensures that the log directory exists; if not, it creates it.
 */
function ensureLogDirExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Creates and configures the root logger instance.
 */
function createRootLogger(): Logger {
    // Ensure the log directory exists
    ensureLogDirExists(env.auditLogDirname);

    // Define a more flexible transport target type
    type TransportTarget = {
        level: string;
        target: string;
        options: Record<string, any>;
    };

    // Build transport targets array
    const transportTargets: TransportTarget[] = [];

    // In development, use pino-pretty for human-readable logs
    if (env.nodeEnv === 'development') {
        transportTargets.push({
            level: 'trace',
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                messageFormat: '[{categoryLabel}]: {msg}',
                customLevels: logLevels,
                customColors: 'info:blue,error:red,warn:yellow,debug:green',
                useOnlyCustomLevels: true,
                ignore: 'pid,hostname,category,categoryLabel,service,environment,correlationId',
                levelPadding: true,
            },
        });
    }
    else {
        // In production, explicitly add a transport for stdout
        // This ensures logs go to container stdout in JSON format
        transportTargets.push({
            level: 'trace',
            target: 'pino/file',
            options: {
                destination: 1, // stdout file descriptor
                // No additional formatting - pure JSON for log processors
            }
        });
    }

    // Add audit log transport if enabled (same for both environments)
    if (env.auditLogEnabled) {
        transportTargets.push({
            level: 'audit',
            target: 'pino-roll',
            options: {
                file: `./${env.auditLogDirname}/${env.auditLogFilename}_${os.hostname()}.log`,
                frequency: 'daily',
                mkdir: true,
                size: '10M',
                max: env.auditLogRetentionDays,
            }
        });
    }

    // Create the Pino logger with standard configuration
    const pinoConfig: pino.LoggerOptions<'audit'> = {
        level: env.logLevel,
        customLevels: logLevels,
        useOnlyCustomLevels: true,
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            // Include standard context metadata following common practices
            hostname: os.hostname(),
            pid: process.pid,
            service: env.serviceName,
            environment: env.nodeEnv
        },
        // Add correlation ID to all log entries if available
        mixin: () => {
            const correlationId = getCurrentCorrelationId();
            return correlationId ? { correlationId } : {};
        }
    };

    // Only add transport configuration if we have targets
    // In production with no targets, default to stdout JSON logging
    if (transportTargets.length > 0) {
        pinoConfig.transport = { targets: transportTargets };
    }

    const pinoLogger = pino.pino<'audit'>(pinoConfig);

    return pinoLogger as Logger;
}

/**
 * Returns a logger for the specified logging category.
 * Creates a child logger from the root logger with category-specific context.
 */
export const getLogger = (category: string): Logger => {
    // Return cached logger if it exists
    if (loggerCache.has(category)) {
        return loggerCache.get(category)!;
    }

    // Create root logger if it doesn't exist
    if (!rootLogger) {
        rootLogger = createRootLogger();
    }

    // Create a child logger with category context
    const categoryLogger = rootLogger.child({
        category,
        categoryLabel: formatLabel(category, 25)
    }) as Logger;

    // Cache the logger
    loggerCache.set(category, categoryLogger);

    return categoryLogger;
};
