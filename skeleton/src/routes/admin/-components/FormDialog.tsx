import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
} from "@mui/material";
import type { FormEventHandler, ReactNode } from "react";

declare module "@mui/material" {
    interface DialogPaperSlotPropsOverrides {
        noValidate: boolean;
    }
}

type Props = {
    title: string;
    description?: ReactNode;
    submitLabel?: string;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: FormEventHandler;
    children: ReactNode;
};

export const FormDialog = ({
    title,
    description,
    submitLabel = "Save",
    isSubmitting,
    onClose,
    onSubmit,
    children,
}: Props): ReactNode => (
    <Dialog
        open
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
            paper: {
                component: "form",
                onSubmit,
                noValidate: true,
            },
        }}
    >
        <DialogTitle>{title}</DialogTitle>

        <DialogContent>
            {description && <DialogContentText sx={{ mb: 2 }}>{description}</DialogContentText>}
            <Stack spacing={2} sx={{ pt: 1 }}>
                {children}
            </Stack>
        </DialogContent>

        <DialogActions>
            <Button color="secondary" onClick={onClose}>
                Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
                {submitLabel}
            </Button>
        </DialogActions>
    </Dialog>
);
