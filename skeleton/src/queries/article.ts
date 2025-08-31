import {
    createDeserializer,
    handleJsonApiError,
    injectPageParams,
    type PageParams,
} from "@jsonapi-serde/client";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod/mini";
import { zt } from "zod-temporal/mini";
import { apiUrl } from "@/utils/api.ts";

export const articleAttributesSchema = z.object({
    title: z.string(),
    content: z.string(),
    createdAt: zt.offsetDateTime(),
});

const deserializeArticle = createDeserializer({
    type: "article",
    cardinality: "one",
    attributesSchema: articleAttributesSchema,
});

const deserializeArticles = createDeserializer({
    type: "article",
    cardinality: "many",
    attributesSchema: z.pick(articleAttributesSchema, {
        title: true,
        createdAt: true,
    }),
});

export type Article = ReturnType<typeof deserializeArticle>;
export type PaginatedArticles = ReturnType<typeof deserializeArticles>;
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
                return deserializeArticles(await response.json());
            },
        }),
    get: (articleId: string) =>
        queryOptions({
            queryKey: ["article", articleId],
            queryFn: async ({ signal }) => {
                const response = await authFetch(apiUrl(`/articles/${articleId}`), { signal });
                await handleJsonApiError(response);
                return deserializeArticle(await response.json()).data;
            },
        }),
});
