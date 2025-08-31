import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Collapse,
    Divider,
    IconButton,
    type IconButtonProps,
    styled,
    Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";
import { serializeError } from "serialize-error";

type ExpandMoreProps = IconButtonProps & {
    expand: boolean;
};

const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme }) => ({
    transform: "rotate(180deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.shortest,
    }),
    variants: [
        {
            props: ({ expand }) => !expand,
            style: {
                transform: "rotate(0deg)",
            },
        },
    ],
}));

type Props = {
    error: Error;
};

const ErrorCard = ({ error }: Props): ReactNode => {
    const [expanded, setExpanded] = useState(false);

    const errorDetails = JSON.stringify(
        {
            path: window.location.pathname,
            error: serializeError(error),
        },
        undefined,
        2,
    );

    return (
        <Card>
            <CardContent>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                        color: "error",
                    }}
                >
                    Something went wrong
                </Typography>
                <Typography>An unexpected error occurred, please try again.</Typography>
            </CardContent>
            <CardActions disableSpacing>
                <Button component="a" href="/">
                    Reload the app
                </Button>
                <ExpandMore
                    expand={expanded}
                    onClick={() => {
                        setExpanded(!expanded);
                    }}
                >
                    <ExpandMoreIcon />
                </ExpandMore>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Divider />
                <CardContent>
                    <Typography
                        sx={{
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {errorDetails}
                    </Typography>
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default ErrorCard;
