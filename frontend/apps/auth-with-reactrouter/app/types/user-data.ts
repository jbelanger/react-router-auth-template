import "react-router";

export interface UserData {
    uniqueId: string;
    displayName: string;
    email: string;
    roles: string[];
    apiToken?: string;
    apiTokenExpiresAt?: number;
}