import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateDomainPrefix } from "../src/tasks/features.js";

describe("validateDomainPrefix", () => {
    it("accepts lowercase letters, numbers and inner hyphens", () => {
        assert.equal(validateDomainPrefix("acme-portal-2"), true);
    });

    it("rejects uppercase, leading or trailing hyphens and other characters", () => {
        for (const value of ["Acme", "-acme", "acme-", "acme_portal", ""]) {
            assert.equal(typeof validateDomainPrefix(value), "string", value);
        }
    });

    it("rejects the words Cognito reserves", () => {
        for (const value of ["aws-portal", "my-amazon", "cognito-test"]) {
            assert.match(String(validateDomainPrefix(value)), /Must not contain/);
        }
    });

    it("leaves room for the longest environment suffix", () => {
        assert.equal(validateDomainPrefix("a".repeat(52)), true);
        assert.match(String(validateDomainPrefix("a".repeat(53))), /at most 52/);
    });
});
