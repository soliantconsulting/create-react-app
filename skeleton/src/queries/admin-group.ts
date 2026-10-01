import {
    type CognitoIdentityProviderClient,
    GetGroupCommand,
    type GroupType,
    ListGroupsCommand,
    ListUsersInGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { type AdminUserPage, mapAdminUser } from "#/queries/admin-user.js";
import { getConfig } from "#/utils/config.js";

/**
 * A Cognito group. Roles are defined in the CDK stack; the admin UI only lists them and assigns them
 * to users.
 */
export type AdminGroup = {
    name: string;
    description: string | null;
};

const mapGroup = (group: GroupType): AdminGroup => ({
    name: group.GroupName ?? "",
    description: group.Description ?? null,
});

export const createAdminGroupQueryOptionsFactory = (client: CognitoIdentityProviderClient) => ({
    list: () =>
        queryOptions({
            queryKey: ["admin-groups"],
            queryFn: async ({ signal }): Promise<AdminGroup[]> => {
                const groups: AdminGroup[] = [];
                let nextToken: string | undefined;

                do {
                    const result = await client.send(
                        new ListGroupsCommand({
                            UserPoolId: getConfig().userPoolId,
                            Limit: 60,
                            NextToken: nextToken,
                        }),
                        { abortSignal: signal },
                    );

                    groups.push(...(result.Groups ?? []).map(mapGroup));
                    nextToken = result.NextToken;
                } while (nextToken);

                return groups.sort((a, b) => a.name.localeCompare(b.name));
            },
        }),
    get: (groupName: string) =>
        queryOptions({
            queryKey: ["admin-group", groupName],
            queryFn: async ({ signal }): Promise<AdminGroup> => {
                const result = await client.send(
                    new GetGroupCommand({
                        UserPoolId: getConfig().userPoolId,
                        GroupName: groupName,
                    }),
                    { abortSignal: signal },
                );

                if (!result.Group) {
                    throw new Error(`Group "${groupName}" not found`);
                }

                return mapGroup(result.Group);
            },
        }),
    members: (groupName: string) =>
        infiniteQueryOptions({
            queryKey: ["admin-group-members", groupName],
            queryFn: async ({ pageParam, signal }): Promise<AdminUserPage> => {
                const result = await client.send(
                    new ListUsersInGroupCommand({
                        UserPoolId: getConfig().userPoolId,
                        GroupName: groupName,
                        Limit: 60,
                        NextToken: pageParam ?? undefined,
                    }),
                    { abortSignal: signal },
                );

                return {
                    users: (result.Users ?? []).map(mapAdminUser),
                    nextToken: result.NextToken ?? null,
                };
            },
            initialPageParam: null as string | null,
            getNextPageParam: (lastPage) => lastPage.nextToken,
        }),
});
