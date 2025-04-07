import { useUpdateArticleMutation } from "@/mutations/article.ts";
import { useQueryOptionsFactory } from "@/queries";
import { Backdrop, CircularProgress } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import ArticleFormDialog, { type ArticleFormValues } from "../-components/ArticleFormDialog.tsx";

const Root = (): ReactNode => {
    const { enqueueSnackbar } = useSnackbar();
    const updateMutation = useUpdateArticleMutation();
    const navigate = useNavigate();
    const { articleId } = Route.useParams();
    const qof = useQueryOptionsFactory();
    const article = useSuspenseQuery(qof.article.get(articleId)).data;

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
        void navigate({ to: "/articles", search: true });
    };

    return (
        <ArticleFormDialog
            title="Edit article"
            onSubmit={handleSubmit}
            defaultValues={{
                title: article.title,
                content: article.content,
            }}
        />
    );
};

export const Route = createFileRoute("/articles/$articleId/edit")({
    component: Root,
    pendingComponent: () => (
        <Backdrop open>
            <CircularProgress />
        </Backdrop>
    ),
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(context.qof.article.get(params.articleId));
    },
});
