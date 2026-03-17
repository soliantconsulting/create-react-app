import { useAuth0 } from "@auth0/auth0-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { InlineSpinner } from "#/components/InlineSpinner.js";
import { AuthError } from "./AuthError.js";

type Props = {
    children: ReactNode;
};

export const AuthGuard = ({ children }: Props): ReactNode => {
    const { isAuthenticated, isLoading, loginWithRedirect, error } = useAuth0();

    useEffect(() => {
        if (isLoading || isAuthenticated || error) {
            return;
        }

        void loginWithRedirect();
    }, [isLoading, isAuthenticated, error, loginWithRedirect]);

    if (error) {
        return <AuthError error={error} />;
    }

    if (isAuthenticated) {
        return children;
    }

    return <InlineSpinner />;
};

