import { Dialog, DialogContent, DialogTitle } from "@mui/material";

import UsersSearch from "../user/UsersSearch";
import { socket } from "../../socket";

export default function AddMemberDialog({open, setIsOpen, chatId}){
  function addMember(userId) {
    socket.emit("add_user_to_chat", userId, chatId);
  }
  return (
    <Dialog open={open} onClose={() => setIsOpen(false)}>
        <DialogTitle>Add member</DialogTitle>
        <DialogContent>
          <UsersSearch userClickFunction={(user) => { addMember(user.id); setIsOpen(false) }} />
        </DialogContent>
      </Dialog>
  );
}