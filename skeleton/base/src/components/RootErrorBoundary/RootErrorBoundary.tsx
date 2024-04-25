import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Collapse,
    Container,
    Divider,
    IconButton,
    type IconButtonProps,
    Typography,
    styled,
} from "@mui/material";
import { CorjMaker } from "caught-object-report-json";
import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation, useRouteError } from "react-router-dom";

type ExpandMoreProps = IconButtonProps & {
    expand: boolean;
};

const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.shortest,
    }),
}));

const corj = CorjMaker.withDefaults({
    metadataFields: false,
});

const RootErrorBoundary = (): ReactNode => {
    const error = useRouteError();
    const location = useLocation();
    const [expanded, setExpanded] = useState(false);

    const errorDetails = [
        `Path: ${location.pathname}`,
        "",
        JSON.stringify(corj.makeReportObject(error), undefined, 2),
    ];

    return (
        <Container maxWidth="sm" sx={{ my: 2 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
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
                        <Typography fontFamily="monospace" whiteSpace="pre-wrap">
                            {errorDetails.join("\n")}
                        </Typography>
                    </CardContent>
                </Collapse>
            </Card>
        </Container>
    );
};


export default RootErrorBoundary;
