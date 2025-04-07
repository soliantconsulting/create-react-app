import type { TransitionProps } from "@mui/material/transitions";
import { useCallback, useMemo, useState } from "react";

export type ControlledDialogProps = {
    open: boolean;
    onClose: () => void;
    TransitionProps: TransitionProps;
};

type DialogController = {
    open: () => void;
    mount: boolean;
    dialogProps: ControlledDialogProps;
};

const useDialogController = (): DialogController => {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const handleOpen = useCallback(() => {
        setMounted(true);
        setOpen(true);
    }, []);

    const onClose = useCallback(() => {
        setOpen(false);
    }, []);

    return useMemo(
        () => ({
            open: handleOpen,
            mount: mounted,
            dialogProps: {
                open,
                onClose,
                TransitionProps: {
                    onExited: () => {
                        setMounted(false);
                    },
                },
            },
        }),
        [open, handleOpen, onClose, mounted],
    );
};

export default useDialogController;
