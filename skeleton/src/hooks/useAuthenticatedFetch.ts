import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";

export const useAuthenticatedFetch = (): typeof fetch => {
    const { getAccessTokenSilently, loginWithRedirect } = useAuth0();

    return useCallback(
        async (input: RequestInfo | URL, init?: RequestInit) => {
            let accessToken: string | undefined;

            try {
                accessToken = await getAccessTokenSilently();
            } catch {
                // Falls through to the login redirect below.
            }

            if (!accessToken) {
                const { location } = window;
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
        [getAccessTokenSilently, loginWithRedirect],
    );
};
