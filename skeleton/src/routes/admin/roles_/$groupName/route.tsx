import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button, List, Stack, Typography } from "@mui/material";
import { useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { InlineSpinner } from "#/components/InlineSpinner.js";
import { IconButtonLink } from "#/components/Link/index.js";
import { useQueryOptionsFactory } from "#/queries/index.js";
import { UserListItem } from "../../-components/UserListItem.js";

const Root = (): ReactNode => {
    const { groupName } = Route.useParams();
    const qof = useQueryOptionsFactory();
    const group = useSuspenseQuery(qof.adminGroup.get(groupName)).data;
    const members = useSuspenseInfiniteQuery(qof.adminGroup.members(groupName));
    const users = members.data.pages.flatMap((page) => page.users);

    return (
        <>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                <IconButtonLink to="/admin/roles" aria-label="Back to roles">
                    <ArrowBackIcon />
                </IconButtonLink>
                <Typography variant="h6">{group.name}</Typography>
            </Stack>

            {group.description && <Typography sx={{ mb: 2 }}>{group.description}</Typography>}

            {users.length === 0 ? (
                <Typography sx={{ my: 2 }}>No users have this role.</Typography>
            ) : (
                <List>
                    {users.map((user) => (
                        <UserListItem key={user.username} user={user} />
                    ))}
                </List>
            )}

            {members.hasNextPage && (
                <Button
                    loading={members.isFetchingNextPage}
                    onClick={() => {
                        void members.fetchNextPage();
                    }}
                >
                    Load more
                </Button>
            )}
        </>
    );
};

export const Route = createFileRoute("/admin/roles_/$groupName")({
    component: Root,
    pendingComponent: InlineSpinner,
    loader: async ({ context, params }) => {
        await Promise.all([
            context.queryClient.ensureQueryData(context.qof.adminGroup.get(params.groupName)),
            context.queryClient.ensureInfiniteQueryData(
                context.qof.adminGroup.members(params.groupName),
            ),
        ]);
    },
});
