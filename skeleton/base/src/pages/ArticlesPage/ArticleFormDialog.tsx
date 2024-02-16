import type { RenderDialogProps } from "@components/DialogController/index.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { RhfTextField } from "mui-rhf-integration";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
    title: z.string().trim().min(1),
    content: z.string().trim().min(1),
});

type FieldValues = z.input<typeof schema>;
type TransformedValues = z.output<typeof schema>;
export type ArticleFormValues = TransformedValues;

type Props = {
    title: string;
    defaultValues?: DefaultValues<FieldValues>;
    onSubmit: (values: TransformedValues) => Promise<void>;
    DialogProps: RenderDialogProps;
};

const ArticleFormDialog = ({ title, defaultValues, onSubmit, DialogProps }: Props): ReactNode => {
    const form = useForm<FieldValues, unknown, TransformedValues>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    useEffect(() => {
        form.reset(defaultValues, { keepDefaultValues: true });
    }, [form, defaultValues]);

    return (
        <Dialog
            {...DialogProps}
            PaperProps={{
                component: "form",
                onSubmit: form.handleSubmit(onSubmit),
                noValidate: true,
            }}
        >
            <DialogTitle>{title}</DialogTitle>

            <DialogContent>
                <Stack spacing={2}>
                    <RhfTextField control={form.control} name="title" label="Title" required />
                    <RhfTextField control={form.control} name="content" label="Content" required />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button color="secondary" onClick={DialogProps.onClose}>
                    Cancel
                </Button>
                <Button type="submit">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ArticleFormDialog;
