import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import type { ReactNode } from "react";
import type { ConfirmProps } from "react-confirm-hook";

type ConfirmDialogProps = ConfirmProps & {
    title: string;
    message: NonNullable<ReactNode>;
};

const ConfirmDialog = ({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    isConfirming,
}: ConfirmDialogProps): ReactNode => (
    <Dialog open={open} onClose={onCancel} maxWidth="xs">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
            <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button autoFocus onClick={onCancel} disabled={isConfirming}>
                No
            </Button>
            <Button onClick={onConfirm} color="primary" loading={isConfirming}>
                Yes
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
