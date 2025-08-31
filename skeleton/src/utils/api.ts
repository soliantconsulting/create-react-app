import { JsonApiError } from "@jsonapi-serde/client";
import { isPlainArray, isPlainObject } from "@tanstack/react-router";

export const apiUrl = (path: string): URL => new URL(path, import.meta.env.VITE_APP_API_ENDPOINT);

export const getErrorMessage = (error: unknown): string => {
    if (!(error instanceof JsonApiError)) {
        return "An unknown error occurred";
    }

    const jsonApiError = error.errors[0];
    return jsonApiError.detail ?? jsonApiError.title ?? "An unknown error occurred";
};

type TemporalType =
    | Temporal.PlainDate
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime
    | Temporal.PlainMonthDay
    | Temporal.PlainYearMonth
    | Temporal.Instant
    | Temporal.Duration;

const isTemporal = (object: unknown): object is TemporalType => {
    return (
        object instanceof Temporal.PlainDate ||
        object instanceof Temporal.PlainTime ||
        object instanceof Temporal.PlainDateTime ||
        object instanceof Temporal.ZonedDateTime ||
        object instanceof Temporal.PlainMonthDay ||
        object instanceof Temporal.PlainYearMonth ||
        object instanceof Temporal.Instant ||
        object instanceof Temporal.Duration
    );
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: low-level complexity
const isTemporalEqual = (oldData: TemporalType, newData: TemporalType): boolean => {
    if (oldData instanceof Temporal.PlainDate && newData instanceof Temporal.PlainDate) {
        return oldData.equals(newData);
    }

    if (oldData instanceof Temporal.PlainTime && newData instanceof Temporal.PlainTime) {
        return oldData.equals(newData);
    }

    if (oldData instanceof Temporal.PlainDateTime && newData instanceof Temporal.PlainDateTime) {
        return oldData.equals(newData);
    }

    if (oldData instanceof Temporal.ZonedDateTime && newData instanceof Temporal.ZonedDateTime) {
        return oldData.equals(newData);
    }

    if (oldData instanceof Temporal.PlainMonthDay && newData instanceof Temporal.PlainMonthDay) {
        return oldData.equals(newData);
    }

    if (oldData instanceof Temporal.PlainYearMonth && newData instanceof Temporal.PlainYearMonth) {
        return oldData.equals(newData);
    }

    if (oldData instanceof Temporal.Instant && newData instanceof Temporal.Instant) {
        return oldData.equals(newData);
    }

    if (oldData instanceof Temporal.Duration && newData instanceof Temporal.Duration) {
        return Temporal.Duration.compare(oldData, newData) === 0;
    }

    return false;
};

const areSetsEquals = (a: Set<unknown>, b: Set<unknown>): boolean => {
    if (a.size !== b.size) {
        return false;
    }

    for (const value of a) {
        if (!b.has(value)) {
            return false;
        }
    }

    return true;
};

const replaceArrayItems = (oldData: unknown[], newData: unknown[]): unknown[] => {
    const oldSize = oldData.length;
    const newSize = newData.length;
    const copy = [];
    let equalItems = 0;

    for (let i = 0; i < newSize; ++i) {
        copy[i] = extendedReplaceEqualDeep(oldData[i], newData[i]);

        if (copy[i] === oldData[i]) {
            equalItems += 1;
        }
    }

    return oldSize === newSize && equalItems === oldSize ? oldData : copy;
};

const replaceObjectProperties = (
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
): Record<string, unknown> => {
    const oldKeys = Object.keys(oldData);
    const newKeys = Object.keys(newData);
    const oldSize = oldKeys.length;
    const newSize = newKeys.length;
    const copy: Record<string, unknown> = {};
    let equalItems = 0;

    for (let i = 0; i < newSize; ++i) {
        const key = oldKeys[i];
        copy[key] = extendedReplaceEqualDeep(oldData[key], newData[key]);

        if (copy[key] === oldData[key]) {
            equalItems += 1;
        }
    }

    return oldSize === newSize && equalItems === oldSize ? oldData : copy;
};

/**
 * Custom implementation to support comparing non-JSON objects
 */
export const extendedReplaceEqualDeep = (oldData: unknown, newData: unknown): unknown => {
    if (oldData === newData) {
        return oldData;
    }

    if (oldData instanceof Set && newData instanceof Set) {
        return areSetsEquals(oldData, newData) ? oldData : newData;
    }

    if (isTemporal(oldData) && isTemporal(newData)) {
        return isTemporalEqual(oldData, newData) ? oldData : newData;
    }

    if (isPlainArray(oldData) && isPlainArray(newData)) {
        return replaceArrayItems(oldData, newData);
    }

    if (isPlainObject(oldData) && isPlainObject(newData)) {
        return replaceObjectProperties(
            oldData as Record<string, unknown>,
            newData as Record<string, unknown>,
        );
    }

    return newData;
};
