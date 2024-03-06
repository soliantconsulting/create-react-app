import DialogController from "@/components/DialogController/index.ts";
import { useArticlesQuery } from "@/queries/article.ts";
import { Button, ButtonGroup, Container, LinearProgress, List, Typography } from "@mui/material";
import type { PageParams } from "jsonapi-zod-query";
import type { ReactNode } from "react";
import { useState } from "react";
import ArticleListItem from "./ArticleListItem.tsx";
import CreateArticleFormDialog from "./CreateArticleFormDialog.tsx";

type PaginationButtonProps = {
    label: string;
    pageParams: PageParams | undefined;
    setPageParams: (pageParams: PageParams) => void;
};

const PaginationButton = ({
    label,
    pageParams,
    setPageParams,
}: PaginationButtonProps): ReactNode => (
    <Button
        disabled={pageParams === undefined}
        onClick={() => {
            if (pageParams !== undefined) {
                setPageParams(pageParams);
            }
        }}
    >
        {label}
    </Button>
);

const ArticleList = (): ReactNode => {
    const [pageParams, setPageParams] = useState<PageParams | undefined>(undefined);
    const articlesQuery = useArticlesQuery(pageParams);

    if (articlesQuery.isPending) {
        return <LinearProgress />;
    }

    if (articlesQuery.isError) {
        throw articlesQuery.error;
    }

    const paginated = articlesQuery.data;

    if (paginated.data.length === 0) {
        return <Typography>There are no articles.</Typography>;
    }

    return (
        <>
            <List>
                {paginated.data.map((article) => (
                    <ArticleListItem key={article.id} article={article} />
                ))}
            </List>

            {(paginated.pageParams.first || paginated.pageParams.last) && (
                <ButtonGroup variant="contained">
                    <PaginationButton
                        label="First"
                        pageParams={paginated.pageParams.first}
                        setPageParams={setPageParams}
                    />
                    <PaginationButton
                        label="Prev"
                        pageParams={paginated.pageParams.prev}
                        setPageParams={setPageParams}
                    />
                    <PaginationButton
                        label="Next"
                        pageParams={paginated.pageParams.next}
                        setPageParams={setPageParams}
                    />
                    <PaginationButton
                        label="Last"
                        pageParams={paginated.pageParams.last}
                        setPageParams={setPageParams}
                    />
                </ButtonGroup>
            )}
        </>
    );
};

const ArticlesPage = (): ReactNode => {
    return (
        <Container>
            <Typography variant="h6" gutterBottom>
                Articles
            </Typography>

            <DialogController
                controller={(props) => <Button {...props}>Create article</Button>}
                dialog={(props) => <CreateArticleFormDialog DialogProps={props} />}
            />

            <ArticleList />
        </Container>
    );
};

export default ArticlesPage;
