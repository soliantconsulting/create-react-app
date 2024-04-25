import ConfirmDialog from "@/components/ConfirmDialog/index.ts";
import { useDeleteArticleMutation } from "@/mutations/article.ts";
import EditArticleFormDialog from "@/pages/ArticlesPage/EditArticleFormDialog.tsx";
import type { ListArticle } from "@/queries/article.ts";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, ListItem, ListItemText, Menu, MenuItem } from "@mui/material";
import { bindMenu, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { useSnackbar } from "notistack";
import type { ReactNode } from "react";
import { useConfirm } from "react-confirm-hook";
import useDialogController from "@/hooks/useDialogController.js";

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
    const editDialogController = useDialogController();

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
                                editDialogController.open();
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

            {editDialogController.mount && (
                <EditArticleFormDialog
                    articleId={article.id}
                    dialogProps={editDialogController.dialogProps}
                />
            )}
        </ListItem>
    );
};

export default ArticleListItem;
