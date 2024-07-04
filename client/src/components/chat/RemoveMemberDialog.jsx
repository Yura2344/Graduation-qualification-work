import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { socket } from "../../socket";

export default function RemoveMemberDialog({userId, chatId, isOpen, setIsOpen}){
  function removeMember() {
    console.log(userId, chatId)
    socket.emit("remove_user_from_chat", userId, chatId);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogTitle>Remove member</DialogTitle>
      <DialogContent>
        <Typography>Do you really want to remove this member?</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="error" onClick={removeMember}>Yes</Button>
        <Button variant="outlined" onClick={() => setIsOpen(false)}>No</Button>
      </DialogActions>
    </Dialog>
  );
}