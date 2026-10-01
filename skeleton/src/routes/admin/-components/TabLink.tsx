import { Tab as MuiTab, type TabProps as MuiTabProps } from "@mui/material";
import { createLink } from "@tanstack/react-router";
import React from "react";

const MuiTabLinkComponent = React.forwardRef<HTMLAnchorElement, MuiTabProps<"a">>((props, ref) => (
    <MuiTab ref={ref} component="a" {...props} />
));

export const TabLink = createLink(MuiTabLinkComponent);
