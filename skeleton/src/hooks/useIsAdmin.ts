import { useAuth } from "react-oidc-context";

/**
 * Name of the Cognito group whose members may manage users. The group is created by the CDK stack
 * and is the only group mapped to an IAM role in the identity pool.
 */
export const cognitoAdminGroupName = "admin";

export const useCurrentUserGroups = (): string[] => {
    const { user } = useAuth();
    const groups = user?.profile["cognito:groups"];

    return Array.isArray(groups)
        ? groups.filter((group): group is string => typeof group === "string")
        : [];
};

export const useCurrentUsername = (): string | null => {
    const { user } = useAuth();
    const username = user?.profile["cognito:username"];

    return typeof username === "string" ? username : null;
};

export const useIsAdmin = (): boolean => useCurrentUserGroups().includes(cognitoAdminGroupName);
