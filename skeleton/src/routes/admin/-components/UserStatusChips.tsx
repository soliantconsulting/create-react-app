import type { UserStatusType } from "@aws-sdk/client-cognito-identity-provider";
import { Chip, type ChipProps, Stack } from "@mui/material";
import type { ReactNode } from "react";
import type { AdminUser } from "#/queries/admin-user.js";

const statuses: Partial<Record<UserStatusType, { label: string; color: ChipProps["color"] }>> = {
    CONFIRMED: { label: "Active", color: "success" },
    FORCE_CHANGE_PASSWORD: { label: "Invited", color: "info" },
    RESET_REQUIRED: { label: "Password reset required", color: "warning" },
    UNCONFIRMED: { label: "Unconfirmed", color: "default" },
    EXTERNAL_PROVIDER: { label: "External login", color: "default" },
};

type Props = {
    user: AdminUser;
};

export const UserStatusChips = ({ user }: Props): ReactNode => {
    const status = user.status
        ? (statuses[user.status] ?? { label: user.status, color: "default" })
        : null;

    return (
        <Stack direction="row" spacing={1}>
            {!user.enabled && <Chip size="small" color="error" label="Disabled" />}
            {status && (
                <Chip size="small" variant="outlined" color={status.color} label={status.label} />
            )}
        </Stack>
    );
};
