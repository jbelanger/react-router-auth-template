import * as minimatchModule from 'minimatch';

const minimatch = (minimatchModule as any).default || minimatchModule.minimatch || minimatchModule;

/**
 * Checks if a given path should be ignored based on a list of ignore patterns.
 * @param ignorePatterns - An array of glob patterns to match against the path.
 * @param path - The path to check.
 * @returns - True if the path should be ignored, false otherwise.
 */
export function shouldIgnore(ignorePatterns: string[], path: string): boolean {
    return ignorePatterns.some((entry) => minimatch(path, entry));
}