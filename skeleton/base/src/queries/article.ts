import { apiUrl } from "@/utils/api.ts";
import { queryOptions } from "@tanstack/react-query";
import {
    type PageParams,
    createDataSelector,
    createResourceCollectionSelector,
    createResourceSelector,
    handleJsonApiError,
    injectPageParams,
} from "jsonapi-zod-query";
import { z } from "zod";
import { zj } from "zod-joda";

export const articleAttributesSchema = z.object({
    title: z.string(),
    content: z.string(),
    createdAt: zj.zonedDateTime(),
});

const articleSelector = createDataSelector(
    createResourceSelector({
        type: "article",
        attributesSchema: articleAttributesSchema,
    }),
);

const articlesSelector = createResourceCollectionSelector({
    type: "article",
    attributesSchema: articleAttributesSchema.pick({
        title: true,
        createdAt: true,
    }),
});

export type Article = ReturnType<typeof articleSelector>;
export type PaginatedArticles = ReturnType<typeof articlesSelector>;
export type ListArticle = PaginatedArticles["data"][number];

export type ListArticlesOptions = {
    pageParams?: PageParams;
};

export const createArticleQueryOptionsFactory = (authFetch: typeof fetch) => ({
    list: (options?: ListArticlesOptions) =>
        queryOptions({
            queryKey: ["articles", options],
            queryFn: async ({ signal }) => {
                const url = apiUrl("/articles");
                url.searchParams.set("fields[article]", "title,createdAt");
                injectPageParams(url, options?.pageParams);

                const response = await authFetch(url, { signal });
                await handleJsonApiError(response);
                return articlesSelector(await response.json());
            },
        }),
    get: (articleId: string) =>
        queryOptions({
            queryKey: ["article", articleId],
            queryFn: async ({ signal }) => {
                const response = await authFetch(apiUrl(`/articles/${articleId}`), { signal });
                await handleJsonApiError(response);
                return articleSelector(await response.json());
            },
        }),
});
