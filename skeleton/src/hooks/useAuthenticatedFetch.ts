import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "@tanstack/react-router";
import { useCallback } from "react";

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
                return new Promise(() => {
                    // Will never resolve
                });
            }

            const modifiedInit = init ?? {};
            modifiedInit.headers = new Headers(modifiedInit.headers);
            modifiedInit.headers.set("Authorization", `Bearer ${accessToken}`);

            return await fetch(input, modifiedInit);
        },
        [getAccessTokenSilently, loginWithRedirect, location],
    );
};

export default useAuthenticatedFetch;
