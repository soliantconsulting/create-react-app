import type { RenderDialogProps } from "@/components/DialogController/index.ts";
import { useUpdateArticleMutation } from "@/mutations/article.ts";
import { useArticleQuery } from "@/queries/article.ts";
import { Backdrop, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import type { ReactNode } from "react";
import ArticleFormDialog, { type ArticleFormValues } from "./ArticleFormDialog.tsx";

type Props = {
    articleId: string;
    DialogProps: RenderDialogProps;
};

const EditArticleFormDialog = ({ articleId, DialogProps }: Props): ReactNode => {
    const { enqueueSnackbar } = useSnackbar();
    const articleQuery = useArticleQuery(articleId);
    const updateMutation = useUpdateArticleMutation();

    const handleSubmit = async (values: ArticleFormValues) => {
        try {
            await updateMutation.mutateAsync({
                id: articleId,
                attributes: values,
            });
        } catch {
            enqueueSnackbar("Failed to update article", { variant: "error" });
            return;
        }

        enqueueSnackbar("Article has been updated", { variant: "success" });
        DialogProps.onClose();
    };

    useEffect(() => {
        if (articleQuery.isError) {
            enqueueSnackbar("Failed to load article", { variant: "error" });
        }
    }, [articleQuery.isError, enqueueSnackbar]);

    if (articleQuery.isPending) {
        return (
            <Backdrop open>
                <CircularProgress />
            </Backdrop>
        );
    }

    if (articleQuery.isError) {
        return;
    }

    const article = articleQuery.data;

    return (
        <ArticleFormDialog
            title="Edit article"
            defaultValues={{
                title: article.title,
                content: article.content,
            }}
            onSubmit={handleSubmit}
            DialogProps={DialogProps}
        />
    );
};

export default EditArticleFormDialog;
