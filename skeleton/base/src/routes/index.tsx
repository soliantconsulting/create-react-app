import { Container } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

const Root = (): ReactNode => {
    return <Container>Welcome Home!</Container>;
};

export const Route = createFileRoute("/")({
    component: Root,
});
