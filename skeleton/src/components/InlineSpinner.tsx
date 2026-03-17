import { Box, CircularProgress } from "@mui/material";
import type { ReactNode } from "react";

export const InlineSpinner = (): ReactNode => {
    return (
        <Box
            sx={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
            }}
        >
            <CircularProgress size={80} />
        </Box>
    );
};
