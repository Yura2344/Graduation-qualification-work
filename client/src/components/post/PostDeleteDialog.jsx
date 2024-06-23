import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useNavigate } from "react-router";
import { enqueueSnackbar } from "notistack";

import { axiosInstance } from "../../axios";

export default function PostDeleteDialog({ postId, isDeleteDialogOpen, setIsDeleteDialogOpen }) {
  const navigate = useNavigate();

  function deletePost() {
    axiosInstance.delete(`/posts/${postId}`).then((res) => {
      enqueueSnackbar("Successfully deleted post");
      setIsDeleteDialogOpen(false);
      navigate("/");
      navigate(0);
    });
  }

  return (
    <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
      <DialogTitle>Delete post</DialogTitle>
      <DialogContent>
        Do you really want to delete this post?
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="error" onClick={deletePost}>Yes</Button>
        <Button variant="outlined" onClick={() => setIsDeleteDialogOpen(false)}>No</Button>
      </DialogActions>
    </Dialog>
  );
}