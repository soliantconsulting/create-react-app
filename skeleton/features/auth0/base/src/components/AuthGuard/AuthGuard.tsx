import { useAuth0 } from "@auth0/auth0-react";
import FullPageSpinner from "@components/FullPageSpinner/index.ts";
import { useEffect } from "react";
import type { ReactNode } from "react";
import AuthError from "./AuthError.tsx";

type Props = {
    children: ReactNode;
};

const AuthGuard = ({ children }: Props): ReactNode => {
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

    return <FullPageSpinner />;
};

export default AuthGuard;
