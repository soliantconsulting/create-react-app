import { ListItem, ListItemText } from "@mui/material";
import type { ReactNode } from "react";
import { ListItemButtonLink } from "#/components/Link/index.js";
import { type AdminUser, getUserDisplayName } from "#/queries/admin-user.js";
import { UserStatusChips } from "./UserStatusChips.js";

type Props = {
    user: AdminUser;
};

export const UserListItem = ({ user }: Props): ReactNode => (
    <ListItem disablePadding secondaryAction={<UserStatusChips user={user} />}>
        <ListItemButtonLink to="/admin/users/$username" params={{ username: user.username }}>
            <ListItemText primary={getUserDisplayName(user)} secondary={user.email} />
        </ListItemButtonLink>
    </ListItem>
);
