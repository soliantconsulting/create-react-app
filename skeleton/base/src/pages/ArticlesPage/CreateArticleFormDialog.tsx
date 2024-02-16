import type { RenderDialogProps } from "@components/DialogController/index.ts";
import { useCreateWorldMutation } from "@mutations/article.ts";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import ArticleFormDialog, { type ArticleFormValues } from "./ArticleFormDialog.tsx";

type Props = {
    DialogProps: RenderDialogProps;
};

const CreateArticleFormDialog = ({ DialogProps }: Props): ReactNode => {
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
        DialogProps.onClose();
    };

    return (
        <ArticleFormDialog
            title="Create article"
            onSubmit={handleSubmit}
            DialogProps={DialogProps}
        />
    );
};

export default CreateArticleFormDialog;
