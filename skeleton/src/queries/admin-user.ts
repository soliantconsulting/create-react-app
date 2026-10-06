import {
    AdminGetUserCommand,
    AdminListGroupsForUserCommand,
    type AttributeType,
    type CognitoIdentityProviderClient,
    ListUsersCommand,
    type UserStatusType,
    type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getConfig } from "#/utils/config.js";

export type AdminUser = {
    username: string;
    email: string | null;
    emailVerified: boolean;
    givenName: string | null;
    familyName: string | null;
    phoneNumber: string | null;
    status: UserStatusType | null;
    enabled: boolean;
    createdAt: Temporal.Instant | null;
    updatedAt: Temporal.Instant | null;
    attributes: Record<string, string>;
};

export type AdminUserDetails = AdminUser & {
    groups: string[];
    mfaMethods: string[];
    preferredMfa: string | null;
};

export type AdminUserPage = {
    users: AdminUser[];
    nextToken: string | null;
};

/**
 * Attributes supported by the `ListUsers` filter that are useful to search by.
 */
export const searchableAttributes = ["email", "given_name", "family_name"] as const;

export type SearchableAttribute = (typeof searchableAttributes)[number];

export const searchableAttributeLabels: Record<SearchableAttribute, string> = {
    email: "Email",
    given_name: "Given name",
    family_name: "Family name",
};

export type ListAdminUsersOptions = {
    search?: string;
    searchAttribute?: SearchableAttribute;
};

const toInstant = (date: Date | undefined): Temporal.Instant | null =>
    date ? Temporal.Instant.fromEpochMilliseconds(date.getTime()) : null;

const mapAttributes = (attributes: AttributeType[] | undefined): Record<string, string> =>
    Object.fromEntries(
        (attributes ?? []).flatMap((attribute) =>
            attribute.Name && attribute.Value !== undefined
                ? [[attribute.Name, attribute.Value]]
                : [],
        ),
    );

export const mapAdminUser = (
    user: Pick<
        UserType,
        | "Username"
        | "Attributes"
        | "UserStatus"
        | "Enabled"
        | "UserCreateDate"
        | "UserLastModifiedDate"
    >,
): AdminUser => {
    const attributes = mapAttributes(user.Attributes);

    return {
        username: user.Username ?? "",
        email: attributes.email ?? null,
        emailVerified: attributes.email_verified === "true",
        givenName: attributes.given_name ?? null,
        familyName: attributes.family_name ?? null,
        phoneNumber: attributes.phone_number ?? null,
        status: user.UserStatus ?? null,
        enabled: user.Enabled ?? false,
        createdAt: toInstant(user.UserCreateDate),
        updatedAt: toInstant(user.UserLastModifiedDate),
        attributes,
    };
};

export const getUserDisplayName = (user: AdminUser): string => {
    const names = [user.givenName, user.familyName].filter((name) => name !== null);

    if (names.length > 0) {
        return names.join(" ");
    }

    if (user.email !== null) {
        return user.email;
    }

    return user.username;
};

// `ListUsers` filter values are double-quoted strings.
const escapeFilterValue = (value: string): string =>
    value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const listUserGroups = async (
    client: CognitoIdentityProviderClient,
    userPoolId: string,
    username: string,
    signal: AbortSignal,
): Promise<string[]> => {
    const groups: string[] = [];
    let nextToken: string | undefined;

    do {
        const result = await client.send(
            new AdminListGroupsForUserCommand({
                UserPoolId: userPoolId,
                Username: username,
                Limit: 60,
                NextToken: nextToken,
            }),
            { abortSignal: signal },
        );

        for (const group of result.Groups ?? []) {
            if (group.GroupName) {
                groups.push(group.GroupName);
            }
        }

        nextToken = result.NextToken;
    } while (nextToken);

    return groups;
};

export const createAdminUserQueryOptionsFactory = (client: CognitoIdentityProviderClient) => ({
    list: (options: ListAdminUsersOptions) =>
        infiniteQueryOptions({
            queryKey: ["admin-users", options],
            queryFn: async ({ pageParam, signal }): Promise<AdminUserPage> => {
                const search = options.search?.trim();
                const result = await client.send(
                    new ListUsersCommand({
                        UserPoolId: getConfig().userPoolId,
                        Limit: 60,
                        PaginationToken: pageParam ?? undefined,
                        Filter: search
                            ? `${options.searchAttribute ?? "email"} ^= "${escapeFilterValue(search)}"`
                            : undefined,
                    }),
                    { abortSignal: signal },
                );

                return {
                    users: (result.Users ?? []).map(mapAdminUser),
                    nextToken: result.PaginationToken ?? null,
                };
            },
            initialPageParam: null as string | null,
            getNextPageParam: (lastPage) => lastPage.nextToken,
        }),
    get: (username: string) =>
        queryOptions({
            queryKey: ["admin-user", username],
            queryFn: async ({ signal }): Promise<AdminUserDetails> => {
                const { userPoolId } = getConfig();

                const [user, groups] = await Promise.all([
                    client.send(
                        new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username }),
                        { abortSignal: signal },
                    ),
                    listUserGroups(client, userPoolId, username, signal),
                ]);

                return {
                    ...mapAdminUser({ ...user, Attributes: user.UserAttributes }),
                    groups: groups.sort((a, b) => a.localeCompare(b)),
                    mfaMethods: user.UserMFASettingList ?? [],
                    preferredMfa: user.PreferredMfaSetting ?? null,
                };
            },
        }),
});
