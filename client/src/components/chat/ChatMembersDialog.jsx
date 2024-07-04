import { Delete } from "@mui/icons-material";
import { Avatar, Card, CardHeader, Dialog, DialogContent, IconButton, Link, Typography } from "@mui/material";
import { useState } from "react";
import RemoveMemberDialog from "./RemoveMemberDialog";

export default function ChatMembersDialog({ open, setIsOpen, members, chatId }) {

  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);

  const [userId, setUserId] = useState();

  return (
    <Dialog open={open} onClose={() => setIsOpen(false)}>
      <RemoveMemberDialog userId={userId} chatId={chatId} isOpen={isRemoveMemberDialogOpen} setIsOpen={setIsRemoveMemberDialogOpen}/>
      <DialogContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
        {
          open && members.map((member) => (
            <Card key={member.id} elevation={3} >

              <CardHeader
                avatar={<Link href={`/users/${member.username}`}><Avatar src={member.avatarURL} /></Link>}
                title={<Link href={`/users/${member.username}`} underline="none" color="text.primary">
                  <Typography>{member.username}</Typography>
                </Link>
                }
                action={
                  <IconButton onClick={() => {setIsRemoveMemberDialogOpen(true); setUserId(member.id)}}>
                    <Delete />
                  </IconButton>}
              />
            </Card>
          ))
        }
      </DialogContent>
    </Dialog>
  );
}