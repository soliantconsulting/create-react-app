import ConfirmDialog from "@/components/ConfirmDialog/index.ts";
import { useDeleteArticleMutation } from "@/mutations/article.ts";
import type { ListArticle } from "@/queries/article.ts";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, ListItem, ListItemText, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { bindMenu, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import { useConfirm } from "react-confirm-hook";

type Props = {
    article: ListArticle;
};

const ArticleListItem = ({ article }: Props): ReactNode => {
    const popupState = usePopupState({
        variant: "popover",
        popupId: `article-popup-${article.id}`,
    });
    const deleteMutation = useDeleteArticleMutation();
    const { enqueueSnackbar } = useSnackbar();
    const confirm = useConfirm(ConfirmDialog);
    const navigate = useNavigate();

    const handleDelete = () => {
        confirm({
            title: "Confirm deletion",
            message: "Do you really want to delete this article?",
            onConfirm: async () => {
                try {
                    await deleteMutation.mutateAsync({ id: article.id });
                } catch {
                    enqueueSnackbar("Failed to delete article", { variant: "error" });
                    return;
                }

                enqueueSnackbar("Article deleted", { variant: "success" });
            },
        });
    };

    return (
        <ListItem
            secondaryAction={
                <>
                    <IconButton {...bindTrigger(popupState)}>
                        <MoreVertIcon />
                    </IconButton>
                    <Menu {...bindMenu(popupState)}>
                        <MenuItem
                            onClick={() => {
                                void navigate({
                                    to: "/articles/$articleId/edit",
                                    params: { articleId: article.id },
                                });
                                popupState.close();
                            }}
                        >
                            Edit
                        </MenuItem>
                        <MenuItem onClick={handleDelete}>Delete</MenuItem>
                    </Menu>
                </>
            }
        >
            <ListItemText>{article.title}</ListItemText>
        </ListItem>
    );
};

export default ArticleListItem;
