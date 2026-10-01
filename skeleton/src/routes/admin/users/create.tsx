import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RhfAutocomplete, RhfTextField } from "mui-rhf-integration";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InlineSpinner } from "#/components/InlineSpinner.js";
import { useCreateAdminUserMutation } from "#/mutations/admin-user.js";
import { useQueryOptionsFactory } from "#/queries/index.js";
import { getCognitoErrorMessage } from "#/utils/cognito-error.js";
import { FormDialog } from "../-components/FormDialog.js";

const schema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    givenName: z
        .string()
        .trim()
        .transform((value) => (value === "" ? null : value)),
    familyName: z
        .string()
        .trim()
        .transform((value) => (value === "" ? null : value)),
    groups: z.array(z.string()),
});

type FieldValues = z.input<typeof schema>;
type TransformedValues = z.output<typeof schema>;

const Root = (): ReactNode => {
    const qof = useQueryOptionsFactory();
    const groups = useSuspenseQuery(qof.adminGroup.list()).data;
    const createMutation = useCreateAdminUserMutation();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const form = useForm<FieldValues, unknown, TransformedValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", givenName: "", familyName: "", groups: [] },
    });

    const handleClose = () => {
        void navigate({ to: "/admin/users", search: true });
    };

    const handleSubmit = async (values: TransformedValues) => {
        let result: Awaited<ReturnType<typeof createMutation.mutateAsync>>;

        try {
            result = await createMutation.mutateAsync({
                email: values.email,
                givenName: values.givenName,
                familyName: values.familyName,
                groups: values.groups,
            });
        } catch (error) {
            enqueueSnackbar(getCognitoErrorMessage(error, "Failed to invite user"), {
                variant: "error",
            });
            return;
        }

        if (result.failedGroups.length > 0) {
            enqueueSnackbar(
                `Invitation sent to ${values.email}, but these roles could not be assigned: ${result.failedGroups.join(", ")}`,
                { variant: "warning" },
            );
        } else {
            enqueueSnackbar(`Invitation sent to ${values.email}`, { variant: "success" });
        }

        void navigate({ to: "/admin/users/$username", params: { username: result.username } });
    };

    return (
        <FormDialog
            title="Invite user"
            description="The user receives an email with a temporary password, which they have to change when they first sign in."
            submitLabel="Invite"
            isSubmitting={form.formState.isSubmitting}
            onClose={handleClose}
            onSubmit={form.handleSubmit(handleSubmit)}
        >
            <RhfTextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                required
                autoFocus
            />
            <RhfTextField control={form.control} name="givenName" label="Given name" />
            <RhfTextField control={form.control} name="familyName" label="Family name" />
            <RhfAutocomplete
                control={form.control}
                name="groups"
                multiple
                options={groups.map((group) => group.name)}
                slotProps={{ textField: { label: "Roles" } }}
            />
        </FormDialog>
    );
};

export const Route = createFileRoute("/admin/users/create")({
    component: Root,
    pendingComponent: InlineSpinner,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(context.qof.adminGroup.list());
    },
});
