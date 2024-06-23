import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

import { socket } from "../../socket";

export default function MessageDeleteDialog({ messageId, isDeleteDialogOpen, setIsDeleteDialogOpen }) {
  function deleteMessage(){
    socket.emit("delete_message", messageId);
    setIsDeleteDialogOpen(false);
  }
  
  return (
    <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
      <DialogTitle>Delete message</DialogTitle>
      <DialogContent>
        Do you really want to delete this message?
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="error" onClick={deleteMessage}>Yes</Button>
        <Button variant="outlined" onClick={() => setIsDeleteDialogOpen(false)}>No</Button>
      </DialogActions>
    </Dialog>
  );
}