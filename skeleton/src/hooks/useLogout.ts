import { useCallback } from "react";
import { useAuth } from "react-oidc-context";

/**
 * Cognito's discovery document has no end_session_endpoint, so logout goes to the hosted
 * domain's /logout directly. The logout URI must be one of the client's logout URLs.
 */
export const useLogout = (): (() => Promise<void>) => {
    const { removeUser } = useAuth();

    return useCallback(async () => {
        await removeUser();

        const url = new URL("/logout", import.meta.env.VITE_APP_COGNITO_DOMAIN);
        url.searchParams.set("client_id", import.meta.env.VITE_APP_COGNITO_CLIENT_ID);
        url.searchParams.set("logout_uri", window.location.origin);
        window.location.assign(url);
    }, [removeUser]);
};
