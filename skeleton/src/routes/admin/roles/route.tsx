import { List, ListItem, ListItemText, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { InlineSpinner } from "#/components/InlineSpinner.js";
import { ListItemButtonLink } from "#/components/Link/index.js";
import { useQueryOptionsFactory } from "#/queries/index.js";

const Root = (): ReactNode => {
    const qof = useQueryOptionsFactory();
    const groups = useSuspenseQuery(qof.adminGroup.list()).data;

    if (groups.length === 0) {
        return <Typography sx={{ my: 2 }}>There are no roles.</Typography>;
    }

    return (
        <List>
            {groups.map((group) => (
                <ListItem key={group.name} disablePadding>
                    <ListItemButtonLink
                        to="/admin/roles/$groupName"
                        params={{ groupName: group.name }}
                    >
                        <ListItemText primary={group.name} secondary={group.description} />
                    </ListItemButtonLink>
                </ListItem>
            ))}
        </List>
    );
};

export const Route = createFileRoute("/admin/roles")({
    component: Root,
    pendingComponent: InlineSpinner,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(context.qof.adminGroup.list());
    },
});
