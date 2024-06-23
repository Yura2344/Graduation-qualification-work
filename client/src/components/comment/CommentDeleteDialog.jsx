import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { enqueueSnackbar } from "notistack";

import { axiosInstance } from "../../axios";

export default function CommentDeleteDialog({ postId, commentId, isDeleteDialogOpen, setIsDeleteDialogOpen, updateComments }) {
  function deleteComment() {
    axiosInstance.delete(`/posts/${postId}/comments/${commentId}`).then((res) => {
      enqueueSnackbar("Successfully deleted comment");
      setIsDeleteDialogOpen(false);
      updateComments();
    });
  }

  return (
    <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
      <DialogTitle>Delete comment</DialogTitle>
      <DialogContent>
        Do you really want to delete this comment?
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="error" onClick={deleteComment}>Yes</Button>
        <Button variant="outlined" onClick={() => setIsDeleteDialogOpen(false)}>No</Button>
      </DialogActions>
    </Dialog>
  );
}