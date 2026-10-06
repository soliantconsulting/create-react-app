import {
    AdminAddUserToGroupCommand,
    AdminCreateUserCommand,
    AdminDeleteUserAttributesCommand,
    AdminDeleteUserCommand,
    AdminDisableUserCommand,
    AdminEnableUserCommand,
    AdminRemoveUserFromGroupCommand,
    AdminResetUserPasswordCommand,
    AdminSetUserMFAPreferenceCommand,
    AdminSetUserPasswordCommand,
    AdminUpdateUserAttributesCommand,
    AdminUserGlobalSignOutCommand,
    type AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";
import {
    type QueryClient,
    type UseMutationResult,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useCognitoAdminClient } from "#/cognito/CognitoAdminClient.js";
import { getConfig } from "#/utils/config.js";

const invalidateUser = async (
    queryClient: QueryClient,
    username: string,
    { refetchDetail = true }: { refetchDetail?: boolean } = {},
): Promise<void> => {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({
            queryKey: ["admin-user", username],
            refetchType: refetchDetail ? "active" : "none",
        }),
        queryClient.invalidateQueries({ queryKey: ["admin-group-members"] }),
    ]);
};

type UsernameValues = {
    username: string;
};

type CreateAdminUserValues = {
    email: string;
    givenName: string | null;
    familyName: string | null;
    groups: string[];
};

type CreateAdminUserResult = {
    username: string;
    /**
     * Roles that could not be assigned. The user has been created and invited regardless.
     */
    failedGroups: string[];
};

export const useCreateAdminUserMutation = (): UseMutationResult<
    CreateAdminUserResult,
    Error,
    CreateAdminUserValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            const { userPoolId } = getConfig();
            const attributes: AttributeType[] = [
                { Name: "email", Value: values.email },
                // The admin vouches for the address, which also allows password reset codes to be
                // sent to it.
                { Name: "email_verified", Value: "true" },
            ];

            if (values.givenName) {
                attributes.push({ Name: "given_name", Value: values.givenName });
            }

            if (values.familyName) {
                attributes.push({ Name: "family_name", Value: values.familyName });
            }

            const result = await client.send(
                new AdminCreateUserCommand({
                    UserPoolId: userPoolId,
                    Username: values.email,
                    UserAttributes: attributes,
                    DesiredDeliveryMediums: ["EMAIL"],
                }),
            );

            // With email as the sign-in alias, Cognito assigns a generated username.
            const username = result.User?.Username ?? values.email;
            // The invitation has already been sent at this point, so a failed role assignment must
            // not fail the whole operation.
            const results = await Promise.allSettled(
                values.groups.map((group) =>
                    client.send(
                        new AdminAddUserToGroupCommand({
                            UserPoolId: userPoolId,
                            Username: username,
                            GroupName: group,
                        }),
                    ),
                ),
            );
            const failedGroups = values.groups.filter(
                (_group, index) => results[index]?.status === "rejected",
            );

            return { username, failedGroups };
        },
        onSuccess: async ({ username }) => {
            await invalidateUser(queryClient, username);
        },
    });
};

export const useDeleteAdminUserMutation = (): UseMutationResult<void, Error, UsernameValues> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            await client.send(
                new AdminDeleteUserCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                }),
            );
        },
        onSuccess: async (_data, values) => {
            // The detail page stays mounted until the caller navigates away, and refetching it now
            // would fail with UserNotFoundException. The caller removes it once it has navigated away.
            await invalidateUser(queryClient, values.username, { refetchDetail: false });
        },
    });
};

type SetAdminUserEnabledValues = UsernameValues & {
    enabled: boolean;
};

export const useSetAdminUserEnabledMutation = (): UseMutationResult<
    void,
    Error,
    SetAdminUserEnabledValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            const input = { UserPoolId: getConfig().userPoolId, Username: values.username };

            if (values.enabled) {
                await client.send(new AdminEnableUserCommand(input));
                return;
            }

            await client.send(new AdminDisableUserCommand(input));
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};

/**
 * Emails the user a verification code and forces a password reset on their next sign-in.
 *
 * Requires a verified email address.
 */
export const useResetAdminUserPasswordMutation = (): UseMutationResult<
    void,
    Error,
    UsernameValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            await client.send(
                new AdminResetUserPasswordCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                }),
            );
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};

type SetAdminUserPasswordValues = UsernameValues & {
    password: string;
    permanent: boolean;
};

export const useSetAdminUserPasswordMutation = (): UseMutationResult<
    void,
    Error,
    SetAdminUserPasswordValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            await client.send(
                new AdminSetUserPasswordCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                    Password: values.password,
                    Permanent: values.permanent,
                }),
            );
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};

/**
 * Resends the invitation email with a new temporary password.
 *
 * Only works for users who have not signed in yet (status `FORCE_CHANGE_PASSWORD`).
 */
export const useResendAdminUserInviteMutation = (): UseMutationResult<
    void,
    Error,
    UsernameValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            await client.send(
                new AdminCreateUserCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                    MessageAction: "RESEND",
                    DesiredDeliveryMediums: ["EMAIL"],
                }),
            );
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};

/**
 * Revokes all of the user's refresh tokens. Access and ID tokens already issued stay valid until
 * they expire.
 */
export const useGlobalSignOutAdminUserMutation = (): UseMutationResult<
    void,
    Error,
    UsernameValues
> => {
    const client = useCognitoAdminClient();

    return useMutation({
        mutationFn: async (values) => {
            await client.send(
                new AdminUserGlobalSignOutCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                }),
            );
        },
    });
};

/**
 * Only the attributes to change: `undefined` leaves an attribute as is, `null` removes it.
 */
type UpdateAdminUserAttributesValues = UsernameValues & {
    email?: string;
    givenName?: string | null;
    familyName?: string | null;
};

export const useUpdateAdminUserAttributesMutation = (): UseMutationResult<
    void,
    Error,
    UpdateAdminUserAttributesValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            const { userPoolId } = getConfig();
            const attributes: AttributeType[] = [];
            const deletedAttributes: string[] = [];

            if (values.email !== undefined) {
                attributes.push(
                    { Name: "email", Value: values.email },
                    { Name: "email_verified", Value: "true" },
                );
            }

            for (const [name, value] of [
                ["given_name", values.givenName],
                ["family_name", values.familyName],
            ] as const) {
                if (value === undefined) {
                    continue;
                }

                if (value) {
                    attributes.push({ Name: name, Value: value });
                } else {
                    deletedAttributes.push(name);
                }
            }

            if (attributes.length > 0) {
                await client.send(
                    new AdminUpdateUserAttributesCommand({
                        UserPoolId: userPoolId,
                        Username: values.username,
                        UserAttributes: attributes,
                    }),
                );
            }

            if (deletedAttributes.length > 0) {
                await client.send(
                    new AdminDeleteUserAttributesCommand({
                        UserPoolId: userPoolId,
                        Username: values.username,
                        UserAttributeNames: deletedAttributes,
                    }),
                );
            }
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};

type ResetAdminUserMfaValues = UsernameValues & {
    mfaMethods: string[];
};

/**
 * Disables all MFA methods of a user, e.g. after they lost their authenticator device.
 */
export const useResetAdminUserMfaMutation = (): UseMutationResult<
    void,
    Error,
    ResetAdminUserMfaValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            const disabled = { Enabled: false, PreferredMfa: false };

            // Only touch configured methods; disabling a method the pool does not support fails.
            await client.send(
                new AdminSetUserMFAPreferenceCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                    SoftwareTokenMfaSettings: values.mfaMethods.includes("SOFTWARE_TOKEN_MFA")
                        ? disabled
                        : undefined,
                    SMSMfaSettings: values.mfaMethods.includes("SMS_MFA") ? disabled : undefined,
                    EmailMfaSettings: values.mfaMethods.includes("EMAIL_OTP")
                        ? disabled
                        : undefined,
                }),
            );
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};

type AdminUserGroupValues = UsernameValues & {
    groupName: string;
};

export const useAddAdminUserToGroupMutation = (): UseMutationResult<
    void,
    Error,
    AdminUserGroupValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            await client.send(
                new AdminAddUserToGroupCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                    GroupName: values.groupName,
                }),
            );
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};

export const useRemoveAdminUserFromGroupMutation = (): UseMutationResult<
    void,
    Error,
    AdminUserGroupValues
> => {
    const client = useCognitoAdminClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values) => {
            await client.send(
                new AdminRemoveUserFromGroupCommand({
                    UserPoolId: getConfig().userPoolId,
                    Username: values.username,
                    GroupName: values.groupName,
                }),
            );
        },
        onSuccess: async (_data, values) => {
            await invalidateUser(queryClient, values.username);
        },
    });
};
