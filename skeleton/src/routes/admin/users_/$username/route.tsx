import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Grid, Stack, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { InlineSpinner } from "#/components/InlineSpinner.js";
import { IconButtonLink } from "#/components/Link/index.js";
import { getUserDisplayName } from "#/queries/admin-user.js";
import { useQueryOptionsFactory } from "#/queries/index.js";
import { UserStatusChips } from "../../-components/UserStatusChips.js";
import { ProfileCard } from "./-components/ProfileCard.js";
import { RolesCard } from "./-components/RolesCard.js";
import { UserActionsMenu } from "./-components/UserActionsMenu.js";

const Root = (): ReactNode => {
    const { username } = Route.useParams();
    const qof = useQueryOptionsFactory();
    const user = useSuspenseQuery(qof.adminUser.get(username)).data;

    return (
        <>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                <IconButtonLink to="/admin/users" aria-label="Back to users">
                    <ArrowBackIcon />
                </IconButtonLink>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {getUserDisplayName(user)}
                </Typography>
                <UserStatusChips user={user} />
                <UserActionsMenu user={user} />
            </Stack>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <ProfileCard user={user} />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <RolesCard user={user} />
                </Grid>
            </Grid>

            <Outlet />
        </>
    );
};

export const Route = createFileRoute("/admin/users_/$username")({
    component: Root,
    pendingComponent: InlineSpinner,
    loader: async ({ context, params }) => {
        await Promise.all([
            context.queryClient.ensureQueryData(context.qof.adminUser.get(params.username)),
            context.queryClient.ensureQueryData(context.qof.adminGroup.list()),
        ]);
    },
});
