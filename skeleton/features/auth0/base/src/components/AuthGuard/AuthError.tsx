import { Button, Card, CardActions, CardContent, Container, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
    error: Error;
};

const AuthError = ({ error }: Props): ReactNode => {
    return (
        <Container sx={{ py: 2 }} maxWidth="sm">
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Failed to log you in
                    </Typography>

                    <Typography gutterBottom>
                        We are unable to log you in. Please contact support.
                    </Typography>

                    <Typography fontFamily="monospace">{error.message}</Typography>
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

export default AuthError;
