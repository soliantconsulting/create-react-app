import { Button, Card, CardActions, CardContent, Container, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useRouteError } from "react-router-dom";

const RootErrorBoundary = (): ReactNode => {
    const error = useRouteError();

    return (
        <Container maxWidth="sm">
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Something went wrong
                    </Typography>

                    <Typography fontFamily="monospace">
                        {error instanceof Error
                            ? error.message
                            : JSON.stringify(error, undefined, 2)}
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button component="a" href="/">
                        Reload the app
                    </Button>
                </CardActions>
            </Card>
        </Container>
    );
};

export default RootErrorBoundary;
