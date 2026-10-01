import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RhfTextField } from "mui-rhf-integration";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "react-oidc-context";
import { z } from "zod";
import { useCurrentUsername } from "#/hooks/useIsAdmin.js";
import { useUpdateAdminUserAttributesMutation } from "#/mutations/admin-user.js";
import { useQueryOptionsFactory } from "#/queries/index.js";
import { getCognitoErrorMessage } from "#/utils/cognito-error.js";
import { FormDialog } from "../../-components/FormDialog.js";

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
});

type FieldValues = z.input<typeof schema>;
type TransformedValues = z.output<typeof schema>;

// `undefined` when unchanged, `null` when cleared.
const diffAttribute = (value: string | null, current: string | null): string | null | undefined =>
    value === current ? undefined : value;

const Root = (): ReactNode => {
    const { username } = Route.useParams();
    const qof = useQueryOptionsFactory();
    const user = useSuspenseQuery(qof.adminUser.get(username)).data;
    const updateMutation = useUpdateAdminUserAttributesMutation();
    const { signinSilent } = useAuth();
    const isSelf = useCurrentUsername() === username;
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const form = useForm<FieldValues, unknown, TransformedValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: user.email ?? "",
            givenName: user.givenName ?? "",
            familyName: user.familyName ?? "",
        },
    });

    const handleClose = () => {
        void navigate({ to: "/admin/users/$username", params: { username } });
    };

    const handleSubmit = async (values: TransformedValues) => {
        try {
            await updateMutation.mutateAsync({
                username,
                // The form lowercases the email, so compare case-insensitively to avoid rewriting
                // an unchanged address.
                email: values.email !== user.email?.toLowerCase() ? values.email : undefined,
                givenName: diffAttribute(values.givenName, user.givenName),
                familyName: diffAttribute(values.familyName, user.familyName),
            });
        } catch (error) {
            enqueueSnackbar(getCognitoErrorMessage(error, "Failed to update user"), {
                variant: "error",
            });
            return;
        }

        enqueueSnackbar("User has been updated", { variant: "success" });

        // The app bar reads name and email from our own ID token, so refresh it.
        if (isSelf) {
            try {
                await signinSilent();
            } catch {
                // The change shows up on the next token refresh instead.
            }
        }

        handleClose();
    };

    return (
        <FormDialog
            title="Edit profile"
            description="Changing the email address also changes the address the user signs in with."
            isSubmitting={form.formState.isSubmitting}
            onClose={handleClose}
            onSubmit={form.handleSubmit(handleSubmit)}
        >
            <RhfTextField control={form.control} name="email" label="Email" type="email" required />
            <RhfTextField control={form.control} name="givenName" label="Given name" />
            <RhfTextField control={form.control} name="familyName" label="Family name" />
        </FormDialog>
    );
};

export const Route = createFileRoute("/admin/users_/$username/edit")({
    component: Root,
});
