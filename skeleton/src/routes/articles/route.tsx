import { extractPageParams } from "@jsonapi-serde/client";
import { ButtonGroup, Container, LinearProgress, List, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { type ReactNode, useMemo } from "react";
import { z } from "zod/mini";
import { ButtonLink } from "@/components/Link";
import { useQueryOptionsFactory } from "@/queries";
import ArticleListItem from "./-components/ArticleListItem.tsx";

const ArticleList = (): ReactNode => {
    const qof = useQueryOptionsFactory();
    const { pageParams } = Route.useSearch();
    const page = useSuspenseQuery(qof.article.list({ pageParams })).data;
    const documentPageParams = useMemo(() => extractPageParams(page.links ?? {}), [page.links]);

    if (page.data.length === 0) {
        return <Typography>There are no articles.</Typography>;
    }

    return (
        <>
            <List>
                {page.data.map((article) => (
                    <ArticleListItem key={article.id} article={article} />
                ))}
            </List>

            {(documentPageParams.first || documentPageParams.last) && (
                <ButtonGroup variant="contained">
                    {documentPageParams.first && (
                        <ButtonLink to="." search={{ pageParams: documentPageParams.first }} />
                    )}
                    {documentPageParams.prev && (
                        <ButtonLink to="." search={{ pageParams: documentPageParams.prev }} />
                    )}
                    {documentPageParams.next && (
                        <ButtonLink to="." search={{ pageParams: documentPageParams.next }} />
                    )}
                    {documentPageParams.last && (
                        <ButtonLink to="." search={{ pageParams: documentPageParams.last }} />
                    )}
                </ButtonGroup>
            )}
        </>
    );
};

const Root = (): ReactNode => {
    return (
        <Container>
            <Typography variant="h6" gutterBottom>
                Articles
            </Typography>

            <ButtonLink to="/articles/create" search={true}>
                Create article
            </ButtonLink>

            <ArticleList />
            <Outlet />
        </Container>
    );
};

const articleSearchSchema = z.object({
    pageParams: z._default(z.record(z.string(), z.string()), {}),
});

export const Route = createFileRoute("/articles")({
    component: Root,
    pendingComponent: LinearProgress,
    validateSearch: articleSearchSchema,
    loaderDeps: ({ search: { pageParams } }) => ({ pageParams }),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(context.qof.article.list(deps.pageParams));
    },
});
