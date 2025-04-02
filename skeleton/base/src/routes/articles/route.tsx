import { ButtonLink } from "@/components/Link";
import { useQueryOptionsFactory } from "@/queries";
import { ButtonGroup, Container, LinearProgress, List, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import type { ReactNode } from "react";
import { z } from "zod";
import ArticleListItem from "./-components/ArticleListItem.tsx";

const ArticleList = (): ReactNode => {
    const qof = useQueryOptionsFactory();
    const { pageParams } = Route.useSearch();
    const page = useSuspenseQuery(qof.article.list({ pageParams })).data;

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

            {(page.pageParams.first || page.pageParams.last) && (
                <ButtonGroup variant="contained">
                    {page.pageParams.first && (
                        <ButtonLink to="." search={{ pageParams: page.pageParams.first }} />
                    )}
                    {page.pageParams.prev && (
                        <ButtonLink to="." search={{ pageParams: page.pageParams.prev }} />
                    )}
                    {page.pageParams.next && (
                        <ButtonLink to="." search={{ pageParams: page.pageParams.next }} />
                    )}
                    {page.pageParams.last && (
                        <ButtonLink to="." search={{ pageParams: page.pageParams.last }} />
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
    pageParams: fallback(z.record(z.string()), {}).default({}),
});

export const Route = createFileRoute("/articles")({
    component: Root,
    pendingComponent: LinearProgress,
    validateSearch: zodValidator(articleSearchSchema),
    loaderDeps: ({ search: { pageParams } }) => ({ pageParams }),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(context.qof.article.list(deps.pageParams));
    },
});
