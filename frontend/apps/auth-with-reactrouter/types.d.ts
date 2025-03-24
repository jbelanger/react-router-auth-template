import "react-router";
import type { Session } from '@gc-fwcs/session';

interface UserData {
    uniqueId: string;
    displayName: string;
    email: string;
    roles: string[];
    apiToken?: string;
    apiTokenExpiresAt?: number;
}

declare module 'react-router' {
    interface AppLoadContext {
        /** Type-safe session manager */
        session: Session;
        /** Correlation ID for request tracing */
        correlationId: string;
    }
}
