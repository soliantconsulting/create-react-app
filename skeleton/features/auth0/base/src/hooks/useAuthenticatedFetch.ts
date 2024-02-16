import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";
import { useLocation } from "react-router-dom";

export class AuthenticatedFetchError extends Error {}

const useAuthenticatedFetch = (): typeof fetch => {
    const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
    const location = useLocation();

    return useCallback(
        async (input: RequestInfo | URL, init?: RequestInit) => {
            let accessToken: string;

            try {
                accessToken = await getAccessTokenSilently();
            } catch {
                await loginWithRedirect({
                    appState: {
                        returnTo: `${location.pathname}${location.search}${location.hash}`,
                    },
                });
                throw new AuthenticatedFetchError(
                    "Refresh token missing, performing login redirect",
                );
            }

            const modifiedInit = init ?? {};
            modifiedInit.headers = new Headers(modifiedInit.headers);
            modifiedInit.headers.set("Authorization", `Bearer ${accessToken}`);

            return await fetch(input, init);
        },
        [getAccessTokenSilently, loginWithRedirect, location],
    );
};

export default useAuthenticatedFetch;
