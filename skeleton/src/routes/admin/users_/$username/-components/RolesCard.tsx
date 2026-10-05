import {
    Autocomplete,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useConfirm } from "material-ui-confirm";
import { useSnackbar } from "notistack";
import { type ReactNode, useState } from "react";
import { useAuth } from "react-oidc-context";
import { cognitoAdminGroupName, useCurrentUsername } from "#/hooks/useIsAdmin.js";
import {
    useAddAdminUserToGroupMutation,
    useRemoveAdminUserFromGroupMutation,
} from "#/mutations/admin-user.js";
import type { AdminUserDetails } from "#/queries/admin-user.js";
import { useQueryOptionsFactory } from "#/queries/index.js";
import { getCognitoErrorMessage } from "#/utils/cognito-error.js";

type Props = {
    user: AdminUserDetails;
};

export const RolesCard = ({ user }: Props): ReactNode => {
    const qof = useQueryOptionsFactory();
    const groups = useSuspenseQuery(qof.adminGroup.list()).data;
    const addMutation = useAddAdminUserToGroupMutation();
    const removeMutation = useRemoveAdminUserFromGroupMutation();
    const { enqueueSnackbar } = useSnackbar();
    const confirm = useConfirm();
    const { signinSilent } = useAuth();
    const isSelf = useCurrentUsername() === user.username;
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    const availableGroups = groups
        .map((group) => group.name)
        .filter((name) => !user.groups.includes(name));

    // Group memberships are baked into the tokens, so refresh them when changing our own roles.
    const refreshOwnTokens = async () => {
        if (!isSelf) {
            return;
        }

        try {
            await signinSilent();
        } catch {
            // The new roles apply on the next sign-in instead.
        }
    };

    const handleAdd = async () => {
        if (!selectedGroup) {
            return;
        }

        try {
            await addMutation.mutateAsync({ username: user.username, groupName: selectedGroup });
        } catch (error) {
            enqueueSnackbar(getCognitoErrorMessage(error, "Failed to add role"), {
                variant: "error",
            });
            return;
        }

        enqueueSnackbar(`Role "${selectedGroup}" added`, { variant: "success" });
        setSelectedGroup(null);
        await refreshOwnTokens();
    };

    const handleRemove = async (groupName: string) => {
        if (isSelf && groupName === cognitoAdminGroupName) {
            const { confirmed } = await confirm({
                title: "Remove your own admin role?",
                description:
                    "You will immediately lose access to user management and need another administrator to restore it.",
                confirmationText: "Remove",
            });

            if (!confirmed) {
                return;
            }
        }

        try {
            await removeMutation.mutateAsync({ username: user.username, groupName });
        } catch (error) {
            enqueueSnackbar(getCognitoErrorMessage(error, "Failed to remove role"), {
                variant: "error",
            });
            return;
        }

        enqueueSnackbar(`Role "${groupName}" removed`, { variant: "success" });
        await refreshOwnTokens();
    };

    return (
        <Card>
            <CardHeader title="Roles" />
            <CardContent>
                {user.groups.length === 0 ? (
                    <Typography sx={{ mb: 2 }}>This user has no roles.</Typography>
                ) : (
                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
                        {user.groups.map((groupName) => (
                            <Chip
                                key={groupName}
                                label={groupName}
                                color={groupName === cognitoAdminGroupName ? "primary" : "default"}
                                onDelete={() => {
                                    void handleRemove(groupName);
                                }}
                            />
                        ))}
                    </Stack>
                )}

                {availableGroups.length > 0 && (
                    <Stack direction="row" spacing={1}>
                        <Autocomplete
                            size="small"
                            options={availableGroups}
                            value={selectedGroup}
                            onChange={(_event, value) => {
                                setSelectedGroup(value);
                            }}
                            renderInput={(params) => <TextField {...params} label="Add role" />}
                            sx={{ flexGrow: 1 }}
                        />
                        <Button
                            variant="outlined"
                            disabled={!selectedGroup}
                            loading={addMutation.isPending}
                            onClick={() => {
                                void handleAdd();
                            }}
                        >
                            Add
                        </Button>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};
