import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAuthProvider } from "../src/tasks/features.js";

describe("resolveAuthProvider", () => {
    it("returns null when no login provider is picked", () => {
        assert.equal(resolveAuthProvider([]), null);
    });

    it("returns the one provider picked", () => {
        assert.equal(resolveAuthProvider(["auth0"]), "auth0");
        assert.equal(resolveAuthProvider(["cognito"]), "cognito");
    });

    it("rejects picking both", () => {
        assert.throws(() => resolveAuthProvider(["auth0", "cognito"]), /either Auth0 or Cognito/);
    });
});
