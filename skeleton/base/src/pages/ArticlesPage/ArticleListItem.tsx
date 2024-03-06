import ConfirmDialog from "@/components/ConfirmDialog/index.ts";
import DialogController from "@/components/DialogController/index.ts";
import { useDeleteArticleMutation } from "@/mutations/article.ts";
import EditArticleFormDialog from "@/pages/ArticlesPage/EditArticleFormDialog.tsx";
import type { ListArticle } from "@/queries/article.ts";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, ListItem, ListItemText, Menu, MenuItem } from "@mui/material";
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
                        <DialogController
                            controller={(props) => <MenuItem {...props}>Edit</MenuItem>}
                            dialog={(props) => (
                                <EditArticleFormDialog articleId={article.id} DialogProps={props} />
                            )}
                        />

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
