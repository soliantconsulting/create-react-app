import EditIcon from "@mui/icons-material/Edit";
import {
    Card,
    CardContent,
    CardHeader,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@mui/material";
import type { ReactNode } from "react";
import { ButtonLink } from "#/components/Link/index.js";
import type { AdminUserDetails } from "#/queries/admin-user.js";
import { getConfig } from "#/utils/config.js";

const mfaLabels: Record<string, string> = {
    SOFTWARE_TOKEN_MFA: "Authenticator app",
    SMS_MFA: "SMS",
    EMAIL_OTP: "Email",
};

const formatInstant = (instant: Temporal.Instant | null): string =>
    instant ? instant.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "–";

type Props = {
    user: AdminUserDetails;
};

export const ProfileCard = ({ user }: Props): ReactNode => {
    const rows: [string, ReactNode][] = [
        [
            "Email",
            <Stack key="email" direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <span>{user.email ?? "–"}</span>
                {user.email && (
                    <Chip
                        size="small"
                        variant="outlined"
                        color={user.emailVerified ? "success" : "warning"}
                        label={user.emailVerified ? "Verified" : "Not verified"}
                    />
                )}
            </Stack>,
        ],
        ["Given name", user.givenName ?? "–"],
        ["Family name", user.familyName ?? "–"],
        ["Phone", user.phoneNumber ?? "–"],
        [
            "MFA",
            user.mfaMethods.length > 0
                ? user.mfaMethods.map((method) => mfaLabels[method] ?? method).join(", ")
                : // Cognito does not list an authenticator enrolled at sign-in in a required-MFA pool,
                  // and it cannot be reset: see "Lost authenticator" in the README.
                  getConfig().mfaRequired
                  ? "Required at sign-in"
                  : "Not set up",
        ],
        ["Created", formatInstant(user.createdAt)],
        ["Last updated", formatInstant(user.updatedAt)],
        ["User ID", user.username],
    ];

    return (
        <Card>
            <CardHeader
                title="Profile"
                action={
                    <ButtonLink
                        to="/admin/users/$username/edit"
                        params={{ username: user.username }}
                        startIcon={<EditIcon />}
                    >
                        Edit
                    </ButtonLink>
                }
            />
            <CardContent>
                <Table size="small">
                    <TableBody>
                        {rows.map(([label, value]) => (
                            <TableRow key={label}>
                                <TableCell component="th" sx={{ fontWeight: 500, width: "35%" }}>
                                    {label}
                                </TableCell>
                                <TableCell sx={{ wordBreak: "break-all" }}>{value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
