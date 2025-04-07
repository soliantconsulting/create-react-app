import { useCreateArticleMutation } from "@/mutations/article.ts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import ArticleFormDialog, { type ArticleFormValues } from "./-components/ArticleFormDialog.tsx";

const Root = (): ReactNode => {
    const { enqueueSnackbar } = useSnackbar();
    const createMutation = useCreateArticleMutation();
    const navigate = useNavigate();

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
        void navigate({ to: "/articles", search: true });
    };

    return <ArticleFormDialog title="Create article" onSubmit={handleSubmit} />;
};

export const Route = createFileRoute("/articles/create")({
    component: Root,
});
