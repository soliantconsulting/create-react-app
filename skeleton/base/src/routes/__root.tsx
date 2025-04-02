import ErrorCard from "@/components/ErrorCard";
import FullPageSpinner from "@/components/FullPageSpinner";
import type { QueryOptionsFactory } from "@/queries";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type RootRouterContext = {
    queryClient: QueryClient;
    qof: QueryOptionsFactory;
};

const Root = (): ReactNode => {
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div">
                        React App Test
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ py: 2 }}>
                <Outlet />
            </Box>
        </>
    );
};

export const Route = createRootRouteWithContext<RootRouterContext>()({
    component: Root,
    pendingComponent: FullPageSpinner,
    errorComponent: ({ error }) => (
        <Container maxWidth="md" sx={{ my: 2 }}>
            <ErrorCard error={error} />
        </Container>
    ),
});
