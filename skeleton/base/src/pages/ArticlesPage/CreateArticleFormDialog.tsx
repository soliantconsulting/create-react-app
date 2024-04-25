import { useCreateWorldMutation } from "@/mutations/article.ts";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import ArticleFormDialog, { type ArticleFormValues } from "./ArticleFormDialog.tsx";
import type { ControlledDialogProps } from "@/hooks/useDialogController.tsx";

type Props = {
    dialogProps: ControlledDialogProps;
};

const CreateArticleFormDialog = ({ dialogProps }: Props): ReactNode => {
    const { enqueueSnackbar } = useSnackbar();
    const createMutation = useCreateWorldMutation();

    const handleSubmit = async (values: ArticleFormValues) => {
        try {
            await createMutation.mutateAsync({
                attributes: values,
            });
        } catch {
            enqueueSnackbar("Failed to create article", { variant: "error" });
            return;
        }

        enqueueSnackbar("Article has been created", { variant: "success" });
        dialogProps.onClose();
    };

    return (
        <ArticleFormDialog
            title="Create article"
            onSubmit={handleSubmit}
            dialogProps={dialogProps}
        />
    );
};

export default CreateArticleFormDialog;
