import { Alert, Container, Tabs, Typography } from "@mui/material";
import {
    createFileRoute,
    type ErrorComponentProps,
    Outlet,
    useRouterState,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ErrorCard } from "#/components/ErrorCard.js";
import { cognitoAdminGroupName, useIsAdmin } from "#/hooks/useIsAdmin.js";
import { TabLink } from "./-components/TabLink.js";

class NotAdminError extends Error {
    public constructor() {
        super("Current user is not an administrator");
        this.name = "NotAdminError";
    }
}

const NotAuthorized = (): ReactNode => (
    <Container maxWidth="md">
        <Alert severity="warning">
            You do not have permission to manage users. Ask an administrator to give you the "
            {cognitoAdminGroupName}" role.
        </Alert>
    </Container>
);

const Root = (): ReactNode => {
    const isAdmin = useIsAdmin();
    const pathname = useRouterState({ select: (state) => state.location.pathname });

    // Covers losing the admin role mid-session; `beforeLoad` covers the initial navigation.
    if (!isAdmin) {
        return <NotAuthorized />;
    }

    return (
        <Container>
            <Typography variant="h5" gutterBottom>
                User management
            </Typography>

            <Tabs value={pathname.startsWith("/admin/roles") ? "roles" : "users"} sx={{ mb: 2 }}>
                <TabLink label="Users" value="users" to="/admin/users" />
                <TabLink label="Roles" value="roles" to="/admin/roles" />
            </Tabs>

            <Outlet />
        </Container>
    );
};

const AdminError = ({ error }: ErrorComponentProps): ReactNode => {
    if (error instanceof NotAdminError) {
        return <NotAuthorized />;
    }

    return (
        <Container maxWidth="md">
            <ErrorCard error={error instanceof Error ? error : new Error(String(error))} />
        </Container>
    );
};

export const Route = createFileRoute("/admin")({
    component: Root,
    errorComponent: AdminError,
    // Stops child loaders from requesting admin credentials for users that cannot get them.
    beforeLoad: ({ context }) => {
        if (!context.isAdmin) {
            throw new NotAdminError();
        }
    },
});
