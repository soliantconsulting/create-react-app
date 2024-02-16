import type { TransitionProps } from "@mui/material/transitions";
import { type ReactNode, useState } from "react";

type RenderControllerProps = {
    onClick: () => void;
};

export type RenderDialogProps = {
    open: boolean;
    onClose: () => void;
    TransitionProps: TransitionProps;
};

type Props = {
    controller: (props: RenderControllerProps) => ReactNode;
    dialog: (props: RenderDialogProps) => ReactNode;
};

const DialogController = ({ controller, dialog }: Props): ReactNode => {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    return (
        <>
            {controller({
                onClick: () => {
                    setOpen(true);
                    setMounted(true);
                },
            })}

            {mounted &&
                dialog({
                    open,
                    onClose: () => {
                        setOpen(false);
                    },
                    TransitionProps: {
                        onExited: () => {
                            setMounted(false);
                        },
                    },
                })}
        </>
    );
};

export default DialogController;
