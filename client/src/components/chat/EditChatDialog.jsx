import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";

import ChangeChatAvatarDialog from "./ChangeChatAvatarDialog";
import { socket } from "../../socket";

export default function EditChatDialog({open, setIsOpen, chatId}) {

  const [chatName, setChatName] = useState("");

  const [isChangeAvatarDialogOpen, setIsChangeAvatarDialogOpen] = useState(false);

  function editChatName(){
    socket.emit("update_chat_name", chatId, chatName);
  }
  return (
    <Dialog open={open} onClose={() => setIsOpen(false)}>
      <DialogTitle>Edit chat</DialogTitle>
      <ChangeChatAvatarDialog open={isChangeAvatarDialogOpen} setIsOpen={setIsChangeAvatarDialogOpen} chatId={chatId}/>
      <DialogContent sx={{
        display: "flex",
        flexDirection: "column",
        rowGap: 2
      }}>
        <TextField
          label="Chat name"
          value={chatName}
          onChange={(e) => setChatName(e.target.value)}
        />
        <Button variant="contained" onClick={editChatName}>Change name</Button>
        <Button onClick={() => setIsChangeAvatarDialogOpen(true)}>Change avatar</Button>
      </DialogContent>
      <DialogActions>
        
        <Button variant="outlined" onClick={() => setIsOpen(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}