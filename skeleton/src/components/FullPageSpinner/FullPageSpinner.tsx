import { Box, CircularProgress } from "@mui/material";
import type { ReactNode } from "react";

const FullPageSpinner = (): ReactNode => {
    return (
        <Box
            sx={{
                display: "flex",
                width: "100%",
                height: "100vh",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <CircularProgress size={80} />
        </Box>
    );
};

export default FullPageSpinner;
