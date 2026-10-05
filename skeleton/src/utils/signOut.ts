import type { AuthContextProps } from "react-oidc-context";
import { getConfig } from "#/utils/config.js";

let signingOut = false;

/**
 * Whether a sign-out is navigating to the logout endpoint. `AuthGuard` must not start a sign-in
 * redirect meanwhile, as that would cancel the logout navigation.
 */
export const isSigningOut = (): boolean => signingOut;

// Going back after signing out can restore this page from the back/forward cache, signed out and
// with the flag still set. Reload so the app starts over and signs in again.
window.addEventListener("pageshow", (event) => {
    if (event.persisted && signingOut) {
        window.location.reload();
    }
});

/**
 * Signs the user out locally and ends the Cognito Managed Login session.
 *
 * Cognito does not advertise an `end_session_endpoint` in its OIDC discovery document, and its
 * logout endpoint takes `client_id` and `logout_uri` instead of the standard parameters, so it is
 * called directly. The logout URI must be one of the app client's configured sign-out URLs.
 */
export const signOut = async (auth: AuthContextProps): Promise<void> => {
    const { domain, clientId } = getConfig();
    signingOut = true;

    try {
        // Stops further refreshes. Issued access and ID tokens stay valid until they expire.
        await auth.revokeTokens(["refresh_token"]);
    } catch {
        // Sign out locally regardless; the refresh token expires on its own.
    }

    await auth.removeUser();

    const url = new URL("/logout", domain);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("logout_uri", window.location.origin);
    window.location.assign(url);
};
