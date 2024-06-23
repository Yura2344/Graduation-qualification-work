import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { socket } from "../../socket";

export default function DeleteChatDialog({open, setIsOpen, chatId}){
  function deleteChat() {
    socket.emit("delete_chat", chatId);
  }
  
  return (
    <Dialog open={open} onClose={() => setIsOpen(false)}>
        <DialogTitle>Delete chat</DialogTitle>
        <DialogContent>
          <Typography>Do you really want to delete this chat?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" onClick={deleteChat}>Yes</Button>
          <Button variant="outlined" onClick={() => setIsOpen(false)}>No</Button>
        </DialogActions>
      </Dialog>
  );
}