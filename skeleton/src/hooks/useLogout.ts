import { useCallback } from "react";
import { useAuth } from "react-oidc-context";

/**
 * Cognito's discovery document has no end_session_endpoint, so AuthProvider seeds it with the
 * hosted domain's /logout. Cognito's /logout needs client_id and logout_uri (one of the client's
 * logout URLs). signoutRedirect removes the stored user and sets activeNavigator, so AuthGuard
 * does not start a new login while the browser leaves.
 */
export const useLogout = (): (() => Promise<void>) => {
    const { signoutRedirect } = useAuth();

    return useCallback(async () => {
        await signoutRedirect({
            extraQueryParams: {
                client_id: import.meta.env.VITE_APP_COGNITO_CLIENT_ID,
                logout_uri: window.location.origin,
            },
        });
    }, [signoutRedirect]);
};
