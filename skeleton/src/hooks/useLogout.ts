import { useCallback } from "react";
import { useAuth } from "react-oidc-context";

/**
 * Signs out through Cognito's hosted /logout.
 *
 * Cognito's discovery document has no end_session_endpoint, so AuthProvider seeds it with the
 * hosted domain's /logout. Cognito's /logout needs client_id and logout_uri (one of the client's
 * logout URLs). signoutRedirect also revokes the refresh token and stops AuthGuard logging back in.
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
