import { createArticleQueryOptionsFactory } from "@/queries/article.ts";
import { type ReactNode, createContext, useContext } from "react";

export const createQueryOptionsFactory = (authFetch: typeof fetch) => ({
    article: createArticleQueryOptionsFactory(authFetch),
});

export type QueryOptionsFactory = ReturnType<typeof createQueryOptionsFactory>;

const QueryOptionsFactoryContext = createContext<QueryOptionsFactory | null>(null);

type QueryOptionsFactoryProviderProps = {
    children: ReactNode;
    factory: QueryOptionsFactory;
};

export const QueryOptionsFactoryProvider = ({
    children,
    factory,
}: QueryOptionsFactoryProviderProps): ReactNode => (
    <QueryOptionsFactoryContext.Provider value={factory}>
        {children}
    </QueryOptionsFactoryContext.Provider>
);

export const useQueryOptionsFactory = (): QueryOptionsFactory => {
    const factory = useContext(QueryOptionsFactoryContext);

    if (!factory) {
        throw new Error("useQueryOptionsFactory used outside QueryOptionsFactoryProvider");
    }

    return factory;
};
