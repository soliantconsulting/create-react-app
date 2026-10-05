import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Button, Divider, Menu, MenuItem } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useConfirm } from "material-ui-confirm";
import { bindMenu, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import { MenuItemLink } from "#/components/Link/index.js";
import { useCurrentUsername } from "#/hooks/useIsAdmin.js";
import {
    useDeleteAdminUserMutation,
    useGlobalSignOutAdminUserMutation,
    useResendAdminUserInviteMutation,
    useResetAdminUserMfaMutation,
    useResetAdminUserPasswordMutation,
    useSetAdminUserEnabledMutation,
} from "#/mutations/admin-user.js";
import { type AdminUserDetails, getUserDisplayName } from "#/queries/admin-user.js";
import { getCognitoErrorMessage } from "#/utils/cognito-error.js";

type Action = {
    title: string;
    description: string;
    confirmationText: string;
    run: () => Promise<void>;
    successMessage: string;
    failureMessage: string;
};

type Props = {
    user: AdminUserDetails;
};

export const UserActionsMenu = ({ user }: Props): ReactNode => {
    const popupState = usePopupState({ variant: "popover", popupId: "user-actions" });
    const confirm = useConfirm();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isSelf = useCurrentUsername() === user.username;
    const name = getUserDisplayName(user);
    const { username } = user;

    const resetPasswordMutation = useResetAdminUserPasswordMutation();
    const resendInviteMutation = useResendAdminUserInviteMutation();
    const resetMfaMutation = useResetAdminUserMfaMutation();
    const globalSignOutMutation = useGlobalSignOutAdminUserMutation();
    const setEnabledMutation = useSetAdminUserEnabledMutation();
    const deleteMutation = useDeleteAdminUserMutation();

    const runAction = async (action: Action): Promise<boolean> => {
        popupState.close();

        const { confirmed } = await confirm({
            title: action.title,
            description: action.description,
            confirmationText: action.confirmationText,
        });

        if (!confirmed) {
            return false;
        }

        try {
            await action.run();
        } catch (error) {
            enqueueSnackbar(getCognitoErrorMessage(error, action.failureMessage), {
                variant: "error",
            });
            return false;
        }

        enqueueSnackbar(action.successMessage, { variant: "success" });
        return true;
    };

    const handleResetPassword = () => {
        void runAction({
            title: "Send password reset code?",
            description: `${name} receives an email with a code and has to choose a new password on their next sign-in. Their current password stops working immediately.`,
            confirmationText: "Send code",
            run: () => resetPasswordMutation.mutateAsync({ username }),
            successMessage: "Password reset code sent",
            failureMessage: "Failed to reset password",
        });
    };

    const handleResendInvite = () => {
        void runAction({
            title: "Resend invitation?",
            description: `${name} receives a new invitation email with a new temporary password.`,
            confirmationText: "Resend",
            run: () => resendInviteMutation.mutateAsync({ username }),
            successMessage: "Invitation resent",
            failureMessage: "Failed to resend invitation",
        });
    };

    const handleResetMfa = () => {
        void runAction({
            title: "Reset multi-factor authentication?",
            description: `This disables all MFA methods for ${name}, e.g. after losing their authenticator device.`,
            confirmationText: "Reset MFA",
            run: () => resetMfaMutation.mutateAsync({ username, mfaMethods: user.mfaMethods }),
            successMessage: "MFA reset",
            failureMessage: "Failed to reset MFA",
        });
    };

    const handleGlobalSignOut = () => {
        void runAction({
            title: "Sign out everywhere?",
            description: `${name} is signed out of all devices once their current session expires (at most one hour).`,
            confirmationText: "Sign out",
            run: () => globalSignOutMutation.mutateAsync({ username }),
            successMessage: "User signed out of all sessions",
            failureMessage: "Failed to sign out user",
        });
    };

    const handleToggleEnabled = () => {
        void runAction(
            user.enabled
                ? {
                      title: "Disable user?",
                      description: `${name} can no longer sign in until the account is enabled again.`,
                      confirmationText: "Disable",
                      run: () => setEnabledMutation.mutateAsync({ username, enabled: false }),
                      successMessage: "User disabled",
                      failureMessage: "Failed to disable user",
                  }
                : {
                      title: "Enable user?",
                      description: `${name} can sign in again.`,
                      confirmationText: "Enable",
                      run: () => setEnabledMutation.mutateAsync({ username, enabled: true }),
                      successMessage: "User enabled",
                      failureMessage: "Failed to enable user",
                  },
        );
    };

    const handleDelete = () => {
        void runAction({
            title: "Delete user?",
            description: `${name} is permanently deleted. This cannot be undone.`,
            confirmationText: "Delete",
            run: () => deleteMutation.mutateAsync({ username }),
            successMessage: "User deleted",
            failureMessage: "Failed to delete user",
        }).then(async (deleted) => {
            if (!deleted) {
                return;
            }

            await navigate({ to: "/admin/users" });
            // Only once the detail page is gone: while mounted it would refetch the deleted user.
            queryClient.removeQueries({ queryKey: ["admin-user", username] });
        });
    };

    return (
        <>
            <Button variant="outlined" endIcon={<MoreVertIcon />} {...bindTrigger(popupState)}>
                Actions
            </Button>
            <Menu {...bindMenu(popupState)}>
                <MenuItemLink
                    to="/admin/users/$username/set-password"
                    params={{ username }}
                    onClick={popupState.close}
                >
                    Set password…
                </MenuItemLink>
                {/* Invited users have no password to reset yet; resend the invitation instead. */}
                <MenuItem
                    onClick={handleResetPassword}
                    disabled={!user.emailVerified || user.status === "FORCE_CHANGE_PASSWORD"}
                >
                    Send password reset code…
                </MenuItem>
                {user.status === "FORCE_CHANGE_PASSWORD" && (
                    <MenuItem onClick={handleResendInvite}>Resend invitation…</MenuItem>
                )}
                <MenuItem onClick={handleResetMfa} disabled={user.mfaMethods.length === 0}>
                    Reset MFA…
                </MenuItem>
                <MenuItem onClick={handleGlobalSignOut}>Sign out everywhere…</MenuItem>
                <Divider />
                <MenuItem onClick={handleToggleEnabled} disabled={isSelf}>
                    {user.enabled ? "Disable user…" : "Enable user…"}
                </MenuItem>
                <MenuItem onClick={handleDelete} disabled={isSelf} sx={{ color: "error.main" }}>
                    Delete user…
                </MenuItem>
            </Menu>
        </>
    );
};
