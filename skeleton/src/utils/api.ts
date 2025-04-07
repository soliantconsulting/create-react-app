import { LocalDate, LocalDateTime, LocalTime, ZoneId, ZonedDateTime } from "@js-joda/core";
import { isPlainArray, isPlainObject } from "@tanstack/react-router";
import { JsonApiError } from "jsonapi-zod-query";

export const apiUrl = (path: string): URL => new URL(path, import.meta.env.VITE_APP_API_ENDPOINT);

export const getErrorMessage = (error: unknown): string => {
    if (!(error instanceof JsonApiError)) {
        return "An unknown error occurred";
    }

    const jsonApiError = error.errors[0];

    return jsonApiError.detail ?? jsonApiError.title ?? "An unknown error occurred";
};

const isJsJodaObject = (
    object: unknown,
): object is LocalDate | LocalTime | LocalDateTime | ZonedDateTime | ZoneId => {
    return (
        object instanceof LocalDate ||
        object instanceof LocalTime ||
        object instanceof LocalDateTime ||
        object instanceof ZonedDateTime ||
        object instanceof ZoneId
    );
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

    if (isJsJodaObject(oldData) && isJsJodaObject(newData)) {
        return oldData.equals(newData) ? oldData : newData;
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
