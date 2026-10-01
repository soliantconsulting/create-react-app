import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import type { User } from "oidc-client-ts";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { getConfig } from "#/utils/config.js";

const CognitoAdminClientContext = createContext<CognitoIdentityProviderClient | null>(null);

type Props = {
    children: ReactNode;
};

/**
 * Provides a Cognito user pool client authenticated with temporary AWS credentials.
 *
 * The signed-in user's ID token is exchanged at the identity pool for credentials of the role
 * attached to their highest-precedence group. Only the `admin` group has a role, so for every other
 * user the credential exchange (and thus every admin call) is denied.
 */
export const CognitoAdminClientProvider = ({ children }: Props): ReactNode => {
    const { user, signinSilent } = useAuth();
    const userRef = useRef<User | null | undefined>(user);
    const signinSilentRef = useRef(signinSilent);

    useEffect(() => {
        userRef.current = user;
        signinSilentRef.current = signinSilent;
    }, [user, signinSilent]);

    const [client] = useState(() => {
        const { region, userPoolId, identityPoolId } = getConfig();

        // Called by the SDK whenever it needs fresh credentials, so it must always return the
        // current, unexpired ID token.
        const getIdToken = async (): Promise<string> => {
            let currentUser = userRef.current;

            if (!currentUser || currentUser.expired) {
                currentUser = await signinSilentRef.current();
            }

            if (!currentUser?.id_token) {
                throw new Error("No valid ID token available");
            }

            return currentUser.id_token;
        };

        return new CognitoIdentityProviderClient({
            region,
            credentials: fromCognitoIdentityPool({
                clientConfig: { region },
                identityPoolId,
                logins: {
                    [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: getIdToken,
                },
            }),
        });
    });

    return (
        <CognitoAdminClientContext.Provider value={client}>
            {children}
        </CognitoAdminClientContext.Provider>
    );
};

export const useCognitoAdminClient = (): CognitoIdentityProviderClient => {
    const client = useContext(CognitoAdminClientContext);

    if (!client) {
        throw new Error("useCognitoAdminClient used outside CognitoAdminClientProvider");
    }

    return client;
};
