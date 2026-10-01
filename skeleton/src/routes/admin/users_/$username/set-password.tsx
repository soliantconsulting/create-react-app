import { zodResolver } from "@hookform/resolvers/zod";
import { FormControlLabel } from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RhfCheckbox, RhfTextField } from "mui-rhf-integration";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSetAdminUserPasswordMutation } from "#/mutations/admin-user.js";
import { getCognitoErrorMessage } from "#/utils/cognito-error.js";
import { FormDialog } from "../../-components/FormDialog.js";

// The user pool enforces the actual password policy; this only catches obvious mistakes early.
const schema = z.object({
    password: z.string().min(12),
    requireChange: z.boolean(),
});

type FieldValues = z.input<typeof schema>;
type TransformedValues = z.output<typeof schema>;

const Root = (): ReactNode => {
    const { username } = Route.useParams();
    const setPasswordMutation = useSetAdminUserPasswordMutation();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const form = useForm<FieldValues, unknown, TransformedValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: "", requireChange: true },
    });

    const handleClose = () => {
        void navigate({ to: "/admin/users/$username", params: { username } });
    };

    const handleSubmit = async (values: TransformedValues) => {
        try {
            await setPasswordMutation.mutateAsync({
                username,
                password: values.password,
                permanent: !values.requireChange,
            });
        } catch (error) {
            enqueueSnackbar(getCognitoErrorMessage(error, "Failed to set password"), {
                variant: "error",
            });
            return;
        }

        enqueueSnackbar("Password has been set", { variant: "success" });
        handleClose();
    };

    return (
        <FormDialog
            title="Set password"
            description="No email is sent. Share the password with the user through a secure channel."
            isSubmitting={form.formState.isSubmitting}
            onClose={handleClose}
            onSubmit={form.handleSubmit(handleSubmit)}
        >
            <RhfTextField
                control={form.control}
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                autoFocus
            />
            <FormControlLabel
                control={<RhfCheckbox control={form.control} name="requireChange" />}
                label="Require the user to change it at next sign-in"
            />
        </FormDialog>
    );
};

export const Route = createFileRoute("/admin/users_/$username/set-password")({
    component: Root,
});
