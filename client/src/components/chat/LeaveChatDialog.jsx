import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { socket } from "../../socket";

export default function LeaveChatDialog({open, setIsOpen, chatId}){
  function leaveChat() {
    socket.emit("leave_chat", chatId);
  }
  
  return (
    <Dialog open={open} onClose={() => setIsOpen(false)}>
        <DialogTitle>Leave chat</DialogTitle>
        <DialogContent>
          <Typography>Do you really want to leave this chat?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" onClick={leaveChat}>Yes</Button>
          <Button variant="outlined" onClick={() => setIsOpen(false)}>No</Button>
        </DialogActions>
      </Dialog>
  );
}