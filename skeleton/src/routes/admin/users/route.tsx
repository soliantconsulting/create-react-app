import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Box, Button, List, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { z } from "zod/mini";
import { InlineSpinner } from "#/components/InlineSpinner.js";
import { ButtonLink } from "#/components/Link/index.js";
import {
    type SearchableAttribute,
    searchableAttributeLabels,
    searchableAttributes,
} from "#/queries/admin-user.js";
import { useQueryOptionsFactory } from "#/queries/index.js";
import { UserListItem } from "../-components/UserListItem.js";

type UserListProps = {
    search?: string;
    searchAttribute?: SearchableAttribute;
};

const UserList = ({ search, searchAttribute }: UserListProps): ReactNode => {
    const qof = useQueryOptionsFactory();
    const query = useSuspenseInfiniteQuery(qof.adminUser.list({ search, searchAttribute }));
    const users = query.data.pages.flatMap((page) => page.users);

    if (users.length === 0) {
        return <Typography sx={{ my: 2 }}>No users found.</Typography>;
    }

    return (
        <>
            <List>
                {users.map((user) => (
                    <UserListItem key={user.username} user={user} />
                ))}
            </List>

            {query.hasNextPage && (
                <Button
                    loading={query.isFetchingNextPage}
                    onClick={() => {
                        void query.fetchNextPage();
                    }}
                >
                    Load more
                </Button>
            )}
        </>
    );
};

const Root = (): ReactNode => {
    const { search, attribute } = Route.useSearch();
    const navigate = Route.useNavigate();
    const [searchInput, setSearchInput] = useState(search ?? "");
    const lastPushedSearch = useRef(search ?? "");

    // The URL changed from outside the input (tab link, back button), so follow it.
    useEffect(() => {
        if ((search ?? "") !== lastPushedSearch.current) {
            lastPushedSearch.current = search ?? "";
            setSearchInput(search ?? "");
        }
    }, [search]);

    // Debounce the search so that every keystroke does not hit the Cognito API.
    useEffect(() => {
        if (searchInput === lastPushedSearch.current) {
            return;
        }

        const timeout = setTimeout(() => {
            lastPushedSearch.current = searchInput;
            void navigate({
                search: (previous) => ({
                    ...previous,
                    search: searchInput === "" ? undefined : searchInput,
                }),
                replace: true,
            });
        }, 300);

        return () => {
            clearTimeout(timeout);
        };
    }, [searchInput, navigate]);

    return (
        <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 1 }}>
                <TextField
                    select
                    size="small"
                    label="Search by"
                    value={attribute ?? "email"}
                    onChange={(event) => {
                        const selected = searchableAttributes.find(
                            (searchableAttribute) => searchableAttribute === event.target.value,
                        );

                        void navigate({
                            search: (previous) => ({ ...previous, attribute: selected }),
                            replace: true,
                        });
                    }}
                    sx={{ minWidth: 160 }}
                >
                    {searchableAttributes.map((searchableAttribute) => (
                        <MenuItem key={searchableAttribute} value={searchableAttribute}>
                            {searchableAttributeLabels[searchableAttribute]}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    size="small"
                    label="Starts with"
                    value={searchInput}
                    onChange={(event) => {
                        setSearchInput(event.target.value);
                    }}
                    sx={{ flexGrow: 1 }}
                />
                <Box>
                    <ButtonLink
                        to="/admin/users/create"
                        search={true}
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                    >
                        Invite user
                    </ButtonLink>
                </Box>
            </Stack>

            <Suspense fallback={<InlineSpinner />}>
                <UserList search={search} searchAttribute={attribute} />
            </Suspense>

            <Outlet />
        </>
    );
};

export const Route = createFileRoute("/admin/users")({
    component: Root,
    validateSearch: z.object({
        search: z.optional(z.string()),
        attribute: z.optional(z.enum(searchableAttributes)),
    }),
});
